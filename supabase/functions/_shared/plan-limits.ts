// Canonical plan limits — the SINGLE source of truth for grading caps across the backend.
// Pricing (per .planning/LAUNCH-PLAN.md Section 3):
//   Free = 15 gradings / month
//   Pro  = 500 gradings / month (fair-use)
// Enterprise is sales-assisted with an effectively-uncapped fair-use ceiling.
//
// NOTE: the authoritative enforcement happens in the consume_grading_quota RPC (migration 0019),
// which must hold the same numbers. These constants are the source the founder reconciles the RPC
// (and the frontend pricingPlans/billingApi) against. They are also used by any TypeScript-side
// gate (e.g. record-feedback-usage) so caps live in exactly one place per language boundary.
export const FREE_MONTHLY_GRADINGS = 15;
export const PRO_MONTHLY_GRADINGS = 500;
// Enterprise has no published cap; a high fair-use ceiling prevents accidental hard blocks.
export const ENTERPRISE_MONTHLY_GRADINGS = 100_000;

// Plan -> monthly grading cap. Keys match users.plan vocabulary ('free' | 'pro' | 'enterprise').
export const MONTHLY_GRADING_LIMIT: Record<string, number> = {
  free: FREE_MONTHLY_GRADINGS,
  pro: PRO_MONTHLY_GRADINGS,
  enterprise: ENTERPRISE_MONTHLY_GRADINGS,
};

// Resolve the monthly cap for a plan, defaulting to the Free cap for unknown/missing plans.
export function monthlyGradingLimit(plan: string | null | undefined): number {
  return MONTHLY_GRADING_LIMIT[(plan ?? "free").toLowerCase()] ?? FREE_MONTHLY_GRADINGS;
}
