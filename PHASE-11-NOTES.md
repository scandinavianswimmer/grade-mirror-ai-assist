# Phase 11 — Analytics, Metrics & Observability

Implements METRIC-01..04 and OBS-01..02. Additive: new files + pages, with surgical edits
to shared nav/routes only.

## What was built

### METRIC-04 — Product analytics (PostHog)
- `src/lib/analytics.ts` — thin, no-op-safe wrapper over `posthog-js`. Gated entirely on
  `VITE_POSTHOG_KEY`: when the key is absent every method is a cheap no-op, so dev/CI/self-host
  builds never send events or error. Exposes a typed `AnalyticsEvent` union, plus
  `capture/identify/reset`.
- Init wired in `src/main.tsx` (`initAnalytics()` at boot). Identity wired in
  `src/components/AuthProvider.tsx` (identify on login, reset on `SIGNED_OUT`).
- Capture calls added at the real action sites (no grading edge functions touched):
  - `submission_uploaded` → `src/pages/AssignmentDetail.tsx` (after `createSubmissionWithFile`)
  - `grade_started` / `grade_completed` (with `ok` + `duration_ms`) → `src/pages/SubmissionDetail.tsx` `runGrading`
  - `annotation_accepted` / `annotation_dismissed` → `setStatus` + `bulkSetStatus`
  - `annotation_edited` → `saveEdit`
  - `grade_finalized` → `finalize`

### METRIC-01/02/03 — Metrics dashboard
- `src/lib/metricsApi.ts` — RLS-scoped Supabase queries computing:
  - **Time saved (METRIC-01):** `gradedCount × (BASELINE_MINUTES_PER_SUBMISSION −
    AI_REVIEW_MINUTES_PER_SUBMISSION)`. Documented constants: baseline **10 min/submission**
    (conservative midpoint of the commonly-cited 5–15 min for written feedback), minus a
    **3 min/submission** review overhead. Both exported and tunable.
  - **Avg teacher edits / submission (METRIC-01):** `annotation_edits count / unique graded submissions`.
  - **Rubric-alignment confidence (METRIC-01):** avg of latest `submission_grades.confidence`.
  - **Feedback turnaround (METRIC-01):** `submission_grades.created_at − submissions.created_at`.
  - **Edit-rate-over-time (METRIC-02):** edits-per-submission bucketed by ISO week (Monday).
- `src/pages/Metrics.tsx` (route `/metrics`, nav "Metrics") — 4 summary cards + a `recharts`
  line chart for the edit-rate trend. `recharts` was already a dependency; no heavy dep added.

### OBS-02 — Grading history
- `src/lib/historyApi.ts` — joins `submission_grades → submissions → assignments → classes`
  (all RLS-scoped) and enriches each row with model + token usage from `llm_sessions`.
- `src/pages/History.tsx` (route `/history`, nav "History") — sortable table filterable by
  **class** and **assignment**; shows student, score, confidence, model, in/out tokens, flags,
  graded date. Rows link to the submission detail.

### OBS-01 — Request tracing (data model + integration hook)
- `src/lib/tracing.ts` — the trace/span **data model** (`GradingTrace`, `TraceSpan`, named
  `TraceAgent`s mirroring Phase 3) plus two functions: `recordTraceSpan` (write hook) and
  `fetchTrace` (read helper for the UI). No grading files edited.

## OBS-01 integration hook left for Phase 3/4

The agentic grading pipeline is built in Phases 3/4, and this phase must not edit grading
files — so per-step traces can't be emitted yet. The hook is ready:

1. **Phase 4** adds an additive `grading_traces` table migration:
   `(id, trace_id uuid, submission_id uuid, user_id uuid default auth.uid(), span jsonb,
   created_at timestamptz default now())` with owner-scoped RLS. Then remove the two
   `@ts-expect-error` lines in `src/lib/tracing.ts` and regenerate `types.ts`.
2. **Phase 3's orchestrator** calls `recordTraceSpan(traceId, submissionId, span)` once per
   agent step (rubric / relevance_risk / grading / annotation / feedback_summary / style),
   using one `traceId` per grading job.
3. The UI can then call `fetchTrace(submissionId)` (already implemented) to render the
   per-step timeline on the submission/history view. Until then `fetchTrace` returns `null`
   and nothing breaks.

## Env / config needed
- `VITE_POSTHOG_KEY` (optional, public project key) — enables analytics; unset = no-op.
- `VITE_POSTHOG_HOST` (optional) — defaults to PostHog Cloud US (`https://us.i.posthog.com`).
- Documented in `.env.example`. No secrets committed.

## Dependencies added
- `posthog-js` `^1.155.0` added to `package.json` deps. **`npm install` was NOT run** (per
  constraints) — run it before the next build. `tsc --noEmit` passes today because the project
  uses loose resolution (`strict:false`); `vite build` needs the install to resolve the import.

## Follow-ups
- Replace the best-effort nearest-timestamp `llm_sessions` correlation in `historyApi.ts` with
  an exact join once Phase 3/4 add a shared trace/job id on grading rows.
- Once `grading_traces` exists, surface `fetchTrace` results in the History/SubmissionDetail UI.
- Consider server-side analytics events (PostHog/custom) for grading completed in the edge
  function, to capture grades that finish out-of-band (async jobs, Phase 4).
- The `submission_uploaded` event currently fires from `AssignmentDetail` (the canonical real
  upload path); add it to any future bulk-upload entry points.
