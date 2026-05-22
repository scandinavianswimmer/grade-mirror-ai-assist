// POST /stripe-webhook   (BILL-01/BILL-02 source of truth)
// NO JWT — Stripe calls this server-to-server. Authenticity is proven by the Stripe-Signature
// header (verified against STRIPE_WEBHOOK_SECRET). On verified events we upsert the teacher's
// subscription via the service-role adminClient (the ONLY writer to public.subscriptions, since
// RLS exposes no client write policy). We also mirror the resulting plan onto users.plan so the
// existing server-side usage gate (record-feedback-usage) keeps working unchanged.
//
// Register this URL in the Stripe Dashboard (Developers -> Webhooks):
//   https://<project-ref>.functions.supabase.co/stripe-webhook
// Subscribed events: checkout.session.completed, customer.subscription.updated,
//   customer.subscription.deleted.
//
// NOTE: this function must be deployed with JWT verification OFF (`--no-verify-jwt`) because
// Stripe cannot present a Supabase JWT. Signature verification is the auth boundary instead.
import { withErrors, ok, AppError } from "../_shared/http.ts";
import { adminClient } from "../_shared/db.ts";
import { ENV } from "../_shared/env.ts";
import { verifyWebhook } from "../_shared/stripe.ts";

// Map a Stripe Price ID back to our app plan. Configured as secrets, so this is data-driven.
function planForPrice(priceId: string | undefined): string | null {
  if (!priceId) return null;
  for (const plan of ["pro", "enterprise"]) {
    if (Deno.env.get(`STRIPE_PRICE_${plan.toUpperCase()}`) === priceId) return plan;
  }
  return null;
}

// Statuses Stripe considers "the customer is paying / entitled".
function isActive(status: string): boolean {
  return status === "active" || status === "trialing";
}

interface SubRow {
  user_id: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan?: string;
  status?: string;
  current_period_end?: string | null;
}

async function upsertSubscription(row: SubRow): Promise<void> {
  const admin = adminClient();
  const { error } = await admin
    .from("subscriptions")
    .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw new AppError(500, "db", "Failed to upsert subscription");

  // Mirror entitlement onto users.plan (free when not active) so the existing gate stays in sync.
  const effectivePlan = isActive(row.status ?? "") ? (row.plan ?? "free") : "free";
  const { error: planErr } = await admin
    .from("users")
    .update({ plan: effectivePlan })
    .eq("id", row.user_id);
  if (planErr) console.error("Failed to mirror plan onto users:", planErr.message);
}

// Resolve our user_id either from a row we already store (by customer id) or from event metadata.
async function resolveUserId(
  customerId: string | undefined,
  fallback: string | null,
): Promise<string | null> {
  if (fallback) return fallback;
  if (!customerId) return null;
  const admin = adminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.user_id ?? null;
}

Deno.serve((req) => {
  // No CORS preflight: Stripe is a server, not a browser.
  return withErrors(req, async () => {
    if (req.method !== "POST") throw new AppError(405, "method", "POST only");

    const sig = req.headers.get("Stripe-Signature") ?? "";
    if (!sig) throw new AppError(400, "webhook", "Missing Stripe-Signature");
    const rawBody = await req.text();

    const event = await verifyWebhook(rawBody, sig, ENV.stripeWebhookSecret());

    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        const userId = await resolveUserId(s.customer, s.client_reference_id ?? s.metadata?.user_id ?? null);
        if (!userId) {
          console.error("checkout.session.completed without resolvable user_id");
          break;
        }
        await upsertSubscription({
          user_id: userId,
          stripe_customer_id: s.customer ?? null,
          stripe_subscription_id: s.subscription ?? null,
          plan: s.metadata?.plan ?? "pro",
          // The session itself is "complete"; subscription.updated will refine status/period.
          status: "active",
        });
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const userId = await resolveUserId(sub.customer, sub.metadata?.user_id ?? null);
        if (!userId) {
          console.error(`${event.type} without resolvable user_id`);
          break;
        }
        const priceId = sub.items?.data?.[0]?.price?.id;
        const deleted = event.type === "customer.subscription.deleted";
        const status = deleted ? "canceled" : (sub.status ?? "inactive");
        await upsertSubscription({
          user_id: userId,
          stripe_customer_id: sub.customer ?? null,
          stripe_subscription_id: sub.id ?? null,
          plan: deleted ? "free" : (planForPrice(priceId) ?? sub.metadata?.plan ?? "pro"),
          status,
          current_period_end: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null,
        });
        break;
      }
      default:
        // Ignore unsubscribed event types; ack so Stripe doesn't retry.
        break;
    }

    // Always 200 on verified+handled events so Stripe marks delivery successful.
    return ok(req, { received: true });
  });
});
