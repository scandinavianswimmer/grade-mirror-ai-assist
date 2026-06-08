// Billing client (Phase 12). Thin wrappers around the Stripe edge functions plus the
// single source of truth for plan limits used by the usePlan() gate (BILL-02).
import { supabase } from './supabase';

export type Plan = 'free' | 'pro' | 'enterprise';

export interface PlanLimits {
  // Monthly grading runs allowed on this plan (BILL-02 gate). null = unlimited.
  monthlyGradingLimit: number | null;
  maxClasses: number | null;
  label: string;
}

// PLAN_LIMITS is the canonical client-side gate. The grading edge functions must enforce
// the SAME numbers server-side (see the integration hook documented in PHASE-12-NOTES.md);
// the client copy is for UX only and is NOT a security boundary.
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: { monthlyGradingLimit: 25, maxClasses: 1, label: 'Free' },
  pro: { monthlyGradingLimit: 1000, maxClasses: null, label: 'Pro' },
  enterprise: { monthlyGradingLimit: null, maxClasses: null, label: 'Enterprise' },
};

export interface Subscription {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: Plan;
  status: string;
  current_period_end: string | null;
}

// Read the caller's own subscription row (RLS-scoped). Returns null if they have never
// subscribed (treated as the Free plan).
export const getSubscription = async (): Promise<Subscription | null> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('user_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end')
    .maybeSingle();
  // Missing table/row is non-fatal — fall back to Free.
  if (error && error.code !== 'PGRST116') {
    console.error('getSubscription error:', error.message);
    return null;
  }
  return (data as Subscription) ?? null;
};

// Pro billing cadence. The edge function maps the plan → a Stripe price id server-side
// (see stripe-checkout's ENV.stripePriceId), so the client only needs to name the cadence.
export type BillingInterval = 'monthly' | 'annual';

// Start Stripe Checkout for a plan; returns a URL the caller should redirect to.
// `interval` is forwarded so the edge function can pick the monthly vs annual Stripe price.
// The function ignores unknown body fields, so passing it is safe even before the founder
// wires the annual price id (see VITE_STRIPE_PRICE_PRO_* in pricingPlans.ts).
export const startCheckout = async (
  plan: Plan = 'pro',
  interval: BillingInterval = 'monthly',
): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: { plan, interval },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Checkout session did not return a URL');
  return data.url as string;
};

// Open the Stripe Customer Portal to manage/cancel an existing subscription.
export const openBillingPortal = async (): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('stripe-portal', {});
  if (error) throw error;
  if (!data?.url) throw new Error('Portal session did not return a URL');
  return data.url as string;
};
