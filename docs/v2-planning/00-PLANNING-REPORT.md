# aiTA (Grade Mirror AI Assist) — V2 Rebuild Planning Report

> Product: **aiTA** — an AI-native instructional co-pilot for teacher grading. Repo currently named `grade-mirror-ai-assist`.
> Status: **Planning only — no code changes made.** Audit date: 2026-05-21.
> Source commit audited: `d2a39e0 "Fix AI grading feedback errors"` (single-commit shallow history).
> Stack: Vite 5 · React 18 · TypeScript 5.5 · shadcn/ui · Supabase (Postgres + Edge Functions) · React Query (installed, unused) · ~20.8k LOC in `src/`.

This directory is the planning package for a serious V2 rebuild. **Start with [GOAL.md](GOAL.md)** (the product north star), then read in order:

| # | Doc | Covers |
|---|-----|--------|
| ★ | [**GOAL.md**](GOAL.md) | aiTA product vision, workflow, non-negotiables (the north star) |
| 00 | **this file** | Executive summary, 10-point assessment, risk register |
| 01 | [Current-state architecture map](01-current-state-architecture.md) | How it's built today |
| 02 | [Feature inventory](02-feature-inventory.md) | Every feature + status |
| 03 | [Broken / incomplete / obsolete flows](03-broken-incomplete-flows.md) | The defect & dead-code list |
| 04 | [Recommended V2 architecture](04-v2-architecture.md) | Target architecture |
| 05 | [AI grading pipeline design (V2)](05-ai-grading-pipeline.md) | The core engine redesign |
| 06 | [Supabase / RLS / security review](06-supabase-security-review.md) | Backend, data model changes, security |
| 07 | [Prioritized sprint plan](07-sprint-plan.md) | Sprint 0 → MVP-V2 |
| 08 | [Skills, subagents & tooling to install first](08-skills-agents-tooling.md) | What to set up before coding |
| 09 | [Goal alignment scorecard](09-goal-alignment.md) | aiTA non-negotiables vs. current state vs. plan |

---

## Executive summary

Grade Mirror AI Assist is a **genuinely strong product idea with a working core and a fragile, half-finished, mock-contaminated implementation.** The end-to-end happy path *does* work — a teacher can create a class, upload a real student essay, get a real LLM grade with Grammarly-style inline annotations, and accept/reject/edit them — and the annotation review system is a distinctive, high-quality asset worth porting wholesale.

But the implementation has accreted three onboarding flows, four upload paths, two dashboards, two annotation renderers, a vestigial podcast generator from an unrelated project, and **mock `Math.random()` scores injected into the production grading path** alongside real AI output. The grading engine itself is unreliable in ways that matter for a grading product: it silently substitutes a fake "B" on parse failure, anchors annotations by exact substring match (so paraphrased/whitespace-mangled quotes vanish silently), pins no temperature (same essay → different grades), feeds the model only 200-char-truncated examples, **never actually feeds the distilled teacher style into the real grader**, and has zero evals. Migrations are not replayable from scratch. There are real privacy gaps (plaintext Canvas tokens, student-name scrubbing that ignores names inside essay bodies, a consent flag that's never enforced).

**Recommendation:** Do **not** greenfield. Keep the data entities, the annotation system, the design system, and the grading-response *shape*; rebuild the grading engine for reliability, consolidate the duplicated flows, squash the migrations to a clean secured baseline, and stand up an eval harness *before* iterating on prompts. V2 is a **stabilize-then-deepen** effort, not a from-scratch rewrite.

---

## 10-point assessment

### 1. What the product is trying to achieve
An **AI teaching assistant that grades student writing in each teacher's own voice and standards.** Teachers "train" the system on samples of their past graded work, then upload student essays; an LLM produces a rubric-aligned score plus inline, Grammarly-style annotations written in the teacher's style. The teacher reviews (accept / reject / edit), and those edits feed back as reinforcement. Surrounding it: a style-capturing onboarding, Canvas LMS sync, and a freemium plan. **Core value prop: cut grading time dramatically while preserving the teacher's judgment and feedback voice.**

### 2. What currently works (keep-worthy)
- **Core grading happy path** end-to-end: class → assignment → upload → real edge-function grading (`google/gemini-2.5-flash` via the Lovable AI Gateway) → annotation render → teacher edit logged to `teacher_edits`.
- **Annotation review system** (`resolveAnchors` / `splitIntoSpans` / `GrammarlyAnnotations` / `AnnotationSidebar` / `TeacherCommentModal`) — the standout asset: span model, accept/reject/edit, bulk actions, text-selection comments.
- **RLS enabled on all 20 tables** with mostly-correct per-teacher isolation.
- **Real client-side text extraction** (`src/lib/fileUpload.ts`: `mammoth` for DOCX, `pdfjs-dist` for PDF).
- **Freemium limit enforcement** (`freemiumApi.ts`, `increment-feedback-count`).
- **Edge functions default to `verify_jwt = true`**; `create-class` is a model of correct auth.
- Complete **shadcn/ui** component set; clean Tailwind design tokens.
- Real (if unfinished) **Canvas REST** client code.

### 3. What is incomplete, fragile, or obsolete
See [03](03-broken-incomplete-flows.md) for the full list. Highlights:
- **Mock contamination in production:** `SubmissionDetail.processAIResponse` injects `Math.random()` scores + hardcoded feedback tiles/vocab regardless of real AI output.
- **Duplicated flows:** onboarding ×3, upload ×4, dashboard ×2, annotation renderer ×2.
- **Dead code:** `Upload.tsx`, `GradingPreview.tsx`, `Index.tsx` (fake stats), `Onboarding.tsx`, `OnboardingFlow.tsx`, `PersonalizationStep`, `GeminiSetup` (writes a `localStorage` key nothing reads), the **podcast generator** (leftover from a different Lovable project).
- **Grading reliability:** silent fallback "B" grade; exact-match anchoring silently drops comments; no temperature; no evals; open prompt injection; training-schema mismatch (`Training.tsx` writes rows the grader can never use); **style summary never reaches the real grader**; 200-char example truncation.
- **Migrations non-replayable:** duplicate `podcast_episodes CREATE TABLE`, conflicting `users.id` definitions, tables (`enterprise_contacts`, `teacher_interest`) present in the live DB but in no migration.
- **React Query installed but unused** (manual `useEffect` everywhere).
- **Canvas never actually syncs** (client-exposed secret, CORS-blocked exchange, missing columns).

### 4. What should be kept from the Lovable version
The **annotation review system**, the **shadcn/ui design system**, the **grading-response schema** (`rubricBreakdown` shape) as the target contract, the **DOCX/PDF extraction logic**, the **`teacher_edits` learning-loop concept**, the **Dashboard class→assignment information architecture**, the **`ai-router` health/circuit-breaker/logging scaffolding** (concept), and the **core data entities** (teachers/classes/assignments/submissions/annotations).

### 5. What should be rebuilt or replaced
Routing & auth/onboarding gating (move into the router); collapse to **one** onboarding, **one** upload component, **one** dashboard, **one** annotation renderer; the **grading engine** (structured output, robust anchoring, evidence verification, determinism, injection defense, unified model abstraction); **migrations** (squash to a clean secured baseline); **file extraction moved server-side + OCR**; **Canvas** (server-side OAuth); remove all mock injection, the podcast feature, and dead pages; **adopt React Query**; unify the freemium-`training_examples`-vs-`submissions` data overlap; encrypt LMS tokens.

### 6. What AI grading pipeline should exist in V2
Full design in [05](05-ai-grading-pipeline.md). In brief: server-side ingestion + OCR → **structured output via tool-use/JSON mode** (no fence-stripping) → **char-offset anchoring returned by the model + fuzzy fallback, never silent-drop** → **evidence verification** (quoted spans must exist in the essay) → **teacher style actually injected** (distilled style profile + retrieved few-shot, not 200-char stubs) → **structured rubric** (criteria, weights, max scores) → **temperature 0** for grade stability → **prompt-injection delimiting** of student text → **model router with valid IDs + health-based fallback** → **async job + caching** → **confidence + explicit human-in-the-loop** → **eval harness with a golden set scored for teacher-agreement (Kappa)** gating every prompt change.

### 7. What data model changes are needed
Detailed in [06](06-supabase-security-review.md). Squash to one replayable baseline; **unify the two submission models**; promote **rubrics to a structured table** (criteria + weights + max scores); make **annotations a first-class table** (char offsets + status); **encrypt LMS tokens** (Supabase Vault / `pgsodium`); add **consent + retention fields + an audit log**; add **`WITH CHECK`** to all write policies and **lock privileged columns** (`plan`, `role`, usage counters) behind server-only writes; **derive identity from the JWT**, never the request body; ensure the **style profile is consumed by the grader**.

### 8. What skills/agents/tools should be installed before coding
Full mapping in [08](08-skills-agents-tooling.md). The 8 skills already installed this session map 1:1 to the workstreams (`repo-audit`, `supabase-rls-security`, `react-shadcn-ui-audit`, `document-parsing-pdf-docx`, `ai-grading-rubric-evaluation`, `prompt-evaluation-test-harness`, `privacy-ferpa-student-data`, `product-requirements-prd`). Add: **Supabase CLI** (local DB + migration squash), **promptfoo** or similar (eval harness), **structured outputs** via the `claude-api` skill (tool use / JSON mode), a **server-side OCR** path, **Vitest + Playwright** (no tests exist today), and the **GSD plan/execute** workflow for sprint execution.

### 9. What the first implementation sprint should be
See [07](07-sprint-plan.md). **Sprint 0 = "Trust the grade."** One vertical slice: *a single teacher uploads one real essay and receives a trustworthy, teacher-styled, correctly-anchored grade with zero mock data.* That forces: remove `Math.random()` mock injection; structured grading output + robust anchoring + injection delimiting + temperature 0 + no silent fallback; a minimal eval harness with ~15 golden essays; and the security/migration hardening needed to ship safely (squash migrations, `WITH CHECK`, encrypt tokens, uncommit `.env`, identity-from-JWT).

### 10. Key risks
Full register below and in each doc.

---

## Risk register

| # | Risk | Severity | Evidence | Mitigation |
|---|------|----------|----------|------------|
| R1 | **Student PII leakage (FERPA).** `anonymize-student-data` only renames `student_name`; names inside `essay`/`feedback`/`inline_comments` are never scrubbed. | Critical | `supabase/functions/anonymize-student-data` | Body-level PII scrubbing; consent capture; deletion path. See [06](06-supabase-security-review.md). |
| R2 | **Plaintext LMS OAuth tokens.** `lms_integrations.access_token`/`refresh_token` are plain `TEXT`. | Critical | `types.ts`, migrations | Encrypt at rest (Vault/`pgsodium`); server-side token exchange. |
| R3 | **Hallucinated / silent-fake grading.** Parse failure → canned "B"/0.8 presented as real; `evidenceQuote` & `rubricBreakdown.score` are unverified inventions. | Critical | `generate-grading-feedback/index.ts:200-207` | Structured output, evidence verification, explicit failure, evals. See [05](05-ai-grading-pipeline.md). |
| R4 | **Privilege / paywall escalation.** `users` UPDATE policy has no `WITH CHECK`; client can write `plan`/`role`/usage counters. | High | `001` + Lovable migrations | `WITH CHECK` + move privileged columns to server-only writes. |
| R5 | **Annotation loss.** Exact-substring anchoring drops any comment whose quote doesn't match verbatim (PDF whitespace, paraphrase). | High | `resolveAnchors.ts` | Model-returned char offsets + fuzzy fallback; never silent-drop. |
| R6 | **Rubric unreliability.** Free-text rubric; model invents 0-10 `score` with no weights or max. | High | grading prompt | Structured rubric schema with weights/max; per-criterion calibration. |
| R7 | **Personalization doesn't work.** Style summary is consumed only by the onboarding demo, not the real grader; examples truncated to 200 chars; training schema mismatch makes primary-UI rows unusable. | High | `geminiApi.ts`, `Training.tsx` | Inject style profile + retrieved few-shot into the real grader; unify training schema. See [05](05-ai-grading-pipeline.md). |
| R8 | **Prompt injection from student text.** Raw essay interpolated into prompt with no delimiting. | High | grading prompt | Delimit/encode student content; instruct model to treat it as data. |
| R9 | **Non-replayable migrations.** Duplicate `podcast_episodes` table, conflicting `users.id`, undocumented live tables. | High | `supabase/migrations/` | Squash to a single clean baseline from live schema. |
| R10 | **Non-determinism.** No temperature set → inconsistent grades run-to-run. | Medium | grading function | Pin temperature 0 (or low) for scoring. |
| R11 | **No tests / single commit / no history.** Zero test files; one shallow commit; can't bisect or safely refactor. | Medium | repo | Vitest + Playwright + eval harness; meaningful commit discipline in V2. |
| R12 | **Cost/latency.** Synchronous edge call per essay, full text each time, no caching/batching; client-side parse blocks UI. | Medium | pipeline | Async jobs, caching, batch API, server-side parse. |
| R13 | **Committed `.env`.** Tracked in git and absent from `.gitignore` (currently only public `VITE_` anon keys, but the pattern invites real-secret leakage, e.g. a future `VITE_CANVAS_CLIENT_SECRET`). | Medium | `git ls-files` | Remove from tracking, add to `.gitignore`, rotate if any real secret ever lands there. |
