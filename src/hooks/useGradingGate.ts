// useGradingGate() — UX-only gate that decides whether a Free teacher who has hit their
// monthly grading cap should see the upgrade paywall instead of starting a grade run.
//
// Composes usePlan() (plan + limits) with a current-month count of the teacher's grades
// (submission_grades is RLS-scoped to auth.uid(), so the count is theirs alone).
//
// FAIL OPEN: while plan/usage are still loading, or if usage can't be read, `atCap` is false
// so we never block a paying or unknown user. Authoritative enforcement still lives server-side
// in the grading edge functions — this is a UX gate only and is NOT a security boundary.
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { usePlan } from './usePlan';
import { analytics } from '@/lib/analytics';
import type { Plan } from '@/lib/billingApi';

// Product-qualified-lead threshold: a teacher who has graded this many essays in a month is
// demonstrably getting value — the best moment to nudge conversion (Launch Plan §B / Cohort A).
const PQL_GRADE_THRESHOLD = 12;

interface UseGradingGateResult {
  plan: Plan;
  /** Free teacher whose current-month grading usage is at/over the Free monthly limit. */
  atCap: boolean;
  /** Grades remaining this month on a limited plan; null when the plan is unlimited. */
  remaining: number | null;
  loading: boolean;
}

// First instant of the current calendar month (UTC), as an ISO string for the usage query.
function monthStartIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export function useGradingGate(): UseGradingGateResult {
  const { user } = useAuth();
  const { plan, limits, loading: planLoading, isTrial, isWithinGradingLimit } = usePlan();
  const [usedThisMonth, setUsedThisMonth] = useState<number | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);

  const loadUsage = useCallback(async () => {
    if (!user) {
      // No authenticated teacher yet — fail open (treat as "no usage we can read").
      setUsedThisMonth(null);
      setUsageLoading(false);
      return;
    }
    try {
      setUsageLoading(true);
      // RLS scopes submission_grades to this teacher; count this calendar month's grades.
      const { count, error } = await supabase
        .from('submission_grades')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthStartIso());
      if (error) throw error;
      setUsedThisMonth(count ?? 0);
    } catch (err) {
      // Fail open: an unreadable usage count must never block grading.
      console.error('useGradingGate usage load error:', err);
      setUsedThisMonth(null);
    } finally {
      setUsageLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  // Grade-12 PQL: fire once per teacher per month when usage crosses the threshold. localStorage
  // guards idempotency so PostHog gets exactly one signal (the funnel counts qualified leads, not
  // every grade past 12). Best-effort — analytics no-ops without a key, and storage may be absent.
  useEffect(() => {
    if (!user || usedThisMonth === null || usedThisMonth < PQL_GRADE_THRESHOLD) return;
    try {
      const period = monthStartIso().slice(0, 7); // YYYY-MM
      const key = `pql_grade_12:${user.id}:${period}`;
      if (typeof localStorage !== 'undefined' && localStorage.getItem(key)) return;
      analytics.capture('pql_grade_12', { used_this_month: usedThisMonth, plan, on_trial: isTrial });
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, '1');
    } catch {
      // Never let a PQL signal break grading.
    }
  }, [user, usedThisMonth, plan, isTrial]);

  const loading = planLoading || usageLoading;
  const monthlyLimit = limits.monthlyGradingLimit;

  // atCap requires: a free plan, a known usage count, and usage at/over the free limit.
  // Anything unknown (loading, null usage, unlimited plan) fails open to false.
  const atCap =
    !loading &&
    plan === 'free' &&
    usedThisMonth !== null &&
    !isWithinGradingLimit(usedThisMonth);

  const remaining =
    monthlyLimit === null || usedThisMonth === null
      ? null
      : Math.max(0, monthlyLimit - usedThisMonth);

  return { plan, atCap, remaining, loading };
}
