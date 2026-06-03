// Phase 15 (Voice-Convergence Proof) — pure metric functions for the convergence curve.
//
// No I/O. Given per-batch edit signals (accept/edit/dismiss counts, edit-distances, self-ratings),
// computes the per-batch edit-rate + mean edit-distance + mean self-rating, and the batch-1→batch-N
// decline that decides whether aiTA's voice learning is converging. Shared by the eval harness
// (eval/run.mjs --convergence) and the in-app trend so the math is defined exactly once.

// The falsifiable bar (CONTEXT.md): ≥40% edit-rate decline = converging; <15% = flat (kill criterion).
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
  converged: boolean;               // delta >= CONVERGENCE_DECLINE_PCT
  flat: boolean;                    // delta < FLAT_DECLINE_PCT (kill criterion); null delta is NOT flat
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
