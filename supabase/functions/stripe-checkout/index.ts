// POST /stripe-checkout   (BILL-01)
// Auth: JWT. Identity is derived from the token — NEVER the request body. Creates a Stripe
// subscription Checkout Session for the chosen plan and returns the hosted session URL for
// the client to redirect to. Reuses an existing Stripe customer id if we already have one.
// All Stripe keys + price IDs come from env (see _shared/env.ts) — nothing is hardcoded.
import { handlePreflight } from "../_shared/cors.ts";
import { withErrors, ok, AppError } from "../_shared/http.ts";
import { getUserFromJWT } from "../_shared/auth.ts";
import { adminClient } from "../_shared/db.ts";
import { ENV } from "../_shared/env.ts";
import { createCheckoutSession } from "../_shared/stripe.ts";

// Plans a teacher may self-serve checkout for. 'enterprise' is sales-assisted (no public price).
const CHECKOUT_PLANS = new Set(["pro"]);
// Billing intervals the client may request. Default is monthly for backward compatibility.
const CHECKOUT_INTERVALS = new Set(["monthly", "annual"]);

Deno.serve((req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  return withErrors(req, async () => {
    if (req.method !== "POST") throw new AppError(405, "method", "POST only");

    const { userId, email } = await getUserFromJWT(req);
    const { plan, interval } = await req.json().catch(() => ({}));
    const targetPlan = (plan ?? "pro").toString();
    if (!CHECKOUT_PLANS.has(targetPlan)) {
      throw new AppError(400, "input", `Plan '${targetPlan}' is not available for self-serve checkout`);
    }
    // 'monthly' | 'annual' — default monthly; reject anything else so we never look up a junk price.
    const targetInterval = (interval ?? "monthly").toString();
    if (!CHECKOUT_INTERVALS.has(targetInterval)) {
      throw new AppError(400, "input", `Interval '${targetInterval}' is not supported (use monthly or annual)`);
    }

    const priceId = ENV.stripePriceId(targetPlan, targetInterval as "monthly" | "annual");
    const appUrl = ENV.appUrl().replace(/\/$/, "");

    // Reuse an existing Stripe customer if the webhook has already recorded one.
    const admin = adminClient();
    const { data: existing } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    const session = await createCheckoutSession({
      priceId,
      successUrl: `${appUrl}/billing?checkout=success`,
      cancelUrl: `${appUrl}/billing?checkout=cancelled`,
      customerId: existing?.stripe_customer_id ?? undefined,
      customerEmail: existing?.stripe_customer_id ? undefined : (email ?? undefined),
      clientReferenceId: userId,
      metadata: { user_id: userId, plan: targetPlan, interval: targetInterval },
    });

    return ok(req, { url: session.url, sessionId: session.id });
  });
});
