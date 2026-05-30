# Edge Function Auth & Secrets Audit

**Date:** 2026-05-30  
**Scope:** Supabase edge functions, secrets handling, CORS, input validation, service-role usage  
**Method:** Static analysis of committed source; git history grep for secrets

---

## 1. Per-Function Auth Matrix

| Function | config.toml verify_jwt | In-code auth check | Effective auth | Publicly reachable without JWT? | Verdict |
|---|---|---|---|---|---|
| `grade-submission` | `true` (config) / deployed with `--no-verify-jwt` (STATE.md) | `getUserFromJWT(req)` always called, OR `isInternal` path requires matching `INTERNAL_GRADE_SECRET` header | **JWT required in code even if gateway skips it** | No — code enforces JWT or valid internal secret | PASS (with caveat — see F-01) |
| `ingest-document` | `true` | `getUserFromJWT(req)` | JWT required | No | PASS |
| `build-style-profile` | `true` | `getUserFromJWT(req)` | JWT required | No | PASS |
| `record-feedback-usage` | `true` | `getUserFromJWT(req)` | JWT required | No | PASS |
| `grade-enqueue` | not in config.toml (defaults to `true`) | `getUserFromJWT(req)` | JWT required | No | PASS |
| `create-class` | not in config.toml (defaults to `true`) | `getUserFromJWT(req)` | JWT required | No | PASS |
| `increment-feedback-count` | not in config.toml (defaults to `true`) | `getUserFromJWT(req)` | JWT required | No | PASS |
| `test-ai-grading` | not in config.toml (defaults to `true`) | `getUserFromJWT(req)` | JWT required | No | PASS |
| `generate-grading-feedback` | not in config.toml (defaults to `true`) | `getUserFromJWT(req)` | JWT required | No | PASS |
| `generate-style-summary` | not in config.toml (defaults to `true`) | `getUserFromJWT(req)` | JWT required | No | PASS |
| `privacy-tasks` | `false` (intentional) | `requireCronSecret(req)` | x-cron-secret header required | Yes at gateway, but secret-gated in code | PASS (with caveat — see F-03) |
| `stripe-webhook` | not in config.toml (defaults to `true` per config) but docs say deploy with `--no-verify-jwt` | `verifyWebhook()` — Stripe HMAC-SHA256 signature | Stripe sig verified | Yes at gateway (intended), authenticated via sig | PASS |
| `stripe-checkout` | not in config.toml (defaults to `true`) | `getUserFromJWT(req)` | JWT required | No | PASS |
| `stripe-portal` | not in config.toml (defaults to `true`) | `getUserFromJWT(req)` | JWT required | No | PASS |
| **`generate-podcast`** | not in config.toml (defaults to `true`) | **NONE** — no `getUserFromJWT`, no auth check | **OPEN** | **YES — completely unauthenticated** | **CRITICAL** |

---

## 2. Findings (ranked by severity)

---

### F-01 — CRITICAL: `grade-submission` Deployed with `--no-verify-jwt` (Config Drift)

**File:** `.planning/STATE.md:29`, `.planning/continue.md:25`, `docs/DEMO-SARAH-MARTINEZ.md:41`, `.planning/GOAL-ALIGNMENT-REVIEW.md:92`  
**Severity:** CRITICAL (config drift, but mitigated in code — see below)

**The drift:** `config.toml` declares `verify_jwt = true` for `grade-submission`, but the function is confirmed deployed to production with `--no-verify-jwt` (the flag overrides the config at deploy time). The Supabase gateway therefore accepts unauthenticated requests.

**In-code mitigation:** The function does call `getUserFromJWT(req)` for all normal requests (line 35), which calls `supabase.auth.getUser(token)` and rejects missing/invalid tokens with a 401. The only bypass is the `isInternal` path (lines 26–37), which requires the header `x-internal-secret` to match the env var `INTERNAL_GRADE_SECRET` AND requires `body.userId` to be a string.

**Residual exposure:** The in-code auth is solid. HOWEVER, the `--no-verify-jwt` deployment means:
1. The Supabase gateway does not reject forged or replayed JWT structures before the function starts executing — the token is verified by a Supabase client call (network hop), not the gateway's lightweight static check. If `INTERNAL_GRADE_SECRET` is unset (`Deno.env.get("INTERNAL_GRADE_SECRET")` returns `undefined`), then `Boolean(internalSecret)` is `false`, `isInternal` is `false`, and all calls go through the JWT path — still safe.
2. The config lies to any operator reading `config.toml` — it says `true` but production is `false`. This is an operational hazard for future deploys, audits, and anyone reading the config.

**Remediation:**
- Re-deploy `grade-submission` WITHOUT `--no-verify-jwt` so gateway and config are aligned. This is the correct production state and is blocked only on a CLI permission issue per STATE.md.
- Update config.toml to reflect the actual deployed state until the re-deploy happens (or fix the deploy).
- The CI workflow (`ci.yml:45`) runs `supabase functions deploy "$fn"` WITHOUT `--no-verify-jwt`, so a CI deploy would correctly re-enable gateway JWT verification. Run that deploy.

---

### F-02 — CRITICAL: `generate-podcast` Has No Authentication Whatsoever

**File:** `supabase/functions/generate-podcast/index.ts`  
**Severity:** CRITICAL

**The vulnerability:** `generate-podcast` has no JWT check and no secret gate. It accepts a request body with `{ title, inputNotes, userId }` and trusts the caller-supplied `userId` directly — it uses that value to write to the `podcast_episodes` table with `user_id: userId` (line 101). Any anonymous caller can:
1. Write arbitrary podcast entries to any user's record by supplying their UUID.
2. Consume Gemini API quota freely with no authentication.
3. Trigger AI generation (Gemini Pro) at will, running up API costs.

**Exploit sketch:**
```
POST https://<project>.functions.supabase.co/generate-podcast
Content-Type: application/json

{"title":"test","userId":"<victim-uuid>","inputNotes":"anything"}
```
No token required. The gateway's `verify_jwt = true` default would normally block this, but only if the function is not deployed with `--no-verify-jwt`. Since this function is not explicitly configured in `config.toml`, it uses the default `true` — which means it is currently protected at the gateway. However, the code itself has zero in-code auth, so if the gateway is ever bypassed or misconfigured (as is the case with `grade-submission` right now), it becomes instantly exploitable.

**Additional issue:** `userId` is taken from the request body (line 24) and used directly as the DB `user_id`, which is a classic Insecure Direct Object Reference. Even a legitimate authenticated user could claim to be any other user.

**Remediation:**
- Add `getUserFromJWT(req)` at the top of the handler. Derive `userId` from the JWT, never from the body.
- Add this function to `config.toml` explicitly with `verify_jwt = true`.
- This function also uses `Access-Control-Allow-Origin: '*'` — a wildcard (see F-05).

---

### F-03 — MEDIUM: `requireCronSecret` Uses String Equality, Not Constant-Time Comparison

**File:** `supabase/functions/_shared/auth.ts:24`  
**Severity:** MEDIUM

**The vulnerability:** The cron secret comparison uses JavaScript's `!==` operator:
```typescript
if (!provided || provided !== ENV.cronSecret()) {
```
String equality in JavaScript is not guaranteed to be constant-time. On certain engines and JIT paths, this can be vulnerable to timing side-channel attacks that allow an attacker to determine the secret byte-by-byte. The `stripe.ts` module already has a correct `timingSafeEqual` implementation — it just isn't used here.

**Remediation:** Replace `provided !== ENV.cronSecret()` with a call to `timingSafeEqual` from `_shared/stripe.ts` (or inline the same crypto.subtle HMAC comparison). Since edge functions are on shared infrastructure with variable latency, practical exploitability is low, but this is a correctness issue given a correct implementation already exists in the codebase.

---

### F-04 — MEDIUM: `grade-submission` Internal Path — `isInternal` When `INTERNAL_GRADE_SECRET` Unset

**File:** `supabase/functions/grade-submission/index.ts:27`  
**Severity:** MEDIUM

**The logic:**
```typescript
const internalSecret = Deno.env.get("INTERNAL_GRADE_SECRET");
const isInternal = Boolean(internalSecret) && req.headers.get("x-internal-secret") === internalSecret;
```

When `INTERNAL_GRADE_SECRET` is not configured (undefined), `Boolean(undefined)` is `false`, so `isInternal` is always `false` — the internal path is unreachable. This is safe by design. However, the check is order-sensitive: if `internalSecret` is an empty string `""`, `Boolean("")` is also `false`, so an empty-string secret cannot be "guessed" either. This logic is correct.

**Residual concern:** The `isInternal` path uses `adminClient()` (bypasses RLS) and derives `userId` from `body.userId` (line 32). Ownership is verified explicitly (line 49), but only against `submission.user_id`. If the worker were compromised or the `INTERNAL_GRADE_SECRET` leaked, it could grade any submission as any user while bypassing RLS on related writes (annotations, grades). The secret should be rotated periodically.

**Remediation:** Ensure `INTERNAL_GRADE_SECRET` is set and strong (docs already recommend `openssl rand -hex 32`). Confirm it is never logged. It is accessed via `Deno.env.get()` directly rather than through the typed `ENV` helper — add it to `_shared/env.ts` as `internalGradeSecret: () => optionalEnv("INTERNAL_GRADE_SECRET")` for consistency and auditing.

---

### F-05 — MEDIUM: `generate-podcast` Uses Wildcard CORS (`'*'`)

**File:** `supabase/functions/generate-podcast/index.ts:5-8`  
**Severity:** MEDIUM

**The vulnerability:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  ...
}
```
This function uses a hardcoded wildcard CORS header instead of the shared `corsHeaders()` allowlist from `_shared/cors.ts`. Wildcard CORS on an authenticated endpoint allows any origin to make credentialed requests in a browser context. For a function that's supposed to write to the database, this is unsafe.

All other functions correctly use `_shared/cors.ts` which enforces an origin allowlist. This is an older function (different code style, different Deno std version, different Supabase client version) that was clearly not updated to the shared pattern.

**Remediation:** Refactor to use `handlePreflight` and `corsHeaders(req)` from `_shared/cors.ts`. Fix auth first (F-02) — the CORS issue compounds it.

---

### F-06 — LOW: `stripe-webhook` Not Explicitly Listed in `config.toml` Despite Requiring `--no-verify-jwt`

**File:** `supabase/functions/stripe-webhook/index.ts:13-14`, `PHASE-12-NOTES.md:76`  
**Severity:** LOW

**The issue:** The `stripe-webhook` function's own comment says it "must be deployed with JWT verification OFF." The docs confirm this deployment flag. However, the function is not listed in `config.toml` with `verify_jwt = false`. This means:
- If deployed via CI (which uses plain `supabase functions deploy`), it would run with gateway JWT verification ON, causing all Stripe webhooks to fail with 401.
- There is no authoritative record in config of its intended auth mode.

**In-code auth:** The function verifies the `Stripe-Signature` HMAC correctly using `verifyWebhook()` in `_shared/stripe.ts`. The HMAC uses `crypto.subtle` with constant-time comparison. This is correct and safe for a Stripe webhook receiver.

**Remediation:** Add to `config.toml`:
```toml
[functions.stripe-webhook]
verify_jwt = false  # Stripe cannot present a Supabase JWT; HMAC-SHA256 sig is the auth boundary
```
Also ensure the CI workflow adds `--no-verify-jwt` for this specific function.

---

### F-07 — LOW: `adminClient()` Singleton Could Leak Across Requests

**File:** `supabase/functions/_shared/db.ts:16-23`  
**Severity:** LOW

**The pattern:**
```typescript
let _admin: SupabaseClient | null = null;
export function adminClient(): SupabaseClient {
  if (!_admin) { _admin = createClient(...) }
  return _admin;
}
```
In Deno edge functions, the module-level `_admin` variable persists for the lifetime of the isolate (which is typically warm-reused across requests). This is an intentional performance optimization. However, if the `SUPABASE_SERVICE_ROLE_KEY` env var were rotated mid-deployment, this singleton would continue using the old key until the isolate is recycled. This is a low-risk operational concern, not a direct exploit path.

**Remediation:** Acceptable as-is for the current architecture. Document the behavior; after a key rotation, force a cold restart of the function.

---

### F-08 — LOW: `generate-grading-feedback` References `LOVABLE_API_KEY` — Undocumented Secret

**File:** `supabase/functions/generate-grading-feedback/index.ts:171`  
**Severity:** LOW (informational / operational)

**The issue:** The function uses `Deno.env.get("LOVABLE_API_KEY")` directly (not through the typed `ENV` helper in `_shared/env.ts`). `LOVABLE_API_KEY` is not listed in `_shared/env.ts` nor in `.env.example`. The `GO-LIVE-RUNBOOK.md` mentions it as a required secret. If it is not set, the function returns a 503.

**Remediation:** Add `lovableApiKey: () => requireEnv("LOVABLE_API_KEY")` to `_shared/env.ts` so the secret requirement is auditable in one place. Update `.env.example` with a comment indicating this is a server-only secret.

---

## 3. Secrets Exposure

### Working Tree (non-node_modules)

**`supabase/.temp/pooler-url`** — Contains the Supabase pooler connection string including project reference:
```
postgresql://postgres.yhdobsmmhdvqswjpousc@aws-1-us-west-2.pooler.supabase.com:5432/postgres
```
**This file is gitignored** (`.gitignore:21: supabase/.temp/`). No credentials (password) are present in the URL itself — the username is the project ref only. The project ref (`yhdobsmmhdvqswjpousc`) is also visible in `supabase/.temp/project-ref` and `linked-project.json`. These files are gitignored.

**Assessment:** The project ref is not a secret (it is visible in the Supabase dashboard URL and function URLs). No passwords or tokens are present in these files. No rotation needed.

### Git History

No committed secrets found:
- No `sk_live_` or `sk_test_` Stripe keys in any committed `.ts`, `.tsx`, `.js`, `.json`, or `.toml` files across git history.
- No `AIza` Google/Gemini API key patterns found.
- No base64 JWT tokens (`eyJ` prefix) in tracked source files.
- No `.env` files were ever added to the git index (only `.env.example` with empty values).
- The git history entry for `.env.example` (`f827dc44`) contains only empty placeholder variable names, no values.

**The "historically exposed sk_live_ and DB password" referenced in repo memory was not found in git history.** Either it was in a branch that was squashed, committed before the current git history begins, or stored externally. This cannot be ruled out from the current repo state alone. If there is any doubt, rotate the Stripe live key and the DB password regardless — the cost of rotation is low; the cost of an undetected exposure is high.

### Secret Access Patterns

All secrets in the edge functions are accessed via:
- `Deno.env.get(KEY)` — standard and correct
- `ENV.xxx()` helpers from `_shared/env.ts` — typed, fail-fast
- One exception: `generate-grading-feedback` uses `Deno.env.get("LOVABLE_API_KEY")` directly (F-08)
- One exception: `generate-podcast` uses `Deno.env.get('GEMINI_API_KEY')!` and `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!` directly with non-null assertion (will throw at runtime if missing, not a security issue)

No secrets are hardcoded in source files. No secrets appear in log statements.

---

## 4. CORS Review

**All functions using `_shared/cors.ts`:** Correct. The `corsHeaders()` function maintains an allowlist via `ALLOWED_ORIGINS` env var, reflects the requesting origin only if it is in the list, and sets `Vary: Origin`. No wildcard.

**`generate-podcast`:** Uses a hardcoded `'Access-Control-Allow-Origin': '*'` (F-05). This is the only function with wildcard CORS.

**Preflight handling for `stripe-webhook`:** Correctly skips CORS preflight since Stripe is a server caller, not a browser.

---

## 5. Input Validation Review

**`grade-submission`:** `submissionId` is required and type-checked as a string before use. The submission is fetched via Supabase's parameterized client — no raw SQL. The `extracted_text` field is passed to the AI model, not to SQL. No injection surface.

**`generate-grading-feedback`:** `essayText` is bounded to 100,000 chars; `rubricText` to 20,000 chars. The essay is delimited with a sentinel (`#####STUDENT_ESSAY_UNTRUSTED#####`) and the prompt explicitly instructs the model to treat it as data, not instructions. Output is strictly validated via `validateGradingResponse()`. The AI response is not used in SQL queries.

**`generate-podcast`:** No input validation beyond checking `title` and `userId` are truthy. The `inputNotes` field is passed directly into the AI prompt without sanitization or length bounding. This is a prompt injection surface — an attacker can supply a very large `inputNotes` to inflate AI costs, or attempt to manipulate model output. Since there is no auth (F-02), this is exploitable by anyone.

**`create-class`:** Field presence is checked but `classSize` is passed to `parseInt()` without bounds checking — if `classSize` is a non-integer string `parseInt` returns `NaN`, which would be stored as `NaN` in the JSON column. Low severity; not a security issue but a data quality issue.

**All Supabase queries use the supabase-js client**, which uses parameterized queries internally. No raw SQL string concatenation was found in edge functions. SQL injection is not present.

---

## 6. Service-Role (`adminClient`) Usage Audit

`adminClient()` is used in the following functions and for the following purposes:

| Function | adminClient usage | Justified? |
|---|---|---|
| `grade-submission` | Write to `llm_sessions`, `access_audit_log`, `agent_events` (server-only tables); also used for internal worker path DB queries | Yes — audit tables inaccessible to user RLS |
| `record-feedback-usage` | Read and update `users.weekly_feedback_count`, `users.plan` — privileged columns not client-writable | Yes — prevents client-side plan manipulation |
| `stripe-webhook` | Upsert `subscriptions`, update `users.plan` — billing state management | Yes — Stripe is not a user; no JWT to use |
| `stripe-checkout` | Read `subscriptions.stripe_customer_id` | Acceptable; used server-side only |
| `stripe-portal` | Read `subscriptions.stripe_customer_id` | Acceptable; used server-side only |
| `privacy-tasks` | All operations — processes all users' data | Yes — cron context, no user JWT |
| `generate-podcast` | All DB writes — `podcast_episodes` insert | Unjustified — should use `userClient(req)` with RLS after auth is added |
| `create-class` | All DB writes — `classes` insert | Overprivileged — should use `userClient(req)` after `getUserFromJWT`. The user id is sourced from JWT so the insert is owner-correct, but bypassing RLS unnecessarily. LOW severity. |

The `adminClient` is never referenced in frontend/client code. It is server-side only. The `SUPABASE_SERVICE_ROLE_KEY` is never returned in any API response.

---

## Summary Table

| ID | Severity | Finding |
|---|---|---|
| F-01 | CRITICAL | `grade-submission` deployed with `--no-verify-jwt` — config drift; in-code auth is present but gateway is bypassed |
| F-02 | CRITICAL | `generate-podcast` has no auth at all; accepts attacker-supplied `userId`; wildcard CORS; unbounded input |
| F-03 | MEDIUM | `requireCronSecret` uses non-constant-time string comparison |
| F-04 | MEDIUM | `grade-submission` internal path uses `adminClient` + body-supplied `userId` — safe only while `INTERNAL_GRADE_SECRET` is set and uncompromised |
| F-05 | MEDIUM | `generate-podcast` uses `Access-Control-Allow-Origin: *` (wildcard) |
| F-06 | LOW | `stripe-webhook` requires `--no-verify-jwt` but is not declared in `config.toml`; CI will deploy it with JWT verification ON |
| F-07 | LOW | `adminClient()` singleton persists key across requests — stale after key rotation until isolate recycles |
| F-08 | LOW | `LOVABLE_API_KEY` and `generate-podcast`'s secrets not in `_shared/env.ts` — unauditable |

