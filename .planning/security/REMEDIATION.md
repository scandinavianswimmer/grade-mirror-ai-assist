# Security Remediation — 2026-05-30

Outcome of the 4-domain audit (`01`–`04` in this dir). Key reframing: the audit agents analyzed
both the v1 (`supabase/migrations/`) and v2 (`supabase/migrations_v2/`) schemas and scoped their
CRITICAL/HIGH RLS findings to the **v1** schema. Live-DB probes (anon key) confirmed **v2 is
applied in production** — so most RLS findings were already fixed live. The genuine gaps were
code-level (rate limiting, an unauthenticated function, send-time de-identification, erasure).

## Verified live state (probed 2026-05-30, anon key)
- Storage buckets `uploads`/`submissions`/`training-data`/`grading-examples` → **private** (v2 `0004`).
  CRITICAL-1 already remediated. No flip needed.
- `submissions`/PII not readable by anon (RLS enforced).
- v2 tables present: `submission_grades`, `annotations`, `consent_records`, `access_audit_log`,
  `agent_events`, encrypted `lms_credentials`.
- `0008_restrict_ai_health` (drops the world-readable `ai_model_health` / `ai_request_logs`
  policies) is part of the applied v2 set → HIGH-1/HIGH-2 already remediated. (Authenticated-user
  read couldn't be 100%-confirmed without a teacher JWT; `0016` does not need to re-assert it but
  the v2 policy is correct.)
- `increment_weekly_feedback` RPC present; `consume_grading_quota` absent (built here).

## Fixed this session (commits on `aita-production-build`)

| Area | Severity | What | Ships via |
|------|----------|------|-----------|
| Cost-control Layers B/C/D | CRITICAL | Upstash global per-minute ceiling counting every Gemini call incl. key rotations (`_shared/ratelimit.ts`, `gemini.ts`); per-request call budget max 4 (`engine.ts`); essay ≤100k chars, enqueue batch ≤100, PDF ≤50 pages | **deploy** |
| `generate-podcast` auth | CRITICAL | Was fully unauthenticated + body-supplied `userId` (IDOR) + service-role + wildcard CORS. Now JWT, userId from token, RLS userClient, CORS allowlist, bounded input | **deploy + config** |
| Grading quota Layer A | CRITICAL | Atomic `consume_grading_quota` RPC wired into grade-submission + grade-enqueue; fail-open pre-migration | **deploy + migration** |
| De-identification | HIGH | Mask student name in essay before Gemini (length-preserving so annotation offsets stay valid), gated by `anonymize_student_names` | **deploy** |
| Right-to-erasure + storage cleanup | HIGH | New `delete-data` fn (submission/class/account, removes DB rows + Storage objects + audit); retention now removes orphaned files | **deploy + config** |
| Config drift + cron compare | MED | config.toml now matches deploy reality (grade-submission verify_jwt=false documented; podcast/stripe-webhook/delete-data declared); constant-time cron secret compare | **deploy** |
| RLS FORCE + teacher_comments | MED | `0016`: teacher_comments WITH CHECK enforces user_id; FORCE RLS on tenant tables (users excluded — signup-trigger risk) | **migration** |

## Founder actions to make it all live
1. **Deploy the changed functions** (config.toml now encodes per-function verify_jwt, so no
   `--no-verify-jwt` flag needed): `supabase functions deploy` (all) — or at least
   `grade-submission grade-enqueue generate-podcast privacy-tasks delete-data build-style-profile`.
   `delete-data` is NEW (first deploy).
2. **Apply migrations** `0015_grading_quota_rpc.sql` + `0016_rls_force_and_comments.sql` with the DB
   password (same path that applied 0002–0014). Until 0015 is applied, the quota gate fails open
   (grading still works — good for the demo).
3. **(Optional) `GEMINI_GLOBAL_QPM`** secret to tune the global ceiling (default 60/min). Confirm
   `UPSTASH_REDIS_REST_URL`/`TOKEN` are set or Layer B no-ops (fails open).

## Not addressed (deferred / lower priority)
- LOW items: hardcoded anon-key fallback in `src/lib/supabase.ts`, JWT placeholder in v1 `001`,
  divergent legacy limit tables, plaintext essays at rest.
- `config.toml project_id = "rwiqwuohbcvhuvtlxlvh"` ≠ live `yhdobsmmhdvqswjpousc` — reconcile.
- Vendor data-handling: confirm the Gemini key tier is no-train / retention-limited (FERPA).
- Full `auth.users` account deletion (admin API) — `delete-data` erases content, not the auth row.
- FORCE RLS on `users` (signup-trigger interaction — verify in staging first).
- Rotate Stripe live key + DB password out of caution (no committed secret found in git history).
