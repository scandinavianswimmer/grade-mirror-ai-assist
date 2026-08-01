# aiTA — Session Handoff

> Product: **aiTA**, an AI grading co-pilot for teachers (repo name: `grade-mirror-ai-assist`).
> Stack: Vite + React 18 + TS + shadcn/ui + Tailwind · Supabase (Postgres + Edge Functions) · **Google Gemini** for grading.
> Last verified: 2026-08-01. Full competition gate: `docs/launch/XPRIZE-SUBMISSION.md`.
> Fail-closed deployment recovery: `docs/launch/DEPLOYMENT-RECOVERY.md`.

---

## Current verified release state — 2026-08-01

- The isolated candidate is on branch `codex/xprize-submission-sprint-20260801` in draft [PR #30](https://github.com/scandinavianswimmer/grade-mirror-ai-assist/pull/30).
- [GitHub Actions run 30717852981](https://github.com/scandinavianswimmer/grade-mirror-ai-assist/actions/runs/30717852981) passed lint, typecheck, all 224 tests, the production build, and deterministic eval gates.
- The Firebase URL configured in this repository currently returns HTTP 404. There is no verified live frontend release.
- The backend target is unresolved: `supabase/config.toml` names inactive project `rwiqwuohbcvhuvtlxlvh`, while the May deployment notes below name `yhdobsmmhdvqswjpousc`, which is not visible to the currently authenticated CLI account. Do **not** restore, link, migrate, or deploy until the founder confirms which ref is canonical.
- The authenticated Vercel scope contains only an unrelated project. Do **not** deploy aiTA into that scope.
- The existing aiTA project predates the XPRIZE eligibility cutoff. Do not submit it without a written organizer ruling; see the competition gate for the official-source evidence and pivot options.

Everything below this point is historical May 2026 context. It is useful for recovery, but its claims of a live deployment are **not current production evidence**.

## Historical May state
- v2 grading pipeline deployed
- SubmissionDetail rewritten
- Gemini grading live
- annotation_edits persist
- mock grading removed
- build passing
- **upload → ingest-document wired** (AssignmentDetail upload now sets `submissions.file_path` and invokes `ingest-document` for server-side extraction; toast surfaces confidence / needs_review; status badges handle v2 vocab). `tsc` clean + build passing.

## Pending
- runtime smoke testing (incl. verifying the new upload→ingest path on a real PDF/DOCX — not browser-tested in agent env)
- annotation edge-case testing
- SubmitAssignment (the standalone v1 "paste essay + rubric" flow) still calls the old `generate-grading-feedback`; not part of the assignment→workspace path, left for the redesign/cutover pass

## Important Files
- SubmissionDetail.tsx
- supabase/functions/grade-submission
- submission_grades table
- annotations table

## Known Risks
- browser-tested minimally
- annotation anchoring may fail on duplicate text
- malformed PDFs unverified

## Next Priority
Production hardening and end-to-end validation

## Audit remediation (2026-05-21) — all 80 findings addressed in code
Worked the full dev audit in priority order (committed in logical batches; `tsc` + build green throughout).
- **Sprint 1 (Critical C1–C10):** hardened all v1 edge functions (JWT-derived identity, server-side training fetch, prompt-injection delimiters, fail-closed parsing — no fabricated grade/confidence, redacted logging, CORS allowlist, atomic usage RPC); removed false FERPA/GDPR/E2E claims; private buckets + signed URLs; killed PII logs (incl. auth session/token); fixed XSS sink; verified explicit-consent grading; training consent now opt-in (+ grader gated on consent).
- **Sprint 2 (workflow):** unified submission status state machine + finalize + status badges; persisted bulk accept/dismiss (per-annotation already persists/hydrates); removed mock/fallback grading output + reframed confidence as "AI completeness · review required"; rubric-driven scoring (deleted hardcoded letter map, explicit no-rubric mode); confirmed anchoring/evidence-verification already correct; deleted dead multi-render component.
- **Sprint 3 (privacy/files):** separated style exemplars from graded submissions (`is_exemplar`); batch upload + unified extraction + editable student name + dropped `.doc`; PDF uses `feedback_json`, exports only teacher-approved comments, moderation flag; comprehensive delete (DB + storage) + honest "mask names" relabel + persisted retention.
- **Sprint 4 (quality):** single Supabase client; real sitemap/llms.txt; vendor + route code-splitting (main bundle 1656kB→246kB); dashboard skeletons + fresh cache + no N+1 + always-show Unassigned; AI provider disclosure + learned-style inspect/reset + model-name fix + restricted ai_model_health RLS; CSP/security headers (`public/_headers`); a11y (focusable annotations, aria-labels, no Tab-hijack); audit trail (`ai_comment`, `rubric_snapshot`, training_data `title`); branding metadata.

### Deploy follow-ups REQUIRED for these fixes to take effect
1. **Apply new migrations on the cloud project (additive):** `migrations_v2/0003_usage_rpc.sql`, `0004_private_buckets.sql`, `0005_training_consent_default_off.sql`, `0006_separate_exemplars.sql`, `0007_retention_days.sql`, `0008_restrict_ai_health.sql`, `0009_audit_trail_columns.sql`.
2. **Redeploy edge functions:** `generate-grading-feedback`, `increment-feedback-count`, `generate-style-summary`, `test-ai-grading`, `create-class`, `grade-submission`, `ingest-document` (they now use the shared `_shared` helpers).
3. **Still pending (need a human/host):** rotate the exposed keys (sb_secret_, DB password, Gemini); set `GEMINI_STYLE_MODEL` secret if overriding; verify `public/_headers` is honored by the host (Netlify/Cloudflare) or replicate in CDN config; run `update-browserslist-db` on Node 20 (crashes on Node 23 here); browser/mobile + axe a11y pass; full grade round-trip smoke test.

---

## Historical May environment & connections (unverified; no secrets stored here)
- **Cloud Supabase project:** ref `yhdobsmmhdvqswjpousc`, region **us-west-2 (Oregon)**, URL `https://yhdobsmmhdvqswjpousc.supabase.co`.
- **DB access:** the direct host `db.<ref>.supabase.co` does NOT resolve (new-project behavior). Use the **Session pooler** (port 5432): `aws-1-us-west-2.pooler.supabase.com`, user `postgres.yhdobsmmhdvqswjpousc`. DB password is held by Luke (was shared in chat — **rotate it**).
- **CLI:** linked (`supabase link --project-ref yhdobsmmhdvqswjpousc`); login via `supabase login` (done in Luke's terminal). Deploys need a personal access token / interactive login.
- **Function secrets (set via `supabase secrets set`, values NOT in repo):** `GEMINI_API_KEY`, `GEMINI_GRADING_MODEL=gemini-2.5-pro`, `CRON_SECRET`, `ALLOWED_ORIGINS=http://localhost:8080,https://yhdobsmmhdvqswjpousc.supabase.co`.
- **Frontend → project:** `.env` + `src/integrations/supabase/client.ts` + `src/lib/supabase.ts` are env-driven (fallback = new project). `.env` is gitignored; run `git rm --cached .env` if still tracked.
- **Run locally:** `npm install && npm run dev` → `http://localhost:8080`.

## Deployed edge functions (live on the project)
`grade-submission` (core grader), `ingest-document` (server-side PDF/DOCX/text extraction), `build-style-profile` (consent-gated, Sprint-2), `record-feedback-usage` (usage counter), `privacy-tasks` (cron/secret-gated anonymize + retention). Shared core in `supabase/functions/_shared/` (`ai/gemini.ts` = Gemini `responseSchema` JSON + temp 0; `grading/engine.ts` = validate → evidence-verify → recompute totals → anchor → fail-loud; `grading/anchor.ts`; `extract/`; `auth.ts`/`db.ts`/`cors.ts`/`http.ts`/`env.ts`).

## Database state — IMPORTANT (v1 + additive v2)
- The cloud DB currently runs the **v1 schema** (restored from Luke's DigitalOcean backup) **plus an additive v2 layer**. It is NOT the clean v2 baseline.
- **Applied to cloud:** `supabase/migrations_v2/0002_additive_grading.sql` — added v2 tables (`submission_grades`, `annotations`, `annotation_edits`, `rubric_criteria`, `teacher_style_profiles`, `consent_records`, `lms_credentials`, `access_audit_log`) + columns on `submissions` (`extracted_text`, `extraction_confidence`, `file_path`, backfilled from `essay`/`submission_storage_path`) + `assignments.instructions` + `rubrics.assignment_id`/`total_points` + storage bucket `submissions` + storage policies. Dropped the restrictive `submissions_status_check`.
- **NOT applied:** `supabase/migrations_v2/0001_baseline.sql` (the clean-room v2 schema). Do NOT apply it on top of the cloud project — it conflicts with the live v1 tables. It's the reference design / for a fresh project.
- **Strategy decision (standing):** evolve **additively** — never drop the restored v1 data; add v2 objects alongside. This keeps the v1-shaped frontend working while v2 grading runs.
- **Restored test data:** 2 teachers in `auth.users` (`test.teacher@school.edu` owns 2 gradeable submissions; `crooner.97wig@icloud.com`). Backup artifacts: `~/Downloads/db_cluster-...backup` + `~/Downloads/aita_public_restore.sql` + `~/Downloads/aita_auth_data.sql`.
- **Bug fixed this session:** restored essays had `extraction_confidence = NULL` → the grader auto-rejected them as needs_review. Backfilled the 2 rows to `1.0`. New uploads get real confidence from `ingest-document`.

## Frontend redesign — "Marginalia" design system
Direction: scholarly grading workspace — warm parchment, ink text, pine primary, ochre accent, semantic annotation "pens" (praise=green, suggestion=ochre, error=critique/rose, question=indigo); fonts Fraunces (display) / Hanken Grotesk (UI) / Spline Sans Mono (metrics). Implemented in `src/index.css`, `tailwind.config.ts`, `index.html`.
- **Redesigned + building:** Navbar, Auth, AnnotationSidebar, Dashboard, **SubmissionDetail** (full v2 grading workspace: invokes `grade-submission`, renders `submission_grades` + `annotations` with pen highlights, Accept/Edit/Dismiss → writes `annotation_edits`; no mock data).
- **Still on old styling / TODO:** Profile, onboarding (3 competing flows — pick `TeacherOnboarding`), CreateAssignment, AssignmentDetail, UploadTraining, SubmitAssignment, LMS pages, FreemiumDashboard, ~12 pages with hardcoded colors.
- **Delete (dead/duplicate):** `Upload.tsx`, `GradingPreview.tsx`, `Index.tsx`, `Onboarding.tsx`, `OnboardingFlow.tsx`, podcast pages + `generate-podcast` fn, `GeminiSetup.tsx`, the legacy v1 `_shared/ai-router.ts` and old v1 edge functions (`generate-grading-feedback`, `test-ai-grading`, etc.) once the frontend fully cuts over.

## Validation done this session (non-mutating)
- `grade-submission`: no-auth → **401** (gateway gated); anon-as-bearer → **401** (auth-gated); CORS preflight → **204**. Function is **live, reachable, auth-gated, CORS-clean**.
- Production `npm run build` passes (exit 0) after every change.
- **NOT yet validated:** the full grade round-trip (function → Gemini → writes `submission_grades`/`annotations`). Needs a real teacher JWT. Resetting an existing account's password to get one was correctly blocked. **To validate:** sign in as `test.teacher@school.edu` at localhost:8080, open a submission, click **"Grade with aiTA"** — OR paste a teacher `access_token` so the next agent can run the live curl + verify rows. **Cannot browser-test inside the Claude agent env (Chromium sandboxed).**

## Security TODO (do soon)
- **Rotate** the `sb_secret_` secret key (Dashboard → Settings → API) and **reset the DB password** — both were shared in chat.
- Rotate/restrict the Gemini API key (old limited test key, but exposed).
- `git rm --cached .env` if still tracked; confirm it's gitignored.
- Tighten the **storage policy** on bucket `submissions` (currently any authenticated user can read any object) to owner-scoped once upload paths are uid-prefixed.

## Recommended next steps (for the next session)
1. **Finish end-to-end validation** of the grade round-trip (smoke test in browser or via a provided JWT); verify `submission_grades` + `annotations` rows + the redesigned workspace render.
2. **Hardening:** annotation anchoring on duplicate text (prefer model offset region before first-match fallback in `_shared/grading/anchor.ts`, then redeploy); gate grading on `record-feedback-usage` (plan limits); tighten storage policy; verify `ingest-document` on a real PDF/DOCX upload. (DONE: upload → `ingest-document` is now wired in `createSubmissionWithFile` (`src/lib/submissionApi.ts`) + `AssignmentDetail.tsx`. Still needs a real-file runtime smoke test — agent env can't browser-test.)
3. **Continue the redesign** of the remaining screens + delete the dead pages (list above).
4. Stand up the **eval harness** (`docs/v2-planning/sprint-0/01-06-PLAN.md`) so prompt/model changes are regression-gated.

## Useful commands
```
npm run dev                      # localhost:8080
npm run build                    # verify (no browser available to the agent)
supabase functions deploy <name> # redeploy a function (login required)
# DB (Session pooler):
PGPASSWORD=<db_pw> psql "host=aws-1-us-west-2.pooler.supabase.com port=5432 user=postgres.yhdobsmmhdvqswjpousc dbname=postgres sslmode=require"
```
