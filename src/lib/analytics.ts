// Product analytics (METRIC-04). Thin wrapper over posthog-js that no-ops gracefully
// when VITE_POSTHOG_KEY is absent — so dev/CI/self-host builds never error and never
// send events. Import `analytics` and call `analytics.capture(...)` anywhere.
import posthog from 'posthog-js';

// The canonical set of product events Phase 11 cares about. Keeping them as a union
// gives us autocomplete + a typo-proof call site without a heavy schema lib.
export type AnalyticsEvent =
  | 'submission_uploaded'
  | 'grade_started'
  | 'grade_completed'
  | 'annotation_accepted'
  | 'annotation_edited'
  | 'annotation_dismissed'
  | 'grade_finalized'
  // Pricing → checkout conversion funnel (METRIC-04 / Launch Plan §3 B3).
  // The "user evidence" backbone: every step is a discrete event so the funnel is measurable.
  | 'pricing_page_viewed'
  | 'paywall_viewed'
  | 'upgrade_clicked'
  | 'checkout_started'
  // 14-day full-access trial → conversion (BILL-03) and the grade-12 PQL signal.
  | 'trial_banner_viewed'
  | 'trial_banner_upgrade_clicked'
  | 'pql_grade_12';

type AnalyticsProps = Record<string, unknown>;

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
// Default to PostHog Cloud US; override per-env if self-hosting.
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com';

// `enabled` is the single source of truth for "should we touch posthog at all?".
// When false every method below is a cheap no-op.
let initialized = false;
const enabled = Boolean(KEY);

/**
 * Initialise PostHog exactly once. Safe to call unconditionally on app boot —
 * it no-ops when no key is configured or when already initialised.
 */
export function initAnalytics(): void {
  if (!enabled || initialized || typeof window === 'undefined') return;
  try {
    posthog.init(KEY as string, {
      api_host: HOST,
      capture_pageview: true,
      // Respect Do-Not-Track and avoid surprising autocapture noise; we send explicit events.
      autocapture: false,
      persistence: 'localStorage',
    });
    initialized = true;
  } catch (err) {
    // Never let analytics break the app.
    console.warn('[analytics] PostHog init failed; continuing without it.', err);
  }
}

export const analytics = {
  /** True only when a key is configured AND init succeeded. */
  get isEnabled(): boolean {
    return enabled && initialized;
  },

  /** Capture a product event. No-ops silently when analytics is disabled. */
  capture(event: AnalyticsEvent, props?: AnalyticsProps): void {
    if (!enabled || !initialized) return;
    try {
      posthog.capture(event, props);
    } catch (err) {
      console.warn(`[analytics] capture("${event}") failed`, err);
    }
  },

  /** Tie events to the authenticated teacher (call after login). */
  identify(distinctId: string, props?: AnalyticsProps): void {
    if (!enabled || !initialized) return;
    try {
      posthog.identify(distinctId, props);
    } catch (err) {
      console.warn('[analytics] identify failed', err);
    }
  },

  /** Clear identity on sign-out so the next user starts a fresh anon profile. */
  reset(): void {
    if (!enabled || !initialized) return;
    try {
      posthog.reset();
    } catch (err) {
      console.warn('[analytics] reset failed', err);
    }
  },
};
