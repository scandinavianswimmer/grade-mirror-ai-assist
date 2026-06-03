# aiTA — Roadmap (Production Milestone 1)

**14 phases** | full v1 requirement coverage ✓

Expanded from grading-only to an operationally-real, agentic AI platform: valid grading + a visible AI-agent workflow + reliability/async infra + auditability + teacher-memory learning loop + measurable analytics + auth/billing/storage + deploy to a custom domain. Ordering is dependency- and demo-impact-driven (judges want: agents, orchestration, auditability, reliability, measurable improvement, scalability, live on a domain).

| # | Phase | Goal | Requirements |
|---|-------|------|--------------|
| 1 | Data foundation & isolation | Correct, owner-isolated v2 schema; no silent writes | OPS-01, OPS-02, SEC-01, SEC-02 |
| 2 | Trustworthy grading core | A grade is valid: rubric-mandatory, relevance-gated, calibrated | GRADE-01..07 |
| 3 | Agentic grading workflow | Grading is a visible, logged multi-agent pipeline | AGENT-01..04 |
| 4 | Async jobs & reliability | Grading is queued, retried, never loses work | JOBS-01..05, RELY-01..02 |
| 5 | HITL review & audit layer | Teacher controls + full audit/explainability | HITL-01..05, AUDIT-01..05 |
| 6 | Auth & account creation | Email + Google sign-in via Supabase Auth | AUTH-01..03 |
| 7 | Onboarding, classes & samples | Gated setup → class (subject/level) → ≥10 samples | ONBOARD-01..05 |
| 8 | Storage backend & parsing | Owner-scoped object storage + robust parsing | STORE-01..02 |
| 9 | Teacher memory & improvement loop | Style reaches grader; edits improve grading; measurable | LEARN-01..06 |
| 10 | Evaluation harness | Quality measured + gated; regressions caught | EVAL-01..04 |
| 11 | Analytics, metrics & observability | Measurable outcomes + tracing + grading history | METRIC-01..04, OBS-01..02 |
| 12 | Billing | Stripe plans + usage gating | BILL-01..02 |
| 13 | Privacy, compliance & FERPA-aware | Scoped retrieval, data controls, honest compliance language | SEC-03..05, COMPLY-01..02 |
| 14 | Deploy & custom domain | Hosted, on a custom domain, CI/CD, secrets rotated | DEPLOY-01..03, OPS-03 |

---

### Phase 1: Data foundation & isolation
**Goal:** v2 schema fully applied; every teacher-owned row + storage object owner-scoped; no silently-swallowed write failures.
**Mode:** mvp · **Requirements:** OPS-01, OPS-02, SEC-01, SEC-02
**Success Criteria:** (1) migrations `0003–0011` applied (annotations 400 gone); (2) RLS provably blocks cross-teacher access on every teacher-owned table; (3) no public file URLs, signed URLs only; (4) edge inserts check + surface errors.
*Prereq:* migration apply needs DB password (user).

### Phase 2: Trustworthy grading core ✅ code complete (awaiting deploy)
**Goal:** A grade is valid — rubric-mandatory, relevance-gated, level-calibrated, primary model.
**Mode:** mvp · **Requirements:** GRADE-01..07
**Success Criteria:** (1) no grade without a structured rubric (auto-synthesized when absent); (2) off-topic content (oil-change case) withheld via deterministic relevance gate; (3) flags change disposition, not just annotate; (4) calibration varies by level/harshness; (5) `gemini-2.5-pro` on the happy path.

### Phase 3: Agentic grading workflow
**Goal:** Grading reads as an AI workforce — named, individually-logged agents (Rubric, Relevance/Risk, Grading, Annotation, Feedback-Summary, Style) orchestrated with visible per-step status.
**Mode:** mvp · **Requirements:** AGENT-01..04
**Success Criteria:** (1) the engine is structured as discrete named agents behind an orchestrator; (2) each agent logs input/output/model/latency/tokens; (3) the UI shows the pipeline + per-step status; (4) a Risk/Plagiarism agent flags off-topic/injection/likely-AI-generated work.

### Phase 4: Async jobs & reliability
**Goal:** Grading is a queued, retried, durable job — the app never crashes, freezes, loses uploads, or drops teacher edits.
**Mode:** mvp · **Requirements:** JOBS-01..05, RELY-01..02
**Success Criteria:** (1) grading runs via Upstash Redis queue + Cloud Run worker, non-blocking; (2) jobs idempotent + retried, no dup/lost grades; (3) uploads + edits never silently fail; (4) failed jobs are visibly retryable; (5) a jobs/events view is queryable.

### Phase 5: HITL review & audit layer
**Goal:** The teacher has final say with full auditability — accept/edit/dismiss persists, every grade is explainable with confidence + citations + edit history.
**Mode:** mvp · **Requirements:** HITL-01..05, AUDIT-01..05
**Success Criteria:** (1) annotations render/accept/edit/dismiss persist across reload; (2) confidence + evidence citation shown per criterion; (3) per-criterion rationale visible; (4) edits tracked (AI-original vs edited); (5) nothing final without teacher approval; clean export.

### Phase 6: Auth & account creation
**Goal:** A teacher can create an account with email/password or Google.
**Mode:** mvp · **Requirements:** AUTH-01..03
**Success Criteria:** (1) email/password sign-up + sign-in; (2) Google OAuth sign-up + sign-in via Supabase Auth; (3) account creation captures required profile basics feeding onboarding.

### Phase 7: Onboarding, classes & samples
**Goal:** Gated onboarding captures who the teacher is + ingests ≥10 samples; classes carry subject/level.
**Mode:** mvp · **Requirements:** ONBOARD-01..05
**Success Criteria:** (1) gated onboarding (type/subjects/levels/harshness); (2) class subject+level feeds calibration; multi-class; (3) ≥10 samples uploaded + parsed into the teacher's sandbox; (4) grading unlock gating + advanced-class prompts.

### Phase 8: Storage backend & parsing
**Goal:** Submissions + samples in owner-scoped object storage with robust parsing.
**Mode:** mvp · **Requirements:** STORE-01..02
**Success Criteria:** (1) object storage (GCS or Supabase buckets per Key Decision) is owner-scoped, no public URLs, signed/expiring access; (2) PDF/DOCX/TXT parsing with confidence + OCR fallback; low-confidence → manual review.

### Phase 9: Teacher memory & continuous-improvement loop
**Goal:** The grader sounds like the teacher and improves measurably with every batch.
**Mode:** mvp · **Requirements:** LEARN-01..06
**Success Criteria:** (1) per-teacher/per-level calibration profile from samples; (2) profile injected into the grader (with vs without differs); (3) approve/edit/dismiss updates profile + exemplars; (4) eval shows agreement improving / edit-rate dropping over batches; (5) cold-start path.

### Phase 10: Evaluation harness
**Goal:** Grading quality is measurable and every prompt/model change is gated.
**Mode:** mvp · **Requirements:** EVAL-01..04
**Success Criteria:** (1) versioned reference dataset (off-topic + injection + teacher cases); (2) metrics: agreement, calibration error, off-topic catch, injection resistance; (3) the 100/100-on-unrelated regression fails the gate; (4) one-command reproducible run.

### Phase 11: Analytics, metrics & observability
**Goal:** Measurable outcomes + operational visibility — the "measurable intelligence improvement" story.
**Mode:** mvp · **Requirements:** METRIC-01..04, OBS-01..02
**Success Criteria:** (1) track time-saved, avg edits, alignment confidence, turnaround; (2) edit-rate-over-time per teacher; (3) teacher metrics dashboard; (4) product analytics events (PostHog/custom); (5) request tracing per grading job; (6) queryable grading history.

### Phase 12: Billing
**Goal:** Teachers can pay; usage is gated by plan.
**Mode:** mvp · **Requirements:** BILL-01..02
**Success Criteria:** (1) Stripe subscribe + manage plan; (2) free/paid usage gating enforced.

### Phase 13: Privacy, compliance & FERPA-aware
**Goal:** Provably teacher-scoped learning + honest, defensible compliance posture.
**Mode:** mvp · **Requirements:** SEC-03..05, COMPLY-01..02
**Success Criteria:** (1) grade-time retrieval provably teacher-scoped (no cross-teacher influence); (2) teacher can view/retain/delete all data (rows + storage); (3) consent enforced (no unconsented exemplars); (4) all copy is "FERPA-aware," never "fully compliant"; (5) retention/deletion structured for a future legal review.

### Phase 14: Deploy & custom domain
**Goal:** Live on a custom domain, production-configured, CI/CD, secrets rotated.
**Mode:** mvp · **Requirements:** DEPLOY-01..03, OPS-03
**Success Criteria:** (1) frontend hosted + connected to the user's custom domain over HTTPS; (2) CI/CD for functions + frontend; (3) prod CORS/headers set + exposed secrets rotated.

---

## Notes
- **Brownfield:** evolve the existing v2 backend + Marginalia UI; reuse working pieces (live grading round-trip, ingestion, injection resistance, schema-constrained engine).
- **Stack (locked unless noted):** Gemini 2.5 Pro (core) + Flash (fast tasks); Supabase (Auth + Postgres + edge functions) + Cloud Run (queue worker / long jobs); Upstash Redis (queue); Stripe (billing); PostHog or custom (analytics); object storage backend **pending Key Decision (GCS vs Supabase buckets)**.
- **Auth:** Supabase Auth with Google OAuth provider — satisfies both "Google sign-in option" and "Auth: Supabase."
- **Compliance:** never claim "fully FERPA/GDPR compliant" — "FERPA-aware workflows + teacher-controlled review" only.
- **Demo-impact ordering:** Phases 2–5 + 9–11 carry the judge-facing story (valid grading, agent workforce, reliability, auditability, measurable improvement). Phase 14 makes it live on a domain.

*Last updated: 2026-05-22 after scope expansion (auth/storage/infra/agents/analytics/billing/deploy).*

---

## Milestone 2 — prove-the-wedge (active focus, 2026-06-03)

> Pivot from production-1 breadth to the ONE defensible wedge from the competitive research
> (`~/research/notes/final_report_ai-grading-competitor-whitespace-fc4570.md`): voice-convergence.
> "Spend 30 days proving aiTA can learn a teacher's feedback style well enough that they say
> 'I barely had to edit this.' If you can't, you're in a commodity market."

| # | Phase | Goal | Requirements |
|---|-------|------|--------------|
| 15 | Voice-Convergence Proof | Falsifiable evidence the AI learns a teacher's voice ("barely had to edit this") — measure edit-rate decline over batches, binary-signal few-shot reinforce loop, honest go/no-go verdict | LEARN-04, LEARN-05, EVAL-02, EVAL-03, PROOF-01..03 |

### Phase 15: Voice-Convergence Proof
**Goal:** prove voice-convergence with a falsifiable curve + teacher testimonial (or honestly disprove it).
**Mode:** standard · **Planned:** `.planning/phase-15-voice-convergence-proof/` (CONTEXT + PLAN).
**Success bar:** ≥40% edit-rate decline across ≥4 batches + a "barely edited" rating + with/without margin.
**Kill criterion:** flat edit-rate (<15% decline) → wedge disproven → escalate to KTO or pivot (no ego-boost).
