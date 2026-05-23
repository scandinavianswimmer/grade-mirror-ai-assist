# aiTA grading worker (Phase 4 — async jobs & reliability)

Async grading at scale: the app enqueues submissions and this worker grades them in the background,
so a teacher grading a whole class doesn't wait on N sequential model calls.

## Architecture
```
Frontend ──► grade-enqueue (edge fn) ──► Upstash Redis (grading:queue)
                                              │
                                   Cloud Run worker (this) RPOPs
                                              │
                                   grade-submission (edge fn, x-internal-secret)
                                              │
                                   Gemini + Postgres (grades, annotations, agent_events)
```
- **Idempotent + retried** (JOBS-02 / RELY-02): a failed job is re-queued up to `MAX_ATTEMPTS` (default 3), then dropped with a log. A single bad job never crashes the loop (RELY-01).
- Single-grade flow stays synchronous via `grade-submission`; **bulk** grading goes through the queue.

## What you (the operator) provision
1. **Upstash Redis** (free tier is fine): create a database, copy `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
2. Set those + `INTERNAL_GRADE_SECRET` (a random secret — `openssl rand -hex 32`) as **Supabase function secrets** (so `grade-enqueue` can enqueue and `grade-submission` accepts the worker):
   ```
   supabase secrets set UPSTASH_REDIS_REST_URL=… UPSTASH_REDIS_REST_TOKEN=… INTERNAL_GRADE_SECRET=…
   ```
3. **Deploy this worker to Cloud Run** with the same values + the project's Supabase URL/anon key:
   ```bash
   cd worker
   gcloud run deploy aita-grading-worker --source . --region us-west1 \
     --min-instances 1 --no-allow-unauthenticated \
     --set-env-vars UPSTASH_REDIS_REST_URL=…,UPSTASH_REDIS_REST_TOKEN=…,\
   SUPABASE_URL=https://yhdobsmmhdvqswjpousc.supabase.co,SUPABASE_ANON_KEY=…,INTERNAL_GRADE_SECRET=…
   ```
   `--min-instances 1` keeps the poller alive. (Alternatively run as a Cloud Run **Job** on a schedule.)
4. Deploy the new edge function: `supabase functions deploy grade-enqueue` (and redeploy `grade-submission`, which now accepts the internal path).

## Env
| Var | Purpose |
|---|---|
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | the queue |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | call `grade-submission` |
| `INTERNAL_GRADE_SECRET` | service-to-service auth (must match the edge-function secret) |
| `MAX_ATTEMPTS` (default 3), `IDLE_SLEEP_MS` (default 3000), `PORT` (Cloud Run sets it) | tuning |
