# OSF Pre-Registration — aiTA Voice-Convergence Proof (Phase 15 v2)

> **File on OSF by Jul 7, 2026**, before Batch-1 baseline data is analyzed. This is the complete,
> paste-ready text — structured to the standard OSF Preregistration template. The honest, pre-committed
> kill criterion is the most persuasive element of the XPRIZE Criterion-C narrative: "a proof that could
> have failed and didn't" beats a glossy demo.
>
> **Values are filled with defensible defaults.** Items marked **[CONFIRM]** depend on the final cohort
> and must be locked (not loosened) before Batch 1. The locked GPT-judge rubric lives in
> `../../eval/convergence/judge-rubric.md` (version it before any data is graded).

---

## 1. Study Information

### 1.1 Title
Does an AI essay-grader converge to an individual teacher's feedback voice? A pre-registered,
holdout-controlled study.

### 1.2 Description
AI essay-feedback tools are abandoned because their output is generic and "doesn't sound like me." aiTA
learns an individual teacher's feedback voice from their accept/edit/dismiss signals and injects a learned
style profile into generation. This study tests, with a pre-committed kill criterion, whether aiTA's
drafted feedback becomes **measurably more similar to a teacher's own feedback voice** across successive
real grading batches — and whether that gain is **specific to the learned profile** (vs. a no-profile
holdout), rather than a generic drift.

This is a **falsifiable, holdout-controlled pilot** using a within-teacher (single-case-experimental-design)
logic: each teacher is their own control, and batch index is the time series. We are explicitly **not**
making population-level or student-outcome claims — small N by design; the value is the controlled
contrast plus the honest stopping rule.

### 1.3 Hypotheses
- **H1 (convergence):** For grades 9–12 ELA teachers, the voice-fidelity of aiTA's *with-profile* drafted
  feedback (primary GPT-judge score) increases across successive batches.
- **H2 (specificity):** *With-profile* voice-fidelity exceeds the matched *no-profile holdout* on the same
  essays — i.e., the gain is attributable to the learned profile, not generic improvement.
- **H3 (shape):** The trajectory is **fast-then-plateau** (most convergence achieved by ~8 reinforcement
  examples), not unbounded. We therefore claim *measured, verifiable* convergence to a plateau, not
  monotone improvement without limit.

---

## 2. Design Plan

### 2.1 Study type
Observational/experimental hybrid: a real-use field study with one **within-teacher manipulated factor**
(profile on vs. off) applied to matched essays.

### 2.2 Blinding
The **GPT-judge is blinded** to condition (with-profile vs. holdout), to batch index, and to the
hypothesis direction: feedback samples are presented in randomized order with condition/batch labels
stripped. Teachers are not blinded (they use the product normally); their per-batch self-rating is a
secondary signal only.

### 2.3 Design
- **Manipulated (within-teacher):** profile condition — *with-profile* vs. *no-profile holdout*.
- **Time series:** batch index 1…N (**[CONFIRM] N ≥ 4**) per teacher.
- On each batch, a fixed fraction of essays (**holdout share = 20%**, ≥3 essays/batch, randomly assigned)
  are graded with the profile suppressed, yielding matched with/without pairs within the same batch.

### 2.4 Randomization
Within each batch, essays are randomly assigned to the holdout arm via a seeded RNG (seed logged per
teacher per batch) to keep the with/without split reproducible and auditable.

---

## 3. Sampling Plan

### 3.1 Existing data
No outcome data collected at registration. Product instrumentation already exists (migrations 0017/0018:
`grading_batches`, `submissions.batch_id`, `submissions.edit_self_rating`, `annotations.edit_distance`,
`teacher_feedback_exemplars`). Teachers' pre-enrollment reference corpora are collected *before* analysis.

### 3.2 Data collection procedure
1. **Enrollment:** each teacher contributes **10 reference feedback samples** (their own prior feedback,
   de-identified) = the baseline voice corpus. Minimum 8 to qualify.
2. **Batches:** each teacher grades **≥4 batches** of their real student essays in aiTA (essays they would
   grade anyway). aiTA logs AI-original and teacher-final feedback text per annotation; profile is rebuilt
   from reviewed annotations between batches.
3. After each batch: a one-tap edit self-rating (1 = rewrote everything … 5 = barely touched).
4. All student text is **de-identified before any model call** (names scrubbed) and before analysis.

### 3.3 Sample size and rationale
**5 teachers (range 4–6)** × **≥4 batches** × ~20 essays/batch. This is a deliberately small,
within-teacher design: power comes from repeated within-teacher matched pairs (≈ ≥4 batches × ≥3 holdout
pairs = ≥12 matched pairs/teacher, plus the full with-profile time series), not from between-teacher N. We
report **per-teacher trajectories and effect sizes**, and treat cross-teacher aggregation as descriptive.
**[CONFIRM]** final teacher count once DPAs sign.

### 3.4 Stopping rule
Data collection ends when all enrolled teachers complete ≥4 batches **or** at the Week-7 analysis gate
(whichever is first). No optional stopping based on interim results. Teachers completing <3 batches are
reported separately and excluded from the confirmatory test.

---

## 4. Variables

### 4.1 Manipulated variables
**Profile condition:** with-profile (learned style profile + top-K exemplars injected into the cached
grading prefix) vs. no-profile holdout (profile + exemplars suppressed; identical model, rubric, temperature).

### 4.2 Measured variables (outcomes)
- **PRIMARY — GPT-judge voice-trait fidelity (0–100).** A blinded LLM judge scores each aiTA feedback
  sample against the teacher's reference corpus on a fixed rubric (lexical register, sentence structure,
  hedging/directness, praise-to-critique balance, formatting habits). Rubric locked + versioned in
  `../../eval/convergence/judge-rubric.md` before Batch 1. Judge model, version, and prompt are frozen and
  recorded; each sample is scored **3×** and averaged to reduce judge variance.
- **SECONDARY — Aggregated LUAR-MUD cosine similarity.** Computed over **8-sample aggregation windows** per
  teacher (NOT single comments — LUAR degrades on short text) vs. the pre-enrollment reference corpus. The
  similarity **floor/ceiling is calibrated in-domain** on held-out same-teacher vs. different-teacher pairs
  from the reference corpora; **Reddit/MUD default thresholds are NOT reused.**
- **SECONDARY — LZ77 compression edit-distance** between AI-original and teacher-final feedback (a
  Borchers-robust corroborator that does not assume teachers edit).
- **CONTEXT (not confirmatory) — edit self-rating (1–5)** and normalized Levenshtein edit-distance
  (`annotations.edit_distance`). Reported descriptively; **not** a primary metric (Borchers et al., AIED
  2026, n=117: 51.3% of teachers never edit AI feedback → edit-rate is uninterpretable as proof).

### 4.3 Indices
"Convergence" = positive batch slope in primary GPT-judge fidelity for the with-profile arm. "Specificity"
= with-profile minus holdout fidelity (matched, same batch).

---

## 5. Analysis Plan

### 5.1 Statistical models
- **H1/H2 (confirmatory):** linear mixed-effects model
  `fidelity ~ batch * condition + (batch | teacher)`, fit on all qualifying samples. H1 = positive `batch`
  slope in the with-profile arm; H2 = positive `condition` (with > holdout) and/or positive
  `batch:condition` interaction. Pre-registered **α = 0.05**, two-sided.
- **Per-teacher (primary descriptive):** for each teacher, batch-1→N delta in with-profile fidelity and the
  mean with−holdout gap, with bootstrap CIs. A teacher "converges" if the with-profile slope > 0 and the
  late-batch with−holdout gap > 0.
- **Secondary:** the same model on aggregated LUAR cosine; Spearman trend on LZ77 edit-distance.

### 5.2 Transformations
GPT-judge scores analyzed on the 0–100 scale; LUAR cosine Fisher-z transformed before modeling.

### 5.3 Inference criteria
Confirmatory support requires **H1 significant (α=0.05) AND H2 directionally supported** (with-profile >
holdout, late batches) in the mixed model, corroborated by a positive aggregated-LUAR trend. Secondary
outcomes are corroborating, not decisive.

### 5.4 Data exclusion
- Batches with **< 15 essays** excluded from confirmatory analysis (logged).
- Teachers completing **< 3 batches** reported separately, excluded from the confirmatory model.
- Feedback samples that are empty, withheld (off-topic refusal), or flagged `possible_injection` excluded
  from voice scoring (logged counts).

### 5.5 Missing data
Mixed-effects model uses all available observations (no imputation). Holdout pairs missing one arm are
dropped from the matched specificity contrast but retained in the with-profile time series.

### 5.6 Exploratory (clearly labeled, non-confirmatory)
Per-trait fidelity breakdown; relationship between exemplar count and fidelity (the FSPO plateau, H3);
whether ELL-heavy classrooms differ; self-rating vs. measured-fidelity correspondence.

---

## 6. Kill Criterion (pre-committed — do not loosen)
The wedge is **DISPROVEN** if, at the Week-7 analysis gate, **either**:
- the with-profile arm shows **no statistically significant positive batch slope** in primary GPT-judge
  fidelity (H1 fails at α=0.05), **or**
- with-profile does **not** exceed the holdout (H2 fails) **and** the aggregated LUAR trend is flat —
  **< 10% relative gain** from Batch 1 to Batch 4.

If disproven, Criterion C **pivots honestly to a measured time-savings claim** (grading throughput,
unattended auto-finalize rate) — reported without spin. We pre-commit to publishing the result either way.

---

## 7. Ethics & Materials
- **[CONFIRM]** IRB / exempt determination for the study design (de-identified, real-use, minimal risk).
- Student data is de-identified before any model call and before analysis; teacher participation under a
  signed school DPA (`school-dpa-stub.md`).
- On completion, the OSF project will host: the de-identified analysis dataset, the locked judge rubric,
  the analysis code (`eval/run.mjs --convergence` + LUAR calibration), and the results.

---

### Pre-file checklist
- [ ] Lock all **[CONFIRM]** values (final teacher count, N batches, IRB status). Tighten, never loosen.
- [ ] Freeze + version the GPT-judge rubric (`eval/convergence/judge-rubric.md`) and the judge model/prompt.
- [ ] Calibrate the in-domain LUAR floor/ceiling on reference-corpus pairs; record thresholds.
- [ ] Create the OSF project, paste sections 1–7, **file by Jul 7**, keep the registration DOI/link for the
      XPRIZE submission.

> Founder-gated: creating the OSF account + filing, the IRB/exempt determination, final cohort numbers.
> Agent-done: this complete pre-reg text, the judge rubric artifact, the analysis-code alignment.
