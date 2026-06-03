# Rate Limiting, Abuse Resistance & Cost-Control Audit — aiTA / grade-mirror-ai-assist

Scope: rate limiting, abuse resistance, cost-control on the paid/quota-limited Gemini path.
Out of scope (other agents): RLS internals, secret values, FERPA.
Method: read of edge functions, `_shared` helpers, `config.toml`, migrations (`migrations/` + `migrations_v2/`), frontend invoke sites. Read-only.

---

## TL;DR

- **There is NO rate limiting anywhere in the system** — not per-user, per-IP, per-tenant, or global. No middleware, no token bucket, no cooldown on any user-facing function. The only "429"s in the codebase are quota *metering* on a feedback counter and upstream-Gemini quota passthrough — neither throttles request frequency.
- **The grading path (`grade-submission`, `grade-enqueue`) performs ZERO quota/plan check before calling the paid Gemini API.** The freemium weekly limit is enforced by a *separate* function (`increment-feedback-count`) that the grading path never calls. An authenticated teacher can fire unlimited grade requests.
- **The key-pool draining vector is real and is the headline finding.** A single grade request fans out to up to ~4 Gemini calls, and *each* call iterates the entire `geminiKeys()` pool on quota errors. A scripted loop from one logged-in account can exhaust every rotating free-tier key for **all tenants** — full grading-pipeline DoS plus uncontrolled cost if a billed key is ever added.
- Quota enforcement, where it exists at all (`increment_weekly_feedback` RPC), **is** race-safe (`SELECT … FOR UPDATE`, single transaction). But it is vestigial: it gates a "feedback count," not grading, and the grading endpoints bypass it entirely.

---

## Current State (file:line)

### 1. Rate limiting — NONE

| Layer | Finding | Evidence |
|---|---|---|
| Edge function code | No per-user / per-IP / per-tenant / global limiter in any function or `_shared` helper. | `grade-submission/index.ts`, `grade-enqueue/index.ts`, `ingest-document/index.ts`, `build-style-profile/`, `generate-*/` — none import or call a limiter. |
| `_shared` middleware | `http.ts` (`withErrors`), `auth.ts` (`getUserFromJWT`), `cors.ts` only — no throttle helper exists. | `supabase/functions/_shared/*` |
| `config.toml` | Only `verify_jwt` flags. No rate-limit config (Supabase config.toml has no rate-limit primitive anyway). | `supabase/config.toml` |
| The only "limits" present | (a) Gemini upstream quota *passthrough* `429` in `generate-grading-feedback/index.ts:198`; (b) weekly feedback *count* limit in `record-feedback-usage/index.ts:42` and the `increment_weekly_feedback` RPC; (c) model-health *cooldown* (`ai/router.ts:23`) — operational failover, not abuse control. | as cited |

There is no Upstash rate-limit usage despite Upstash already being a dependency (`_shared/queue.ts` uses Upstash Redis for the job queue — the infra to add a token bucket is already wired in).

### 2. Quota / Plan enforcement — meters the wrong thing, and the AI path skips it

- **Two parallel, divergent meters exist:**
  - `record-feedback-usage/index.ts` — service-role read-modify-write of `users.weekly_feedback_count`. Limits: `{ free: 10, pro: 1000, enterprise: 100000 }` (line 10). **This is a non-atomic check-then-update (lines 37–48): TOCTOU-racy** — N concurrent calls all read the same `count`, all pass the `count >= limit` check, all write `count+1`. The weekly cap is bypassable by racing.
  - `increment-feedback-count/index.ts` — calls the **atomic** RPC `increment_weekly_feedback` (`migrations_v2/0003_usage_rpc.sql`). This one IS race-safe: `SELECT … FOR UPDATE` row lock + reset + check + increment in one transaction. Limits hardcoded in SQL: `freemium=10, else=100` — **and these do not match** the TS limits (`free:10/pro:1000/enterprise:100000`). Two sources of truth, two limit tables, two race-safety levels.
- **The grading endpoints never call either meter.** Grep of `grade-submission/` and `grade-enqueue/` for `quota|plan|weekly|increment` returns nothing. `grade-submission/index.ts` goes straight from auth (line 35) → load submission → `gradeSubmission()` → Gemini, with no usage gate. The frontend calls `increment-feedback-count` from `freemiumApi.ts:143` for a *different* (v1/legacy) flow; `grade-submission` is invoked directly from `SubmissionDetail.tsx:91` and `grade-enqueue` from `AssignmentDetail.tsx:52` with no metering before or after.
- **Net result:** an authenticated user has *unlimited* grading regardless of plan. Even if a meter were wired in, only the RPC path is race-safe; the `record-feedback-usage` path is exploitable by concurrency.

### 3. Cost-control on the AI path — largely absent

- **No input-size cap.** `engine.ts:303` only rejects essays shorter than 5 chars. The full `submission.extracted_text` is sent to Gemini in `buildUserContent()` (`engine.ts:139`) with `maxOutputTokens: 8192` but **no max input length**. Extraction allows up to a 20MB file (`extract/index.ts:15,54`); a 20MB text-heavy upload becomes a massive (multi-million-token) prompt → large per-call input-token cost and a real chance of hammering the upstream context/quota limits.
- **Per-request fan-out is multiplicative.** One `grade-submission` call =
  1 relevance call (`engine.ts:315`) +
  1 grading call (`engine.ts:347`) +
  up to 1 *repair* call on schema failure (`engine.ts:354`) +
  model fallback **pro → flash** looping over `getHealthyGradingModels()` (`engine.ts:344`, models from `router.ts:15`).
  Worst case ≈ **4 Gemini calls per single grade request.**
- **Each Gemini call then rotates the entire key pool.** `gemini.ts:76` loops `for attempt < keys.length`, retrying the same request against the next key on any quota/429 (`gemini.ts:89`). So under quota pressure, one grade request can issue `~4 × keys.length` upstream calls. With a pool of K keys, R requests/sec sustains up to `~4·K·R` calls/sec against Google — the rotation pool *amplifies* abuse rather than containing it.
- **`grade-enqueue` accepts an unbounded `submissionIds[]`** (`grade-enqueue/index.ts:21`) — no max batch size. A single request can enqueue arbitrarily many jobs (each later fanning out as above). No concurrency cap on the queue itself (`queue.ts` is a plain LPUSH; throttling is left entirely to an unconfigured Cloud Run worker).
- **Model-health failover is not a cost guard.** `router.ts` re-admits "unhealthy" models after a 10-min cooldown (`router.ts:23`) and fails *open* (returns all models if all are flagged, `router.ts:48`) — sensible for availability, but it means a degraded/quota-pressed state still attempts the full fan-out.

### 4. Upload abuse — partially bounded

- **File size IS capped at 20MB** (`extract/index.ts:15,54`, returns 413). Good.
- **No page-count cap.** PDFs are extracted whole (`extract/index.ts:65`, `mergePages:true`); `pages` is reported but never enforced. A 20MB / thousands-of-pages PDF passes the byte check, parses fully (CPU/memory parse cost), then becomes an unbounded grading prompt.
- **File type is restricted** to pdf/docx/text by magic-byte + extension (`extract/index.ts:17`, rejects unknown with 415). Good.
- **No per-user upload-rate limit** — `ingest-document` can be called as fast as the client likes; combined with no grading limit, storage + parse cost is attacker-controlled.

### 5. What the app relies on the platform for (and shouldn't)

- Supabase's API gateway provides only coarse Auth/edge protections; **it does NOT rate-limit your invoked Edge Functions per business identity.** There is no Supabase primitive that enforces "N grades per teacher per hour" — the app must do this itself. `config.toml` confirms only `verify_jwt` is configured.
- `verify_jwt = true` stops *anonymous* abuse but does nothing against an authenticated user (free signup → unlimited paid Gemini calls). With open teacher signup this is an unauthenticated-equivalent cost attack one signup away.
- Upstash Redis is already a dependency (`queue.ts`) — the platform piece needed for a real limiter is already present and unused for that purpose.

---

## Abuse-Vector Table

| Vector | Exploitable today? | Blast radius | Severity |
|---|---|---|---|
| Spam `grade-submission` in a loop (no rate limit, no quota check) | **Yes** — 1 authed account, trivial script | Drains every rotating Gemini key → grading DoS for **all tenants**; uncontrolled cost if billed key added | **CRITICAL** |
| Key-pool amplification: 1 request → ~4 calls × full key rotation | **Yes** | Multiplies the above; exhausts pool ~4× faster, defeats the rotation mitigation | **CRITICAL** |
| `grade-enqueue` with huge `submissionIds[]` (no batch cap) | **Yes** | Floods queue; bulk fan-out of paid calls; worker overload | **HIGH** |
| Oversized essay → giant Gemini prompt (no input-size cap, 20MB upload allowed) | **Yes** | Per-call cost spike + faster quota burn; possible context-limit errors | **HIGH** |
| Concurrent calls beat `record-feedback-usage` weekly cap (non-atomic) | **Yes** (that endpoint) | Exceeds plan on the legacy feedback meter | **MEDIUM** (meter is vestigial; real grading is uncapped anyway) |
| Repeated `ingest-document` calls (no upload-rate limit) | **Yes** | Storage + PDF/DOCX parse CPU cost; no DoS guard | **MEDIUM** |
| Many-page PDF (size <20MB but huge page count) | **Yes** | Parse cost + oversized downstream prompt | **MEDIUM** |
| Divergent / inconsistent limit tables (TS vs SQL) | N/A (correctness) | Plan limits unpredictable; enterprise gets 100 not 100000 via RPC | **LOW** |
| Anonymous abuse of functions | **No** — `verify_jwt=true` blocks it | — | (mitigated) |

---

## Findings (ranked)

### CRITICAL-1 — No rate limit + no pre-call quota check on the paid grading path (key-pool drain / cross-tenant DoS)
`grade-submission/index.ts`, `grade-enqueue/index.ts` call Gemini with no per-user/global throttle and no remaining-quota check. Combined with key rotation (`gemini.ts:76–97`) and ~4× fan-out (`engine.ts`), one authenticated account can exhaust the shared free-tier key pool for everyone and (once a billed key exists) run up unbounded cost.

**Remediation (do all):**
1. Add an **atomic, pre-call** rate-limit + quota gate to *every* function that calls Gemini (`grade-submission`, `grade-enqueue` per submission, `build-style-profile`, `generate-*`). Check-and-decrement BEFORE the model call; on exhaustion return `429` and never touch Gemini.
2. Make grading consume the *same* usage ledger as the plan limit so grading actually counts against the plan.
3. Add a **global** ceiling (per-minute cap across all tenants) protecting the key pool independent of per-user limits — this is the cross-tenant safety valve.

### CRITICAL-2 — Per-request fan-out amplifies abuse through the whole key pool
Each grade = relevance + grade + repair + model fallback, and each sub-call loops the full key list on quota errors. Mitigation intended to *survive* quota actually *accelerates* draining under attack.

**Remediation:** Cap total Gemini calls per grade request (e.g. a per-request call budget, hard limit ~3). Count *every* upstream call (including rotations) against the global per-minute ceiling so rotation can't bypass it. Consider routing the cheap relevance pre-pass to flash only and gating the expensive pro grade behind the per-request budget.

### HIGH-1 — Unbounded batch size in `grade-enqueue`
`grade-enqueue/index.ts:21` accepts any-length `submissionIds[]`. **Remediation:** clamp to a max batch (e.g. 50–100) and reject larger with `400`; count the batch against the user's quota at enqueue time.

### HIGH-2 — No input-size cap sent to Gemini
`engine.ts` sends full `extracted_text` (up to a 20MB document's worth). **Remediation:** truncate/reject essays above a sane char ceiling (e.g. 60k–100k chars ≈ assignment-realistic) before `buildUserContent()`; surface "submission too long for auto-grading — split or trim."

### MEDIUM-1 — `record-feedback-usage` weekly limit is TOCTOU-racy
`record-feedback-usage/index.ts:37–48` reads then writes non-atomically. **Remediation:** delete this function and standardize on the atomic `increment_weekly_feedback` RPC pattern (extend it to grading). Do not maintain two meters.

### MEDIUM-2 — No upload / page-count limits beyond raw bytes
`ingest-document` has no per-user upload-rate limit; `extract/index.ts` caps bytes (20MB) but not pages. **Remediation:** add page-count cap (e.g. reject >50 pages or down-scope text), and include `ingest-document` in the per-user rate limiter.

### LOW-1 — Divergent limit tables
TS `{free:10, pro:1000, enterprise:100000}` (`record-feedback-usage:10`) vs SQL `freemium=10 else 100` (`0003_usage_rpc.sql`). **Remediation:** single source of truth (a `plan_limits` table or one shared constant), referenced by the unified RPC.

---

## Recommended rate-limit design for this stack

This stack already has **both** building blocks: Postgres (with a working `FOR UPDATE` atomic-RPC pattern) and **Upstash Redis** (already used by `queue.ts`). Recommended: a layered design.

### Layer A — Per-teacher quota + rate, atomic in Postgres (authoritative)
Extend the proven `increment_weekly_feedback` pattern into a single grading gate. One RPC, `security definer`, called *before* every Gemini-touching function:

```sql
-- consume_grading_quota(p_units int default 1)
-- Locks the user row (FOR UPDATE), applies weekly reset, enforces plan limit,
-- AND a short-window rate cap (e.g. token bucket: refill N/min), then decrements.
-- Returns (allowed, remaining_week, remaining_minute, plan). One transaction => race-safe.
```

- Drive limits from a `plan_limits` table (kills LOW-1). Count grading units the same place as feedback (kills the split meter / MEDIUM-1).
- `grade-submission` calls it once; `grade-enqueue` calls it with `p_units = ids.length` (and clamp ids first — HIGH-1).
- Identity from `auth.uid()` inside the RPC, never the body (matches existing C2 discipline).

### Layer B — Global key-pool circuit breaker in Upstash (cross-tenant valve)
Postgres per-user limits don't protect against *many* users (or many free signups) collectively draining keys. Add a global sliding-window counter in the Redis you already have:

- Before each upstream Gemini call in `gemini.ts call()`, `INCR` a global per-minute key with `EXPIRE`; if it exceeds a tuned ceiling (sized to total key-pool free-tier QPM), short-circuit with `429` and do NOT rotate. This makes the budget count **every** call including rotations (kills CRITICAL-2 amplification).
- Upstash `@upstash/ratelimit` (sliding-window) is the minimal drop-in; you already hold the REST URL/token (`queue.ts:14`).

### Layer C — Per-request call budget (in-process, free)
In `engine.ts`, thread a `callBudget` counter through `callModel`/relevance/repair; hard-cap total upstream calls per grade (~3). Stop fan-out when exhausted. No infra needed.

### Layer D — Input bounds (cheap guards)
- `engine.ts`: reject/truncate essays over a char ceiling before sending (HIGH-2).
- `extract/index.ts`: add a page-count cap alongside the existing byte cap (MEDIUM-2).
- `grade-enqueue`: clamp `submissionIds[]` length (HIGH-1).

Minimum viable to stop the headline attack today: **Layer A (atomic per-teacher gate wired into grade-submission/grade-enqueue) + Layer B (global Upstash ceiling counting rotations) + Layer C call budget.** A and C are pure-code; B reuses existing Upstash creds.
