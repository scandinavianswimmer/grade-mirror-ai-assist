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
import { supabase } from '@/lib/supabase';
import { getSubscription, PLAN_LIMITS, type Plan, type PlanLimits } from '@/lib/billingApi';
import { isTrialActive, trialDaysLeft as computeTrialDaysLeft } from '@/lib/trial';

const ACTIVE_STATUSES = new Set(['active', 'trialing']);

interface UsePlanResult {
  plan: Plan;
  limits: PlanLimits;
  status: string;
  isPaid: boolean;
  /** On an active 14-day full-access trial (granted Pro access without a paid subscription). */
  isTrial: boolean;
  /** Whole days left in the trial (0 when not on a trial). */
  trialDaysLeft: number;
  loading: boolean;
  /** Returns true if `usedThisMonth` is still under the plan's monthly grading limit. */
  isWithinGradingLimit: (usedThisMonth: number) => boolean;
  refetch: () => Promise<void>;
}

export function usePlan(): UsePlanResult {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan>('free');
  const [status, setStatus] = useState<string>('inactive');
  const [isTrial, setIsTrial] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setPlan('free');
      setStatus('inactive');
      setIsTrial(false);
      setTrialDaysLeft(0);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const sub = await getSubscription();
      const subActive = sub ? ACTIVE_STATUSES.has(sub.status) : false;

      // Best-effort trial read: trial_ends_at is absent until migration 0021 — a missing column or
      // error simply means "no trial" and never blocks plan resolution.
      let trialEndsAt: string | null = null;
      try {
        const { data } = await supabase
          .from('users')
          .select('trial_ends_at')
          .eq('id', user.id)
          .maybeSingle();
        trialEndsAt = (data as { trial_ends_at?: string | null } | null)?.trial_ends_at ?? null;
      } catch {
        trialEndsAt = null;
      }
      const onTrial = !subActive && isTrialActive(trialEndsAt);

      // Effective plan: a real paid subscription wins; otherwise an active trial grants Pro access;
      // otherwise Free. Server-side consume_grading_quota enforces the same precedence.
      setPlan(subActive ? sub!.plan : onTrial ? 'pro' : 'free');
      setStatus(subActive ? (sub?.status ?? 'inactive') : onTrial ? 'trialing' : 'inactive');
      setIsTrial(onTrial);
      setTrialDaysLeft(onTrial ? computeTrialDaysLeft(trialEndsAt) : 0);
    } catch (err) {
      console.error('usePlan load error:', err);
      setPlan('free');
      setStatus('inactive');
      setIsTrial(false);
      setTrialDaysLeft(0);
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
    isTrial,
    trialDaysLeft,
    loading,
    isWithinGradingLimit,
    refetch: load,
  };
}
