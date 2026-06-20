# Phase 15 — Voice-Convergence Verdict

**STATUS: ⏳ PENDING — awaiting the pre-registered pilot run (≥4–6 real teachers, ≥4 batches each).**

This file is **pre-registered**: the decision rule below was committed *before* any data was collected,
so the verdict cannot be retrofitted to flatter the product. The rule is the GPT-judge voice-fidelity
proof defined in [`docs/recruiting/osf-prereg.md`](../../docs/recruiting/osf-prereg.md) and the LOCKED
rubric [`eval/convergence/judge-rubric.md`](../../eval/convergence/judge-rubric.md). When the
[`PROTOCOL.md`](./PROTOCOL.md) run completes, fill in §2 (Data) and §3 (Verdict) from the captured
numbers — **do not edit §1 (the rule).** Per the founder's explicit instruction: **no ego-boosting. A
disproof is a valid, honestly-reported outcome.** A hedged "looks promising" is a verification FAIL
(`15-PLAN.md` §Verification, Honesty gate).

> **Single primary, pre-registered once.** There is exactly ONE pre-registered primary metric: the
> blinded GPT-judge voice-fidelity score, corroborated by aggregated LUAR-MUD cosine, decided within a
> within-teacher holdout. Edit-rate decline is a **DEPRECATED CORROBORATOR**, reported for context only —
> it is uninterpretable as proof because Borchers et al. (AIED 2026, n=117) found **51.3% of teachers
> never edit AI feedback**. Do NOT promote edit-rate to a verdict here or anywhere.

---

## 1. Decision rule (LOCKED — pre-registered, do not edit)

Pre-registered design: a **holdout-controlled pilot**, within-teacher (single-case-experimental-design)
— each teacher is their own control via the no-profile holdout arm, batch index is the time series.
**This is a PILOT (n = 4–6 teachers by design); it makes no population-level or student-outcome claims.**
Power comes from repeated within-teacher matched pairs, not between-teacher N. Limits stated honestly in §3.

**PRIMARY instrument:** blinded GPT-judge voice-fidelity (0–100) on the LOCKED 5-dimension rubric
(`eval/convergence/judge-rubric.md` v1.0), each sample scored 3× and averaged, judge model/prompt frozen
at filing. Measured exactly as `eval/run.mjs --judge` computes it (the one shared definition).

**PROVEN** — declare the wedge real **iff ALL hold** (confirmatory test, α = 0.05, two-sided):
1. **H1 (convergence):** the *with-profile* arm shows a **statistically significant positive batch slope**
   in primary GPT-judge fidelity (linear mixed model `fidelity ~ batch * condition + (batch | teacher)`).
2. **H2 (specificity):** *with-profile* fidelity **exceeds the matched no-profile holdout** on the same
   essays (positive `condition` and/or `batch:condition` interaction, late batches) — the gain is
   attributable to the learned profile, not generic drift.
3. **Corroboration:** a **positive aggregated LUAR-MUD cosine trend** (8-sample windows, in-domain
   calibrated floor/ceiling) in the same direction. (LZ77 compression edit-distance is a further
   Borchers-robust corroborator; edit-rate decline is a DEPRECATED corroborator, context only.)

**DISPROVEN (KILL)** — declare the wedge unproven for aiTA's current approach **if EITHER holds:**
- the with-profile arm shows **no statistically significant positive batch slope** in primary GPT-judge
  fidelity (H1 fails at α = 0.05), **OR**
- with-profile does **not** exceed the holdout (H2 fails) **AND** the aggregated LUAR trend is flat
  (**< 10% relative gain** Batch 1 → Batch 4).
- → If disproven, Criterion C **pivots honestly to a measured time-savings claim** (grading throughput,
  unattended auto-finalize rate), reported without spin; the documented next step is real **KTO/DPO**
  training. We pre-commit to publishing the result either way.

**INCONCLUSIVE** — between the bars (e.g. H1 directional but not significant at pilot n, or mixed
LUAR/judge signals): report honestly, do **not** round up to PROVEN. Recommend extending the cohort /
batch count or calling it, with reasoning.

> Scope honesty (LOCKED): the proof stands on aiTA's **own measured GPT-judge + LUAR curve** — do **not**
> cite FSPO's 87% or any borrowed benchmark as evidence. The technique under test is **binary-signal
> few-shot retrieval**, not model training; HITL authorship was preserved throughout. This is a pilot:
> small N is a stated limitation, not hidden.

---

## 2. Data (fill from the pilot run)

_Source: `artifacts/judge-scores-<date>.csv` (per-sample GPT-judge fidelity, blinded) +
`artifacts/eval-judge-<date>.txt` (`eval/run.mjs --judge` stdout) + the LUAR calibration + mixed-model
output. Edit-rate corroborator: `artifacts/convergence-raw-<date>.csv` + `eval/run.mjs --convergence`._

### Primary — GPT-judge voice-fidelity (0–100, with-profile vs holdout, per batch)

| Batch | n (samples) | With-profile fidelity (mean ± SD) | Holdout fidelity (mean ± SD) | With − holdout gap |
|------:|------------:|----------------------------------:|-----------------------------:|-------------------:|
| 1     | _tbd_       | _tbd_                             | _tbd_                        | _tbd_              |
| 2     | _tbd_       | _tbd_                             | _tbd_                        | _tbd_              |
| 3     | _tbd_       | _tbd_                             | _tbd_                        | _tbd_              |
| 4     | _tbd_       | _tbd_                             | _tbd_                        | _tbd_              |

- **H1 — with-profile batch slope (mixed model):** _tbd_ (β, 95% CI, p; bar: p < 0.05, positive)
- **H2 — with − holdout gap (late batches):** _tbd_ (positive required)
- **Per-teacher trajectories:** _tbd_ (batch-1→N delta + mean with−holdout gap, bootstrap CIs, per teacher)

### Corroborators

- **Aggregated LUAR-MUD cosine trend (Fisher-z):** _tbd_ (bar: positive; KILL if flat & H2 fails — < 10% rel. gain)
- **LZ77 compression edit-distance trend:** _tbd_ (Spearman)
- **DEPRECATED — edit-rate decline (context only, NOT a verdict input):** _tbd_ %
- **CONTEXT — best late-batch self-rating (1–5):** _tbd_ / 5
- **Teacher testimonial (verbatim, attributed, batch #):** _"tbd"_

---

## 3. Verdict (fill after §2)

**Outcome:** ⏳ _PROVEN / DISPROVEN (KILL) / INCONCLUSIVE — tbd_

**Reasoning (against §1, citing the actual numbers — judge slope, holdout gap, LUAR trend):** _tbd_

**Pilot limitations (state honestly):** n = _tbd_ teachers (4–6 by design); within-teacher power only;
no population or student-outcome claim; _tbd_ batches/teacher; judge-model + LUAR-calibration caveats.

**Recommendation / next step:** _tbd_ (if DISPROVEN: time-savings pivot vs KTO/DPO escalation, with the why.)

---

## Why this isn't filled in yet

The verdict is, by design, written **from the data** — and the data requires the founder-gated pilot run:
real teachers grading ≥4 batches each through the deployed loop (prereqs P1–P5 in `PROTOCOL.md`), each
teacher's reference voice corpus collected pre-enrollment, plus a live `GEMINI_API_KEY` for the
`--judge` scoring and the LUAR calibration. None of those are agent-doable. Writing a
PROVEN/DISPROVEN here before that run would be fabrication and would fail the phase's own honesty gate.
The decision rule is locked and ready; the verdict is one fill-in away once the run produces real numbers.
