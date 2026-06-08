// GcsObjectStore — Google Cloud Storage implementation of ObjectStore (M3 — additive, OFF by
// default). Selected only when STORAGE_BACKEND=gcs (see index.ts). Nothing imports it on the default
// path; the app keeps using Supabase Storage until call sites adopt getObjectStore() AND the flag is
// flipped. See deploy/gcs/README.md.
//
// AUTH: reuses the M1 token mint in ../ai/google-auth.ts (getGoogleAccessToken). That mint requests
// the cloud-platform scope, which INCLUDES devstorage.read_write — so the same GOOGLE_SERVICE_ACCOUNT_JSON
// / GOOGLE_OAUTH_TOKEN credential already configured for Vertex works for GCS object reads/writes with
// no extra setup. (The storage-specific scope https://www.googleapis.com/auth/devstorage.read_write is
// a strict subset of cloud-platform; documented here for the principle of least privilege if a future
// iteration narrows google-auth's scope.)
//
// SIGNED URLS: GCS does not mint signed URLs via a token. A V4 signed URL is computed locally by
// signing a canonical request with the service-account RSA private key (RSA-SHA256). That requires
// the SA key directly (GOOGLE_SERVICE_ACCOUNT_JSON), so signed-URL support is unavailable when only a
// passthrough GOOGLE_OAUTH_TOKEN is configured — see createSignedUrl below.

import type { ObjectStore, PutBody, PutOptions, StoreResult } from "./types.ts";
import { getGoogleAccessToken } from "../ai/google-auth.ts";

const UPLOAD_BASE = "https://storage.googleapis.com/upload/storage/v1/b";
const OBJECT_BASE = "https://storage.googleapis.com/storage/v1/b";
const GCS_HOST = "storage.googleapis.com";

// Storage-specific scope (subset of cloud-platform). Documented; the actual minted token from
// google-auth.ts currently carries cloud-platform, which is a superset and works as-is.
export const GCS_SCOPE = "https://www.googleapis.com/auth/devstorage.read_write";

function ok<T>(data: T): StoreResult<T> {
  return { data, error: null };
}
function err<T>(message: string): StoreResult<T> {
  return { data: null, error: { message } };
}

async function toBytes(body: PutBody): Promise<Uint8Array> {
  if (body instanceof Uint8Array) return body;
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  // Blob / File
  return new Uint8Array(await body.arrayBuffer());
}

async function authHeader(): Promise<Record<string, string>> {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error("GCS backend selected but no Google OAuth credential is available");
  return { Authorization: `Bearer ${token}` };
}

export class GcsObjectStore implements ObjectStore {
  readonly bucket: string;

  constructor(bucket: string) {
    if (!bucket) throw new Error("GcsObjectStore requires a non-empty bucket (set GCS_BUCKET)");
    this.bucket = bucket;
  }

  async download(path: string): Promise<StoreResult<Blob>> {
    try {
      const headers = await authHeader();
      // alt=media returns the raw object bytes (default returns JSON metadata).
      const url = `${OBJECT_BASE}/${this.bucket}/o/${encodeURIComponent(path)}?alt=media`;
      const res = await fetch(url, { headers });
      if (!res.ok) return err(`GCS download HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return ok(await res.blob());
    } catch (e) {
      return err(e instanceof Error ? e.message : "GCS download failed");
    }
  }

  async upload(path: string, body: PutBody, opts?: PutOptions): Promise<StoreResult<{ path: string }>> {
    try {
      const headers = await authHeader();
      const bytes = await toBytes(body);
      // Simple (single-request) media upload. uploadType=media; object name in the query string.
      // ifGenerationMatch=0 enforces upsert:false (fail if the object already exists) — matching the
      // current Supabase default in src/lib/fileUpload.ts.
      const params = new URLSearchParams({ uploadType: "media", name: path });
      if (!(opts?.upsert ?? false)) params.set("ifGenerationMatch", "0");
      const contentType = opts?.contentType ?? "application/octet-stream";
      // TODO(verify): GCS object metadata (cacheControl) is set via a JSON multipart upload or a
      // follow-up metadata PATCH; the simple media upload here does not carry cacheControl. If
      // cache headers matter for served objects, switch to uploadType=multipart and include
      // { cacheControl: opts.cacheControl } in the metadata part.
      const url = `${UPLOAD_BASE}/${this.bucket}/o?${params.toString()}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { ...headers, "Content-Type": contentType },
        body: bytes,
      });
      if (!res.ok) return err(`GCS upload HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return ok({ path });
    } catch (e) {
      return err(e instanceof Error ? e.message : "GCS upload failed");
    }
  }

  async remove(paths: string[]): Promise<StoreResult<{ removed: string[] }>> {
    try {
      const headers = await authHeader();
      const removed: string[] = [];
      // GCS deletes one object per request (no native batch in the JSON API without multipart).
      // Mirrors the best-effort, non-fatal removal the existing functions do (delete-data /
      // privacy-tasks log + continue). A 404 (already gone) is treated as success — idempotent erase.
      for (const path of paths) {
        const url = `${OBJECT_BASE}/${this.bucket}/o/${encodeURIComponent(path)}`;
        const res = await fetch(url, { method: "DELETE", headers });
        if (res.ok || res.status === 404) {
          removed.push(path);
        } else {
          return err(`GCS delete HTTP ${res.status} for ${path}: ${(await res.text()).slice(0, 200)}`);
        }
      }
      return ok({ removed });
    } catch (e) {
      return err(e instanceof Error ? e.message : "GCS delete failed");
    }
  }

  async list(prefix?: string): Promise<StoreResult<{ keys: string[] }>> {
    try {
      const headers = await authHeader();
      const keys: string[] = [];
      let pageToken: string | undefined;
      // Paginate listObjects until exhausted.
      do {
        const params = new URLSearchParams();
        if (prefix) params.set("prefix", prefix);
        if (pageToken) params.set("pageToken", pageToken);
        const url = `${OBJECT_BASE}/${this.bucket}/o?${params.toString()}`;
        const res = await fetch(url, { headers });
        if (!res.ok) return err(`GCS list HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
        const json = (await res.json()) as { items?: Array<{ name: string }>; nextPageToken?: string };
        for (const o of json.items ?? []) keys.push(o.name);
        pageToken = json.nextPageToken;
      } while (pageToken);
      return ok({ keys });
    } catch (e) {
      return err(e instanceof Error ? e.message : "GCS list failed");
    }
  }

  // V4 signed URL for a GET (download). Computed locally — signs a canonical request with the SA
  // private key (RSA-SHA256). Requires GOOGLE_SERVICE_ACCOUNT_JSON (a passthrough GOOGLE_OAUTH_TOKEN
  // cannot sign). Returns an error in that case rather than throwing, matching the soft-fail contract
  // of the Supabase getSignedUrl wrapper.
  async createSignedUrl(path: string, expiresIn = 3600): Promise<StoreResult<{ signedUrl: string }>> {
    try {
      const sa = loadServiceAccountForSigning();
      if (!sa) {
        return err(
          "GCS signed URLs require GOOGLE_SERVICE_ACCOUNT_JSON (a passthrough GOOGLE_OAUTH_TOKEN cannot sign V4 URLs)",
        );
      }
      const signedUrl = await signV4GetUrl(sa, this.bucket, path, expiresIn);
      return ok({ signedUrl });
    } catch (e) {
      return err(e instanceof Error ? e.message : "GCS signed URL failed");
    }
  }
}

// ── V4 signed-URL signing ──────────────────────────────────────────────────────────────────────
// Mirrors the SA-key idioms in ../ai/google-auth.ts (PEM→PKCS8 import, RS256 via crypto.subtle) but
// for GCS's V4 query-string signing scheme. Reads the SAME GOOGLE_SERVICE_ACCOUNT_JSON the M1 Vertex
// path uses, so no new credential is introduced.

interface SigningServiceAccount {
  client_email: string;
  private_key: string;
}

function loadServiceAccountForSigning(): SigningServiceAccount | null {
  const raw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!raw) return null;
  let sa: SigningServiceAccount;
  try {
    sa = JSON.parse(raw) as SigningServiceAccount;
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
  if (!sa.client_email || !sa.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON missing client_email or private_key");
  }
  // Secrets set via `supabase secrets set` often arrive with escaped newlines in the PEM.
  sa.private_key = sa.private_key.replace(/\\n/g, "\n");
  return sa;
}

function pemToDer(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const der = atob(body);
  const bytes = new Uint8Array(der.length);
  for (let i = 0; i < der.length; i++) bytes[i] = der.charCodeAt(i);
  return bytes;
}

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const data = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

// RFC 3986 encode each path segment but preserve "/" — GCS V4 canonical resource keeps slashes.
function encodeObjectPath(path: string): string {
  return path
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

// Build "YYYYMMDDTHHMMSSZ" and "YYYYMMDD" from a Date.
function v4Timestamps(now: Date): { iso: string; date: string } {
  const iso = now.toISOString().replace(/[:-]/g, "").replace(/\.\d{3}/, "");
  return { iso, date: iso.slice(0, 8) };
}

// Construct a V4 signed GET URL. Implements the documented GCS V4 query-string signing algorithm.
// TODO(verify): exercise against a real bucket/object before relying on this in production — the
// canonical-request construction is per the GCS V4 spec but has not been round-tripped here.
async function signV4GetUrl(
  sa: SigningServiceAccount,
  bucket: string,
  objectPath: string,
  expiresIn: number,
): Promise<string> {
  const now = new Date();
  const { iso, date } = v4Timestamps(now);
  const credentialScope = `${date}/auto/storage/goog4_request`;
  const credential = `${sa.client_email}/${credentialScope}`;

  const canonicalUri = `/${bucket}/${encodeObjectPath(objectPath)}`;
  const signedHeaders = "host";
  const headers = `host:${GCS_HOST}\n`;

  const queryParams: Record<string, string> = {
    "X-Goog-Algorithm": "GOOG4-RSA-SHA256",
    "X-Goog-Credential": credential,
    "X-Goog-Date": iso,
    "X-Goog-Expires": String(expiresIn),
    "X-Goog-SignedHeaders": signedHeaders,
  };
  // Canonical query string: sorted by key, both key and value RFC3986-encoded.
  const canonicalQuery = Object.keys(queryParams)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
    .join("&");

  // For a signed URL the payload is unsigned.
  const canonicalRequest = [
    "GET",
    canonicalUri,
    canonicalQuery,
    headers,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "GOOG4-RSA-SHA256",
    iso,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(stringToSign),
  );
  const signatureHex = toHex(new Uint8Array(sig));

  return `https://${GCS_HOST}${canonicalUri}?${canonicalQuery}&X-Goog-Signature=${signatureHex}`;
}
