# aiTA — Roadmap (Production Milestone 1)

**7 phases** | **34 requirements mapped** | 100% v1 coverage ✓

Phases are ordered by dependency and each delivers an end-to-end, observable capability (vertical slices). Goal-backward: the milestone is done when grading is valid, learns the teacher's style, the teacher controls every output, and each teacher's data + learning is isolated — all proven by an eval harness.

| # | Phase | Goal | Requirements |
|---|-------|------|--------------|
| 1 | Data foundation & isolation | Correct, owner-isolated v2 schema live; no silent write failures | OPS-01, OPS-02, SEC-01, SEC-02 |
| 2 | Trustworthy grading core | A grade is valid: rubric-mandatory, relevance-gated, level-calibrated | GRADE-01..07 |
| 3 | Human-in-the-loop review | Teacher accepts/edits/dismisses every note; states persist; finalize/export | HITL-01..05 |
| 4 | Evaluation harness | Grading quality is measured + gated; regressions caught | EVAL-01..04 |
| 5 | Onboarding, classes & samples | Gated onboarding → class (subject/level) → ≥10 samples ingested | ONBOARD-01..05 |
| 6 | Teacher-style learning loop | Style profile reaches the grader; edits improve grading over time | LEARN-01..06 |
| 7 | Privacy, isolation hardening & launch | Scoped retrieval, FERPA controls, secret rotation, eval-gated go-live | SEC-03, SEC-04, SEC-05, OPS-03 |

---

### Phase 1: Data foundation & isolation
**Goal:** The v2 cloud schema is fully applied and every teacher-owned row + storage object is owner-scoped, with no silently-swallowed write failures — the correct, isolated foundation everything else writes to.
**Mode:** mvp
**Requirements:** OPS-01, OPS-02, SEC-01, SEC-02
**Success Criteria:**
1. Migrations `0003–0011` are applied to cloud; `annotations.ai_comment` and all v2 columns exist (the annotations 400 is gone).
2. RLS on every teacher-owned table (submissions, grades, annotations, edits, profiles, samples, exemplars) provably blocks cross-teacher reads/writes.
3. Uploaded files have no public URL; access is via expiring signed URLs only.
4. Edge-function inserts check for errors and surface them (no silent failures like the current annotation insert).

*Prerequisite:* migration apply needs the DB password (user runs `GO-LIVE-RUNBOOK.md` §2); policies + code authored by aiTA.

### Phase 2: Trustworthy grading core
**Goal:** A produced grade is valid — aligned to a real rubric, refusing to reward off-assignment work, calibrated to the class level and teacher harshness, on the primary model.
**Mode:** mvp
**Requirements:** GRADE-01, GRADE-02, GRADE-03, GRADE-04, GRADE-05, GRADE-06, GRADE-07
**Success Criteria:**
1. Grading is blocked without a structured rubric; the teacher is guided to author or auto-generate one (strict rubric synthesized from prompt + subject/level, editable).
2. The motor-oil-on-a-Holes-essay case (and similar off-topic content) is scored low / "needs review" via a deterministic relevance gate, not the model's self-report.
3. `off_topic` / `low_confidence` / `unverified_evidence` change the disposition (floor/withhold/review), not just annotate.
4. The same essay scores measurably differently across class levels / harshness settings.
5. The rendered grade shows `gemini-2.5-pro` as the model used on the happy path.

### Phase 3: Human-in-the-loop review
**Goal:** The teacher has final say — every annotation and the grade can be accepted, edited, or dismissed, and those decisions persist and export cleanly.
**Mode:** mvp
**Requirements:** HITL-01, HITL-02, HITL-03, HITL-04, HITL-05
**Success Criteria:**
1. Inline annotations render anchored to the quoted spans and survive reload.
2. Accept / edit / dismiss (and accept-all / dismiss-all) persist across reload.
3. An edited note shows "AI originally suggested…".
4. Finalize locks the grade; export contains only accepted/edited notes (no internal AI-confidence; harsh-wording banner when applicable).

### Phase 4: Evaluation harness
**Goal:** Grading quality is measurable and every prompt/model change is gated against regressions — "better over time" becomes falsifiable.
**Mode:** mvp
**Requirements:** EVAL-01, EVAL-02, EVAL-03, EVAL-04
**Success Criteria:**
1. A versioned reference dataset exists (curated off-topic + injection cases + teacher-graded cases).
2. An eval run reports agreement-with-teacher, calibration error, off-topic catch rate, injection-resistance rate.
3. A change that reintroduces "100/100 on unrelated content" fails the gate.
4. The eval is runnable on demand with one command and reproducible.

### Phase 5: Onboarding, classes & samples
**Goal:** A new teacher is taken through a gated setup that captures who they are and how they teach, and ingests ≥10 of their past grading samples — the inputs the learning loop needs.
**Mode:** mvp
**Requirements:** ONBOARD-01, ONBOARD-02, ONBOARD-03, ONBOARD-04, ONBOARD-05
**Success Criteria:**
1. A new teacher completes onboarding (type, subjects, grade levels, baseline harshness) before reaching the dashboard.
2. A teacher creates a class with subject + level that feeds grading calibration; multiple classes are supported and independently configured.
3. A teacher uploads ≥10 past samples that are parsed (PDF/DOCX/TXT) and stored in their sandbox.
4. Grading unlocks only when prerequisites are met (or explicit cold-start opt-in), with clear UI state; advanced classes prompt for more detail.

### Phase 6: Teacher-style learning loop
**Goal:** The grader actually sounds like the teacher and gets better with every batch — the style profile reaches the grading prompt and teacher edits feed back into it.
**Mode:** mvp
**Requirements:** LEARN-01, LEARN-02, LEARN-03, LEARN-04, LEARN-05, LEARN-06
**Success Criteria:**
1. A per-teacher, per-subject-level calibration/style profile is built from the ≥10 samples.
2. The profile is injected into the grading prompt — the same essay graded with vs without the profile differs in voice/standards.
3. Teacher approve/edit/dismiss actions update the profile and/or few-shot exemplars.
4. The eval harness shows grading agreement improving toward the teacher's standards across successive batches.
5. Cold-start (<10 samples) grades conservatively and bootstraps from first edits.

### Phase 7: Privacy, isolation hardening & launch
**Goal:** Production-ready: learning retrieval is provably teacher-scoped, teachers control their data per FERPA, secrets are rotated, and go-live is gated on a green eval.
**Mode:** mvp
**Requirements:** SEC-03, SEC-04, SEC-05, OPS-03
**Success Criteria:**
1. Grade-time style/exemplar retrieval is provably scoped to the grading teacher (a second teacher's data can never influence a grade).
2. A teacher can view, set retention for, and delete all their data (DB rows + storage objects); deletion is verified complete.
3. Student-submission PII + training-consent are enforced (no unconsented exemplar use).
4. Exposed secrets (DB password, service-role key, Gemini key) are rotated; go-live gated on a passing eval run.

---

## Notes
- Brownfield: Phases evolve the existing v2 backend + Marginalia UI; they do not rebuild working pieces (live grading round-trip, ingestion, injection resistance, schema-constrained engine).
- Ordering rationale: foundation/isolation (1) → valid grade (2) → teacher control (3) → measurement (4) → inputs for learning (5) → the learning loop (6) → hardening + launch (7). Phase 4 can begin once Phase 2 lands; Phase 6 depends on 3+5.

*Last updated: 2026-05-22 after initialization*
