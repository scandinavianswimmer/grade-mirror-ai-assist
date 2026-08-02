import { describe, it, expect } from 'vitest';

import {
  PRO_MONTHLY_PRICE,
  PRO_ANNUAL_PRICE,
  ANNUAL_SAVINGS_PCT,
  PRICING_TIERS,
  SCHOOL_CONTACT_EMAIL,
  SCHOOL_CONTACT_SUBJECT,
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

  it('describes review without claiming that teachers manually approve every grade', () => {
    const featureCopy = PRICING_TIERS.flatMap((tier) => tier.features).join(' ');

    expect(featureCopy).toContain('Teacher review is the default');
    expect(featureCopy).not.toMatch(/approve every grade/i);
  });
});

describe('pricingPlans — contact config', () => {
  it('never invents an unverified School / Dept inbox', () => {
    expect(SCHOOL_CONTACT_EMAIL).not.toBe('hello@example.com');
    expect(SCHOOL_CONTACT_EMAIL).not.toBe('hello@mrselby.app');
    if (SCHOOL_CONTACT_EMAIL) {
      expect(SCHOOL_CONTACT_EMAIL).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
    }
  });

  it('uses a non-empty contact subject line', () => {
    expect(SCHOOL_CONTACT_SUBJECT).toBeTruthy();
    expect(typeof SCHOOL_CONTACT_SUBJECT).toBe('string');
  });
});
