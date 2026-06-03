// POST /stripe-portal   (BILL-01: manage an existing subscription)
// Auth: JWT. Returns a Stripe Customer Portal URL so the teacher can update payment,
// switch plans, or cancel. Requires that we already have a Stripe customer id for them
// (created during checkout + recorded by the webhook). Identity is from the token only.
import { handlePreflight } from "../_shared/cors.ts";
import { withErrors, ok, AppError } from "../_shared/http.ts";
import { getUserFromJWT } from "../_shared/auth.ts";
import { adminClient } from "../_shared/db.ts";
import { ENV } from "../_shared/env.ts";
import { createPortalSession } from "../_shared/stripe.ts";

Deno.serve((req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  return withErrors(req, async () => {
    if (req.method !== "POST") throw new AppError(405, "method", "POST only");

    const { userId } = await getUserFromJWT(req);
    const appUrl = ENV.appUrl().replace(/\/$/, "");

    const admin = adminClient();
    const { data: sub } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      throw new AppError(404, "billing", "No billing account yet — subscribe first");
    }

    const session = await createPortalSession({
      customerId: sub.stripe_customer_id,
      returnUrl: `${appUrl}/billing`,
    });

    return ok(req, { url: session.url });
  });
});
