// Covers the canonical backend grading caps in supabase/functions/_shared/plan-limits.ts.
// That module is pure TypeScript (no Deno/Supabase imports), so it is safe to import here.
// The test lives under src/ because vitest.config.ts only collects `src/**` test files.
import { describe, it, expect } from 'vitest';

import {
  FREE_MONTHLY_GRADINGS,
  PRO_MONTHLY_GRADINGS,
  ENTERPRISE_MONTHLY_GRADINGS,
  monthlyGradingLimit,
} from '../../supabase/functions/_shared/plan-limits';

describe('plan-limits — canonical backend grading caps', () => {
  it('sets the Free cap to 15 gradings / month', () => {
    expect(FREE_MONTHLY_GRADINGS).toBe(15);
  });

  it('sets the Pro cap to 500 gradings / month', () => {
    expect(PRO_MONTHLY_GRADINGS).toBe(500);
  });

  it('gives Enterprise a high fair-use ceiling well above the Pro cap', () => {
    expect(ENTERPRISE_MONTHLY_GRADINGS).toBeGreaterThan(PRO_MONTHLY_GRADINGS);
    expect(ENTERPRISE_MONTHLY_GRADINGS).toBe(100_000);
  });
});

describe('monthlyGradingLimit — resolves a plan to its monthly cap', () => {
  it('returns 15 for the free plan', () => {
    expect(monthlyGradingLimit('free')).toBe(FREE_MONTHLY_GRADINGS);
  });

  it('returns 500 for the pro plan', () => {
    expect(monthlyGradingLimit('pro')).toBe(PRO_MONTHLY_GRADINGS);
  });

  it('returns the high fair-use ceiling for the enterprise plan', () => {
    expect(monthlyGradingLimit('enterprise')).toBe(ENTERPRISE_MONTHLY_GRADINGS);
  });

  it('is case-insensitive to the plan name', () => {
    expect(monthlyGradingLimit('PRO')).toBe(PRO_MONTHLY_GRADINGS);
    expect(monthlyGradingLimit('Enterprise')).toBe(ENTERPRISE_MONTHLY_GRADINGS);
  });

  it('defaults an unknown plan safely to the Free cap', () => {
    expect(monthlyGradingLimit('platinum')).toBe(FREE_MONTHLY_GRADINGS);
  });

  it('defaults a null plan safely to the Free cap', () => {
    expect(monthlyGradingLimit(null)).toBe(FREE_MONTHLY_GRADINGS);
  });

  it('defaults an undefined plan safely to the Free cap', () => {
    expect(monthlyGradingLimit(undefined)).toBe(FREE_MONTHLY_GRADINGS);
  });
});
