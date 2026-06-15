# OSF Pre-Registration — aiTA Voice-Convergence Proof (Phase 15 v2)

> **Deadline: file on OSF by Jul 7, 2026** (before Batch 1 baseline data is analyzed). The honest,
> falsifiable kill criterion is the most persuasive element of the Criterion-C narrative — "a proof
> that could have failed and didn't" beats a glossy demo. Paste these sections into the OSF
> pre-registration form (AsPredicted-style). **[FOUNDER VERIFY]** numbers in braces before filing.

## Title
Does an AI essay-grader converge to an individual teacher's feedback voice? A pre-registered,
holdout-controlled study.

## Hypothesis
For grades 9–12 ELA teachers, aiTA's drafted feedback will become **measurably more similar to the
teacher's own feedback voice** across successive grading batches, relative to a no-profile holdout —
with a **fast-then-plateau** trajectory (convergence largely achieved by ~{8} examples), not unbounded
improvement.

## Design
- **Participants:** {4–6} grades 9–12 ELA teachers, each grading {≥4} batches of their real student
  essays in aiTA. Pre-enrollment, each teacher contributes {8–10} reference feedback samples (their
  baseline voice corpus).
- **Conditions (within-teacher):** *with-profile* (aiTA applies the teacher's learned voice profile)
  vs. *holdout/no-profile* (profile suppressed) on matched essays — the specificity control.
- **Procedure:** after each batch the teacher gives a one-tap edit self-rating (1 = rewrote all …
  5 = barely touched). aiTA logs the AI-original and teacher-final feedback text per annotation.

## Primary outcome
**GPT-judge voice-trait fidelity.** A blinded LLM judge scores each piece of aiTA feedback against
the teacher's reference corpus on voice traits (lexical diversity, sentence structure, hedging
patterns) using a fixed rubric. Primary test: with-profile fidelity increases across batches and
exceeds holdout. (Judge-legible and robust to the "teachers rarely edit" problem that kills edit-rate
as a primary metric — Borchers et al., AIED 2026, n=117: 51.3% of teachers never edit AI feedback.)

## Secondary / corroborating outcomes
- **Aggregated LUAR-MUD cosine similarity** over {≥4–8} feedback samples per teacher (NOT single
  comments — LUAR degrades on short text) vs. the pre-enrollment reference corpus. Calibrate an
  **in-domain** floor/ceiling on held-out teacher pairs; **do not reuse Reddit defaults.**
- **LZ77 compression edit-distance** between AI-original and teacher-final feedback (Borchers-robust
  corroborator of the self-rating signal).

## Kill criterion (pre-committed)
The wedge is **disproven** if, across the study, with-profile feedback shows **no statistically
significant gain in primary GPT-judge fidelity over the holdout** AND the aggregated LUAR similarity
trend is flat ({< X%} relative gain by Batch 4). If the proof is killed, Criterion C pivots to a
**time-savings** claim (measured grading throughput), reported honestly.

## Analysis plan
- Mixed-effects model: fidelity ~ batch × condition + (1 | teacher). Pre-registered α = {0.05}.
- Report effect sizes + per-teacher trajectories; no student-outcome claims (not credible in 9 weeks).
- Exclusions: batches with < {N} essays; teachers completing < {3} batches reported separately.

## Data & materials
Instrumentation already in the product (migration 0017: `grading_batches`, `submissions.batch_id`,
`submissions.edit_self_rating`, `annotations.edit_distance`). De-identified analysis dataset + judge
rubric + analysis code to be posted to the OSF project on completion.

---
### Pre-file checklist
- [ ] Fill every {brace} value (sample sizes, α, kill threshold X%).
- [ ] Confirm IRB/exempt status for the study design.
- [ ] Lock the GPT-judge rubric text (versioned) before Batch 1.
- [ ] Create the OSF project; file pre-reg **by Jul 7**; keep the registration link for the submission.
