import { describe, it, expect } from 'vitest';
import {
  normalizedEditDistance,
  computeBatchMetric,
  computeConvergence,
  CONVERGENCE_DECLINE_PCT,
  FLAT_DECLINE_PCT,
  type BatchSignal,
} from './convergenceMetrics';

describe('normalizedEditDistance — Phase 15 edit-distance (1B reuses this)', () => {
  it('is 0 for identical text and ~1 for a full rewrite', () => {
    expect(normalizedEditDistance('Great thesis, tighten the evidence.', 'Great thesis, tighten the evidence.')).toBe(0);
    expect(normalizedEditDistance('abc', 'XYZWVUT')).toBeCloseTo(1, 1);
  });
  it('is between 0 and 1 for a partial edit, larger for bigger edits', () => {
    const small = normalizedEditDistance('Nice work overall.', 'Nice work overall!');
    const big = normalizedEditDistance('Nice work overall.', 'Reconsider the whole framing here.');
    expect(small).toBeGreaterThan(0);
    expect(small).toBeLessThan(big);
    expect(big).toBeLessThanOrEqual(1);
  });
  it('handles empty strings without dividing by zero', () => {
    expect(normalizedEditDistance('', '')).toBe(0);
    expect(normalizedEditDistance('', 'added')).toBe(1);
  });
});

describe('computeBatchMetric', () => {
  it('edit-rate = (edits + dismisses) / total', () => {
    const m = computeBatchMetric({ batchSeq: 1, acceptCount: 6, editCount: 3, dismissCount: 1, editDistances: [0.2, 0.4, 0.3], selfRatings: [3] });
    expect(m.total).toBe(10);
    expect(m.editRate).toBeCloseTo(0.4); // (3+1)/10
    expect(m.meanEditDistance).toBeCloseTo(0.3);
    expect(m.meanSelfRating).toBe(3);
  });
  it('is safe on an empty batch (no divide-by-zero, null means)', () => {
    const m = computeBatchMetric({ batchSeq: 1, acceptCount: 0, editCount: 0, dismissCount: 0, editDistances: [], selfRatings: [] });
    expect(m.editRate).toBe(0);
    expect(m.meanEditDistance).toBeNull();
    expect(m.meanSelfRating).toBeNull();
  });
});

describe('computeConvergence — the falsifiable curve', () => {
  const declining: BatchSignal[] = [
    { batchSeq: 1, acceptCount: 3, editCount: 6, dismissCount: 1, editDistances: [0.5], selfRatings: [2] },
    { batchSeq: 2, acceptCount: 5, editCount: 4, dismissCount: 1, editDistances: [0.4], selfRatings: [3] },
    { batchSeq: 3, acceptCount: 7, editCount: 3, dismissCount: 0, editDistances: [0.25], selfRatings: [4] },
    { batchSeq: 4, acceptCount: 9, editCount: 1, dismissCount: 0, editDistances: [0.1], selfRatings: [5] },
  ];

  it('reports a positive decline and converged=true when edit-rate drops past the bar', () => {
    const s = computeConvergence(declining);
    // batch1 editRate = 7/10 = 0.70; batch4 = 1/10 = 0.10; decline = (0.70-0.10)/0.70 ≈ 85.7%
    expect(s.batches).toHaveLength(4);
    expect(s.editRateDeltaPct).not.toBeNull();
    expect(s.editRateDeltaPct!).toBeGreaterThanOrEqual(CONVERGENCE_DECLINE_PCT);
    expect(s.converged).toBe(true);
    expect(s.flat).toBe(false);
  });

  it('flags flat=true (kill criterion) when edit-rate does not move', () => {
    const flat: BatchSignal[] = [
      { batchSeq: 1, acceptCount: 5, editCount: 5, dismissCount: 0, editDistances: [0.5], selfRatings: [2] },
      { batchSeq: 2, acceptCount: 5, editCount: 5, dismissCount: 0, editDistances: [0.5], selfRatings: [2] },
      { batchSeq: 3, acceptCount: 5, editCount: 5, dismissCount: 0, editDistances: [0.48], selfRatings: [2] },
      { batchSeq: 4, acceptCount: 5, editCount: 5, dismissCount: 0, editDistances: [0.5], selfRatings: [2] },
    ];
    const s = computeConvergence(flat);
    expect(s.editRateDeltaPct!).toBeLessThan(FLAT_DECLINE_PCT);
    expect(s.converged).toBe(false);
    expect(s.flat).toBe(true);
  });

  it('returns a null delta (not a crash) for a single batch', () => {
    const s = computeConvergence([declining[0]]);
    expect(s.batches).toHaveLength(1);
    expect(s.editRateDeltaPct).toBeNull();
    expect(s.converged).toBe(false);
  });

  it('returns an empty series for no data', () => {
    const s = computeConvergence([]);
    expect(s.batches).toEqual([]);
    expect(s.editRateDeltaPct).toBeNull();
  });
});
