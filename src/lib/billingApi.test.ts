import { describe, it, expect, vi, beforeEach } from 'vitest';

const invoke = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } },
}));

import { PLAN_LIMITS, startCheckout } from './billingApi';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PLAN_LIMITS — canonical client-side grading caps', () => {
  it('caps the Free plan at 15 gradings / month', () => {
    expect(PLAN_LIMITS.free.monthlyGradingLimit).toBe(15);
  });

  it('caps the Pro plan at 500 gradings / month', () => {
    expect(PLAN_LIMITS.pro.monthlyGradingLimit).toBe(500);
  });

  it('leaves the Enterprise plan unlimited (null)', () => {
    expect(PLAN_LIMITS.enterprise.monthlyGradingLimit).toBeNull();
  });

  it('limits Free to a single class but lets Pro and Enterprise run unlimited classes', () => {
    expect(PLAN_LIMITS.free.maxClasses).toBe(1);
    expect(PLAN_LIMITS.pro.maxClasses).toBeNull();
    expect(PLAN_LIMITS.enterprise.maxClasses).toBeNull();
  });

  it('labels each plan with a human-readable name', () => {
    expect(PLAN_LIMITS.free.label).toBe('Free');
    expect(PLAN_LIMITS.pro.label).toBe('Pro');
    expect(PLAN_LIMITS.enterprise.label).toBe('Enterprise');
  });
});

describe('startCheckout — forwards plan + billing interval to the edge function', () => {
  it('defaults to the Pro plan on the monthly interval', async () => {
    invoke.mockResolvedValueOnce({ data: { url: 'https://stripe.test/session' }, error: null });

    const url = await startCheckout();

    expect(url).toBe('https://stripe.test/session');
    expect(invoke).toHaveBeenCalledWith('stripe-checkout', {
      body: { plan: 'pro', interval: 'monthly' },
    });
  });

  it('forwards the annual interval when explicitly requested', async () => {
    invoke.mockResolvedValueOnce({ data: { url: 'https://stripe.test/annual' }, error: null });

    const url = await startCheckout('pro', 'annual');

    expect(url).toBe('https://stripe.test/annual');
    expect(invoke).toHaveBeenCalledWith('stripe-checkout', {
      body: { plan: 'pro', interval: 'annual' },
    });
  });

  it('forwards the requested plan alongside the interval', async () => {
    invoke.mockResolvedValueOnce({ data: { url: 'https://stripe.test/ent' }, error: null });

    await startCheckout('enterprise', 'monthly');

    expect(invoke).toHaveBeenCalledWith('stripe-checkout', {
      body: { plan: 'enterprise', interval: 'monthly' },
    });
  });

  it('throws the underlying error when the edge function fails', async () => {
    invoke.mockResolvedValueOnce({ data: null, error: new Error('checkout boom') });

    await expect(startCheckout('pro', 'annual')).rejects.toThrow('checkout boom');
  });

  it('throws a clear error when no checkout URL is returned', async () => {
    invoke.mockResolvedValueOnce({ data: {}, error: null });

    await expect(startCheckout()).rejects.toThrow('Checkout session did not return a URL');
  });
});
