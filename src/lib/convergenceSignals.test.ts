import { describe, it, expect } from 'vitest';
import { buildBatchSignals, type BatchRow, type SubmissionRow, type AnnotationRow } from './convergenceSignals';

describe('buildBatchSignals — folds raw rows into per-batch convergence signals', () => {
  const batches: BatchRow[] = [
    { id: 'b1', seq: 1, label: 'Batch 1' },
    { id: 'b2', seq: 2, label: null },
  ];

  it('tallies accept/edit/dismiss + edit-distances + self-ratings per batch', () => {
    const submissions: SubmissionRow[] = [
      { id: 's1', batch_id: 'b1', edit_self_rating: 2, status: 'finalized' },
      { id: 's2', batch_id: 'b2', edit_self_rating: 5, status: 'finalized' },
    ];
    const annotations: AnnotationRow[] = [
      { submission_id: 's1', status: 'accepted', edit_distance: null },
      { submission_id: 's1', status: 'edited', edit_distance: 0.5 },
      { submission_id: 's1', status: 'rejected', edit_distance: null },
      { submission_id: 's2', status: 'accepted', edit_distance: null },
      { submission_id: 's2', status: 'accepted', edit_distance: null },
      { submission_id: 's2', status: 'edited', edit_distance: 0.1 },
    ];

    const signals = buildBatchSignals(batches, submissions, annotations);
    expect(signals).toHaveLength(2);

    const [b1, b2] = signals;
    expect(b1.batchSeq).toBe(1);
    expect(b1).toMatchObject({ acceptCount: 1, editCount: 1, dismissCount: 1, editDistances: [0.5], selfRatings: [2] });
    // batch 2 has no label → derived "Batch 2"; edit-rate later computed as (1+0)/3.
    expect(b2.label).toBe('Batch 2');
    expect(b2).toMatchObject({ acceptCount: 2, editCount: 1, dismissCount: 0, editDistances: [0.1], selfRatings: [5] });
  });

  it('ignores non-finalized submissions and submissions without a batch', () => {
    const submissions: SubmissionRow[] = [
      { id: 's1', batch_id: 'b1', edit_self_rating: 3, status: 'graded' }, // not finalized → skip
      { id: 's2', batch_id: null, edit_self_rating: 4, status: 'finalized' }, // no batch → skip
    ];
    const annotations: AnnotationRow[] = [
      { submission_id: 's1', status: 'edited', edit_distance: 0.4 },
      { submission_id: 's2', status: 'edited', edit_distance: 0.4 },
    ];
    expect(buildBatchSignals(batches, submissions, annotations)).toEqual([]);
  });

  it('drops batches with zero review signal (they are not measurement points)', () => {
    const submissions: SubmissionRow[] = [
      { id: 's1', batch_id: 'b1', edit_self_rating: 2, status: 'finalized' },
      { id: 's2', batch_id: 'b2', edit_self_rating: 5, status: 'finalized' }, // finalized but no annotations
    ];
    const annotations: AnnotationRow[] = [
      { submission_id: 's1', status: 'accepted', edit_distance: null },
    ];
    const signals = buildBatchSignals(batches, submissions, annotations);
    expect(signals).toHaveLength(1);
    expect(signals[0].batchSeq).toBe(1);
  });

  it('returns sorted-by-seq output even when batches arrive out of order', () => {
    const unordered: BatchRow[] = [
      { id: 'b2', seq: 2, label: 'B2' },
      { id: 'b1', seq: 1, label: 'B1' },
    ];
    const submissions: SubmissionRow[] = [
      { id: 's1', batch_id: 'b1', edit_self_rating: null, status: 'finalized' },
      { id: 's2', batch_id: 'b2', edit_self_rating: null, status: 'finalized' },
    ];
    const annotations: AnnotationRow[] = [
      { submission_id: 's1', status: 'accepted', edit_distance: null },
      { submission_id: 's2', status: 'edited', edit_distance: 0.3 },
    ];
    const signals = buildBatchSignals(unordered, submissions, annotations);
    expect(signals.map((s) => s.batchSeq)).toEqual([1, 2]);
  });

  it('returns empty for no batches (zero-data case — caller renders an empty state)', () => {
    expect(buildBatchSignals([], [], [])).toEqual([]);
  });
});
