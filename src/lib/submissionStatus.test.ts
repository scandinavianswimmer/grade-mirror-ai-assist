import { describe, it, expect } from 'vitest';

import {
  isAutoFinalized,
  statusMetaWithProvenance,
  statusMeta,
  effectiveStatus,
} from './submissionStatus';

describe('isAutoFinalized', () => {
  it('is true only for ai provenance', () => {
    expect(isAutoFinalized('ai')).toBe(true);
    expect(isAutoFinalized('teacher')).toBe(false);
    expect(isAutoFinalized(null)).toBe(false);
    expect(isAutoFinalized(undefined)).toBe(false);
  });
});

describe('statusMetaWithProvenance', () => {
  it('labels an AI-finalized grade as Auto-finalized', () => {
    const meta = statusMetaWithProvenance('finalized', 'ai');
    expect(meta.label).toBe('Auto-finalized');
    expect(meta.description).toMatch(/aiTA/);
  });

  it('labels an exported AI grade as Auto-finalized too', () => {
    expect(statusMetaWithProvenance('exported', 'ai').label).toBe('Auto-finalized');
  });

  it('falls back to the plain finalized label for teacher approval', () => {
    expect(statusMetaWithProvenance('finalized', 'teacher').label).toBe(statusMeta('finalized').label);
  });

  it('falls back to plain meta when provenance is missing (pre-migration)', () => {
    expect(statusMetaWithProvenance('finalized', undefined).label).toBe('Finalized');
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
