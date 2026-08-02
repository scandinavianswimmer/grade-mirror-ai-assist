import { describe, expect, it, vi } from "vitest";
import {
  assertOwnedStoragePath,
  eraseOwnedStorageFiles,
  listOwnedStorageFiles,
  type StorageListItem,
} from "./storage-erasure";

const userId = "11111111-1111-4111-8111-111111111111";

function inMemoryBucket(initialPaths: string[]) {
  const files = new Set(initialPaths);

  const list = vi.fn(async (prefix: string, options: { limit: number; offset: number }) => {
    const childEntries = new Map<string, StorageListItem>();
    const prefixWithSlash = prefix ? `${prefix}/` : "";
    for (const path of files) {
      if (!path.startsWith(prefixWithSlash)) continue;
      const remainder = path.slice(prefixWithSlash.length);
      const [name, ...rest] = remainder.split("/");
      childEntries.set(
        name,
        rest.length > 0
          ? { name, id: null, metadata: null }
          : { name, id: `object-${name}`, metadata: {} },
      );
    }
    const page = [...childEntries.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(options.offset, options.offset + options.limit);
    return { data: page, error: null };
  });

  const remove = vi.fn(async (paths: string[]) => {
    paths.forEach((path) => files.delete(path));
    return { data: [], error: null };
  });

  return { files, list, remove };
}

describe("storage erasure", () => {
  it("recursively enumerates and deletes nested submission objects", async () => {
    const first = `${userId}/assignments/assignment-1/submissions/essay-a.pdf`;
    const second = `${userId}/assignments/assignment-2/submissions/essay-b.docx`;
    const bucket = inMemoryBucket([first, second]);

    const removed = await eraseOwnedStorageFiles({
      bucket: "submissions",
      ownerPrefix: userId,
      list: bucket.list,
      remove: bucket.remove,
    });

    expect(removed).toBe(2);
    expect(bucket.files.size).toBe(0);
    expect(bucket.remove).toHaveBeenCalledWith([first, second]);
    expect(bucket.list.mock.calls.map(([prefix]) => prefix)).toContain(
      `${userId}/assignments/assignment-1/submissions`,
    );
  });

  it("deletes only an explicitly targeted owned file", async () => {
    const target = `${userId}/assignments/assignment-1/submissions/target.pdf`;
    const keep = `${userId}/assignments/assignment-1/submissions/keep.pdf`;
    const bucket = inMemoryBucket([target, keep]);

    await expect(eraseOwnedStorageFiles({
      bucket: "submissions",
      ownerPrefix: userId,
      list: bucket.list,
      remove: bucket.remove,
      targetPaths: [target],
    })).resolves.toBe(1);

    expect(bucket.files.has(target)).toBe(false);
    expect(bucket.files.has(keep)).toBe(true);
  });

  it("fails closed when Storage reports success but leaves an object behind", async () => {
    const path = `${userId}/assignments/assignment-1/submissions/essay.pdf`;
    const bucket = inMemoryBucket([path]);
    const removeWithoutDeleting = vi.fn(async () => ({ data: [], error: null }));

    await expect(eraseOwnedStorageFiles({
      bucket: "submissions",
      ownerPrefix: userId,
      list: bucket.list,
      remove: removeWithoutDeleting,
    })).rejects.toMatchObject({ stage: "verify" });
  });

  it("fails a full-prefix purge if a new object appears during deletion", async () => {
    const original = `${userId}/assignments/assignment-1/submissions/original.pdf`;
    const concurrent = `${userId}/assignments/assignment-2/submissions/concurrent.pdf`;
    const bucket = inMemoryBucket([original]);
    const removeThenUpload = vi.fn(async (paths: string[]) => {
      paths.forEach((path) => bucket.files.delete(path));
      bucket.files.add(concurrent);
      return { data: [], error: null };
    });

    await expect(eraseOwnedStorageFiles({
      bucket: "submissions",
      ownerPrefix: userId,
      list: bucket.list,
      remove: removeThenUpload,
    })).rejects.toMatchObject({ stage: "verify" });
  });

  it("attempts a requested path even when it was absent from the first listing", async () => {
    const latePath = `${userId}/assignments/assignment-1/submissions/late.pdf`;
    const bucket = inMemoryBucket([]);

    await expect(eraseOwnedStorageFiles({
      bucket: "submissions",
      ownerPrefix: userId,
      list: bucket.list,
      remove: bucket.remove,
      targetPaths: [latePath],
    })).resolves.toBe(0);
    expect(bucket.remove).toHaveBeenCalledWith([latePath]);
  });

  it("fails closed on a Storage removal error", async () => {
    const path = `${userId}/assignments/assignment-1/submissions/essay.pdf`;
    const bucket = inMemoryBucket([path]);
    const removeWithError = vi.fn(async () => ({ data: null, error: { message: "permission denied" } }));

    await expect(eraseOwnedStorageFiles({
      bucket: "submissions",
      ownerPrefix: userId,
      list: bucket.list,
      remove: removeWithError,
    })).rejects.toMatchObject({ stage: "remove" });
  });

  it("rejects traversal and cross-owner targets before removing anything", async () => {
    expect(() => assertOwnedStoragePath(`${userId}/../other/file.pdf`, userId)).toThrow(/outside/);
    expect(() => assertOwnedStoragePath("another-user/file.pdf", userId)).toThrow(/outside/);
    expect(() => assertOwnedStoragePath(`${userId}/folder\\..\\file.pdf`, userId)).toThrow(/outside/);

    const bucket = inMemoryBucket([]);
    await expect(eraseOwnedStorageFiles({
      bucket: "submissions",
      ownerPrefix: userId,
      list: bucket.list,
      remove: bucket.remove,
      targetPaths: ["another-user/file.pdf"],
    })).rejects.toMatchObject({ stage: "validation" });
    expect(bucket.remove).not.toHaveBeenCalled();
  });

  it("paginates folders without dropping the 101st entry", async () => {
    const paths = Array.from(
      { length: 101 },
      (_, index) => `${userId}/assignments/assignment-1/submissions/essay-${String(index).padStart(3, "0")}.pdf`,
    );
    const bucket = inMemoryBucket(paths);

    await expect(listOwnedStorageFiles({
      bucket: "submissions",
      ownerPrefix: userId,
      list: bucket.list,
    })).resolves.toEqual(paths);

    expect(bucket.list).toHaveBeenCalledWith(
      `${userId}/assignments/assignment-1/submissions`,
      expect.objectContaining({ offset: 100 }),
    );
  });

  it("can safely purge a dedicated per-user bucket from its root", async () => {
    const bucket = inMemoryBucket([
      "assignment-1/submissions/essay.pdf",
      "training/example.docx",
    ]);

    await expect(eraseOwnedStorageFiles({
      bucket: `user-${userId}`,
      ownerPrefix: "",
      allowBucketRoot: true,
      list: bucket.list,
      remove: bucket.remove,
    })).resolves.toBe(2);

    expect(bucket.files.size).toBe(0);
    expect(bucket.list).toHaveBeenCalledWith("", expect.any(Object));
  });
});
