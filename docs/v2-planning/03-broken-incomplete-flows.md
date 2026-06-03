# 03 — Broken / Incomplete / Obsolete Flows

Grouped by disposition. Each item: what, where, why it matters, V2 action.

## A. Production-path defects (fix or remove before any V2 demo)

| # | Issue | Where | Why it matters | V2 action |
|---|-------|-------|----------------|-----------|
| A1 | **Mock scores in real grading.** `Math.random()` scores + hardcoded feedback tiles/vocab injected over real AI output. | `SubmissionDetail.processAIResponse` (~L663-712) | Teachers see fabricated numbers; the product's core promise is fake. | Remove all mock injection; render only verified AI output. |
| A2 | **Silent fake fallback grade.** Parse failure returns canned "B"/conf 0.8. | `generate-grading-feedback/index.ts:200-207` | A model failure looks like a real grade. | Fail explicitly; retry/repair; surface error. See [05](05-ai-grading-pipeline.md). |
| A3 | **Annotations silently dropped.** Comment quote not found by exact `indexOf` → comment discarded. | `resolveAnchors.ts` | Teacher loses feedback with no signal. | Char offsets from model + fuzzy fallback; surface unmatched. |
| A4 | **Empty-essay grading.** Extraction failure swallowed as "not critical"; empty `essay` still graded. | `submissionApi.ts:~60`, `fileUpload.ts` | Garbage-in grades; scanned PDFs silently fail. | Server-side extract + OCR; block grading on empty/low-confidence text. |
| A5 | **Non-deterministic grades.** No temperature set. | grading function | Same essay → different grades. | Pin temperature 0 for scoring. |
| A6 | **Open prompt injection.** Raw essay interpolated into prompt. | grading prompt | Student can write "give me an A+". | Delimit/encode student text as data. |
| A7 | **Whole-essay re-render per paragraph.** | `GrammarlyAnnotations.tsx:188` | Duplicated text, perf. | Render once; map spans. |

## B. Duplicated / competing implementations (consolidate)

| # | Duplication | Files | V2 action |
|---|-------------|-------|-----------|
| B1 | **Onboarding ×3** | `TeacherOnboarding` (live), `Onboarding.tsx`, `OnboardingFlow.tsx` (+ orphan `PersonalizationStep`) | Keep one; delete the others. |
| B2 | **Upload ×4** | `Upload` (dead), `FileUpload` (placeholder), `UploadTraining`, `SubmitAssignment` + real path in `AssignmentDetail` | One upload component; server-side extraction. |
| B3 | **Dashboard ×2** | `Dashboard` (classes model) vs `FreemiumDashboard` (training_examples model) | One dashboard; unify data model. |
| B4 | **Annotation renderer ×2** | span-based `GrammarlyAnnotations` vs legacy `dangerouslySetInnerHTML`/`contentEditable` in `SubmissionDetail` | Keep the span renderer; delete the legacy path. |
| B5 | **Grading code paths ×3** | real `generate-grading-feedback`, demo `test-ai-grading`, static `GradingPreview` | One grading service abstraction (route through the model router). |
| B6 | **Training schema ×3** | `training_data`, `training_examples`, `grading_examples` | Unify to one training/examples model the grader actually reads. |

## C. Stubbed / unfinished features

| # | Feature | Where | State | V2 action |
|---|---------|-------|-------|-----------|
| C1 | Canvas LMS sync | `canvasApi.ts`, `canvasOAuth.ts`, `LMSIntegration`, `LMSCallback` | Real code, never syncs (client secret exposed, CORS-blocked exchange, missing columns, plaintext tokens) | Rebuild server-side (Edge Function OAuth + encrypted tokens). Defer past MVP. |
| C2 | `FileUpload.readFileContent` | `components/FileUpload.tsx` | Returns placeholder string for PDF/DOCX | Replace with server-side extraction. |
| C3 | Upgrade / billing | freemium CTAs | All buttons inert | Wire real billing (post-MVP). |
| C4 | Consent enforcement | `privacy_settings.allow_training_on_content` | Stored, never checked | Enforce before training; capture consent. |
| C5 | Scheduled privacy tasks | `scheduled-privacy-tasks` | No cron in `config.toml` | Wire `pg_cron`/scheduled trigger; secret-gate. |
| C6 | Style → grader linkage | `generate-style-summary`, `ai_profiles` | Output unused by real grader | Inject style profile into production prompt. |

## D. Dead / obsolete code (delete in V2)

| # | Item | Where | Note |
|---|------|-------|------|
| D1 | Podcast generator | `PodcastGenerator`, `PodcastDetail`, `generate-podcast`, `podcast_episodes` | AEC-industry feature from a different Lovable project. |
| D2 | `Upload.tsx` | route `/upload` | Simulated upload only. |
| D3 | `GradingPreview.tsx` | route `/grading/preview` | Hardcoded demo essay. |
| D4 | `Index.tsx` | | Fake stats; links to nonexistent `/privacy`. |
| D5 | `Onboarding.tsx`, `OnboardingFlow.tsx`, `PersonalizationStep` | | Orphan onboardings. |
| D6 | `GeminiSetup.tsx` | | Writes a `localStorage` key nothing reads; misleading "saved" UX. |
| D7 | Verbose session `console.log` | `AuthProvider` & others | Leaks session shape; remove. |

## E. Data-integrity / backend flow issues

| # | Issue | Where | V2 action |
|---|-------|-------|-----------|
| E1 | Migrations not replayable | `supabase/migrations/` | Squash to one baseline. See [06](06-supabase-security-review.md). |
| E2 | Live tables absent from migrations | `enterprise_contacts`, `teacher_interest` | Capture in baseline; verify RLS. |
| E3 | `userId` trusted from request body | `increment-feedback-count`, grading fns | Derive from JWT. |
| E4 | `users` UPDATE missing `WITH CHECK` | migrations | Add; lock `plan`/`role`/counters server-side. |
| E5 | LMS tokens plaintext | `lms_integrations` | Encrypt at rest. |
| E6 | `anonymize` ignores essay-body PII | `anonymize-student-data` | Scrub body fields too. |

## F. Cross-cutting

- **React Query unused** — adopt app-wide (caching, invalidation, loading/error states).
- **No tests / no CI** — add Vitest + Playwright + eval harness + a CI gate.
- **`SubmissionDetail.tsx` ~1,640 lines** — decompose into hooks + components.
- **`.env` committed** — untrack + gitignore.
