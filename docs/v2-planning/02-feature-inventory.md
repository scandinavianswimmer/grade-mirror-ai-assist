# 02 — Feature Inventory

Status legend: ✅ Complete · 🟡 Partial · 🟥 Stubbed/Broken · ⚰️ Dead/Vestigial

## Route table (`src/App.tsx`)

| Path | Component | Guarded | Status | Notes |
|------|-----------|:---:|:---:|-------|
| `/`, `/dashboard` | `Dashboard` | ✔ | ✅ | Real class/assignment manager |
| `/create-assignment` | `CreateAssignment` | ✔ | ✅ | DB insert |
| `/assignment/:id` | `AssignmentDetail` | ✔ | ✅ | Upload submissions here (real path) |
| `/submission/:id` | `SubmissionDetail` | ✔ | 🟡 | Real grading workspace **+ mock injection** |
| `/training` | `Training` → `TrainingDataManager` | ✔ | 🟡 | Writes rows the grader can't use |
| `/upload-training` | `UploadTraining` | ✔ | 🟡 | Freemium training entry (different schema) |
| `/submit-assignment` | `SubmitAssignment` | ✔ | 🟡 | Freemium quick-grade |
| `/upload` | `Upload` | ✔ | ⚰️ | Simulated `setTimeout` upload only |
| `/grading/preview` | `GradingPreview` | ✔ | ⚰️ | Hardcoded Hamlet/"John Smith" demo |
| `/onboarding` | `Onboarding` | ✔ | ⚰️ | Competing 5-step onboarding (orphan) |
| `/onboarding-flow` | `OnboardingFlow` | ✔ | ⚰️ | Third 3-step onboarding (orphan) |
| `/lms` | `LMSIntegration` | ✔ | 🟥 | Real code, never syncs |
| `/lms/callback` | `LMSCallback` | ✔ | 🟥 | Reads `canvas_url` from localStorage never written |
| `/profile` | `Profile` | ✔ | ✅ | |
| `/podcast-generator` | `PodcastGenerator` | ✔ | ⚰️ | AEC-industry podcast — wrong project |
| `/podcast/:id` | `PodcastDetail` | ✔ | ⚰️ | |
| `/pdf/submission/:id` | `PdfSubmission` | ✘ | 🟡 | **Unguarded** public PDF render |
| `/pitch` | `Pitch` | ✘ | ✅ | Public marketing page |
| `/auth` | `Auth` | ✘ | 🟡 | Mostly bypassed by `LoginOverlay` |
| `*` | `NotFound` | — | ✅ | |

## Feature areas

### Authentication & session — ✅ (fragile)
Supabase auth via `AuthProvider` (`onAuthStateChange`) + `AuthGuard`. Custom `LoginOverlay` over a blurred `FreemiumDashboard` for unauth users makes `/auth` largely dead. Verbose `console.log` of session objects (security smell). Live onboarding gate (`TeacherOnboarding`) is rendered conditionally in `App` before routing.

### Teacher onboarding — 🟡 (one of three is live)
**`TeacherOnboarding` is the live one** (6 steps: BasicInfo → TeachingEnvironment → Goals → TechnicalComfort → AccountSetup → Referral). Writes `users.full_name` + `onboarding_complete` + auth metadata. Completion check duplicated (auth metadata + DB). AccountSetup's LMS-sync choice is hardcoded to `'independent'` (UI ignored). `Onboarding.tsx`, `OnboardingFlow.tsx`, and `PersonalizationStep` are orphaned (0 imports). Style-capture steps exist but the captured style **doesn't reach the production grader**.

### Document upload & text extraction — 🟡 (two extractors, inconsistent)
- `src/lib/fileUpload.ts` — **real** extraction (mammoth DOCX, pdfjs-dist PDF, FileReader txt/csv/json). Used by the real submission path.
- `src/components/FileUpload.tsx` — its own `readFileContent` returns a **placeholder string** `"[File ... requires server-side processing]"` for PDF/DOCX. Used by `SubmitAssignment`/`AssignmentDetail`; `SubmissionDetail` later detects `[File` and re-extracts via `getTextFromStoredFile`.
- Size limits inconsistent (5MB vs 10MB). **No OCR** — scanned/image PDFs yield empty text and fail silently (`submissionApi.ts:60` treats extraction failure as "not critical", so an empty essay can be saved and graded).

### Assignment → submission → grading → annotation — ✅ core / 🟡 contaminated
`CreateAssignment` → `AssignmentDetail` (upload) → `SubmissionDetail` (auto-extract → auto-call real `generate-grading-feedback` → render annotations → persist → log teacher edits to `teacher_edits`). **Mock contamination:** `processAIResponse` injects `Math.random()` scores + hardcoded feedback tiles/vocab cards regardless of AI output.

### Annotation review UI — ✅ (strongest asset)
`GrammarlyAnnotations` + `resolveAnchors`/`splitIntoSpans` + `AnnotationSidebar`: highlighted spans, accept/reject/edit, bulk actions, progress, teacher text-selection comments via `TeacherCommentModal`, `teacher_edits` reinforcement log. Caveats: a legacy `dangerouslySetInnerHTML` fallback renderer coexists; `GrammarlyAnnotations.tsx:188` re-renders the whole essay per paragraph (duplication bug).

### Teacher style / training system — 🟡 (fragmented, ineffective)
Three storage shapes (`training_data`, `training_examples`, `grading_examples`) plus `ai_profiles.grading_style_summary` and `teacher_profiles.style_profile_json`. `Training.tsx` inserts rows with `processed:false` and **no essay/feedback content** (file_url only) — the grader queries `processed=true` rows expecting `.essay/.feedback/.grade`, so primary-UI rows are unusable. `generate-style-summary` output is consumed only by the onboarding demo. "92% accuracy" shown in `Training.tsx` is hardcoded fiction.

### LMS / Canvas integration — 🟥 (real code, never works)
`canvasOAuth.ts` (genuine OAuth code exchange) + `canvasApi.ts` (real REST: courses, assignments, submissions, comments, grades). Broken because: client secret exposed via `VITE_CANVAS_CLIENT_SECRET`; browser token exchange is CORS-blocked; `LMSCallback` reads a `canvas_url` from localStorage that's never written; `pushFeedbackToCanvas` references `submission.feedback`/`final_score`/`canvas_submission_id` columns the grading flow never populates. Tokens stored plaintext in `lms_integrations`.

### Freemium / plans — ✅ enforcement / 🟥 monetization
`freemiumApi.getUserLimits` enforces 5 training examples / 10 weekly feedbacks; `increment-feedback-count` edge fn. All "Upgrade Plan" CTAs are non-functional (no billing). Freemium stores quick-grade "submissions" inside `training_examples` — overlaps the assignment/`submissions` model.

### Privacy controls — 🟡
`privacy_settings` (anonymize_student_names, allow_training_on_content, auto_delete_training_data), defaults all TRUE. `allow_training_on_content` is **never actually checked** before training on essays. `anonymize-student-data` renames only `student_name`. No consent capture, no "delete my data" path.

### PDF export — ✅
`pdfExport.ts` + `EssayFeedbackPdfRenderer` (jsPDF + html2canvas) renders graded feedback to PDF.

### Podcast generator — ⚰️ (vestigial, wrong project)
`PodcastGenerator`/`PodcastDetail` + `generate-podcast` produce AEC-industry (construction-tech) podcast scripts. Unrelated to grading; safe to delete in V2.

### Misc dead/demo — ⚰️
`Index.tsx` (static fake stats, links to nonexistent `/privacy`), `GeminiSetup.tsx` (writes a `localStorage` Gemini key nothing reads — a dead end and a security trap).
