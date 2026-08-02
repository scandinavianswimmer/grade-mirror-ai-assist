// Billing & plans page (Phase 12 / BILL-01 + BILL-02).
// Shows Free vs Pro tiers, a Subscribe button (Stripe Checkout redirect) and a
// "Manage subscription" button (Stripe Customer Portal). Plan + limits come from usePlan().
// Copy is intentionally factual — it states the configured limits and nothing more
// (no compliance/guarantee claims).
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { usePlan } from '@/hooks/usePlan';
import { PLAN_LIMITS, startCheckout, openBillingPortal } from '@/lib/billingApi';
import { PRO_MONTHLY_PRICE } from '@/lib/pricingPlans';

function limitText(limit: number | null, noun: string): string {
  return limit === null ? `Unlimited ${noun}` : `Up to ${limit.toLocaleString()} ${noun} / month`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return fallback;
}

// Display-only Pro price, sourced from the canonical pricing plan. The actual charge remains
// authoritative in Stripe and must match before launch.
const PRO_PRICE_DISPLAY = `$${PRO_MONTHLY_PRICE}`;

const Billing = () => {
  const { plan, status, isPaid, loading } = usePlan();
  const [searchParams] = useSearchParams();
  const [working, setWorking] = useState<null | 'checkout' | 'portal'>(null);

  // Surface the result of returning from Stripe Checkout.
  const checkoutResult = searchParams.get('checkout');
  React.useEffect(() => {
    if (checkoutResult === 'success') {
      toast.success('Subscription started — it may take a moment to activate.');
    } else if (checkoutResult === 'cancelled') {
      toast('Checkout cancelled — no changes were made.');
    }
  }, [checkoutResult]);

  const handleSubscribe = async () => {
    try {
      setWorking('checkout');
      const url = await startCheckout('pro');
      window.location.href = url; // redirect to Stripe-hosted Checkout
    } catch (err: unknown) {
      console.error(err);
      toast.error(getErrorMessage(err, 'Could not start checkout. Please try again.'));
      setWorking(null);
    }
  };

  const handleManage = async () => {
    try {
      setWorking('portal');
      const url = await openBillingPortal();
      window.location.href = url; // redirect to the Stripe Customer Portal
    } catch (err: unknown) {
      console.error(err);
      toast.error(getErrorMessage(err, 'Could not open the billing portal.'));
      setWorking(null);
    }
  };

  const free = PLAN_LIMITS.free;
  const pro = PLAN_LIMITS.pro;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Plans &amp; billing</h1>
          <p className="mt-2 text-muted-foreground">
            Choose the plan that fits how much you grade. You can change or cancel anytime.
          </p>
          {!loading && (
            // div (not p): Badge renders a <div>, which is invalid inside <p> (React validateDOMNesting).
            <div className="mt-3 text-sm">
              Current plan:{' '}
              <Badge variant={isPaid ? 'default' : 'secondary'}>
                {PLAN_LIMITS[plan].label}
                {isPaid && status && status !== 'active' ? ` · ${status}` : ''}
              </Badge>
            </div>
          )}
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
          {/* Free tier */}
          <Card className={plan === 'free' ? 'border-primary/40' : undefined}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {free.label}
                {plan === 'free' && <Badge variant="secondary">Your plan</Badge>}
              </CardTitle>
              <CardDescription>For trying Mr Selby on a single class.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-semibold">$0<span className="text-base font-normal text-muted-foreground">/mo</span></div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{limitText(free.monthlyGradingLimit, 'grading runs')}</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{free.maxClasses === null ? 'Unlimited classes' : `${free.maxClasses} class`}</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Rubric-aligned grading + inline feedback</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Teacher review is the default</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                {plan === 'free' ? 'Current plan' : 'Included'}
              </Button>
            </CardFooter>
          </Card>

          {/* Pro tier */}
          <Card className={plan === 'pro' ? 'border-primary' : 'border-primary/60'}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />{pro.label}</span>
                {plan === 'pro' && <Badge>Your plan</Badge>}
              </CardTitle>
              <CardDescription>For teachers grading at full load.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-semibold">{PRO_PRICE_DISPLAY}<span className="text-base font-normal text-muted-foreground">/mo</span></div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{limitText(pro.monthlyGradingLimit, 'grading runs')}</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Unlimited classes</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Teacher-style learning loop</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Priority grading throughput</li>
              </ul>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              {isPaid ? (
                <Button className="w-full" onClick={handleManage} disabled={working !== null}>
                  {working === 'portal' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                  Manage subscription
                </Button>
              ) : (
                <Button className="w-full" onClick={handleSubscribe} disabled={working !== null}>
                  {working === 'checkout' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Subscribe to Pro
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs text-muted-foreground">
          Payments are processed securely by Stripe. Need a plan for a school or district?{' '}
          Contact us about Enterprise.
        </p>
      </main>
    </div>
  );
};

export default Billing;
