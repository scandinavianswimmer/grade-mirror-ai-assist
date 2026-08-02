import { describe, it, expect } from 'vitest';

import {
  isAutoFinalized,
  statusMetaWithProvenance,
  statusMeta,
  effectiveStatus,
  isApprovedStatus,
  isExportedStatus,
} from './submissionStatus';

describe('teacher-facing status language', () => {
  it.each([
    ['uploaded', 'Ready to draft'],
    ['pending', 'Ready to draft'],
    ['grading', 'Drafting feedback…'],
    ['graded', 'Ready for review'],
    ['ai_graded', 'Ready for review'],
    ['needs_review', 'Needs a closer look'],
    ['grade_error', 'Draft did not finish'],
    ['finalized', 'Approved'],
    ['exported', 'Exported'],
  ])('translates %s to %s', (stored, visible) => {
    expect(statusMeta(stored).label).toBe(visible);
  });

  it('keeps approved and exported as separate release states', () => {
    expect(isApprovedStatus('finalized')).toBe(true);
    expect(isApprovedStatus('exported')).toBe(true);
    expect(isApprovedStatus('graded')).toBe(false);
    expect(isExportedStatus('finalized')).toBe(false);
    expect(isExportedStatus('exported')).toBe(true);
  });
});

describe('isAutoFinalized', () => {
  it('is true only for ai provenance', () => {
    expect(isAutoFinalized('ai')).toBe(true);
    expect(isAutoFinalized('teacher')).toBe(false);
    expect(isAutoFinalized(null)).toBe(false);
    expect(isAutoFinalized(undefined)).toBe(false);
  });
});

describe('statusMetaWithProvenance', () => {
  it('attributes eligible automatic approval to the teacher setting', () => {
    const meta = statusMetaWithProvenance('finalized', 'ai');
    expect(meta.label).toBe('Approved automatically');
    expect(meta.description).toMatch(/You turned this on/);
  });

  it('does not hide the exported state when approval was automatic', () => {
    const meta = statusMetaWithProvenance('exported', 'ai');
    expect(meta.label).toBe('Exported');
    expect(meta.description).toMatch(/approved automatically/i);
    expect(meta.description).toMatch(/You turned this on/);
  });

  it('falls back to the plain finalized label for teacher approval', () => {
    expect(statusMetaWithProvenance('finalized', 'teacher').label).toBe(statusMeta('finalized').label);
  });

  it('falls back to plain meta when provenance is missing (pre-migration)', () => {
    expect(statusMetaWithProvenance('finalized', undefined).label).toBe('Approved');
  });

  it('does not relabel non-finalized statuses even with ai provenance', () => {
    // Defensive: a 'graded' row should never carry finalized_by='ai', but if it did, the badge
    // should reflect the actual status, not claim it was finalized.
    expect(statusMetaWithProvenance('graded', 'ai').label).toBe(statusMeta('graded').label);
  });

  it('composes with effectiveStatus for a stale pre-grade status that has a grade row', () => {
    const eff = effectiveStatus('grade_error', true); // reconciles to 'graded'
    expect(statusMetaWithProvenance(eff, null).label).toBe(statusMeta('graded').label);
  });
});
