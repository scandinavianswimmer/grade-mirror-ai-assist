# GPT-Judge Voice-Fidelity Rubric — v1.0 (LOCKED for the pre-registered study)

> The PRIMARY outcome instrument for the aiTA voice-convergence proof (`docs/recruiting/osf-prereg.md`).
> **Freeze this file + the judge model/version before Batch 1 grading.** Any change bumps the version and
> invalidates pre-registration for already-collected data. Consumed by `eval/run.mjs --convergence`.
>
> Version: 1.0 · Judge model: **[CONFIRM] gemini-2.5-pro** (frozen at filing) · Temperature: 0 ·
> Scoring runs per sample: 3 (averaged) · Blinding: condition/batch/teacher labels stripped; samples shuffled.

## What the judge sees
- **REFERENCE corpus:** 8–10 de-identified feedback samples written by the teacher (their true voice).
- **CANDIDATE:** one piece of aiTA-drafted feedback (condition/batch hidden).
The judge never sees whether the candidate is with-profile or holdout, nor the batch index.

## Task
Score how closely the CANDIDATE matches the *voice* of the REFERENCE author — **style, not correctness.**
Ignore whether the grade/feedback is pedagogically right; judge only whether it *sounds like the same
person wrote it.*

## Dimensions (each 0–20; total 0–100)
| # | Dimension | Anchors |
|---|---|---|
| 1 | **Lexical register & word choice** | Same vocabulary level, characteristic words/phrases, formality. 20 = indistinguishable diction; 0 = clearly a different writer. |
| 2 | **Sentence structure & rhythm** | Sentence length distribution, complexity, fragments vs. full sentences, punctuation habits. |
| 3 | **Hedging & directness** | Same balance of softeners ("you might consider") vs. directives ("fix this"); same certainty level. |
| 4 | **Praise-to-critique balance & tone** | Same warmth, encouragement ratio, how criticism is framed, use of the student's name/2nd person. |
| 5 | **Formatting & feedback habits** | Same structural habits: inline vs. summary, lists, questions-to-student, sign-offs, emphasis patterns. |

Score each dimension on its 0–20 anchor; **total = sum (0–100).**

## Output (strict JSON)
```json
{
  "dimensions": {
    "lexical_register": 0,
    "sentence_structure": 0,
    "hedging_directness": 0,
    "praise_critique_tone": 0,
    "formatting_habits": 0
  },
  "total": 0,
  "rationale": "1-2 sentences citing concrete textual evidence for the scores."
}
```

## Judge system prompt (frozen text)
> You are a blinded forensic stylometry judge. You will see a REFERENCE set of writing samples by one
> author and one CANDIDATE passage. Judge ONLY whether the CANDIDATE reads as if written by the same
> author as the REFERENCE — voice, not correctness. Do not reward or penalize the candidate for being a
> "better" or "worse" grade; ignore factual accuracy. Score the five dimensions strictly on their 0–20
> anchors, sum to a 0–100 total, and return only the specified JSON. Be calibrated: reserve 18–20 for a
> match a careful human couldn't distinguish, and 0–4 for an obviously different writer.

## Reliability & calibration
- **Judge variance:** 3 scorings/sample, averaged; report inter-run SD per sample.
- **Sanity anchors (run at calibration, not on study data):** a teacher's own held-out sample vs. their
  reference should score high (ceiling check); a *different* teacher's feedback vs. the reference should
  score low (floor check). Record both to bound the scale in-domain before any confirmatory analysis.
- **Do not** tune the rubric to study results. Calibration uses reference corpora only.

## Changelog
- v1.0 — initial locked rubric for Phase-15-v2 pre-registration (2026-06-15).
