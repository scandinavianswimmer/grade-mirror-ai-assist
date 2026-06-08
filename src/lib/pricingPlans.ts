// Public pricing model (Launch Plan §3) — the single source of truth for the marketing
// Pricing page and the in-app upgrade paywall. Prices/features live here; PLAN_LIMITS in
// billingApi.ts remains the canonical gate for usage enforcement. Keep the two in sync.
import type { BillingInterval } from './billingApi';

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

// Stripe checkout maps plan + interval → a price id server-side, but we surface the env
// var names here so the page can gate the Pro CTA when the founder hasn't wired prices yet.
// TODO(founder): create the Pro monthly + annual prices in Stripe (live mode) and set these
// VITE_ vars at build time. Without them the edge function has no price to charge.
const PRO_PRICE_ENV: Record<BillingInterval, string | undefined> = {
  monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY as string | undefined,
  annual: import.meta.env.VITE_STRIPE_PRICE_PRO_ANNUAL as string | undefined,
};

/** True once the founder has configured the Stripe price id for the given cadence. */
export function isProPriceConfigured(interval: BillingInterval): boolean {
  return Boolean(PRO_PRICE_ENV[interval]);
}

// Annual list price is two months free (~20% off the 12× monthly), per Launch Plan §3.
export const PRO_MONTHLY_PRICE = 15;
export const PRO_ANNUAL_PRICE = 144;

/** Percentage saved by paying annually vs 12× the monthly price, rounded to a whole number. */
export const ANNUAL_SAVINGS_PCT = Math.round(
  (1 - PRO_ANNUAL_PRICE / (PRO_MONTHLY_PRICE * 12)) * 100,
);

// Where to send "Contact us" for the School / Dept tier (lead capture only).
export const SCHOOL_CONTACT_EMAIL = 'hello@aita.app';
export const SCHOOL_CONTACT_SUBJECT = 'aiTA for our school / department';

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Try aiTA on a single class — no card required.',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      '~15 gradings / month',
      '1 teacher',
      'Rubric-aligned grading + inline feedback',
      'Basic voice matching',
      'Human-in-the-loop — you approve every grade',
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
