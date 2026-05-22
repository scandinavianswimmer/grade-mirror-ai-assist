# aiTA — Requirements (Production Milestone 1)

Scope: the full production-ready grading system. REQ-ID format `[CATEGORY]-[NN]`. All requirements are user-centric, specific, and testable. Traceability (phase mapping) is filled by the roadmap.

---

## Grading Validity — `GRADE`

- [ ] **GRADE-01**: A teacher cannot run grading on an assignment that has no structured rubric; the UI guides them to create or generate one first.
- [ ] **GRADE-02**: When no rubric exists, aiTA generates a strict, criteria-based rubric from the assignment prompt + class subject/level, which the teacher can review and edit before grading.
- [ ] **GRADE-03**: A submission that does not address the assignment (wrong topic/genre) cannot receive a high score — relevance is checked deterministically (cheap pre-pass / similarity), independent of the grading model's self-report.
- [ ] **GRADE-04**: Off-topic, low-confidence, and unverified-evidence conditions materially change the disposition (score floor / "needs review" / withheld grade), not just an advisory flag.
- [ ] **GRADE-05**: Scores are calibrated to the class level and the teacher's harshness setting (the same essay scores differently in 7th grade vs 11th honors).
- [ ] **GRADE-06**: Grading uses `gemini-2.5-pro` as the primary model (verified in the rendered result), falling back to flash only on real failure.
- [ ] **GRADE-07**: Every criterion's evidence quote is verified against the submission text server-side; unverifiable evidence is surfaced, never silently trusted.

## Teacher-Style Learning — `LEARN`

- [ ] **LEARN-01**: During onboarding a teacher uploads ≥10 past grading samples (graded work / rubrics / feedback), parsed and stored in their sandbox.
- [ ] **LEARN-02**: aiTA builds a per-teacher, per-subject-level calibration/style profile from those samples (tone, harshness, what they reward/penalize, exemplar gradings).
- [ ] **LEARN-03**: The style profile is injected into the grading prompt so output matches the teacher's voice and standards (verifiable: same essay graded with vs without profile differs).
- [ ] **LEARN-04**: Each teacher approve/edit/dismiss of an annotation or score updates the style profile and/or a few-shot exemplar store.
- [ ] **LEARN-05**: Grading measurably improves toward the teacher's standards over successive batches (tracked by the eval harness).
- [ ] **LEARN-06**: Before 10 samples exist, grading still works in a conservative rubric-only mode and begins bootstrapping from the teacher's first edits.

## Human-in-the-Loop Review — `HITL`

- [ ] **HITL-01**: Inline annotations persist and render on the submission, anchored to the quoted text spans.
- [ ] **HITL-02**: A teacher can accept, edit, or dismiss each annotation, and those states survive a page reload.
- [ ] **HITL-03**: "Accept all" / "Dismiss all" work and persist.
- [ ] **HITL-04**: An edited annotation shows "AI originally suggested…" (audit trail of the original AI wording).
- [ ] **HITL-05**: Finalizing a submission locks the grade; export shows only accepted/edited notes (no internal AI-confidence, harsh-wording banner when applicable).

## Onboarding, Accounts & Classes — `ONBOARD`

- [ ] **ONBOARD-01**: A new teacher completes a gated onboarding capturing teacher type, subjects, grade levels, and a baseline harshness before reaching the dashboard.
- [ ] **ONBOARD-02**: A teacher creates a class specifying subject and level; these feed grading calibration and rubric defaults.
- [ ] **ONBOARD-03**: A teacher can run multiple classes, each independently configured and monitored.
- [ ] **ONBOARD-04**: Grading is unlocked only once the prerequisites (profile + class + ≥10 samples or explicit cold-start opt-in) are met, with clear UI state.
- [ ] **ONBOARD-05**: More advanced classes prompt the teacher for additional rubric detail / samples to keep grading consistent and honest.

## Evaluation Harness — `EVAL`

- [ ] **EVAL-01**: A reference dataset of teacher-graded submissions exists and is versioned (seeded from the teacher's samples + curated cases incl. the off-topic and injection cases).
- [ ] **EVAL-02**: An eval run reports agreement with teacher grades, calibration error, off-topic catch rate, and injection-resistance rate.
- [ ] **EVAL-03**: Prompt/model changes are gated on eval results (regressions like "100/100 on unrelated content" fail the gate).
- [ ] **EVAL-04**: Eval results are reproducible and runnable on demand (CI-style command).

## Multi-Tenant Isolation & Privacy — `SEC`

- [ ] **SEC-01**: Every teacher-owned table (samples, profiles, exemplars, grades, annotations, edits) is RLS-scoped so a teacher can only ever read/write their own rows.
- [ ] **SEC-02**: Storage objects (uploaded submissions + samples) are owner-scoped; no public URLs; signed URLs expire.
- [ ] **SEC-03**: Grade-time retrieval of style/exemplars filters strictly to the grading teacher — no cross-teacher contamination is possible.
- [ ] **SEC-04**: A teacher can view, set retention for, and delete all their data (DB rows + storage objects), satisfying FERPA/privacy expectations.
- [ ] **SEC-05**: Student-submission PII handling and training consent are enforced (no unconsented use of student work as exemplars).

## Platform / Ops — `OPS`

- [ ] **OPS-01**: Migrations `0003–0011` (and any new ones) are applied to cloud so the v2 schema (incl. `annotations.ai_comment`) is live.
- [ ] **OPS-02**: Edge functions are deployed and the frontend points at the correct project; failed inserts are checked, not silently swallowed.
- [ ] **OPS-03**: Exposed secrets (DB password, service-role key, Gemini key) are rotated before public exposure.

---

## v2 / Deferred

- Canvas/LMS sync — valuable, not on the critical path to trustworthy grading.
- Student-facing accounts/portals.
- Freemium/billing + pricing.

## Out of Scope (with reasoning)

- Auto-submitting grades without teacher approval — HITL is non-negotiable.
- A shared cross-teacher learning pool — explicitly rejected (isolation requirement).
- Replacing the Marginalia design system — evolve, don't redesign.

---

## Traceability

REQ-ID → Phase (100% coverage; each requirement maps to exactly one phase).

| Phase | Requirements |
|-------|--------------|
| 1 — Data foundation & isolation | OPS-01, OPS-02, SEC-01, SEC-02 |
| 2 — Trustworthy grading core | GRADE-01, GRADE-02, GRADE-03, GRADE-04, GRADE-05, GRADE-06, GRADE-07 |
| 3 — Human-in-the-loop review | HITL-01, HITL-02, HITL-03, HITL-04, HITL-05 |
| 4 — Evaluation harness | EVAL-01, EVAL-02, EVAL-03, EVAL-04 |
| 5 — Onboarding, classes & samples | ONBOARD-01, ONBOARD-02, ONBOARD-03, ONBOARD-04, ONBOARD-05 |
| 6 — Teacher-style learning loop | LEARN-01, LEARN-02, LEARN-03, LEARN-04, LEARN-05, LEARN-06 |
| 7 — Privacy, isolation hardening & launch | SEC-03, SEC-04, SEC-05, OPS-03 |
