// TrialBanner — the in-app nudge during the 14-day full-access trial (BILL-03).
//
// Renders only while the teacher is on an active trial (usePlan().isTrial). Leads with the value
// they currently have ("full access") and the days remaining, then a single upgrade CTA that reuses
// the shared checkout flow. As the trial nears its end the copy gets more urgent (≤3 days).
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlan } from '@/hooks/usePlan';
import { useUpgradeCheckout } from '@/components/pricing/useUpgradeCheckout';
import { analytics } from '@/lib/analytics';
import { useEffect } from 'react';

const URGENT_DAYS = 3;

export default function TrialBanner() {
  const { isTrial, trialDaysLeft, loading } = usePlan();
  const { startProCheckout, starting } = useUpgradeCheckout();

  useEffect(() => {
    if (isTrial) analytics.capture('trial_banner_viewed', { days_left: trialDaysLeft });
  }, [isTrial, trialDaysLeft]);

  if (loading || !isTrial) return null;

  const urgent = trialDaysLeft <= URGENT_DAYS;
  const daysLabel = trialDaysLeft === 1 ? '1 day' : `${trialDaysLeft} days`;

  return (
    <div
      className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
        urgent ? 'border-suggestion/50 bg-suggestion-soft/50' : 'border-primary/30 bg-primary/5'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${urgent ? 'bg-suggestion/15 text-suggestion' : 'bg-primary/10 text-primary'}`}>
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {urgent ? `Only ${daysLabel} left in your free trial` : `You're on the full-access trial — ${daysLabel} left`}
          </p>
          <p className="text-sm text-muted-foreground">
            Unlimited-feel grading (500/mo), auto-finalize, and your teaching voice. Keep it all for $15/mo.
          </p>
        </div>
      </div>
      <Button
        className="gap-2"
        onClick={() => {
          analytics.capture('trial_banner_upgrade_clicked', { days_left: trialDaysLeft });
          void startProCheckout('monthly');
        }}
        disabled={starting}
      >
        {starting ? 'Starting…' : <>Upgrade to Pro <ArrowRight className="h-4 w-4" /></>}
      </Button>
    </div>
  );
}
