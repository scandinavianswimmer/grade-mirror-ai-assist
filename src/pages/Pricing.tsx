// Public marketing pricing page (Launch Plan §3 / B3). Three tiers — Free, Pro, School/Dept —
// with a monthly/annual toggle (annual shows the 20% saving). CTAs: Free → sign up,
// Pro → Stripe checkout (sign-up-then-checkout when logged out), School → contact (mailto).
// Reachable without auth (registered as a public route in App.tsx, like /pitch).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Feather, Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { usePlan } from '@/hooks/usePlan';
import { PricingCard } from '@/components/pricing/PricingCard';
import { BillingIntervalToggle } from '@/components/pricing/BillingIntervalToggle';
import { useUpgradeCheckout } from '@/components/pricing/useUpgradeCheckout';
import {
  PRICING_TIERS,
  SCHOOL_CONTACT_EMAIL,
  SCHOOL_CONTACT_SUBJECT,
  type PricingTier,
} from '@/lib/pricingPlans';
import type { BillingInterval } from '@/lib/billingApi';
import { analytics } from '@/lib/analytics';

const schoolContactHref = SCHOOL_CONTACT_EMAIL
  ? `mailto:${SCHOOL_CONTACT_EMAIL}?subject=${encodeURIComponent(SCHOOL_CONTACT_SUBJECT)}`
  : null;

const Pricing = () => {
  const { user } = useAuth();
  const { plan, isPaid } = usePlan();
  const { starting, startProCheckout } = useUpgradeCheckout();
  const [interval, setInterval] = useState<BillingInterval>('monthly');

  // Funnel entry: the public pricing page was viewed (fires once per mount).
  useEffect(() => {
    analytics.capture('pricing_page_viewed');
  }, []);

  // Per-tier CTA. Behaviour follows Launch Plan §3: Free → sign up, Pro → checkout
  // (or sign up first when logged out, handled inside startProCheckout), School → contact.
  const renderCta = (tier: PricingTier) => {
    if (tier.id === 'free') {
      if (user && !isPaid) {
        return (
          <Button asChild variant="outline" className="w-full">
            <Link to="/dashboard">Go to your workspace</Link>
          </Button>
        );
      }
      return (
        <Button asChild variant="outline" className="w-full">
          <Link to="/auth?mode=signup">Get started free</Link>
        </Button>
      );
    }

    if (tier.id === 'pro') {
      if (user && isPaid) {
        return (
          <Button asChild variant="outline" className="w-full">
            <Link to="/billing">Manage subscription</Link>
          </Button>
        );
      }

      return (
        <Button
          className="w-full"
          aria-busy={starting}
          onClick={() => {
            analytics.capture('upgrade_clicked', { plan: 'pro', interval });
            startProCheckout(interval);
          }}
          disabled={starting}
        >
          {starting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {starting ? 'Starting checkout…' : user ? 'Upgrade to Pro' : 'Start 14-day Pro trial'}
        </Button>
      );
    }

    // School / Dept — lead capture only. Never advertise a dead or unmonitored inbox.
    if (!schoolContactHref) {
      return (
        <Button disabled variant="outline" className="w-full">
          School inquiries opening soon
        </Button>
      );
    }

    return (
      <Button asChild variant="outline" className="w-full">
        <a href={schoolContactHref}>Contact us</a>
      </Button>
    );
  };

  const tierBadge = (tier: PricingTier) => {
    if (!user) return undefined;
    if (tier.id === 'free' && !isPaid) return <Badge variant="secondary">Your plan</Badge>;
    if (tier.id === 'pro' && plan === 'pro') return <Badge variant="secondary">Your plan</Badge>;
    return undefined;
  };

  return (
    <div className="min-h-screen">
      <a href="#pricing-main" className="skip-link">Skip to main content</a>

      {/* Lightweight public header (the app chrome is auth-gated). */}
      <header className="border-b border-border/70">
        <nav aria-label="Primary" className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/pitch" className="flex items-center gap-2.5" aria-label="aiTA overview">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Feather className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight">aiTA</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">{user ? 'Open app' : 'Sign in'}</Link>
          </Button>
        </nav>
      </header>

      <main id="pricing-main" tabIndex={-1} className="container mx-auto px-4 py-14">
        <div className="mx-auto max-w-2xl text-center animate-fade-up">
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Grade in your voice. Pay for what you grade.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Start free on a single class. Upgrade when you grade at full load — every plan keeps
            you the final word, with human-in-the-loop review on every grade.
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <BillingIntervalToggle value={interval} onChange={setInterval} />
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl items-stretch gap-6 lg:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              interval={interval}
              badge={tierBadge(tier)}
              cta={renderCta(tier)}
            />
          ))}
        </div>

        <p className="mx-auto mt-10 flex max-w-2xl items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          Payments are processed securely by Stripe. Change or cancel anytime from your billing
          settings.
        </p>
      </main>

      <footer className="border-t border-border/70 px-4 py-8">
        <div className="container mx-auto flex max-w-5xl flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>aiTA launch preview · Final legal details pending review</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/pitch" className="underline underline-offset-4 hover:text-foreground">Overview</Link>
            <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="underline underline-offset-4 hover:text-foreground">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
