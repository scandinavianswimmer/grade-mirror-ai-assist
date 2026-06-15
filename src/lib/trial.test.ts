import { describe, it, expect } from 'vitest';

import { isTrialActive, trialDaysLeft, trialBadgeLabel, TRIAL_LENGTH_DAYS } from './trial';

const NOW = new Date('2026-06-15T12:00:00Z');
const inDays = (d: number) => new Date(NOW.getTime() + d * 24 * 60 * 60 * 1000).toISOString();

describe('isTrialActive', () => {
  it('is true while the window is open', () => {
    expect(isTrialActive(inDays(5), NOW)).toBe(true);
  });

  it('is false once expired', () => {
    expect(isTrialActive(inDays(-1), NOW)).toBe(false);
  });

  it('is false at the exact end instant (boundary is exclusive)', () => {
    expect(isTrialActive(NOW.toISOString(), NOW)).toBe(false);
  });

  it('is false for null / missing / garbage', () => {
    expect(isTrialActive(null, NOW)).toBe(false);
    expect(isTrialActive(undefined, NOW)).toBe(false);
    expect(isTrialActive('not-a-date', NOW)).toBe(false);
  });

  it('accepts a Date as well as a string', () => {
    expect(isTrialActive(new Date(inDays(2)), NOW)).toBe(true);
  });
});

describe('trialDaysLeft', () => {
  it('rounds up partial days so live access never shows 0', () => {
    const fourHoursLeft = new Date(NOW.getTime() + 4 * 60 * 60 * 1000).toISOString();
    expect(trialDaysLeft(fourHoursLeft, NOW)).toBe(1);
  });

  it('reports the full window on day zero', () => {
    expect(trialDaysLeft(inDays(TRIAL_LENGTH_DAYS), NOW)).toBe(TRIAL_LENGTH_DAYS);
  });

  it('is 0 for an expired or missing trial', () => {
    expect(trialDaysLeft(inDays(-2), NOW)).toBe(0);
    expect(trialDaysLeft(null, NOW)).toBe(0);
  });
});

describe('trialBadgeLabel', () => {
  it('uses singular for the last day', () => {
    const tenHoursLeft = new Date(NOW.getTime() + 10 * 60 * 60 * 1000).toISOString();
    expect(trialBadgeLabel(tenHoursLeft, NOW)).toBe('1 day left in trial');
  });

  it('uses plural otherwise', () => {
    expect(trialBadgeLabel(inDays(7), NOW)).toBe('7 days left in trial');
  });

  it('is empty when not on an active trial', () => {
    expect(trialBadgeLabel(inDays(-1), NOW)).toBe('');
    expect(trialBadgeLabel(null, NOW)).toBe('');
  });
});
