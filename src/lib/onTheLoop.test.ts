import { describe, it, expect } from 'vitest';
import {
  computeOnTheLoopSummary,
  dispositionFor,
  isAutoFinalized,
  AUTO_FINALIZE_CONFIDENCE,
} from './onTheLoop';

describe('dispositionFor', () => {
  it('routes off-ramp statuses to needs_review regardless of confidence', () => {
    expect(dispositionFor({ id: '1', status: 'needs_review' }, 0.99)).toBe('needs_review');
    expect(dispositionFor({ id: '2', status: 'grade_error' }, 0.99)).toBe('needs_review');
  });

  it('auto-finalizes high-confidence clean grades', () => {
    expect(dispositionFor({ id: '1', status: 'graded' }, 0.9)).toBe('auto_finalized');
    expect(dispositionFor({ id: '2', status: 'finalized' }, AUTO_FINALIZE_CONFIDENCE)).toBe('auto_finalized');
  });

  it('routes low-confidence grades to needs_review', () => {
    expect(dispositionFor({ id: '1', status: 'graded' }, 0.5)).toBe('needs_review');
  });

  it('honors explicit auto-finalize provenance even below the threshold', () => {
    expect(dispositionFor({ id: '1', status: 'graded', finalized_by: 'aiTA' }, 0.1)).toBe('auto_finalized');
    expect(dispositionFor({ id: '2', status: 'graded', auto_finalized_at: '2026-01-01' }, 0.1)).toBe('auto_finalized');
  });

  it('returns pending when no confidence is recorded and no provenance', () => {
    expect(dispositionFor({ id: '1', status: 'graded' }, null)).toBe('pending');
  });
});

describe('computeOnTheLoopSummary', () => {
  it('partitions graded submissions into auto-finalized / needs-review / pending', () => {
    const submissions = [
      { id: 'a', status: 'graded' }, // high conf → auto
      { id: 'b', status: 'graded' }, // low conf → review
      { id: 'c', status: 'needs_review' }, // off-ramp → review
      { id: 'd', status: 'graded' }, // no conf → pending
      { id: 'e', status: 'uploaded' }, // ungraded, not exception → ignored
    ];
    const grades = [
      { submission_id: 'a', confidence: 0.92 },
      { submission_id: 'b', confidence: 0.4 },
      { submission_id: 'c', confidence: 0.95 },
      { submission_id: 'd', confidence: null },
    ];

    const s = computeOnTheLoopSummary(submissions, grades);
    expect(s.graded).toBe(4);
    expect(s.autoFinalized).toBe(1);
    expect(s.needsReview).toBe(2);
    expect(s.pending).toBe(1);
    expect(s.autoFinalizedPct).toBeCloseTo(25, 5);
  });

  it('counts ungraded exception off-ramps as needs-review without inflating graded', () => {
    const summary = computeOnTheLoopSummary(
      [{ id: 'x', status: 'grade_error' }],
      [],
    );
    expect(summary.graded).toBe(0);
    expect(summary.needsReview).toBe(1);
    expect(summary.autoFinalizedPct).toBeNull();
  });

  it('uses the best (highest) confidence across re-grades', () => {
    const summary = computeOnTheLoopSummary(
      [{ id: 'a', status: 'graded' }],
      [
        { submission_id: 'a', confidence: 0.3 },
        { submission_id: 'a', confidence: 0.9 },
      ],
    );
    expect(summary.autoFinalized).toBe(1);
    expect(summary.graded).toBe(1);
  });

  it('returns null pct and zero counts for an empty workspace', () => {
    const s = computeOnTheLoopSummary([], []);
    expect(s).toEqual({ graded: 0, autoFinalized: 0, needsReview: 0, pending: 0, autoFinalizedPct: null });
  });
});

describe('isAutoFinalized', () => {
  it('is true for high-confidence clean grades and false for low-confidence', () => {
    expect(isAutoFinalized('graded', 0.9)).toBe(true);
    expect(isAutoFinalized('graded', 0.4)).toBe(false);
    expect(isAutoFinalized('needs_review', 0.99)).toBe(false);
  });

  it('honors explicit provenance', () => {
    expect(isAutoFinalized('graded', 0.1, 'aiTA')).toBe(true);
    expect(isAutoFinalized('graded', null, null, '2026-01-01')).toBe(true);
  });
});
