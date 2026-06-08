// SupabaseObjectStore — the DEFAULT ObjectStore (M3 — additive). Wraps the current Supabase Storage
// calls so behavior is identical to what the edge functions / web client do inline today. This store
// is what getObjectStore() returns unless STORAGE_BACKEND=gcs is explicitly set.
//
// It deliberately delegates to a caller-provided supabase-js client (the same `db` instance the
// functions already build via userClient(req) / adminClient()) rather than constructing its own. That
// preserves the existing auth model exactly: RLS-scoped user client vs service-role admin client is
// the caller's choice, unchanged. The store only fixes the bucket and adapts the `{ data, error }`
// shapes to the small StoreResult envelope in types.ts.

import type { ObjectStore, PutBody, PutOptions, StoreResult } from "./types.ts";

// Minimal structural type for the supabase storage bucket API we use — avoids a hard dependency on
// the supabase-js types from this shared module while still type-checking the call shapes. Matches
// the methods used in ingest-document, delete-data, privacy-tasks, and src/lib/fileUpload.ts.
interface SupabaseStorageBucket {
  download(path: string): Promise<{ data: Blob | null; error: { message: string } | null }>;
  upload(
    path: string,
    body: Blob | ArrayBuffer | Uint8Array | File,
    opts?: { contentType?: string; cacheControl?: string; upsert?: boolean },
  ): Promise<{ data: { path: string } | null; error: { message: string } | null }>;
  remove(paths: string[]): Promise<{ data: unknown; error: { message: string } | null }>;
  createSignedUrl(
    path: string,
    expiresIn: number,
  ): Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>;
  list(
    prefix?: string,
  ): Promise<{ data: Array<{ name: string }> | null; error: { message: string } | null }>;
}

interface SupabaseLike {
  storage: { from(bucket: string): SupabaseStorageBucket };
}

export class SupabaseObjectStore implements ObjectStore {
  readonly bucket: string;
  #bucketApi: SupabaseStorageBucket;

  // `client` is an existing supabase-js client (userClient(req) or adminClient()). The store does not
  // create or own it — auth scoping stays exactly where the call site put it.
  constructor(client: SupabaseLike, bucket: string) {
    this.bucket = bucket;
    this.#bucketApi = client.storage.from(bucket);
  }

  download(path: string): Promise<StoreResult<Blob>> {
    // Identical to ingest-document: db.storage.from(BUCKET).download(file_path).
    return this.#bucketApi.download(path);
  }

  async upload(path: string, body: PutBody, opts?: PutOptions): Promise<StoreResult<{ path: string }>> {
    // Identical to src/lib/fileUpload.ts uploadFile defaults (cacheControl "3600", upsert false).
    const { data, error } = await this.#bucketApi.upload(path, body, {
      contentType: opts?.contentType,
      cacheControl: opts?.cacheControl ?? "3600",
      upsert: opts?.upsert ?? false,
    });
    return { data: data ? { path: data.path } : null, error };
  }

  async remove(paths: string[]): Promise<StoreResult<{ removed: string[] }>> {
    // Identical to delete-data / privacy-tasks: db.storage.from(bucket).remove(paths).
    const { error } = await this.#bucketApi.remove(paths);
    return { data: error ? null : { removed: paths }, error };
  }

  async createSignedUrl(path: string, expiresIn = 3600): Promise<StoreResult<{ signedUrl: string }>> {
    // Identical to src/lib/fileUpload.ts getSignedUrl: .createSignedUrl(path, expiresIn).
    const { data, error } = await this.#bucketApi.createSignedUrl(path, expiresIn);
    return { data: data ? { signedUrl: data.signedUrl } : null, error };
  }

  async list(prefix?: string): Promise<StoreResult<{ keys: string[] }>> {
    const { data, error } = await this.#bucketApi.list(prefix);
    if (error) return { data: null, error };
    const base = prefix ? `${prefix.replace(/\/$/, "")}/` : "";
    return { data: { keys: (data ?? []).map((o) => `${base}${o.name}`) }, error: null };
  }
}
