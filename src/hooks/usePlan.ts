// usePlan() — reads the authenticated teacher's subscription and exposes their effective
// plan + limits for usage gating (BILL-02). Treats a missing/inactive subscription as Free.
//
// Gating helper:
//   const { isWithinGradingLimit, limits } = usePlan();
//   if (!isWithinGradingLimit(usedThisMonth)) { /* prompt to upgrade */ }
//
// IMPORTANT: this is a UX gate only. The authoritative enforcement lives server-side in the
// grading path — see the integration hook in PHASE-12-NOTES.md. Never trust the client.
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getSubscription, PLAN_LIMITS, type Plan, type PlanLimits } from '@/lib/billingApi';

const ACTIVE_STATUSES = new Set(['active', 'trialing']);

interface UsePlanResult {
  plan: Plan;
  limits: PlanLimits;
  status: string;
  isPaid: boolean;
  loading: boolean;
  /** Returns true if `usedThisMonth` is still under the plan's monthly grading limit. */
  isWithinGradingLimit: (usedThisMonth: number) => boolean;
  refetch: () => Promise<void>;
}

export function usePlan(): UsePlanResult {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan>('free');
  const [status, setStatus] = useState<string>('inactive');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setPlan('free');
      setStatus('inactive');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const sub = await getSubscription();
      const active = sub ? ACTIVE_STATUSES.has(sub.status) : false;
      setPlan(active ? sub!.plan : 'free');
      setStatus(sub?.status ?? 'inactive');
    } catch (err) {
      console.error('usePlan load error:', err);
      setPlan('free');
      setStatus('inactive');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const limits = PLAN_LIMITS[plan];

  const isWithinGradingLimit = useCallback(
    (usedThisMonth: number) =>
      limits.monthlyGradingLimit === null || usedThisMonth < limits.monthlyGradingLimit,
    [limits.monthlyGradingLimit],
  );

  return {
    plan,
    limits,
    status,
    isPaid: plan !== 'free',
    loading,
    isWithinGradingLimit,
    refetch: load,
  };
}
