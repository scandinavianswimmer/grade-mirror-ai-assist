// Shared "start Pro checkout" behaviour for the Pricing page and the in-app paywall.
// Centralises the logged-out → sign-up-then-checkout flow and the Stripe-price gating so
// both call sites behave identically (DRY). UX-only — server enforces identity + price.
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { startCheckout, type BillingInterval } from '@/lib/billingApi';
import { isProPriceConfigured } from '@/lib/pricingPlans';
import { analytics } from '@/lib/analytics';

interface UseUpgradeCheckout {
  /** True while a checkout session is being created (disable the CTA). */
  starting: boolean;
  /** Begin Pro checkout. Logged-out users are routed to sign-up first. */
  startProCheckout: (interval: BillingInterval) => Promise<void>;
}

export function useUpgradeCheckout(): UseUpgradeCheckout {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  const startProCheckout = useCallback(
    async (interval: BillingInterval) => {
      // Logged-out: send them to sign up; they can return to /pricing and check out once in.
      if (!user) {
        navigate('/auth?mode=signup&intent=upgrade');
        return;
      }

      // Guard against a silently-broken checkout when the founder hasn't wired the price id.
      if (!isProPriceConfigured(interval)) {
        toast.error('Pro checkout isn’t available yet — please check back shortly.');
        return;
      }

      try {
        setStarting(true);
        // Funnel: the Stripe redirect is being initiated (guards passed, user authed).
        analytics.capture('checkout_started', { plan: 'pro', interval });
        const url = await startCheckout('pro', interval);
        window.location.href = url; // redirect to Stripe-hosted Checkout
      } catch (err: unknown) {
        console.error('startProCheckout error:', err);
        const message = err instanceof Error ? err.message : 'Could not start checkout. Please try again.';
        toast.error(message);
        setStarting(false);
      }
    },
    [user, navigate],
  );

  return { starting, startProCheckout };
}
