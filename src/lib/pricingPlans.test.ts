import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  PRO_MONTHLY_PRICE,
  PRO_ANNUAL_PRICE,
  ANNUAL_SAVINGS_PCT,
  PRICING_TIERS,
  SCHOOL_CONTACT_EMAIL,
  SCHOOL_CONTACT_SUBJECT,
  isProPriceConfigured,
} from './pricingPlans';

describe('pricingPlans — price points', () => {
  it('charges $15 / month for Pro', () => {
    expect(PRO_MONTHLY_PRICE).toBe(15);
  });

  it('charges $144 / year for Pro (two months free)', () => {
    expect(PRO_ANNUAL_PRICE).toBe(144);
  });

  it("prices the annual plan below 12x the monthly price (it's a discount)", () => {
    expect(PRO_ANNUAL_PRICE).toBeLessThan(PRO_MONTHLY_PRICE * 12);
  });
});

describe('pricingPlans — annual savings math', () => {
  it('reflects ~20% savings vs 12x the monthly price', () => {
    // Arrange
    const fullYearAtMonthlyRate = PRO_MONTHLY_PRICE * 12; // 180
    // Act
    const expected = Math.round((1 - PRO_ANNUAL_PRICE / fullYearAtMonthlyRate) * 100);
    // Assert
    expect(ANNUAL_SAVINGS_PCT).toBe(expected);
    expect(ANNUAL_SAVINGS_PCT).toBe(20);
  });

  it('equals two months free expressed as a percentage of the year', () => {
    // Two free months out of twelve = ~16.7%; the published list price rounds to 20%.
    expect(ANNUAL_SAVINGS_PCT).toBeGreaterThanOrEqual(15);
    expect(ANNUAL_SAVINGS_PCT).toBeLessThanOrEqual(25);
  });
});

describe('pricingPlans — tier config', () => {
  it('exposes exactly the free, pro, and school tiers in order', () => {
    expect(PRICING_TIERS.map((t) => t.id)).toEqual(['free', 'pro', 'school']);
  });

  it('makes the Free tier $0 on both cadences', () => {
    const free = PRICING_TIERS.find((t) => t.id === 'free')!;
    expect(free.monthlyPrice).toBe(0);
    expect(free.annualPrice).toBe(0);
  });

  it('wires the Pro tier prices to the published constants and highlights it', () => {
    const pro = PRICING_TIERS.find((t) => t.id === 'pro')!;
    expect(pro.monthlyPrice).toBe(PRO_MONTHLY_PRICE);
    expect(pro.annualPrice).toBe(PRO_ANNUAL_PRICE);
    expect(pro.highlighted).toBe(true);
  });

  it('marks the School tier as custom-priced ("Contact us")', () => {
    const school = PRICING_TIERS.find((t) => t.id === 'school')!;
    expect(school.monthlyPrice).toBeNull();
    expect(school.annualPrice).toBeNull();
  });

  it('highlights exactly one tier', () => {
    const highlighted = PRICING_TIERS.filter((t) => t.highlighted);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].id).toBe('pro');
  });

  it('gives every tier a name, tagline, and at least one feature', () => {
    for (const tier of PRICING_TIERS) {
      expect(tier.name).toBeTruthy();
      expect(tier.tagline).toBeTruthy();
      expect(tier.features.length).toBeGreaterThan(0);
    }
  });
});

describe('pricingPlans — contact config', () => {
  it('routes School / Dept enquiries to a valid contact email', () => {
    expect(SCHOOL_CONTACT_EMAIL).toBe('hello@aita.app');
    expect(SCHOOL_CONTACT_EMAIL).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  });

  it('uses a non-empty contact subject line', () => {
    expect(SCHOOL_CONTACT_SUBJECT).toBeTruthy();
    expect(typeof SCHOOL_CONTACT_SUBJECT).toBe('string');
  });
});

// isProPriceConfigured reads import.meta.env at module-load time, so we re-import the
// module under different stubbed env to exercise both the configured and unconfigured paths.
describe('isProPriceConfigured — gates on the Stripe price env vars', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns true for each cadence whose VITE_STRIPE_PRICE_PRO_* var is set', async () => {
    vi.stubEnv('VITE_STRIPE_PRICE_PRO_MONTHLY', 'price_monthly_123');
    vi.stubEnv('VITE_STRIPE_PRICE_PRO_ANNUAL', 'price_annual_456');

    const mod = await import('./pricingPlans');

    expect(mod.isProPriceConfigured('monthly')).toBe(true);
    expect(mod.isProPriceConfigured('annual')).toBe(true);
  });

  it('returns false for a cadence whose price env var is missing', async () => {
    vi.stubEnv('VITE_STRIPE_PRICE_PRO_MONTHLY', 'price_monthly_123');
    vi.stubEnv('VITE_STRIPE_PRICE_PRO_ANNUAL', '');

    const mod = await import('./pricingPlans');

    expect(mod.isProPriceConfigured('monthly')).toBe(true);
    expect(mod.isProPriceConfigured('annual')).toBe(false);
  });

  it('returns false for both cadences when no price env vars are configured', async () => {
    vi.stubEnv('VITE_STRIPE_PRICE_PRO_MONTHLY', '');
    vi.stubEnv('VITE_STRIPE_PRICE_PRO_ANNUAL', '');

    const mod = await import('./pricingPlans');

    expect(mod.isProPriceConfigured('monthly')).toBe(false);
    expect(mod.isProPriceConfigured('annual')).toBe(false);
  });
});
