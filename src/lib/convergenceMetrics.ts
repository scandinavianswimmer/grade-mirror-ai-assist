// Phase 15 (Voice-Convergence Proof) — pure metric functions for the edit-rate CORROBORATOR curve.
//
// ⚠️ Edit-rate is a DEPRECATED CORROBORATOR, NOT the pre-registered primary verdict. The pre-registered
// proof is the blinded GPT-judge voice-fidelity score (+ aggregated LUAR-MUD cosine + within-teacher
// holdout) — see docs/recruiting/osf-prereg.md and eval/convergence/judge-rubric.md. Edit-rate decline
// is uninterpretable as proof on its own: Borchers et al. (AIED 2026, n=117) found 51.3% of teachers
// never edit AI feedback, so a flat edit-rate does not disprove convergence. This module is kept as the
// in-app corroborator signal (the app can't run the live GPT-judge without a Gemini key).
//
// No I/O. Given per-batch edit signals (accept/edit/dismiss counts, edit-distances, self-ratings),
// computes the per-batch edit-rate + mean edit-distance + mean self-rating, and the batch-1→batch-N
// decline. Shared by the eval harness (eval/run.mjs --convergence, the deprecated-corroborator mode)
// and the in-app trend so the math is defined exactly once.

// Corroborator thresholds (CONTEXT.md, edit-rate terms): ≥40% decline = corroborating signal;
// <15% = flat. These bound the edit-rate CORROBORATOR only — they are NOT the pre-registered verdict bar.
export const CONVERGENCE_DECLINE_PCT = 40;
export const FLAT_DECLINE_PCT = 15;

export interface BatchSignal {
  batchSeq: number;
  label?: string;
  acceptCount: number;
  editCount: number;
  dismissCount: number;
  editDistances: number[]; // normalized [0,1], one per edited annotation
  selfRatings: number[];   // 1..5, one per submission in the batch
}

export interface BatchMetric {
  batchSeq: number;
  label?: string;
  total: number;
  editRate: number;                 // (edit + dismiss) / total; 0 when total is 0
  meanEditDistance: number | null;  // null when nothing was edited
  meanSelfRating: number | null;    // null when no ratings captured
}

export interface ConvergenceSeries {
  batches: BatchMetric[];
  batchCount: number;
  editRateDeltaPct: number | null;  // (firstEditRate - lastEditRate)/firstEditRate * 100; positive = improving
  // NOTE: `converged`/`flat` describe the edit-rate CORROBORATOR only — NOT the pre-registered verdict
  // (which is the GPT-judge proof). UI must not present these as PROVEN/DISPROVEN.
  converged: boolean;               // corroborator: delta >= CONVERGENCE_DECLINE_PCT
  flat: boolean;                    // corroborator: delta < FLAT_DECLINE_PCT; null delta is NOT flat
}

const mean = (xs: number[]): number | null =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

/**
 * Normalized Levenshtein distance in [0,1]: 0 = identical, 1 = maximally different.
 * Used by Task 1B to score how much a teacher changed aiTA's feedback (ai_comment → comment).
 */
export function normalizedEditDistance(original: string, final: string): number {
  const a = original ?? '';
  const b = final ?? '';
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;

  // Two-row Levenshtein (O(min) space).
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length] / maxLen;
}

export function computeBatchMetric(signal: BatchSignal): BatchMetric {
  const total = signal.acceptCount + signal.editCount + signal.dismissCount;
  return {
    batchSeq: signal.batchSeq,
    label: signal.label,
    total,
    editRate: total === 0 ? 0 : (signal.editCount + signal.dismissCount) / total,
    meanEditDistance: mean(signal.editDistances),
    meanSelfRating: mean(signal.selfRatings),
  };
}

export function computeConvergence(signals: BatchSignal[]): ConvergenceSeries {
  const batches = [...signals]
    .sort((a, b) => a.batchSeq - b.batchSeq)
    .map(computeBatchMetric);

  let editRateDeltaPct: number | null = null;
  if (batches.length >= 2) {
    const first = batches[0].editRate;
    const last = batches[batches.length - 1].editRate;
    // Can't express a percentage decline from a zero baseline.
    if (first > 0) editRateDeltaPct = ((first - last) / first) * 100;
  }

  return {
    batches,
    batchCount: batches.length,
    editRateDeltaPct,
    converged: editRateDeltaPct !== null && editRateDeltaPct >= CONVERGENCE_DECLINE_PCT,
    flat: editRateDeltaPct !== null && editRateDeltaPct < FLAT_DECLINE_PCT,
  };
}
