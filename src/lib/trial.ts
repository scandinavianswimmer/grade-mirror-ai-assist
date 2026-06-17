// Trial-window helpers — the client-side view of the 14-day full-access trial (BILL-03).
//
// Pure + dependency-free so the date math is unit-tested and reused everywhere (usePlan, the trial
// banner, the paywall copy). The server (consume_grading_quota, migration 0021) is the authoritative
// gate; this is the UX layer that mirrors it. Pass `now` explicitly in tests for determinism.

export const TRIAL_LENGTH_DAYS = 14;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parse a timestamptz-ish value into epoch ms, or null if absent/invalid. */
function toMs(ts: string | Date | null | undefined): number | null {
  if (!ts) return null;
  const ms = ts instanceof Date ? ts.getTime() : Date.parse(ts);
  return Number.isNaN(ms) ? null : ms;
}

/** True when the teacher is inside an active trial window (trial_ends_at in the future). */
export function isTrialActive(trialEndsAt: string | Date | null | undefined, now: Date = new Date()): boolean {
  const end = toMs(trialEndsAt);
  if (end === null) return false;
  return now.getTime() < end;
}

/**
 * Whole days remaining in the trial, rounded UP so a teacher with 4h left still sees "1 day left"
 * (never a misleading "0 days left" while access is live). Returns 0 once the trial has ended.
 */
export function trialDaysLeft(trialEndsAt: string | Date | null | undefined, now: Date = new Date()): number {
  const end = toMs(trialEndsAt);
  if (end === null) return 0;
  const remainingMs = end - now.getTime();
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / MS_PER_DAY);
}

/** Short human label for the trial banner. Empty string when not on an active trial. */
export function trialBadgeLabel(trialEndsAt: string | Date | null | undefined, now: Date = new Date()): string {
  if (!isTrialActive(trialEndsAt, now)) return '';
  const days = trialDaysLeft(trialEndsAt, now);
  return days === 1 ? '1 day left in trial' : `${days} days left in trial`;
}
