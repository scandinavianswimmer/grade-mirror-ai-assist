# 06 — Supabase / RLS / Security Review & Data-Model Changes

Pairs with `supabase-rls-security-skill` and `privacy-ferpa-student-data-skill`. All findings are read-only audit results; nothing was changed.

## Current data model (live, from `types.ts` — 20 tables)

All tables key off `users.id = auth.uid()`. No native enums — every "enum" is a `TEXT CHECK`.

```
auth.users
   └─ users (profile: email, name, role, plan, weekly_feedback_count,
             last_reset_date, onboarding_complete, school, ...)
        ├─ classes ── assignments (rubric_text, course_name, canvas_id, canvas_course_id)
        │                 └─ submissions (student_name⚠PII, essay⚠PII, file_url,
        │                       ai_score/ai_grade/ai_feedback, final_score, feedback,
        │                       inline_comments, teacher_final_grade, teacher_notes,
        │                       canvas_submission_id)
        │                       ├─ teacher_comments (text_start/end, comment_text, type)
        │                       └─ teacher_edits (accept/decline reinforcement log)
        ├─ teacher_profiles (style_profile_json)
        ├─ ai_profiles (grading_style_summary, ai_model_id)
        ├─ training_examples (essay + rubric + feedback + grade)
        ├─ training_data (file_url, processed)
        ├─ grading_examples (files + teacher_comments JSONB)
        ├─ rubrics (free text)
        ├─ privacy_settings (anonymize_student_names, allow_training_on_content,
        │                    auto_delete_training_data)
        ├─ lms_integrations (access_token⚠, refresh_token⚠, canvas_url) [plaintext]
        ├─ llm_sessions (input_data/output_data JSONB)
        └─ podcast_episodes (vestigial)
Global / lead-gen: ai_model_health, ai_request_logs, enterprise_contacts*, teacher_interest*
   (* present in live DB but in NO migration file)
```

## Migration hygiene — **HIGH: not replayable**

Two overlapping schemes (hand-numbered `001/002/003` + Lovable timestamps `2025xxxx`):
- **Duplicate table (confirmed):** `20250711194357` and `20250711194416` both `CREATE TABLE public.podcast_episodes` with no `IF NOT EXISTS` → second fails on clean replay.
- **Conflicting `users.id` (confirmed):** `001` defines `users.id DEFAULT auth.uid()` (no FK); `20250629180152` defines `users.id REFERENCES auth.users ON DELETE CASCADE`. Lexical order runs `001` first → later conflict.
- **Duplicate policies (confirmed):** the big Lovable file re-creates tables with `IF NOT EXISTS` (skips) but re-issues `CREATE POLICY` (not idempotent) → policy-exists errors on replay.
- **Order-dependent function (confirmed):** `update_updated_at_column()` is used by `20250630053251` but defined later in `20250711194416`.
- **Schema drift (confirmed):** `enterprise_contacts`, `teacher_interest` exist live but in no migration → their RLS state is **unverified**.

**V2 action:** dump the live schema, **squash to a single replayable baseline migration**, delete the conflicting historical files, and from then on use the Supabase CLI with ordered, idempotent migrations + a CI "migrate from scratch" check.

## RLS & access control

RLS is **enabled on all tables**; per-teacher isolation is mostly correct (assignments, submissions via assignment join, classes, teacher_comments, training_*, ai_profiles, teacher_profiles). Findings:

| Sev | Finding | Where | Fix |
|-----|---------|-------|-----|
| **Critical** | **LMS OAuth tokens stored plaintext** (`access_token`/`refresh_token` as `TEXT`) | `lms_integrations` | Encrypt at rest (Supabase Vault / `pgsodium`); never expose to client; server-side exchange. |
| **High** | **`users` UPDATE has no `WITH CHECK`** → client can self-write `plan`/`role`/`weekly_feedback_count` (paywall + privilege escalation) | `001` + Lovable migrations | Add `WITH CHECK`; move privileged columns to server-only writes (revoke column update grant; mutate via Edge Function with service role). |
| **High** | **`USING (true)` SELECT** exposes ops data to any authenticated user | `ai_model_health` | Restrict to service role / admin. |
| **High** | **`userId` trusted from request body** instead of JWT | `increment-feedback-count`, grading fns | Derive identity from `auth.getUser(jwt)`. |
| **High** | **Service-role functions with no caller restriction** (org-wide deletes/anonymize rely solely on gateway `verify_jwt`) | `anonymize-student-data`, `cleanup-training-data`, `scheduled-privacy-tasks` | Cron/secret-gate; never expose with `verify_jwt=false`. |
| **Medium** | **CORS `*`** on every function | all functions | Restrict to known origins. |
| **Medium** | **Lead-gen tables RLS unverified** (often need anon INSERT) | `enterprise_contacts`, `teacher_interest` | Confirm policies in baseline; rate-limit anon insert. |
| **Medium** | **`.env` committed** (currently public anon keys only) | repo root | Untrack + `.gitignore`; rotate if a real secret ever lands there. |

Good baselines to keep: `config.toml` has no `verify_jwt=false` overrides (functions are JWT-gated by default); `create-class` is a correct auth model (validate JWT → validate input → service role); `ai-router` reads keys from env and never logs them.

## Privacy / FERPA (see `privacy-ferpa-student-data-skill`)

| Sev | Finding | Fix |
|-----|---------|-----|
| **Critical** | **Body-level PII not scrubbed.** `anonymize-student-data` renames only `student_name`; names inside `essay`/`feedback`/`inline_comments` remain. | Scrub/redact body fields; consider storing student identity separately from essay text. |
| **High** | **Consent not enforced.** `privacy_settings.allow_training_on_content` is never checked before training on essays; defaults all-TRUE. | Enforce the flag server-side before any training use; capture explicit consent; default to least-permissive. |
| **High** | **No deletion path / retention not running.** `cleanup` only deletes `ai_graded` >30d for opted-in users; finalized grades, training examples, and storage files retained indefinitely; `scheduled-privacy-tasks` has no cron. | Add "delete my data"; wire `pg_cron`; define retention per data class. |
| **Med** | **No student/parent consent or audit log.** | Add consent records + an access/audit log (who accessed which student record, when) — FERPA-relevant. |
| **Med** | **AI vendor terms.** Essays sent to third-party LLM gateways. | Ensure no-training / zero-retention DPA terms; prefer **de-identified** text to the model (strip names; re-attach inside the trust boundary). |

## Data-model changes for V2

1. **Squash migrations** to one clean, replayable, RLS-complete baseline (and capture the two undocumented tables).
2. **Unify the submission model.** Today freemium quick-grades live in `training_examples` while real submissions live in `submissions` — two parallel models. Pick one canonical `submissions` model; treat training/examples separately and explicitly.
3. **Consolidate training/style** (`training_data` + `training_examples` + `grading_examples` → one `training_examples` table the grader reads) and ensure `style_profile` is **consumed by the grader**.
4. **Promote rubrics to structured data:** `rubrics(id, assignment_id)` + `rubric_criteria(name, weight, max_score, level_descriptors jsonb)`. Replace free-text `rubric_text`.
5. **Annotations as a first-class table:** `annotations(submission_id, start_index, end_index, quote, comment, type, status, matched)` + `annotation_edits` for reinforcement. Replace `inline_comments` JSONB / split `teacher_comments`.
6. **Encrypt LMS tokens** (Vault/`pgsodium`); add `token_expires_at`.
7. **Privilege hardening:** `WITH CHECK` on every write policy; revoke client UPDATE on `users.plan/role/weekly_feedback_count`; mutate via server.
8. **Consent + retention + audit:** `consent_records`, retention columns per data class, `access_audit_log`.
9. **Identity from JWT** everywhere; remove client-supplied `userId`.
