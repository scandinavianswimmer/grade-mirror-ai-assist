# 07 — Prioritized Sprint Plan

Sequencing principle: **make the core trustworthy and safe before adding or polishing anything.** Each sprint is a vertical slice that ends in something demonstrable and tested. Sprint length is indicative (1–2 weeks each for a solo/small team).

---

## Sprint 0 — "Trust the grade" (de-risk the core) ⭐ FIRST SPRINT

**Goal / definition of done:** *A single teacher uploads one real essay and receives a trustworthy, teacher-styled, correctly-anchored grade with **zero mock data**, and a regression can't silently break it.*

Scope:
1. **Remove mock injection** — strip `Math.random()` scores + hardcoded tiles/vocab from `SubmissionDetail.processAIResponse`; render only verified AI output. *(A1)*
2. **Structured grading output** — convert `generate-grading-feedback` to tool-use/JSON mode + zod validation; **delete the silent "B" fallback**, add one structured repair attempt then explicit error. *(A2)*
3. **Robust anchoring** — model returns char offsets; fuzzy fallback; **never silent-drop** (surface "couldn't place"). *(A3)*
4. **Determinism + injection defense** — pin temperature 0; delimit/encode student text. *(A5, A6)*
5. **Minimal eval harness** — ~15 de-identified golden essays; deterministic scorers (schema validity, evidence-found, score-in-bounds, anchor-match) + teacher-agreement (±1 level, QWK); commit a baseline; wire a CI gate. *(R3, R11)*
6. **Safety hardening needed to demo legally:** squash migrations to a replayable baseline; add `WITH CHECK` + lock `users.plan/role/counters`; encrypt LMS tokens; untrack `.env` + gitignore; derive `userId` from JWT. *(E1, E4, E5, E3, R13)*

Exit gate: eval harness green; no mock data anywhere in the grading path; `supabase db reset` replays cleanly.

Skills: `ai-grading-rubric-evaluation-skill`, `prompt-evaluation-test-harness-skill`, `supabase-rls-security-skill`, `claude-api` (structured outputs), `tdd`.

---

## Sprint 1 — Reliable ingestion + consolidation

**Goal:** Any supported file (incl. scanned PDF) yields clean text or an honest "needs review"; the app has **one** of each duplicated flow.

1. **Server-side extraction** (`ingest-document` Edge Function) with OCR fallback + extraction confidence; block auto-grade on empty/low-confidence. *(A4, C2)*
2. **Collapse duplicates:** one upload component, one dashboard, one onboarding, one annotation renderer; **delete** podcast, `Upload`, `GradingPreview`, `Index` demo, orphan onboardings, `GeminiSetup`. *(B1–B6, D1–D7)*
3. **Adopt TanStack Query** for classes/assignments/submissions; remove `dashboardCache` and ad-hoc `useEffect` fetching.
4. **Decompose `SubmissionDetail`** into `useSubmission`/`useGrading`/`useAnnotations` + presentational components.

Exit gate: scanned-PDF path produces a graceful result; route map has no dead/duplicate pages; Playwright E2E covers the core path.

Skills: `document-parsing-pdf-docx-skill`, `react-shadcn-ui-audit-skill`, `repo-audit-skill`.

---

## Sprint 2 — Make personalization actually work

**Goal:** The teacher's style measurably changes grades/feedback; training data is one coherent model the grader reads.

1. **Unify training/style schema**; migrate existing rows; ensure `style_profile` + **retrieved few-shot** (full, not truncated) are injected into the production grader. *(R7, C6, B6)*
2. **Structured rubric** (`rubric_criteria` with weights/max + level descriptors); server-recomputed totals; per-criterion evidence verification. *(R6)*
3. **Reinforcement loop:** fold accepted/edited annotations back into the few-shot pool + style profile.
4. **Eval expansion:** measure teacher-agreement *with vs without* style injection to prove personalization works; add bias checks (identity-blinded, length-neutral).

Exit gate: eval shows agreement improves with style on; rubric scores are bounded and evidence-verified.

Skills: `ai-grading-rubric-evaluation-skill`, `prompt-evaluation-test-harness-skill`.

---

## Sprint 3 — Privacy & compliance hardening

**Goal:** Defensible handling of student data.

1. **Body-level PII scrubbing/redaction**; de-identify text sent to the model. *(R1)*
2. **Consent capture + enforcement** (`allow_training_on_content` actually checked); least-permissive defaults. *(C4, R7-privacy)*
3. **Retention + deletion**: `pg_cron` schedules; "delete my data"; per-data-class retention. *(C5)*
4. **Audit log** of student-record access; restrict `ai_model_health`; tighten CORS; verify lead-gen table RLS.
5. Confirm AI-vendor no-training/zero-retention terms.

Exit gate: `privacy-ferpa-student-data-skill` review passes with no Critical/High open.

Skills: `privacy-ferpa-student-data-skill`, `supabase-rls-security-skill`.

---

## Sprint 4 — Onboarding, polish, performance

1. Finish the **single onboarding** with real style capture wired to the grader (fix hardcoded `'independent'`).
2. **Async grading jobs** + caching; batch where possible; remove client-blocking parse. *(R12)*
3. UI/a11y pass (`react-shadcn-ui-audit-skill`); remove `dangerouslySetInnerHTML`; loading/empty/error states.
4. Observability: surface model/latency/cost from `llm_sessions`/`ai_request_logs`.

---

## Sprint 5+ — Deferred (post-MVP)

- **Canvas LMS** rebuilt server-side (encrypted tokens, real sync). *(C1)*
- **Billing/upgrade** wired to a real provider. *(C3)*
- Multi-assignment analytics, class-level insights, additional file types.

---

## Cross-sprint definition of done

Every sprint: eval harness green (where grading touched), Vitest + Playwright pass, `supabase db reset` replays, no new `as any`, no secrets client-side, security review clean for touched surfaces. Use `/gsd-plan-phase` to expand each sprint into an executable plan and `/gsd-execute-phase` to run it.
