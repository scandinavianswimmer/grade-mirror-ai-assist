# Privacy / FERPA Audit — aiTA (grade-mirror-ai-assist)

Scope: data-handling privacy for student PII + essays. RLS internals, rate limiting, and
secret values are out of scope (owned by other audits). Read-only audit.

Authoritative schema = `supabase/migrations_v2/` (the v1 `supabase/migrations/` set is archived/drifted
per `0001_baseline.sql` header and the README). Findings below reference the v2 model + the live
Edge Functions.

---

## 1. Data-flow summary

### What student data is stored, and where
| Data | Table / location | Notes |
|---|---|---|
| Student name (PII) | `submissions.student_name` | plaintext |
| Opaque student id | `submissions.student_ref` | intended de-id token; **never populated/used by code** |
| Essay (raw, full text) | `submissions.extracted_text` | plaintext; primary student content |
| Uploaded file (PDF/DOCX) | Storage bucket `submissions` (path `${uid}/...`) | private bucket (0004/0011) |
| AI grade + feedback | `submission_grades.summary_feedback`, `.criteria` | may contain student name if essay echoed it |
| Inline annotations | `annotations.quote`, `.comment`, `.ai_comment` | quotes copy essay spans verbatim |
| Teacher training exemplars | `training_examples.essay/feedback/grade` | student work used for personalization |
| Teacher PII | `users` (email, full_name, school) | teacher, not student |
| LMS creds | `lms_credentials` (encrypted/vault, deny-all RLS) | out of scope, looks good |

### What is SENT to the third-party LLM (Google Gemini)
Grading engine (`_shared/grading/engine.ts` → `_shared/ai/gemini.ts`):
- **System/cacheable prefix**: system prompt + class context + teacher style profile + rubric text.
- **User content**: `submission.extracted_text` — the **raw, full essay**, inside `<STUDENT_SUBMISSION>` delimiters.
- The relevance pre-pass (`gemini-2.5-flash`) also receives the raw essay + assignment text.
- `student_name` / `student_ref` are **NOT** loaded by `grade-submission` and are **NOT** placed in the
  prompt — good. **However**, any student name written *inside the essay body* (header, byline, "By Jane Doe")
  is sent to Gemini verbatim. There is **no PII stripping/de-identification before the LLM call.**
- A second grading path, `generate-grading-feedback/index.ts`, sends the raw essay to a **different
  provider** via `LOVABLE_API_KEY` (an AI gateway), again with no de-identification.

### What is written to LOGS / durable tables (PII check)
- `ai_request_logs` (router.ts `recordModelResult`): stores **only** `model_id, ok, error_type, latency_ms`.
  **No essay, no prompt, no PII.** Clean.
- `ai_model_health`: model_id + health counters. Clean.
- `llm_sessions` (grade-submission): `model_id`, token counts, `ok`. Schema has `prompt_hash` (hash, not text).
  **No raw prompt/essay.** Clean. (Note: v1 `llm_sessions.input_data/output_data JSONB` existed and could
  hold raw IO, but the v2 baseline drops those columns; only `generate-grading-feedback` still writes
  `input_data`/`output_data` — and it stores only `essayChars` (a length) + `suggestedGrade`/`commentCount`,
  not content. Clean.)
- `access_audit_log`: action + `resource: submission:<id>`. IDs only, no content. Clean.
- `console.error` calls in grade-submission log error messages + column names only — no essay/PII grepped. Clean.

**Logging verdict: no raw essay text or student PII is written to any durable log table.** This is the
single best part of the current design.

### Consent / privacy settings model
- `privacy_settings`: `allow_training_on_content` (default **false** — opt-in, good, 0005),
  `anonymize_student_names` (default true), `retention_days` (nullable, 0007).
- `consent_records` table exists (scope/granted/note) but is **never read or written by any function** — dead.
- Consent gating that DOES work: `allow_training_on_content` gates the *personalization* paths
  (`build-style-profile`, `generate-style-summary`, and exemplar injection in `generate-grading-feedback`).
- Consent gating that does NOT exist: nothing gates the **grading LLM call** itself or the relevance pre-pass.
  Essay text is sent to Gemini for grading regardless of any consent/anonymization setting.

---

## 2. Findings (ranked)

### CRITICAL
None that are clear-cut data leaks given logging is clean and buckets are private. The items below are HIGH.

### HIGH

**H1 — No de-identification before sending essays to Gemini.**
`student_ref` (the intended opaque token) is never populated, and `anonymize_student_names` never affects
the grading prompt. Names embedded in essay bodies (very common in student submissions: name headers,
"My name is…", signatures) are transmitted to Google verbatim. For a minors'-data app this is the core
FERPA/third-party-sharing exposure.
*Remediation:* (a) run a name-scrub over `extracted_text` before building the prompt (reuse the `scrub()`
logic already in `privacy-tasks`, seeded with the submission's `student_name`); (b) populate and use
`student_ref` instead of name anywhere identity is needed; (c) at minimum strip the first/last N lines that
typically carry the byline. Apply to BOTH `grade-submission` and `generate-grading-feedback`.

**H2 — No working right-to-deletion path for student data.**
There is **no** `delete-student`, `delete-class`, `delete-submission`, or `delete-all-my-data` Edge Function.
Deletion relies on (a) RLS DELETE policies letting the teacher delete their own rows via the client, and
(b) `ON DELETE CASCADE` FKs (submissions→grades/annotations cascade correctly in v2). That covers DB rows,
but see H3. There is no audited, single-call "erase this student / this class" operation, and no
account-deletion/export endpoint.
*Remediation:* add a secret/owner-gated function that, for a given submission/class/user, deletes DB rows
**and** the corresponding Storage objects, writes an `access_audit_log` entry, and confirms cascade.

**H3 — Uploaded files in Storage are orphaned on deletion (no Storage cleanup on row delete).**
Deleting a `submissions` row (via RLS or retention) removes DB rows by cascade but does **NOT** delete the
uploaded file at `submissions/${uid}/...`. `privacy-tasks` retention deletes submission rows
(`0007`/index.ts lines 88–99) but never calls `storage.remove()`. Grep confirms no `storage.*remove` call
exists anywhere in the codebase. Result: student PDFs/DOCX persist indefinitely in the bucket after the
"deletion," defeating retention and right-to-erasure.
*Remediation:* in retention + any delete path, collect `file_path`s and `storage.from('submissions').remove([...])`
before/after the row delete.

### MEDIUM

**M1 — `anonymize_student_names` anonymization is retroactive-only and lossy.**
The only place names are scrubbed is the cron `privacy-tasks` job, which overwrites `student_name='Student'`
and regex-replaces names in `extracted_text`/feedback/annotations *after the fact*. Between upload and the
next cron run, names sit in plaintext and have already been sent to Gemini (H1). The regex scrub is also
brittle (won't catch nicknames, split names, or names shorter than 2 chars) and is destructive (no reversible
mapping). It's a reasonable retention-time control but is not a substitute for de-id at send time.

**M2 — `consent_records` is dead / consent is teacher-level only.**
FERPA consent is conceptually about the *student/parent*, but the only consent signal is the teacher's
`allow_training_on_content` flag, and the richer `consent_records` table is unused. For a beta this is
acceptable, but the "share_with_ai_vendor" scope is implied-by-use rather than recorded. Decide whether
vendor-sharing consent needs to be captured, and either wire `consent_records` in or delete it to avoid
implying a control that doesn't exist.

**M3 — Retention default is 365 days and `null` = keep forever.**
`retention_days` defaults to 365 and null means never delete. Fine as a default, but combined with H3
(files never deleted) the practical retention of *files* is infinite regardless of the setting.

**M4 — Two grading providers, two egress paths.**
`grade-submission` → Gemini; `generate-grading-feedback` → LOVABLE_API_KEY gateway. Both receive raw essays.
Confirm which is the live path for beta; the second provider is an additional third party to disclose and
de-identify against. Consolidating reduces the privacy surface.

### LOW

**L1 — Essays/exemplars stored plaintext at rest.** `extracted_text`, `training_examples.essay`,
`annotations.quote` are plaintext columns. Supabase encrypts at the disk level; column-level encryption is
likely overkill for beta but note it for enterprise/district deals.

**L2 — Data minimization is reasonable.** Only `student_name` is collected as student PII (no DOB, ID#,
contact info), which is good FERPA-aligned minimization. The unused `student_ref` should be put to work
(see H1) rather than removed.

**L3 — Annotations/grades can re-introduce names.** Even with `student_name` scrubbed, if the model quotes
an essay span containing a name into `annotations.quote`/`summary_feedback`, the name persists. The
privacy-tasks scrub does cover these columns, so this is mitigated at retention time but not at write time.

---

## 3. "Before public beta" checklist
- [ ] **De-identify essay text before every LLM call** (H1): scrub known `student_name` from `extracted_text`
      in both `grade-submission` and `generate-grading-feedback`; populate/use `student_ref`.
- [ ] **Delete Storage objects on submission/class/user deletion AND in retention** (H3): add `storage.remove()`.
- [ ] **Ship a real right-to-deletion path** (H2): owner-gated `delete-submission` / `delete-class` /
      `delete-account` that removes DB rows + files + audit-logs the action; verify cascades.
- [ ] Decide & document vendor-sharing consent: wire `consent_records` or remove it (M2). Publish a short
      data-handling notice (what leaves to Google, retention window).
- [ ] Confirm a single grading provider for beta; document the third party (M4).
- [ ] Schedule/verify the `privacy-tasks` cron is actually running (it's secret-gated, not user-callable);
      retention is inert if nothing invokes it.
- [ ] Sanity check: confirm Gemini API usage is on a no-train / data-retention-limited tier (vendor-side;
      verify the Google AI Studio/Vertex setting — free `generativelanguage.googleapis.com` keys may be
      used for product improvement; this matters for FERPA).

## 4. What's already good
- No raw essay/prompt/PII in any durable log table (`ai_request_logs`, `llm_sessions`, `access_audit_log`).
- Storage buckets are private and owner-path-scoped (0004/0011).
- Training-on-content is opt-IN by default (0005) and correctly gates personalization paths.
- DB cascades are correct in v2 (submission delete → grades/annotations/edits removed).
- Minimal student PII collected (name only).
- Prompt-injection hardening (essay treated as data) and `prompt_hash` instead of raw prompt storage.
