// In-app upgrade paywall (Launch Plan §3 / B3). Shown when a Free teacher reaches their
// monthly grading cap. Offers a one-click "Upgrade to Pro" that starts Stripe checkout via
// the shared useUpgradeCheckout hook. Render this where the Free cap is detected.
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Sparkles, Lock, Loader2, Check } from 'lucide-react';
import { useUpgradeCheckout } from './useUpgradeCheckout';
import { PRO_MONTHLY_PRICE, PRICING_TIERS } from '@/lib/pricingPlans';
import { analytics } from '@/lib/analytics';

interface UpgradePaywallProps {
  /** Optional override for the headline (e.g. tailored to the blocked action). */
  title?: string;
  /** Optional supporting line under the headline. */
  description?: string;
  /** Where the paywall surfaced (e.g. the blocked action) — recorded on the funnel event. */
  source?: string;
  className?: string;
}

const PRO_HIGHLIGHTS = PRICING_TIERS.find((t) => t.id === 'pro')?.features.slice(0, 4) ?? [];

export function UpgradePaywall({ title, description, source, className }: UpgradePaywallProps) {
  const { starting, startProCheckout } = useUpgradeCheckout();

  // Funnel: a Free teacher hit the cap and saw the paywall (fires once per mount).
  useEffect(() => {
    analytics.capture('paywall_viewed', { source: source ?? 'unknown' });
  }, [source]);

  return (
    <Card className={`border-primary/60 shadow-md ${className ?? ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Lock className="h-5 w-5 text-accent" />
          {title ?? 'You’ve reached your free grading limit'}
        </CardTitle>
        <CardDescription>
          {description ??
            `Upgrade to Pro for fair-use ~500 gradings a month, the full voice-convergence learning loop, bulk grading, and exports — from $${PRO_MONTHLY_PRICE}/mo.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {PRO_HIGHLIGHTS.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="sm:flex-1"
            onClick={() => {
              analytics.capture('upgrade_clicked', { plan: 'pro', interval: 'monthly' });
              startProCheckout('monthly');
            }}
            disabled={starting}
          >
            {starting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Upgrade to Pro
          </Button>
          <Button asChild variant="outline" className="sm:flex-1">
            <Link to="/pricing">Compare plans</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default UpgradePaywall;
