// Shared "start Pro checkout" behaviour for the Pricing page and the in-app paywall.
// Centralises the logged-out → sign-up-then-checkout flow so both call sites behave
// identically (DRY). The server enforces identity and resolves private Stripe price IDs.
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { startCheckout, type BillingInterval } from '@/lib/billingApi';
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

      try {
        setStarting(true);
        // Funnel: the Stripe redirect is being initiated for an authenticated teacher.
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
