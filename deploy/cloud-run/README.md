# M2 — Compute on Cloud Run (parallel deployment path)

**Status: non-destructive proof.** This directory produces *deployable* Google Cloud Run artifacts
for the existing Supabase Deno edge functions **without removing or editing them**. The Supabase
functions keep running exactly as before; Cloud Run becomes a second, identical way to run the same
code. This is a [strangler-fig](https://martinfowler.com/bliki/StranglerFigApplication.html) migration
seam — flip traffic when ready, with zero rewrite and an instant rollback (just keep calling Supabase).

## What's here

| File | Purpose |
|---|---|
| `serve-edge-function.ts` | Portable entry shim. Imports an **unmodified** edge function module and serves it on `0.0.0.0:$PORT`. |
| `Dockerfile` | Generic `denoland/deno` image that copies `supabase/functions` + the shim and runs it. One image, any function. |
| `README.md` | This file. |

### How the shim runs a function without editing it

Every Supabase edge function (e.g. `supabase/functions/grade-submission/index.ts`) calls
`Deno.serve(handler)` at import time — that *is* an HTTP server. The only thing tying it to Supabase
is the host platform, not the code. The shim:

1. Wraps `Deno.serve` so the next call binds the handler to `0.0.0.0:$PORT` (bare `Deno.serve()`
   defaults to port 8000 and ignores Cloud Run's injected `$PORT` — this is the one gap we bridge).
2. `await import()`s the chosen function module, which triggers its top-level `Deno.serve(...)`.
3. Exits non-zero if the module never served, so a bad revision is marked unhealthy instead of hanging.

The function source is **never modified** — it is copied into the image verbatim and merely hosted.

## Function → Cloud Run service map

`grade-submission` is the worked example (it already supports a headless, service-to-service path via
`x-internal-secret`, so it runs cleanly off a JWT-less platform). The shim is generic: select the
function with the `EDGE_FUNCTION` build/deploy env var.

| Supabase edge function | Cloud Run service (suggested) | `EDGE_FUNCTION` value | Notes |
|---|---|---|---|
| `grade-submission` | `aita-grade-submission` | `grade-submission` | Worked example. Auth in code (JWT *or* `x-internal-secret`). |
| `ingest-document` | `aita-ingest-document` | `ingest-document` | Same pattern; verify its own secrets. |
| `generate-podcast` | `aita-generate-podcast` | `generate-podcast` | Same pattern. |
| `worker/` (async poller) | `aita-grading-worker` | n/a (Node, not an edge fn) | Already Cloud-Run-native; see `worker/README.md`. |

This README documents the **`grade-submission`** path end-to-end; the others follow identically by
changing `EDGE_FUNCTION` and that function's secret set.

## Env / secret mapping: Supabase secrets → Cloud Run

Supabase auto-injects `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` into deployed
functions. **Cloud Run does not** — you must provide them explicitly. Sensitive values go in **Secret
Manager** and are mounted as env vars via `--update-secrets`; non-sensitive config goes in
`--set-env-vars`.

`grade-submission` reads (via `_shared/env.ts` and the grading engine):

| Var | Required? | Source on Supabase | On Cloud Run | Sensitive |
|---|---|---|---|---|
| `SUPABASE_URL` | yes | auto-injected | `--set-env-vars` (it's just a URL) | no |
| `SUPABASE_ANON_KEY` | yes | auto-injected | Secret Manager | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | auto-injected | Secret Manager | **yes (high)** |
| `GEMINI_API_KEY` | yes* | `supabase secrets set` | Secret Manager | yes |
| `INTERNAL_GRADE_SECRET` | yes (for the worker path) | `supabase secrets set` | Secret Manager — **must match the value the worker + Supabase use** | yes |
| `ALLOWED_ORIGINS` | recommended | `supabase secrets set` | `--set-env-vars` | no |
| `GEMINI_API_KEYS` | optional | `supabase secrets set` | Secret Manager | yes |
| `GEMINI_GRADING_MODEL` / `GEMINI_STYLE_MODEL` | optional | `supabase secrets set` | `--set-env-vars` | no |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | optional (Layer B ceiling) | `supabase secrets set` | URL via env, token via Secret Manager | token: yes |
| Vertex: `GEMINI_BACKEND`/`VERTEX_AI`, `VERTEX_PROJECT`, `VERTEX_LOCATION`, `GOOGLE_SERVICE_ACCOUNT_JSON` | optional (M1) | `supabase secrets set` | project/region via env; SA JSON via Secret Manager | SA JSON: **yes (high)** |

\* `GEMINI_API_KEY` is required unless you run the Vertex backend (M1) with a service-account credential.

> The full reference list of every secret the functions read lives in
> `supabase/functions/.env.example`.

## XPRIZE "uses a Google Cloud product" gate

This path satisfies the gate two ways, additively:

1. **Google Cloud Run** hosts the compute (this directory) — a first-class GCP product running the
   production grading function.
2. Optionally, **Vertex AI** (M1, already wired in `_shared/env.ts` / `_shared/ai`) routes Gemini
   through Google Cloud when `GEMINI_BACKEND=vertex` is set — a second GCP product on the same path.

Because it is a parallel deployment, the app keeps working on Supabase throughout; the gate is met the
moment the Cloud Run service is live, with no functional risk.

---

## Founder deploy steps (exact)

Run from the **repository root** (the Dockerfile's build context copies `supabase/functions`). Nothing
below is run by this PR — these are the manual steps to actually deploy.

### 0. One-time GCP setup

```bash
# Auth + pick the project.
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable the products this path uses.
gcloud services enable run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com
# (Add aiplatform.googleapis.com if you also turn on the Vertex backend.)
```

### 1. Create the secrets in Secret Manager

Pull the values from Supabase (`supabase secrets list` shows names; values come from where you
originally set them / the Supabase dashboard). Then:

```bash
# Repeat for each sensitive var. Example for three of them:
printf '%s' 'YOUR_SERVICE_ROLE_KEY' | gcloud secrets create SUPABASE_SERVICE_ROLE_KEY --data-file=-
printf '%s' 'YOUR_ANON_KEY'         | gcloud secrets create SUPABASE_ANON_KEY        --data-file=-
printf '%s' 'YOUR_GEMINI_API_KEY'   | gcloud secrets create GEMINI_API_KEY           --data-file=-
printf '%s' 'YOUR_INTERNAL_SECRET'  | gcloud secrets create INTERNAL_GRADE_SECRET    --data-file=-
# To update an existing secret later: ... | gcloud secrets versions add NAME --data-file=-
```

`INTERNAL_GRADE_SECRET` **must be byte-identical** to the value set on Supabase
(`supabase secrets set INTERNAL_GRADE_SECRET=…`) and in the `worker/` deployment, or the
service-to-service grading call is rejected.

### 2. Deploy `grade-submission` to Cloud Run

`--source .` lets Cloud Build build the image. Point it at this Dockerfile via a config file, or build
+ push manually (shown second).

**Option A — build from source (point at this Dockerfile):**

```bash
# From repo root. Cloud Build uses deploy/cloud-run/Dockerfile because we pass it explicitly.
gcloud builds submit --tag REGION-docker.pkg.dev/YOUR_PROJECT_ID/aita/grade-submission \
  --file deploy/cloud-run/Dockerfile .

gcloud run deploy aita-grade-submission \
  --image REGION-docker.pkg.dev/YOUR_PROJECT_ID/aita/grade-submission \
  --region us-west1 \
  --no-allow-unauthenticated \
  --set-env-vars EDGE_FUNCTION=grade-submission,SUPABASE_URL=https://YOUR_PROJECT.supabase.co,ALLOWED_ORIGINS=https://app.aita.example \
  --update-secrets SUPABASE_ANON_KEY=SUPABASE_ANON_KEY:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,INTERNAL_GRADE_SECRET=INTERNAL_GRADE_SECRET:latest
```

**Option B — let `gcloud run deploy --source` build it** (requires the Dockerfile at the path it
expects; pass `--function`-free and use the explicit Dockerfile build above if your gcloud doesn't
support selecting a non-root Dockerfile during `--source` deploys):

```bash
gcloud run deploy aita-grade-submission \
  --source . \
  --region us-west1 \
  --no-allow-unauthenticated \
  --set-env-vars EDGE_FUNCTION=grade-submission,SUPABASE_URL=https://YOUR_PROJECT.supabase.co,ALLOWED_ORIGINS=https://app.aita.example \
  --update-secrets SUPABASE_ANON_KEY=SUPABASE_ANON_KEY:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,INTERNAL_GRADE_SECRET=INTERNAL_GRADE_SECRET:latest
```

> `--no-allow-unauthenticated` keeps the service private (it's reached service-to-service via the
> worker's `x-internal-secret`, not by browsers). Grant the worker's service account
> `roles/run.invoker` on this service, or front it with the existing internal auth and allow
> unauthenticated only if you rely solely on `INTERNAL_GRADE_SECRET`.

### 3. (Optional) turn on the Vertex AI backend (second GCP product)

```bash
printf '%s' "$(cat sa-key.json)" | gcloud secrets create GOOGLE_SERVICE_ACCOUNT_JSON --data-file=-

gcloud run services update aita-grade-submission --region us-west1 \
  --update-env-vars GEMINI_BACKEND=vertex,VERTEX_PROJECT=YOUR_PROJECT_ID,VERTEX_LOCATION=us-central1 \
  --update-secrets GOOGLE_SERVICE_ACCOUNT_JSON=GOOGLE_SERVICE_ACCOUNT_JSON:latest
```

### 4. Point the worker (or app) at the Cloud Run URL

`gcloud run deploy` prints the service URL. To route the async worker through Cloud Run instead of
Supabase, set the worker's `SUPABASE_URL`-derived grade endpoint to the Cloud Run URL (or add an
override). The Supabase function stays deployed as the fallback — this is the strangler-fig cutover
point, and rollback is just pointing back at `…supabase.co/functions/v1/grade-submission`.

---

## What changed in `worker/` for M2

`worker/` already targeted Cloud Run. M2 hardening:

- **`worker/index.mjs`** now binds `0.0.0.0:$PORT` explicitly (was `.listen(PORT)`, which relied on
  Node's default-interface behavior). Cloud Run requires binding all interfaces.
- **`worker/.dockerignore`** added so the build context ships only `package.json` + `index.mjs`.
- `worker/Dockerfile` already honored `$PORT` (`ENV PORT=8080`, `CMD ["node","index.mjs"]`) — unchanged.
