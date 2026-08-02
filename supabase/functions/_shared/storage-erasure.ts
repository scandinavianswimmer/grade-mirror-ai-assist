// Pure helpers for privacy erasure. Keep this module free of Deno/Supabase imports so the
// traversal and fail-closed guarantees can be exercised by the repository's Vitest suite.

export interface StorageListItem {
  name: string;
  id?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface StorageErrorLike {
  message: string;
}

export interface StorageListOptions {
  limit: number;
  offset: number;
  sortBy: { column: "name"; order: "asc" };
}

export type ListStorageObjects = (
  prefix: string,
  options: StorageListOptions,
) => Promise<{ data: StorageListItem[] | null; error: StorageErrorLike | null }>;

export type RemoveStorageObjects = (
  paths: string[],
) => Promise<{ data: unknown[] | null; error: StorageErrorLike | null }>;

export class StorageErasureError extends Error {
  constructor(
    public readonly bucket: string,
    public readonly stage: "validation" | "list" | "remove" | "verify",
    message: string,
  ) {
    super(`${bucket}: ${message}`);
    this.name = "StorageErasureError";
  }
}

const LIST_PAGE_SIZE = 100;
const REMOVE_BATCH_SIZE = 100;
const MAX_LIST_ENTRIES = 50_000;

function normalizePrefix(prefix: string, allowBucketRoot = false): string {
  const normalized = prefix.replace(/^\/+|\/+$/g, "");
  if (!normalized && allowBucketRoot) return "";
  if (!normalized || normalized.includes("/") || normalized === "." || normalized === "..") {
    throw new Error("storage owner prefix must be one non-empty path segment");
  }
  return normalized;
}

function joinPath(prefix: string, name: string): string {
  // list() returns a basename. Treat anything path-like as malformed instead of allowing a
  // surprising object to escape the owner prefix during a destructive operation.
  if (!name || name === "." || name === ".." || name.includes("/") || name.includes("\\")) {
    throw new Error(`storage list returned an unsafe object name: ${JSON.stringify(name)}`);
  }
  return prefix ? `${prefix}/${name}` : name;
}

function assertSafeRelativeStoragePath(path: string): void {
  const segments = path.split("/");
  if (
    !path ||
    path.startsWith("/") ||
    path.includes("\\") ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error(`storage path is outside the authenticated owner prefix: ${path}`);
  }
}

export function assertOwnedStoragePath(path: string, ownerPrefix: string): void {
  const prefix = normalizePrefix(ownerPrefix);
  assertSafeRelativeStoragePath(path);
  if (!path.startsWith(`${prefix}/`)) {
    throw new Error(`storage path is outside the authenticated owner prefix: ${path}`);
  }
}

function isFolder(item: StorageListItem): boolean {
  // Supabase Storage returns synthetic folder entries with null id and metadata. The published
  // FileObject type is narrower than the wire response, hence the deliberately tolerant shape.
  return item.id == null && item.metadata == null;
}

export async function listOwnedStorageFiles(options: {
  bucket: string;
  ownerPrefix: string;
  list: ListStorageObjects;
  maxEntries?: number;
  allowBucketRoot?: boolean;
}): Promise<string[]> {
  const { bucket, list } = options;
  let prefix: string;
  try {
    prefix = normalizePrefix(options.ownerPrefix, options.allowBucketRoot === true);
  } catch (error) {
    throw new StorageErasureError(bucket, "validation", (error as Error).message);
  }

  const maxEntries = options.maxEntries ?? MAX_LIST_ENTRIES;
  const pendingPrefixes = [prefix];
  const visitedPrefixes = new Set<string>();
  const files = new Set<string>();
  let entriesSeen = 0;

  while (pendingPrefixes.length > 0) {
    const currentPrefix = pendingPrefixes.pop() as string;
    if (visitedPrefixes.has(currentPrefix)) continue;
    visitedPrefixes.add(currentPrefix);

    for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
      const { data, error } = await list(currentPrefix, {
        limit: LIST_PAGE_SIZE,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) {
        throw new StorageErasureError(
          bucket,
          "list",
          `could not enumerate ${currentPrefix}: ${error.message}`,
        );
      }

      const page = data ?? [];
      entriesSeen += page.length;
      if (entriesSeen > maxEntries) {
        throw new StorageErasureError(
          bucket,
          "list",
          `enumeration exceeded the safety limit of ${maxEntries} entries`,
        );
      }

      for (const item of page) {
        let path: string;
        try {
          path = joinPath(currentPrefix, item.name);
          if (prefix) assertOwnedStoragePath(path, prefix);
          else assertSafeRelativeStoragePath(path);
        } catch (error) {
          throw new StorageErasureError(bucket, "validation", (error as Error).message);
        }

        if (isFolder(item)) pendingPrefixes.push(path);
        else files.add(path);
      }

      if (page.length < LIST_PAGE_SIZE) break;
    }
  }

  return [...files].sort();
}

export async function eraseOwnedStorageFiles(options: {
  bucket: string;
  ownerPrefix: string;
  list: ListStorageObjects;
  remove: RemoveStorageObjects;
  targetPaths?: string[];
  allowBucketRoot?: boolean;
}): Promise<number> {
  const { bucket, ownerPrefix, list, remove } = options;

  const requestedTargets = options.targetPaths
    ? [...new Set(options.targetPaths.filter((path): path is string => typeof path === "string" && path.length > 0))]
    : null;

  if (requestedTargets) {
    for (const path of requestedTargets) {
      try {
        if (ownerPrefix) assertOwnedStoragePath(path, ownerPrefix);
        else if (options.allowBucketRoot === true) assertSafeRelativeStoragePath(path);
        else normalizePrefix(ownerPrefix);
      } catch (error) {
        throw new StorageErasureError(bucket, "validation", (error as Error).message);
      }
    }
  }

  const filesBefore = await listOwnedStorageFiles({
    bucket,
    ownerPrefix,
    list,
    allowBucketRoot: options.allowBucketRoot,
  });
  const existing = new Set(filesBefore);
  const pathsToRemove = requestedTargets
    // Attempt every requested path, even if it was absent from the first listing. This closes the
    // window where that exact path is uploaded between enumeration and removal.
    ? requestedTargets.sort()
    : filesBefore;
  const existingTargetCount = requestedTargets
    ? requestedTargets.filter((path) => existing.has(path)).length
    : filesBefore.length;

  for (let start = 0; start < pathsToRemove.length; start += REMOVE_BATCH_SIZE) {
    const batch = pathsToRemove.slice(start, start + REMOVE_BATCH_SIZE);
    const { error } = await remove(batch);
    if (error) {
      throw new StorageErasureError(bucket, "remove", `could not delete objects: ${error.message}`);
    }
  }

  // A successful HTTP response does not prove every requested object disappeared. Re-list and
  // compare before callers are allowed to delete the corresponding database records.
  const filesAfter = await listOwnedStorageFiles({
    bucket,
    ownerPrefix,
    list,
    allowBucketRoot: options.allowBucketRoot,
  });
  const remaining = new Set(filesAfter);
  // A full-account purge must also reject a new path that appeared during the operation. A scoped
  // purge only asserts that its explicit targets disappeared and intentionally preserves siblings.
  const leftovers = requestedTargets
    ? pathsToRemove.filter((path) => remaining.has(path))
    : filesAfter;
  if (leftovers.length > 0) {
    const sample = leftovers.slice(0, 3).join(", ");
    throw new StorageErasureError(
      bucket,
      "verify",
      `${leftovers.length} object(s) remained after deletion${sample ? `: ${sample}` : ""}`,
    );
  }

  return existingTargetCount;
}
