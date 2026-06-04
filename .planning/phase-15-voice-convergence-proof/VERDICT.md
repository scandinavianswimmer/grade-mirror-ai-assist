# Phase 15 — Voice-Convergence Verdict

**STATUS: ⏳ PENDING — awaiting the Wave 4A run (real teacher, ≥4 batches).**

This file is **pre-registered**: the decision rule below was committed *before* any data was collected,
so the verdict cannot be retrofitted to flatter the product. When the [`PROTOCOL.md`](./PROTOCOL.md) run
completes, fill in §2 (Data) and §3 (Verdict) from the captured numbers — **do not edit §1 (the rule).**
Per the founder's explicit instruction: **no ego-boosting. A disproof is a valid, honestly-reported
outcome.** A hedged "looks promising" is a verification FAIL (`15-PLAN.md` §Verification, Honesty gate).

---

## 1. Decision rule (LOCKED — pre-registered, do not edit)

Measured exactly as defined in `src/lib/convergenceMetrics.ts` / `eval/run.mjs --convergence` (one shared
definition). `edit-rate = (edited + dismissed) / total annotations`, per batch.

**PROVEN** — declare the wedge real **iff ALL THREE hold:**
1. **Edit-rate declines ≥40%** from batch 1 to batch N (N ≥ 4), same teacher, fixed rubric/assignment
   (`computeConvergence().converged === true`, i.e. `editRateDeltaPct ≥ 40`).
2. **≥1 late batch rated ≥4/5** on the "How much did you change aiTA's feedback?" self-rating.
3. **Held-out with-profile vs without-profile** shows materially lower edit-rate/edit-distance **with**
   the learned profile (clear margin given small n).

**DISPROVEN (KILL)** — declare the wedge unproven for aiTA's current approach **if EITHER holds:**
- **Edit-rate is flat (<15% decline)** across batches (`computeConvergence().flat === true`), **OR**
- **No batch earns a "barely edited" (≥4/5)** rating.
- → Recommend one of: **(a)** escalate to real **KTO/DPO** training (the documented next step), or
  **(b)** accept the market is commodity on this axis and **pivot**.

**INCONCLUSIVE** — between the bars (15–40% decline, or mixed signals): report honestly, do **not** round
up to PROVEN. Recommend extending to more batches or calling it, with reasoning.

> Scope honesty (LOCKED): the proof stands on aiTA's **own measured curve** — do **not** cite FSPO's 87%
> or any borrowed benchmark as evidence. The technique under test is **binary-signal few-shot retrieval**,
> not model training; HITL authorship was preserved throughout.

---

## 2. Data (fill from the Wave 4A run)

_Source: `artifacts/convergence-raw-<date>.csv` + `artifacts/eval-convergence-<date>.txt` + panel screenshots._

| Batch | n (annotations) | Edit-rate | Mean edit-distance | Mean self-rating |
|------:|----------------:|----------:|-------------------:|-----------------:|
| 1     | _tbd_           | _tbd_     | _tbd_              | _tbd_            |
| 2     | _tbd_           | _tbd_     | _tbd_              | _tbd_            |
| 3     | _tbd_           | _tbd_     | _tbd_              | _tbd_            |
| 4     | _tbd_           | _tbd_     | _tbd_              | _tbd_            |

- **Batch-1→N edit-rate decline:** _tbd_ % (bar: ≥40% PROVEN · <15% KILL)
- **Best late-batch self-rating:** _tbd_ / 5 (bar: ≥4/5)
- **Held-out edit-rate — with profile vs without:** _tbd_ % vs _tbd_ %
- **Teacher testimonial (verbatim, attributed, batch #):** _"tbd"_

---

## 3. Verdict (fill after §2)

**Outcome:** ⏳ _PROVEN / DISPROVEN (KILL) / INCONCLUSIVE — tbd_

**Reasoning (against §1, citing the actual numbers):** _tbd_

**Recommendation / next step:** _tbd_ (if DISPROVEN: name KTO/DPO escalation vs pivot, with the why.)

---

## Why this isn't filled in yet

Wave 4B's verdict is, by design, written **from the data** — and the data requires the founder-gated
Wave 4A run: a real teacher grading ≥4 batches through the deployed loop (prereqs P1–P5 in
`PROTOCOL.md`), plus a live `GEMINI_API_KEY` for the `--convergence` replay. None of those are
agent-doable. Writing a PROVEN/DISPROVEN here before that run would be fabrication and would fail the
phase's own honesty gate. The decision rule is locked and ready; the verdict is one fill-in away once the
run produces real numbers.
