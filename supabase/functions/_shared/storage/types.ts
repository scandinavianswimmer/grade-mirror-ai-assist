// ObjectStore — the storage surface the app actually uses (M3 — additive, OFF by default).
//
// This is a deliberately small port (hexagonal "port") that captures ONLY the object-storage
// operations the existing edge functions + web client perform today against Supabase Storage:
//
//   • download(path)                  ingest-document/index.ts — db.storage.from(BUCKET).download(file_path)
//   • remove(paths[])                 delete-data, privacy-tasks — .storage.from(bucket).remove(paths)
//   • createSignedUrl(path, expires)  src/lib/fileUpload.ts getSignedUrl — .createSignedUrl(path, expiresIn)
//   • upload(path, body, opts)        src/lib/fileUpload.ts uploadFile — .upload(filePath, file, { ... })
//   • list(prefix)                    (not used by a function today; included because erasure/retention
//                                      flows commonly need it and a GCS prefix-list is trivial. Kept
//                                      minimal — adopt only if a call site needs it.)
//
// The signatures intentionally mirror the *behavior* of the Supabase calls (bucket is fixed per
// store instance; `path` is the object key inside that bucket; signed URLs are time-bounded) so the
// SupabaseObjectStore wrapper is byte-for-byte identical to today's inline calls and a GCS store can
// be dropped in behind the same interface without touching call sites.
//
// NOTE: nothing imports this yet. M3 is a strangler seam — see deploy/gcs/README.md. Call sites keep
// using `db.storage.from(...)` directly until a later iteration adopts getObjectStore().

// Result envelope mirroring the supabase-js `{ data, error }` shape so a wrapping store can pass the
// underlying result through unchanged and call sites need no new error-handling idiom.
export interface StoreResult<T> {
  data: T | null;
  error: { message: string } | null;
}

// Options accepted by upload — a subset of supabase-js FileOptions actually used today
// (cacheControl + upsert in src/lib/fileUpload.ts). contentType is included because GCS needs it
// explicitly (the browser File carries its own type; a raw byte upload does not).
export interface PutOptions {
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}

// Body accepted by upload. The web client passes a `File`/`Blob`; server-side callers pass bytes.
// `ArrayBuffer`/`Uint8Array` cover the Deno side; `Blob`/`File` cover the browser side.
export type PutBody = Blob | ArrayBuffer | Uint8Array;

export interface ObjectStore {
  // The bucket / GCS bucket this store instance is bound to (informational; mirrors `.from(bucket)`).
  readonly bucket: string;

  // Download an object's bytes. Mirrors supabase `.download(path)` which resolves to a `Blob`.
  download(path: string): Promise<StoreResult<Blob>>;

  // Upload an object. Mirrors supabase `.upload(path, body, opts)`. `upsert:false` (the current
  // default in fileUpload.ts) means "fail if the object already exists".
  upload(path: string, body: PutBody, opts?: PutOptions): Promise<StoreResult<{ path: string }>>;

  // Remove one or more objects by path. Mirrors supabase `.remove(paths)`.
  remove(paths: string[]): Promise<StoreResult<{ removed: string[] }>>;

  // Create a short-lived signed URL for a private-bucket object. Mirrors supabase
  // `.createSignedUrl(path, expiresIn)` which returns `{ signedUrl }`. `expiresIn` is in seconds.
  createSignedUrl(path: string, expiresIn?: number): Promise<StoreResult<{ signedUrl: string }>>;

  // List object keys under a prefix. Optional in practice; included for erasure/retention sweeps.
  list(prefix?: string): Promise<StoreResult<{ keys: string[] }>>;
}
