// Public pricing model (Launch Plan §3) — the single source of truth for the marketing
// Pricing page and the in-app upgrade paywall. Prices/features live here; PLAN_LIMITS in
// billingApi.ts remains the canonical gate for usage enforcement. Keep the two in sync.
export type PricingTierId = 'free' | 'pro' | 'school';

export interface PricingTier {
  id: PricingTierId;
  name: string;
  /** One-line positioning shown under the tier name. */
  tagline: string;
  /** Monthly price in whole dollars. null = custom ("Contact us"). */
  monthlyPrice: number | null;
  /** Annual price in whole dollars (the full year). null = no annual / custom. */
  annualPrice: number | null;
  features: string[];
  /** Marks the visually emphasised tier on the page. */
  highlighted?: boolean;
}

// Annual list price is two months free (~20% off the 12× monthly), per Launch Plan §3.
export const PRO_MONTHLY_PRICE = 15;
export const PRO_ANNUAL_PRICE = 144;

/** Percentage saved by paying annually vs 12× the monthly price, rounded to a whole number. */
export const ANNUAL_SAVINGS_PCT = Math.round(
  (1 - PRO_ANNUAL_PRICE / (PRO_MONTHLY_PRICE * 12)) * 100,
);

// Where to send "Contact us" for the School / Dept tier (lead capture only).
// mrselby.app is registered, but registration alone does not create a monitored inbox. Fail
// closed until the release owner configures and verifies a real address at build time.
export const SCHOOL_CONTACT_EMAIL = (
  import.meta.env.VITE_SCHOOL_CONTACT_EMAIL as string | undefined
)?.trim() ?? '';
export const SCHOOL_CONTACT_SUBJECT = 'Mr Selby for our school / department';

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Try Mr Selby on a single class — no card required.',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      '~15 gradings / month',
      '1 teacher',
      'Rubric-aligned grading + inline feedback',
      'Basic voice matching',
      'Teacher review is the default',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For teachers grading at full load.',
    monthlyPrice: PRO_MONTHLY_PRICE,
    annualPrice: PRO_ANNUAL_PRICE,
    highlighted: true,
    features: [
      'Fair-use ~500 gradings / month',
      'Full voice-convergence learning loop',
      'Bulk grading',
      'Exports',
      'Priority grading throughput',
      '14-day Pro trial for new signups',
    ],
  },
  {
    id: 'school',
    name: 'School / Dept',
    tagline: 'Multi-seat, admin, and SSO for your department.',
    monthlyPrice: null,
    annualPrice: null,
    features: [
      'Everything in Pro',
      'Multiple teacher seats',
      'Admin & usage controls',
      'SSO',
      'Onboarding & priority support',
    ],
  },
];
