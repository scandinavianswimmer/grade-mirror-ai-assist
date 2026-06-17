// getObjectStore() — the storage backend factory (M3 — additive, OFF by default).
//
// Selects between the DEFAULT Supabase Storage wrapper and the opt-in GCS implementation based on the
// STORAGE_BACKEND env var. Identical in spirit to how ai/gemini.ts vertexSelected() gates the M1
// Vertex transport: the flag can be set before GCS is fully configured and the code stays on the safe
// default path until everything required (bucket + Google credential) is present.
//
// Env is read LOCALLY here on purpose — _shared/env.ts is existing source and is NOT edited as part of
// M3 (additive-only constraint). The new env vars are documented in deploy/gcs/README.md:
//
//   STORAGE_BACKEND   "gcs" selects GCS; anything else (incl. unset) ⇒ Supabase (DEFAULT).
//   GCS_BUCKET        Target GCS bucket (required when GCS is selected, unless a bucket is passed in).
//   GOOGLE_SERVICE_ACCOUNT_JSON / GOOGLE_OAUTH_TOKEN   Reused from M1 (Vertex) — the GCS store mints
//                     its token via ../ai/google-auth.ts. The SA JSON is additionally required for
//                     V4 signed URLs (see gcs-store.ts).
//
// NOTHING imports this yet. M3 is a strangler seam — call sites keep using db.storage.from(...) until
// a later iteration swaps them to getObjectStore(). See deploy/gcs/README.md.

import type { ObjectStore } from "./types.ts";
import { SupabaseObjectStore } from "./supabase-store.ts";
import { GcsObjectStore } from "./gcs-store.ts";
import { hasGoogleCredential } from "../ai/google-auth.ts";

// Minimal structural type for the supabase-js client the default store wraps (userClient(req) /
// adminClient()). Kept loose so this module has no hard supabase-js type dependency.
interface SupabaseLike {
  storage: { from(bucket: string): unknown };
}

export interface GetObjectStoreOptions {
  // The supabase-js client to wrap on the DEFAULT path (RLS user client or service-role admin client).
  // Required whenever the Supabase backend is (or might be) selected — i.e. effectively always, since
  // the factory falls back to Supabase if GCS isn't fully configured.
  client?: SupabaseLike;
  // Bucket override. Falls back to GCS_BUCKET for the GCS path; for Supabase the caller MUST pass the
  // bucket it uses today ("submissions" for ingest-document, "uploads" elsewhere — see the README).
  bucket?: string;
}

// True only when GCS is both requested AND configured (bucket + a Google credential present). Mirrors
// ai/gemini.ts vertexSelected(): a half-configured flag falls back to the safe default rather than
// throwing at a call site.
function gcsSelected(bucket?: string): boolean {
  const wantsGcs = (Deno.env.get("STORAGE_BACKEND") ?? "").trim().toLowerCase() === "gcs";
  if (!wantsGcs) return false;
  const resolvedBucket = bucket ?? Deno.env.get("GCS_BUCKET") ?? "";
  return Boolean(resolvedBucket && hasGoogleCredential());
}

export function getObjectStore(opts: GetObjectStoreOptions = {}): ObjectStore {
  if (gcsSelected(opts.bucket)) {
    const bucket = opts.bucket ?? Deno.env.get("GCS_BUCKET") ?? "";
    return new GcsObjectStore(bucket);
  }
  // DEFAULT: Supabase Storage — identical to today.
  if (!opts.client) {
    throw new Error(
      "getObjectStore: a supabase client is required for the default Supabase Storage backend (pass userClient(req) or adminClient())",
    );
  }
  if (!opts.bucket) {
    throw new Error(
      "getObjectStore: a bucket is required for the Supabase backend (pass the bucket the call site uses today)",
    );
  }
  // deno-lint-ignore no-explicit-any — narrow structural type; the store only uses .storage.from().
  return new SupabaseObjectStore(opts.client as any, opts.bucket);
}

export type { ObjectStore } from "./types.ts";
export { SupabaseObjectStore } from "./supabase-store.ts";
export { GcsObjectStore } from "./gcs-store.ts";
