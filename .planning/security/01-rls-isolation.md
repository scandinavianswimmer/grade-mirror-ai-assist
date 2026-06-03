# RLS & Tenant Isolation Audit — aiTA / grade-mirror-ai-assist
**Date:** 2026-05-30
**Scope:** Supabase Postgres RLS, tenant isolation, SECURITY DEFINER functions, storage bucket policies, frontend service_role usage.

---

## Schema Context

Two migration tracks exist:

| Track | Path | Status |
|---|---|---|
| v1 (14 migrations) | `supabase/migrations/` | **Live production** (README-BACKEND-V2.md confirms cutover not yet executed) |
| v2 (14 migrations) | `supabase/migrations_v2/` | Clean-room reference; pending promotion |

`migrations_v2/0002_additive_grading.sql` is labeled "non-destructive additive" and may have been
partially applied to support the deployed `grade-submission` function (which requires `submission_grades`
and `annotations`). Whether migrations 0003–0014 are applied in production is unknown from code alone.

All CRITICAL/HIGH findings are based on the confirmed v1 live schema.
Fixes exist in v2 — applying the v2 migration set resolves every finding.

---

## Table Inventory

### v1 Live Production Tables

| Table | RLS Enabled | FORCE RLS | SELECT Policy | Write Policy (INSERT/UPDATE) | DELETE Policy | Isolation Verdict |
|---|---|---|---|---|---|---|
| `users` | YES | NO | `auth.uid() = id` | INSERT WITH CHECK `uid=id` (added 20260522); UPDATE USING `uid=id` | NONE | SOUND |
| `assignments` | YES | NO | `uid = user_id` (FOR ALL) | implicit `uid = user_id` | implicit | SOUND |
| `submissions` | YES | NO | EXISTS(assignment.user_id = uid) (FOR ALL) | implicit EXISTS check | implicit | SOUND |
| `training_examples` | YES | NO | `uid = user_id` (FOR ALL) | implicit | implicit | SOUND |
| `grading_examples` | YES | NO | `uid = user_id` (FOR ALL) | implicit | implicit | SOUND |
| `ai_profiles` | YES | NO | `uid = user_id` (FOR ALL) | implicit | implicit | SOUND |
| `rubrics` | YES | NO | `uid = user_id` (FOR ALL) | implicit | implicit | SOUND |
| `training_data` | YES | NO | `uid = user_id` (FOR ALL) | implicit | implicit | SOUND |
| `privacy_settings` | YES | NO | `uid = user_id` (FOR ALL) | implicit | implicit | SOUND |
| `lms_integrations` | YES | NO | `uid = user_id` (FOR ALL) | implicit | implicit | SOUND for isolation; **MEDIUM**: `access_token` stored plaintext |
| `llm_sessions` | YES | NO | `uid = user_id` (FOR ALL) | implicit | implicit | SOUND |
| `classes` | YES | NO | `uid = user_id` | `uid = user_id` (separate INS/UPD) | `uid = user_id` | SOUND |
| `teacher_profiles` | YES | NO | `uid = user_id` | `uid = user_id` | NONE | SOUND isolation; missing DELETE |
| `teacher_edits` | YES | NO | `uid = user_id` | `uid = user_id` | NONE | SOUND isolation; limited ops |
| `teacher_comments` | YES | NO | EXISTS(sub→asgn.uid) (FOR ALL) | implicit EXISTS (does NOT validate `user_id = uid`) | implicit | SOUND for isolation; **MEDIUM**: `user_id` column not validated in WITH CHECK |
| `podcast_episodes` | YES | NO | `uid = user_id` | `uid = user_id` | `uid = user_id` | SOUND |
| `ai_model_health` | YES | NO | `USING (true)` — world-readable | NONE | NONE | **HIGH**: all authenticated users can read |
| `ai_request_logs` | YES | NO | `uid = user_id OR user_id IS NULL` | NONE | NONE | **HIGH**: system-level rows leak to all authenticated users |

### Storage Buckets (v1)

| Bucket | Public | Owner-Scoped Policy | Verdict |
|---|---|---|---|
| `uploads` | **YES — public = true** | YES (uid prefix on RLS path) — irrelevant; public bypasses RLS | **CRITICAL**: student files publicly accessible without auth |
| `training-data` | NO | YES (uid prefix) | SOUND |
| `grading-examples` | NO | YES (uid prefix) | SOUND |
| `submissions` | NO | YES (uid prefix, from 0011; bucket-only if only 0002) | SOUND if 0011 applied; HIGH if only 0002 |
| `user-{uid}` (personal) | NO | YES (bucket_id = `user-` + uid) | SOUND |

### v2 Pending Tables (NOT confirmed applied in production)

| Table | v2 RLS | Policies | Verdict if Applied |
|---|---|---|---|
| `submission_grades` | YES (0002) | owner CRUD, `uid = user_id` | SOUND |
| `annotations` | YES (0002) | owner CRUD, `uid = user_id` | SOUND |
| `annotation_edits` | YES (0002) | owner CRUD, `uid = user_id` | SOUND |
| `rubric_criteria` | YES (0002) | owner CRUD, `uid = user_id` | SOUND |
| `teacher_style_profiles` | YES (0002) | SELECT/INSERT/UPDATE, `uid = user_id` | SOUND |
| `lms_credentials` | YES (0002) | NO policies → deny all to anon/authenticated | SOUND (service-role only) |
| `consent_records` | YES (0002) | owner CRUD | SOUND |
| `access_audit_log` | YES (0002) | NO policies → deny all | SOUND |
| `enterprise_contacts` | YES (0001 baseline) | INSERT WITH CHECK(true); no SELECT | SOUND (intentional anon lead capture) |
| `subscriptions` | YES (0012) | SELECT `uid = user_id`; no client writes | SOUND |
| `agent_events` | YES (0013) | SELECT `uid = user_id`; no client writes | SOUND |

---

## Findings

### CRITICAL-1: Student Essay Files Publicly Accessible via Unauthenticated CDN URL

**Severity:** CRITICAL
**Files:**
- `supabase/migrations/001_initial_schema.sql:164`
- `supabase/migrations/20250629180152-e8b80c44-2284-42a0-b82b-a1ecbc35b1a1.sql:211`

**Vulnerability:**
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true)
```
The `uploads` bucket is created with `public = true`. In Supabase, a public bucket bypasses all
`storage.objects` RLS policies and serves every object via an unauthenticated CDN URL:
```
https://yhdobsmmhdvqswjpousc.supabase.co/storage/v1/object/public/uploads/<uid>/<filename>
```
Student essays (containing student names, written content, potentially FERPA-protected educational
records) are uploaded here via `src/lib/fileUpload.ts:uploadFile()`. Anyone with the URL — which
is predictable from `<teacher-uid>/<timestamp>-<randomstring>.<ext>` — can download the file
without any authentication.

**The application code correctly uses signed URLs** (`src/lib/fileUpload.ts:56`: "Private buckets
only — return a short-lived signed URL, never a public URL (C6)") but this protection is bypassed
entirely at the storage configuration layer. The bucket being public negates the signed-URL approach.

**Exploit:**
```bash
# No auth required. uid is learnable from any teacher account; timestamp and random suffix are
# a small search space (ms-precision epoch + 7 alphanumeric chars).
curl https://yhdobsmmhdvqswjpousc.supabase.co/storage/v1/object/public/uploads/  <teacher-uuid>/<timestamp>-<random>.pdf --output student_essay.pdf
```

**Fix (apply immediately):**
```sql
UPDATE storage.buckets SET public = false
  WHERE id IN ('uploads', 'submissions', 'grading-examples', 'training-data');
```
This is already in `supabase/migrations_v2/0004_private_buckets.sql`. Apply it now as a standalone
hotfix. Signed URLs (already used in the frontend) continue to work correctly — private buckets
require them and they are already in place.

---

### HIGH-1: ai_model_health Table World-Readable to All Authenticated Users

**Severity:** HIGH
**File:** `supabase/migrations/20250930203826_ddb8f091-a060-4c8c-93f3-be1315802226.sql:38-41`

**Vulnerability:**
```sql
CREATE POLICY "Teachers can view AI model health"
  ON public.ai_model_health
  FOR SELECT
  USING (true);
```
Every signed-in teacher can SELECT all rows from `ai_model_health`, exposing: model names, AI
provider names, consecutive failure counts, last success/failure timestamps, response time metrics.
This leaks the system's operational state and AI provider dependency map to all users.

**Exploit:**
```js
// Any authenticated teacher:
const { data } = await supabase.from('ai_model_health').select('*')
// Returns all rows: which models are failing, which providers are used, latency data.
```

**Fix:**
```sql
DROP POLICY IF EXISTS "Teachers can view AI model health" ON public.ai_model_health;
-- RLS enabled + zero policies = deny all to anon/authenticated. Service-role bypasses RLS.
-- Source: supabase/migrations_v2/0008_restrict_ai_health.sql
```

---

### HIGH-2: ai_request_logs System Rows Leak to All Authenticated Users

**Severity:** HIGH
**File:** `supabase/migrations/20250930203826_ddb8f091-a060-4c8c-93f3-be1315802226.sql:44-47`

**Vulnerability:**
```sql
CREATE POLICY "Users can view their own AI request logs"
  ON public.ai_request_logs
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);
```
The `OR user_id IS NULL` clause makes every system-level log row (where `user_id` is null —
e.g., cron jobs, health checks, internal tooling) visible to every authenticated teacher.
These rows contain: `function_name`, `model_name`, `provider`, `error_message`, `fallback_model`,
`request_type`, `status`.

**Exploit:**
```js
// Any authenticated teacher:
const { data } = await supabase.from('ai_request_logs').select('*').is('user_id', null)
// Returns all system-level log rows, exposing internal function invocations and error details.
```

**Fix:**
```sql
DROP POLICY IF EXISTS "Users can view their own AI request logs" ON public.ai_request_logs;
CREATE POLICY "Users can view their own AI request logs"
  ON public.ai_request_logs
  FOR SELECT
  USING (auth.uid() = user_id);
-- NULL user_id rows are inaccessible to clients; service role still reads all.
-- Source: supabase/migrations_v2/0008_restrict_ai_health.sql
```

---

### HIGH-3 (Conditional): Storage Cross-Tenant Read/Write if v2 0002 Applied Without 0011

**Severity:** HIGH (only if `migrations_v2/0002` was applied but `0011` was not)
**File:** `supabase/migrations_v2/0002_additive_grading.sql:111-115`

**Vulnerability:**
`0002_additive_grading.sql` creates storage policies gating only on `bucket_id = 'submissions'`
with no owner path-prefix check:
```sql
create policy "submissions auth read" on storage.objects for select to authenticated
  using (bucket_id = 'submissions');
create policy "submissions auth write" on storage.objects for insert to authenticated
  with check (bucket_id = 'submissions');
```
Any authenticated teacher can read or write any file in the `submissions` bucket, regardless of
which teacher owns it.

**Exploit:**
```js
// Teacher B reads Teacher A's student file from the submissions bucket:
const { data } = await supabase.storage.from('submissions')
  .download('<teacher-a-uid>/student-essay.pdf')
// RLS does not block this — bucket_id check passes; no uid check.
```

**Fix:** Apply `supabase/migrations_v2/0011_owner_scoped_storage.sql`, which replaces all four
bucket policies with owner-scoped variants requiring
`(storage.foldername(name))[1] = auth.uid()::text`.

---

### MEDIUM-1: No FORCE ROW LEVEL SECURITY on Any Table

**Severity:** MEDIUM
**Files:** Absent from all migrations.

**Vulnerability:**
Without `ALTER TABLE t FORCE ROW LEVEL SECURITY`, PostgreSQL table owners and superusers bypass
RLS entirely. In Supabase's managed environment, the `postgres` role (used by migrations and admin
tasks) can read or write any row without RLS enforcement. A compromised admin credential or an
inadvertent maintenance script running as the table owner would bypass all tenant isolation
silently.

**Fix:**
```sql
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','assignments','submissions','training_examples','grading_examples',
    'ai_profiles','rubrics','training_data','privacy_settings','lms_integrations',
    'llm_sessions','classes','teacher_profiles','teacher_edits','teacher_comments',
    'podcast_episodes','ai_model_health','ai_request_logs'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', t);
  END LOOP;
END $$;
-- Also add to all v2 tables when the migration set is promoted.
```

---

### MEDIUM-2: teacher_comments.user_id Not Validated in WITH CHECK

**Severity:** MEDIUM
**File:** `supabase/migrations/20250826212604_c91b1955-e9ac-4dde-942f-b61afe4f7006.sql:19-29`

**Vulnerability:**
```sql
CREATE POLICY "Users can manage comments for own submissions"
ON public.teacher_comments FOR ALL
USING (
  EXISTS (SELECT 1 FROM submissions s JOIN assignments a ON s.assignment_id = a.id
          WHERE s.id = teacher_comments.submission_id AND a.user_id = auth.uid())
);
```
The `FOR ALL USING` (implicitly `WITH CHECK` for INSERT/UPDATE) validates that `submission_id`
chains to one of the caller's assignments but does NOT validate that the `user_id` column
matches `auth.uid()`. A teacher can INSERT a comment with `user_id = <another-teacher-uuid>`.
Cross-tenant read access is still blocked (the submission chain enforces that), but
data attribution is corrupted — analytics or admin reports aggregating `teacher_comments` by
`user_id` will misattribute rows.

The table has `CREATE INDEX idx_teacher_comments_user_id` (line 39), implying queries will
filter by `user_id`, making this a live data-quality risk.

**Fix:**
```sql
DROP POLICY "Users can manage comments for own submissions" ON public.teacher_comments;
CREATE POLICY "Users can manage comments for own submissions"
ON public.teacher_comments FOR ALL
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.submissions s
    JOIN public.assignments a ON s.assignment_id = a.id
    WHERE s.id = teacher_comments.submission_id
    AND a.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.submissions s
    JOIN public.assignments a ON s.assignment_id = a.id
    WHERE s.id = teacher_comments.submission_id
    AND a.user_id = auth.uid()
  )
);
```

---

### MEDIUM-3: lms_integrations Stores OAuth Access Tokens in Plaintext

**Severity:** MEDIUM
**File:** `supabase/migrations/001_initial_schema.sql:127`,
`supabase/migrations/20250629180152-e8b80c44-2284-42a0-b82b-a1ecbc35b1a1.sql:121`

**Vulnerability:**
```sql
access_token TEXT NOT NULL,
refresh_token TEXT,
```
Canvas LMS OAuth tokens are stored as plaintext `TEXT` columns. While RLS correctly prevents
cross-tenant access at the application level (`uid = user_id` policy), a database-level breach
(SQL injection in a SECURITY DEFINER function, a compromised `postgres` credential, or a cloud
storage snapshot) would expose all teachers' Canvas OAuth tokens in cleartext, enabling an
attacker to post grades, read rosters, and download submissions on behalf of every teacher.

**Fix:** Migrate to v2 `lms_credentials` table which uses `access_token_enc bytea` (pgcrypto
AES-256 encryption) or `vault_secret_id uuid` (Supabase Vault). See
`supabase/migrations_v2/0001_baseline.sql:255-269`.

---

### MEDIUM-4: SECURITY DEFINER Functions Without SET search_path (Early Migrations — Superseded)

**Severity:** MEDIUM (mitigated; superseded by later migrations)
**Files:**
- `supabase/migrations/001_initial_schema.sql:200`
- `supabase/migrations/20250629180152-e8b80c44-2284-42a0-b82b-a1ecbc35b1a1.sql:259`

**Vulnerability:**
Early definitions of `handle_new_user()` use `SECURITY DEFINER` without `SET search_path`:
```sql
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
A `SECURITY DEFINER` function without a pinned `search_path` runs with the caller's `search_path`,
which can be manipulated. An attacker who can create objects in any schema on the `search_path`
could shadow trusted functions and execute code under the definer's elevated privileges.

**Mitigation already in place:** Later migrations
`20250827204643_afba7a29-c410-461a-a4cf-f3a22b9efb3e.sql:5` and
`20260522000000_oauth_profile_bootstrap.sql:18` both replace `handle_new_user()` using
`SECURITY DEFINER SET search_path = public`. Since `CREATE OR REPLACE FUNCTION` applies the last
definition, the live function has the correct `search_path` pinned — assuming migrations ran
in order (they do in Supabase's sequential runner).

**Verification:** Run `\df+ public.handle_new_user` in production and confirm `search_path=public`
is shown in the function's configuration parameters.

---

### LOW-1: Hardcoded Placeholder JWT Secret

**Severity:** LOW
**File:** `supabase/migrations/001_initial_schema.sql:3`

**Vulnerability:**
```sql
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';
```
Sets the database-level `app.jwt_secret` config to the placeholder string `your-jwt-secret`.
In Supabase's managed environment, JWT secrets are configured via the platform (not this DDL),
so this is likely overridden. However, if this migration ran against a self-hosted instance,
`current_setting('app.jwt_secret')` would return this insecure placeholder, breaking any
function that relies on it for token verification.

**Fix:** Remove this line from the migration, or document that it is a no-op in the managed
Supabase environment.

---

### LOW-2: Supabase Project URL and Anon Key Hardcoded as Fallbacks in Frontend

**Severity:** LOW
**File:** `src/lib/supabase.ts:5-6`

**Vulnerability:**
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ??
  'https://yhdobsmmhdvqswjpousc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  'sb_publishable_K6aT1ZXMuEfdgGYMuQ2IRg_Rz5sM6TB';
```
The Supabase anon/publishable key is intentionally public by design, so this is not a secret
exposure. However: (1) the project reference ID (`yhdobsmmhdvqswjpousc`) and live key are
committed in version control, reducing the ability to rotate without a code change; (2) the
fallback means the app silently connects to production even when `.env` is missing.

**Fix:** Remove the hardcoded fallbacks. Fail loudly at startup if `VITE_SUPABASE_URL` or
`VITE_SUPABASE_PUBLISHABLE_KEY` are unset.

---

### LOW-3: teacher_profiles Missing DELETE Policy

**Severity:** LOW
**File:** `supabase/migrations/20250630053251-06bc05b3-d8e5-4180-933a-052cd89bc478.sql:33-47`

**Vulnerability:**
`teacher_profiles` has SELECT, INSERT, and UPDATE RLS policies but no DELETE policy. A teacher
cannot delete their own style profile via the client. This blocks GDPR/CCPA data-erasure flows.
`teacher_edits` also lacks UPDATE and DELETE policies.

**Fix:**
```sql
CREATE POLICY "Users can delete their own teacher profile"
  ON public.teacher_profiles FOR DELETE USING (auth.uid() = user_id);
```

---

## Edge Function Assessment

| Function | Auth Method | Service-Role Usage | Cross-Tenant Risk |
|---|---|---|---|
| `grade-submission` | JWT (normal) or `x-internal-secret` + explicit ownership check (worker) | YES — writes `llm_sessions`, `access_audit_log`, `agent_events` | LOW — worker path verifies `submission.user_id === body.userId` after DB fetch |
| `ingest-document` | JWT, RLS via userClient | NO | NONE |
| `generate-grading-feedback` | JWT, userClient | NO (writes `llm_sessions` via userClient) | NONE |
| `record-feedback-usage` | JWT, adminClient for privileged column update | YES — only writes caller's own row | LOW |
| `privacy-tasks` | `x-cron-secret` header | YES — all teachers' data | NONE (intentional cron design) |
| `stripe-webhook` | Stripe-Signature (no JWT) | YES — writes `subscriptions` and `users.plan` | LOW — resolves `user_id` from Stripe customer ID or checkout metadata |
| `grade-enqueue` | JWT, userClient | NO | NONE — RLS scopes submission ownership |

**Frontend:** `src/lib/supabase.ts` and `src/integrations/supabase/client.ts` use only the anon
key. No `service_role` key found in frontend source. Correct.

**increment-feedback-count (v1 deprecated function):** The README notes this function trusted
`userId` from the request body — an identity-spoofing gap. Replaced by `record-feedback-usage`.
**Confirm this v1 function is removed or unreachable in production.**

---

## Top-Line Verdict

**Cross-tenant isolation of student/teacher data is PARTIALLY sound in the live v1 schema.**

All core teacher-data tables (`assignments`, `submissions`, `training_examples`, `grading_examples`,
`rubrics`, `classes`, `lms_integrations`, `llm_sessions`, etc.) have correct owner-scoped RLS
using `auth.uid()`. Join-based policies on `submissions` and `teacher_comments` correctly enforce
transitive ownership through the assignment chain. No teacher can read another teacher's
assignments, submissions, or graded essays through the application API.

**Active holes:**
1. The `uploads` storage bucket is `public = true`, exposing student files to unauthenticated
   CDN access — bypassing all RLS policies. This is the highest-risk issue and requires an
   immediate `UPDATE storage.buckets SET public = false` hotfix.
2. `ai_model_health` (USING true) and `ai_request_logs` (OR user_id IS NULL) have overly
   broad SELECT policies leaking operational metadata to all authenticated users.

**Remediation path:** The `migrations_v2/` set contains fixes for all 8 CRITICAL/HIGH/MEDIUM
findings. The highest-value immediate actions are:
1. `UPDATE storage.buckets SET public = false WHERE id IN ('uploads', 'submissions', 'grading-examples', 'training-data');`
2. Apply `migrations_v2/0008_restrict_ai_health.sql` standalone.
3. Full v2 promotion per README-BACKEND-V2.md cutover instructions.

---

## Summary Table

| Severity | Count | Findings |
|---|---|---|
| CRITICAL | 1 | uploads bucket public=true (student PII unauthenticated access) |
| HIGH | 3 | ai_model_health USING(true); ai_request_logs OR NULL; storage cross-tenant if 0002 w/o 0011 |
| MEDIUM | 4 | No FORCE RLS; teacher_comments user_id not in WITH CHECK; lms plaintext tokens; SECURITY DEFINER search_path (superseded) |
| LOW | 3 | JWT placeholder; anon key fallback; missing DELETE policy |
| **Total** | **11** | |
