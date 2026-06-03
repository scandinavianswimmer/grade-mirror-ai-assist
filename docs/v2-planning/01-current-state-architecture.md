# 01 — Current-State Architecture Map

## High-level shape

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser (Vite + React 18 + TS + shadcn/ui)                          │
│                                                                     │
│  App.tsx  ── auth/onboarding gating done via early returns,         │
│             NOT routes ──► AuthProvider → (LoginOverlay over         │
│             blurred FreemiumDashboard) → TeacherOnboarding → Router  │
│                                                                     │
│  Pages (22) ──► lib/*Api.ts (manual supabase-js calls)             │
│  Client-side text extraction: mammoth (DOCX) + pdfjs-dist (PDF)     │
│  Client-side PDF export: jsPDF + html2canvas                        │
│  React Query: provider mounted but UNUSED (manual useEffect)        │
└───────────────┬─────────────────────────────────────────────────────┘
                │ supabase-js (anon key, JWT)
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Supabase project rwiqwuohbcvhuvtlxlvh                               │
│                                                                     │
│  Postgres: 20 tables, RLS enabled on all, per-teacher isolation     │
│  Storage: bucket `submissions` (uploaded files)                     │
│  Edge Functions (10, Deno):                                         │
│    generate-grading-feedback  ─► Lovable AI Gateway (gemini-2.5-flash)│
│    test-ai-grading            ─► _shared/ai-router.ts (multi-model)  │
│    generate-style-summary     ─► Gemini (gemini-pro)                 │
│    generate-podcast           ─► Gemini (vestigial feature)          │
│    create-class, increment-feedback-count                           │
│    anonymize-student-data, cleanup-training-data,                    │
│    scheduled-privacy-tasks (service_role; no cron wired)            │
└─────────────────────────────────────────────────────────────────────┘
                │
                ▼  (intended, currently broken)
        Canvas LMS REST + OAuth  (client secret exposed; never syncs)
```

## Frontend layers

- **Entry / providers:** `main.tsx` → `App.tsx`. `App.tsx` holds an `AppContent` that performs **auth + onboarding gating with conditional early returns before the router runs**, rather than via guarded routes. Unauthenticated users see a custom `LoginOverlay` over a blurred `FreemiumDashboard`, so the `/auth` page is largely dead.
- **Routing:** `react-router-dom` v6, all routes centralized in `App.tsx`. ~20 routes; most wrapped in `<AuthGuard>`. `/pdf/submission/:id` is **unguarded** (public PDF render). See [02](02-feature-inventory.md) for the route table.
- **Data access:** `src/lib/*.ts` modules (`gradingApi`, `geminiApi`, `submissionApi`, `freemiumApi`, `onboardingApi`, `privacyApi`, `canvasApi`, `canvasOAuth`, `fileUpload`, `fileProcessing`, `aiParser`) wrap direct `supabase-js` calls. **No React Query** despite the provider being mounted — every page uses manual `useEffect`/`useState`.
- **Business logic placement:** inconsistent. Some logic in `lib/`, but heavy logic lives in giant components — **`SubmissionDetail.tsx` is ~1,640 lines** doing fetch + extract + AI call + parse + render + persist. `Dashboard.tsx` keeps a module-level mutable `dashboardCache`.
- **Annotation subsystem:** `src/lib/annotations/{resolveAnchors,splitIntoSpans}.ts` + `GrammarlyAnnotations.tsx` / `EssayWithAnnotations.tsx` / `AnnotationSidebar.tsx` / `GrammarlyTooltip.tsx` / `TeacherCommentModal.tsx`. **Two parallel render systems** coexist (the span-based Grammarly system and a legacy `dangerouslySetInnerHTML` `contentEditable` path in `SubmissionDetail`).

## Backend layers

- **Postgres:** 20 tables (full ER in [06](06-supabase-security-review.md)). All keyed off `users.id = auth.uid()`. No native enums — every "enum" is a `TEXT CHECK`. RLS enabled everywhere; isolation mostly correct.
- **Storage:** bucket `submissions` for uploaded files; extracted text duplicated into `submissions.essay`.
- **Edge Functions (Deno, 10):**
  - `generate-grading-feedback` — **the production grader.** Builds one large prompt, POSTs to the **Lovable AI Gateway** (`google/gemini-2.5-flash`, `LOVABLE_API_KEY`), strips markdown fences, `JSON.parse`, **silent canned fallback on failure**.
  - `_shared/ai-router.ts` — multi-provider fallback chain (`gpt-5-mini` → `gemini-pro` → `gemini-2.5-flash` → `claude-sonnet-4`) selected by `ai_model_health` circuit breaker. **Only used by `test-ai-grading`, not the real grader.** Some model IDs look invalid/aspirational.
  - `generate-style-summary` — distills teacher style into `ai_profiles.grading_style_summary`. **Consumed only by the onboarding demo, not the production grader.**
  - `generate-podcast`, `test-ai-grading`, `create-class`, `increment-feedback-count`, `anonymize-student-data`, `cleanup-training-data`, `scheduled-privacy-tasks`.

## Three divergent grading code paths (key architectural problem)

| Path | Entry | Model strategy | Output | Used in prod? |
|------|-------|----------------|--------|---------------|
| Real grader | `geminiApi.generateGradingFeedback` → `generate-grading-feedback` | hardcoded `gemini-2.5-flash` via Lovable Gateway | strict JSON | **Yes** |
| Onboarding demo | `onboardingApi.testAIGrading` → `test-ai-grading` | `ai-router` multi-model | freeform text | No (demo) |
| Static demo | `GradingPreview.tsx` | none (hardcoded Hamlet essay) | `dangerouslySetInnerHTML` | No (dead) |

Plus **mock injection**: even on the real path, `SubmissionDetail.processAIResponse` overlays `Math.random()` scores and hardcoded feedback tiles/vocabulary on top of genuine AI output.

## Config / build / deployment readiness

- **Vite 5 + SWC**, Tailwind 3, `lovable-tagger` dev plugin (Lovable origin marker).
- **`.env` is committed and not gitignored** — currently only public `VITE_SUPABASE_*` anon values, but the pattern is unsafe.
- `supabase/config.toml` contains only `project_id` — **no `[functions.*]` blocks** (so functions default to `verify_jwt = true`, good) and **no cron schedules** (so `scheduled-privacy-tasks` likely never runs).
- **No CI, no tests, no IaC** beyond migrations. Single shallow commit — no usable history for bisect/blame.
- Deployment target is implicitly Lovable hosting + Supabase cloud. No documented prod build/runbook.

## Architectural smells (summary)

1. Auth/onboarding gating outside the router → brittle, hard to reason about.
2. Duplicated subsystems (onboarding ×3, upload ×4, dashboard ×2, renderer ×2, grading paths ×3).
3. Mock data interleaved with real data in the production grading path.
4. Fat components owning data + AI + rendering; React Query unused.
5. Two overlapping data models (assignment/`submissions` vs freemium `training_examples`).
6. Migrations not replayable; live schema has drifted from migration files.
