// Presentational pricing tier card used by the public Pricing page. Pure UI — the parent
// owns the CTA behaviour and billing-interval state. Matches the "Marginalia" tokens
// (pine primary, ochre accent) — no hardcoded colors.
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BillingInterval } from '@/lib/billingApi';
import type { PricingTier } from '@/lib/pricingPlans';

interface PricingCardProps {
  tier: PricingTier;
  interval: BillingInterval;
  /** The CTA button (provided by the parent so behaviour stays in one place). */
  cta: React.ReactNode;
  /** Optional badge, e.g. "Your plan", shown next to the tier name. */
  badge?: React.ReactNode;
}

function PriceLabel({ tier, interval }: { tier: PricingTier; interval: BillingInterval }) {
  // Custom-priced tier (School / Dept).
  if (tier.monthlyPrice === null) {
    return <div className="font-display text-3xl font-semibold">Custom</div>;
  }

  // Free tier reads the same on either cadence.
  if (tier.monthlyPrice === 0) {
    return (
      <div className="font-display text-4xl font-semibold">
        $0<span className="text-base font-normal text-muted-foreground">/mo</span>
      </div>
    );
  }

  // Paid tier: annual divides the yearly price across 12 months for an apples-to-apples
  // monthly figure, with the true annual total shown beneath.
  const isAnnual = interval === 'annual';
  const perMonth = isAnnual && tier.annualPrice !== null ? tier.annualPrice / 12 : tier.monthlyPrice;
  const perMonthLabel = Number.isInteger(perMonth) ? perMonth.toString() : perMonth.toFixed(2);

  return (
    <div>
      <div className="font-display text-4xl font-semibold">
        ${perMonthLabel}
        <span className="text-base font-normal text-muted-foreground">/mo</span>
      </div>
      {isAnnual && tier.annualPrice !== null && (
        <p className="mt-1 text-sm text-muted-foreground">
          Billed ${tier.annualPrice}/year
        </p>
      )}
    </div>
  );
}

export function PricingCard({ tier, interval, cta, badge }: PricingCardProps) {
  return (
    <Card
      className={cn(
        'flex flex-col',
        tier.highlighted ? 'border-primary shadow-md ring-1 ring-primary/20' : 'border-border/70',
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-display text-xl">
            {tier.highlighted && <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />}
            {tier.name}
          </span>
          <span className="flex items-center gap-2">
            {tier.highlighted && <Badge>Most popular</Badge>}
            {badge}
          </span>
        </CardTitle>
        <CardDescription>{tier.tagline}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-5">
        <PriceLabel tier={tier} interval={interval} />
        <ul className="space-y-2.5 text-sm">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>{cta}</CardFooter>
    </Card>
  );
}

export default PricingCard;
