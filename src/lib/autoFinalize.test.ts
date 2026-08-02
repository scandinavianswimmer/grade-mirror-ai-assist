// Covers the canonical auto-finalize decision in supabase/functions/_shared/grading/auto-finalize.ts.
// That module is pure TypeScript (no Deno/Supabase imports), so it is safe to import here. The test
// lives under src/ because vitest.config.ts only collects `src/**` test files (same pattern as
// planLimitsShared.test.ts).
import { describe, it, expect } from 'vitest';

import {
  decideFinalization,
  normalizeThreshold,
  AUTO_FINALIZE_DEFAULT_THRESHOLD,
  AUTO_FINALIZE_DEFAULT_ENABLED,
  AUTO_FINALIZE_MIN_THRESHOLD,
  BLOCKING_FLAGS,
  type FinalizationInput,
} from '../../supabase/functions/_shared/grading/auto-finalize';

const base: FinalizationInput = {
  disposition: 'graded',
  confidence: 0.95,
  flags: [],
  enabled: true,
  threshold: AUTO_FINALIZE_DEFAULT_THRESHOLD,
};

describe('safety defaults — automatic approval is OFF until a teacher opts in (GOAL #1 HITL)', () => {
  it('defaults auto-finalize OFF (opt-in, never silently on)', () => {
    expect(AUTO_FINALIZE_DEFAULT_ENABLED).toBe(false);
  });

  it('does NOT auto-finalize a perfect grade when the product default (disabled) applies', () => {
    // Mirrors the edge function falling back to AUTO_FINALIZE_DEFAULT_ENABLED when the teacher has
    // not opted in. Even a 0.99-confidence, flag-free grade stays an "AI draft ready" for the teacher.
    const d = decideFinalization({ ...base, enabled: AUTO_FINALIZE_DEFAULT_ENABLED, confidence: 0.99 });
    expect(d.autoFinalize).toBe(false);
    expect(d.reason).toBe('disabled');
  });

  it('reaches the automatic-approval path ONLY when a teacher has explicitly enabled it', () => {
    expect(decideFinalization({ ...base, enabled: false }).autoFinalize).toBe(false);
    expect(decideFinalization({ ...base, enabled: true }).autoFinalize).toBe(true);
  });

  it('never auto-finalizes a flagged or low-confidence grade even with auto-finalize opted in', () => {
    // Integrity-flagged cases always defer to the human, regardless of the opt-in.
    for (const flag of BLOCKING_FLAGS) {
      const d = decideFinalization({ ...base, enabled: true, confidence: 0.99, flags: [flag] });
      expect(d.autoFinalize).toBe(false);
      expect(d.reason).toBe('blocking_flag');
    }
    // Low confidence below the (clamped) threshold also defers, even at the hard floor.
    const lowConf = decideFinalization({ ...base, enabled: true, threshold: 0.2, confidence: 0.55 });
    expect(lowConf.appliedThreshold).toBe(AUTO_FINALIZE_MIN_THRESHOLD);
    expect(lowConf.autoFinalize).toBe(false);
    expect(lowConf.reason).toBe('below_threshold');
    // The needs_review disposition (off-topic / very-low-confidence) defers too.
    const exception = decideFinalization({ ...base, enabled: true, disposition: 'needs_review' });
    expect(exception.autoFinalize).toBe(false);
    expect(exception.reason).toBe('needs_review_disposition');
  });
});

describe('decideFinalization — the On-the-Loop automatic-approval gate', () => {
  it('auto-finalizes a high-confidence, on-topic, flag-free grade', () => {
    const d = decideFinalization(base);
    expect(d.autoFinalize).toBe(true);
    expect(d.reason).toBe('auto_finalized');
    expect(d.appliedThreshold).toBe(0.85);
  });

  it('does NOT auto-finalize when the teacher disabled it', () => {
    const d = decideFinalization({ ...base, enabled: false });
    expect(d.autoFinalize).toBe(false);
    expect(d.reason).toBe('disabled');
  });

  it('routes needs_review dispositions (off-topic / very-low-confidence) to the teacher', () => {
    const d = decideFinalization({ ...base, disposition: 'needs_review' });
    expect(d.autoFinalize).toBe(false);
    expect(d.reason).toBe('needs_review_disposition');
  });

  it('holds a grade below the confidence threshold for review', () => {
    const d = decideFinalization({ ...base, confidence: 0.7 });
    expect(d.autoFinalize).toBe(false);
    expect(d.reason).toBe('below_threshold');
  });

  it('finalizes exactly at the threshold (>= is inclusive)', () => {
    const d = decideFinalization({ ...base, confidence: 0.85, threshold: 0.85 });
    expect(d.autoFinalize).toBe(true);
  });

  it.each(['possible_injection', 'likely_ai_generated', 'off_topic', 'grade_withheld', 'relevance_check_unavailable', 'low_confidence'])(
    'never auto-finalizes a high-confidence grade carrying the blocking flag %s',
    (flag) => {
      const d = decideFinalization({ ...base, flags: [flag] });
      expect(d.autoFinalize).toBe(false);
      expect(d.reason).toBe('blocking_flag');
      expect(d.blockingFlag).toBe(flag);
    },
  );

  it('ignores non-blocking advisory flags', () => {
    const d = decideFinalization({ ...base, flags: ['verbose', 'minor_grammar'] });
    expect(d.autoFinalize).toBe(true);
  });

  it('prioritizes "disabled" over every other reason', () => {
    const d = decideFinalization({
      ...base,
      enabled: false,
      disposition: 'needs_review',
      confidence: 0.1,
      flags: ['off_topic'],
    });
    expect(d.reason).toBe('disabled');
  });

  it('reports a blocking flag ahead of a below-threshold confidence', () => {
    const d = decideFinalization({ ...base, confidence: 0.5, flags: ['possible_injection'] });
    expect(d.reason).toBe('blocking_flag');
  });
});

describe('normalizeThreshold — clamps teacher config into the safe band', () => {
  it('passes through an in-range threshold', () => {
    expect(normalizeThreshold(0.9)).toBe(0.9);
  });

  it('raises a too-low threshold to the hard floor (never auto-approve a coin flip)', () => {
    expect(normalizeThreshold(0.2)).toBe(AUTO_FINALIZE_MIN_THRESHOLD);
  });

  it('caps a threshold above 1', () => {
    expect(normalizeThreshold(1.5)).toBe(1);
  });

  it('falls back to the default on NaN / null / undefined', () => {
    expect(normalizeThreshold(NaN)).toBe(AUTO_FINALIZE_DEFAULT_THRESHOLD);
    expect(normalizeThreshold(null)).toBe(AUTO_FINALIZE_DEFAULT_THRESHOLD);
    expect(normalizeThreshold(undefined)).toBe(AUTO_FINALIZE_DEFAULT_THRESHOLD);
  });

  it('applies the clamped threshold inside decideFinalization', () => {
    // A teacher who set 0.2 still cannot auto-approve a 0.5-confidence grade — floor is 0.6.
    const d = decideFinalization({ ...base, threshold: 0.2, confidence: 0.5 });
    expect(d.appliedThreshold).toBe(AUTO_FINALIZE_MIN_THRESHOLD);
    expect(d.autoFinalize).toBe(false);
    expect(d.reason).toBe('below_threshold');
  });
});
