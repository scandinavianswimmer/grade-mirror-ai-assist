import { describe, it, expect } from 'vitest';
import {
  computeOnTheLoopSummary,
  dispositionFor,
  isAutoFinalized,
} from './onTheLoop';

describe('dispositionFor', () => {
  it('routes off-ramp statuses to needs_review regardless of confidence', () => {
    expect(dispositionFor({ id: '1', status: 'needs_review' })).toBe('needs_review');
    expect(dispositionFor({ id: '2', status: 'grade_error' })).toBe('needs_review');
  });

  it('never infers unattended publication from a grade without provenance', () => {
    expect(dispositionFor({ id: '1', status: 'graded' })).toBe('needs_review');
    expect(dispositionFor({ id: '2', status: 'finalized' })).toBe('pending');
  });

  it('honors explicit auto-finalize provenance', () => {
    expect(dispositionFor({ id: '1', status: 'graded', finalized_by: 'ai' })).toBe('auto_finalized');
    expect(dispositionFor({ id: '2', status: 'graded', auto_finalized_at: '2026-01-01' })).toBe('auto_finalized');
  });

  it('rejects non-schema aliases as auto-finalize provenance', () => {
    expect(dispositionFor({ id: '1', status: 'finalized', finalized_by: 'Mr Selby' })).toBe('pending');
  });
});

describe('computeOnTheLoopSummary', () => {
  it('partitions graded submissions into auto-finalized / needs-review / pending', () => {
    const submissions = [
      { id: 'a', status: 'finalized', finalized_by: 'ai' }, // proven AI finalize
      { id: 'b', status: 'graded' }, // no AI-finalize provenance → review
      { id: 'c', status: 'needs_review' }, // off-ramp → review
      { id: 'd', status: 'finalized' }, // teacher-finalized → pending
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

  it('does not convert high-confidence re-grades into unattended publication', () => {
    const summary = computeOnTheLoopSummary(
      [{ id: 'a', status: 'graded' }],
      [
        { submission_id: 'a', confidence: 0.3 },
        { submission_id: 'a', confidence: 0.9 },
      ],
    );
    expect(summary.autoFinalized).toBe(0);
    expect(summary.needsReview).toBe(1);
    expect(summary.graded).toBe(1);
  });

  it('returns null pct and zero counts for an empty workspace', () => {
    const s = computeOnTheLoopSummary([], []);
    expect(s).toEqual({ graded: 0, autoFinalized: 0, needsReview: 0, pending: 0, autoFinalizedPct: null });
  });
});

describe('isAutoFinalized', () => {
  it('is false without explicit provenance', () => {
    expect(isAutoFinalized('graded')).toBe(false);
    expect(isAutoFinalized('finalized')).toBe(false);
    expect(isAutoFinalized('needs_review')).toBe(false);
  });

  it('honors explicit provenance', () => {
    expect(isAutoFinalized('graded', 'ai')).toBe(true);
    expect(isAutoFinalized('graded', null, '2026-01-01')).toBe(true);
  });
});
