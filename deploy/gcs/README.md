# M3 — Object Storage on Google Cloud Storage (parallel storage path)

**Status: non-destructive seam.** This milestone adds a Google Cloud Storage backend *behind an
interface* without removing or editing the existing Supabase Storage calls. The app keeps storing and
serving objects through Supabase Storage exactly as before; GCS becomes a second, opt-in backend the
same code can target once call sites adopt the new `getObjectStore()` factory **and** the flag is set.

This is a [strangler-fig](https://martinfowler.com/bliki/StranglerFigApplication.html) migration seam —
mirroring M1 (Vertex AI) and M2 (Cloud Run). Flip the backend when ready; rollback is instant (unset
one env var). **Nothing is rewired yet.** The default behavior is byte-for-byte today's Supabase Storage.

## What's here

| File | Purpose |
|---|---|
| `supabase/functions/_shared/storage/types.ts` | `ObjectStore` port — the storage surface the app actually uses. |
| `supabase/functions/_shared/storage/supabase-store.ts` | DEFAULT impl. Wraps the current `db.storage.from(...)` calls 1:1. |
| `supabase/functions/_shared/storage/gcs-store.ts` | GCS JSON-API impl (download / upload / delete / list / V4 signed URL). |
| `supabase/functions/_shared/storage/index.ts` | `getObjectStore()` factory, gated by `STORAGE_BACKEND`. |
| `deploy/gcs/README.md` | This file. |

## The `ObjectStore` interface

A small port (`types.ts`) capturing only what the codebase does today against Supabase Storage:

| Method | Mirrors | Used today by |
|---|---|---|
| `download(path)` | `.download(path)` → `Blob` | `ingest-document` |
| `upload(path, body, opts)` | `.upload(path, file, { cacheControl, upsert })` | `src/lib/fileUpload.ts` (web) |
| `remove(paths[])` | `.remove(paths)` | `delete-data`, `privacy-tasks` |
| `createSignedUrl(path, expiresIn)` | `.createSignedUrl(path, expiresIn)` → `{ signedUrl }` | `src/lib/fileUpload.ts` (web) |
| `list(prefix?)` | `.list(prefix)` | (none yet — included for erasure/retention sweeps) |

Each store instance is bound to one bucket (mirroring `.from(bucket)`). Results use a small
`{ data, error }` envelope so call sites keep their existing error-handling idiom.

## How the factory selects the backend

`getObjectStore({ client, bucket })` in `storage/index.ts`:

- `STORAGE_BACKEND=gcs` **and** a resolvable `GCS_BUCKET` (or passed `bucket`) **and** a Google
  credential present (`GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_OAUTH_TOKEN`, reused from M1) → **GCS**.
- Otherwise (the default, incl. unset) → **Supabase Storage**, wrapping the `client` you pass
  (`userClient(req)` or `adminClient()`).

This matches `ai/gemini.ts` `vertexSelected()`: a half-configured flag falls back to the safe default
instead of failing at a call site. So you can set `STORAGE_BACKEND=gcs` *before* GCS is fully wired and
nothing breaks until the bucket + credential are also in place.

## Call sites a future iteration must switch

These are the only places that touch object storage today. None are changed by M3 — this is the
adoption checklist for a later milestone.

| File:function | Bucket today | Operation | New call |
|---|---|---|---|
| `supabase/functions/ingest-document/index.ts` | `submissions` | `download(file_path)` | `getObjectStore({ client: db, bucket: "submissions" }).download(path)` |
| `supabase/functions/delete-data/index.ts` (`removeFiles`) | `uploads` | `remove(paths)` | `getObjectStore({ client: db, bucket: "uploads" }).remove(paths)` |
| `supabase/functions/privacy-tasks/index.ts` | `uploads` | `remove(filePaths)` | `getObjectStore({ client: admin, bucket: "uploads" }).remove(paths)` |
| `src/lib/fileUpload.ts` (`uploadFile`, `getSignedUrl`) | `uploads` (default) | `upload` + `createSignedUrl` | _client-side; see note below_ |

> **⚠️ Existing bucket-name inconsistency (carry forward, don't "fix" silently).** `ingest-document`
> uses bucket `"submissions"`; `delete-data` / `privacy-tasks` / `src/lib/fileUpload.ts` use
> `"uploads"`. M3 preserves this exactly (each wrapper passes the bucket its call site uses today).
> Whoever adopts `getObjectStore()` should resolve whether these are genuinely two buckets or a latent
> bug — but that is **out of scope** for this additive seam.

> **Web client note.** `src/lib/fileUpload.ts` runs in the browser and uses the supabase-js client
> with the user's session (RLS). Routing browser uploads through GCS means either (a) issuing a V4
> **upload** signed URL from an edge function and having the browser PUT to it, or (b) proxying the
> upload through an edge function. The `gcs-store.ts` provided here implements server-side upload and a
> V4 **GET** (download) signed URL; a V4 PUT signed URL is a small extension (TODO) if browser-direct
> uploads to GCS are desired. Until then, only the server-side functions above are candidates to switch.

## Bucket / object-path mapping (Supabase → GCS)

Object **keys/paths are preserved verbatim** — every path is `<userId>/<filename>` today (see
`fileUpload.ts`) and stays that way in GCS. Two layout options:

| Strategy | Supabase | GCS | Notes |
|---|---|---|---|
| **One bucket per Supabase bucket** | `submissions`, `uploads` | `<project>-submissions`, `<project>-uploads` | Cleanest 1:1. `GCS_BUCKET` is set per function (pass `bucket` to the factory). |
| **One bucket, prefix per source** | `submissions`, `uploads` | `aita-objects/submissions/…`, `aita-objects/uploads/…` | Single bucket; prepend the Supabase bucket name as a key prefix. |

The provided store binds to one bucket per instance, so the **one-bucket-per-Supabase-bucket** strategy
needs no path rewriting and is recommended. (GCS bucket names are globally unique — prefix with your
project id.)

## Object data migration (gsutil rsync)

Copy existing objects from Supabase Storage to GCS before flipping the flag. Supabase Storage is
S3-compatible, so `gcloud storage rsync` (or `gsutil rsync`) works against its S3 endpoint, or download
then upload:

```bash
# Option A — direct S3→GCS rsync (Supabase S3-compatible endpoint).
# Get the S3 endpoint + access keys from the Supabase dashboard (Storage → S3 connection).
export AWS_ACCESS_KEY_ID=<supabase-s3-access-key>
export AWS_SECRET_ACCESS_KEY=<supabase-s3-secret-key>
gcloud storage rsync \
  --recursive \
  s3://submissions \
  gs://<project>-submissions

gcloud storage rsync --recursive s3://uploads gs://<project>-uploads

# Option B — stage locally, then push (when the S3 endpoint isn't available).
# (download each bucket via the Supabase CLI / API into ./_dump, then:)
gcloud storage rsync --recursive ./_dump/submissions gs://<project>-submissions
gcloud storage rsync --recursive ./_dump/uploads     gs://<project>-uploads
```

Run a **final delta rsync** during the cutover window so objects written between the initial sync and
the flag flip are not missed. Paths are identical on both sides, so rsync is a straight mirror.

## Signed-URL differences (Supabase vs GCS V4)

| | Supabase Storage | GCS (this impl) |
|---|---|---|
| How it's minted | Server call `.createSignedUrl()` (signed by Supabase) | **Locally computed** V4 URL, signed with the SA RSA private key (RSA-SHA256) |
| Credential needed | supabase-js client | `GOOGLE_SERVICE_ACCOUNT_JSON` (a passthrough `GOOGLE_OAUTH_TOKEN` **cannot** sign) |
| URL shape | `…/storage/v1/object/sign/<bucket>/<path>?token=…` | `https://storage.googleapis.com/<bucket>/<path>?X-Goog-Algorithm=…&X-Goog-Signature=…` |
| Expiry | `expiresIn` seconds | `X-Goog-Expires` seconds (V4 max 7 days) |
| Direction | GET (download) | GET (download) implemented; PUT (upload) is a TODO extension |

Practical consequence: keep `GOOGLE_SERVICE_ACCOUNT_JSON` (not just the passthrough token) configured if
any switched call site needs signed URLs.

## Env / secret setup

New env vars (read locally by `storage/index.ts` — **`_shared/env.ts` is intentionally not edited**):

| Var | Required when | Meaning |
|---|---|---|
| `STORAGE_BACKEND` | to enable GCS | `gcs` selects GCS; unset/anything else ⇒ Supabase (DEFAULT). |
| `GCS_BUCKET` | GCS selected | Target GCS bucket (or pass `bucket` to the factory per call site). |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | GCS selected (and for signed URLs) | **Reused from M1.** SA key; mints the OAuth token via `ai/google-auth.ts` and signs V4 URLs. |
| `GOOGLE_OAUTH_TOKEN` | optional | **Reused from M1.** Passthrough token; works for read/write but **not** for signed-URL signing. |

Auth note: `ai/google-auth.ts` mints tokens with the **cloud-platform** scope, which *includes*
`https://www.googleapis.com/auth/devstorage.read_write` — so the M1 credential already grants GCS object
read/write with no change. (`gcs-store.ts` exports `GCS_SCOPE` documenting the least-privilege subset if
google-auth's scope is ever narrowed.)

### Founder GCloud steps to enable GCS

```bash
# 0. Pick the project (same one used for M1 Vertex).
gcloud config set project <PROJECT_ID>

# 1. Create the GCS buckets (uniform bucket-level access; pick a region near your users).
gcloud storage buckets create gs://<PROJECT_ID>-submissions \
  --location=us-central1 --uniform-bucket-level-access
gcloud storage buckets create gs://<PROJECT_ID>-uploads \
  --location=us-central1 --uniform-bucket-level-access

# 2. Grant the EXISTING M1 service account object admin on the buckets (read/write/delete + signing).
#    Reuse the SA whose key is already in GOOGLE_SERVICE_ACCOUNT_JSON.
SA_EMAIL=$(python3 -c 'import json,os;print(json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"])["client_email"])')
gcloud storage buckets add-iam-policy-binding gs://<PROJECT_ID>-submissions \
  --member="serviceAccount:${SA_EMAIL}" --role=roles/storage.objectAdmin
gcloud storage buckets add-iam-policy-binding gs://<PROJECT_ID>-uploads \
  --member="serviceAccount:${SA_EMAIL}" --role=roles/storage.objectAdmin

# 3. Migrate existing objects (see "Object data migration" above), then a final delta rsync.

# 4. Set the Supabase function secrets (credential is already set from M1).
supabase secrets set STORAGE_BACKEND=gcs
supabase secrets set GCS_BUCKET=<PROJECT_ID>-uploads   # or pass per-call-site buckets in code
# GOOGLE_SERVICE_ACCOUNT_JSON already set during M1 (Vertex).
```

> The SA needs **`roles/storage.objectAdmin`** (object CRUD). V4 signing is done with the SA's own
> private key and needs no extra IAM role; if you instead sign via the IAM Credentials API (not used
> here), the SA would also need `roles/iam.serviceAccountTokenCreator`.

## Rollback

Instant and total — unset the flag:

```bash
supabase secrets unset STORAGE_BACKEND      # (or set STORAGE_BACKEND= / any non-"gcs" value)
```

`getObjectStore()` immediately falls back to the Supabase Storage wrapper (the default), which is
identical to today's behavior. Because M3 never edited the existing call sites, even unfinished
adoption can't break the default path: until a call site is switched to `getObjectStore()`, it is still
calling `db.storage.from(...)` directly.
