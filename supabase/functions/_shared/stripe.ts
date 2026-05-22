// Thin Stripe REST client over fetch — no heavy SDK in the Deno runtime.
// Stripe's API takes application/x-www-form-urlencoded bodies (incl. bracket notation for
// nested params), so we flatten objects into form pairs. Identity/keys come from env only.
import { AppError } from "./http.ts";
import { ENV } from "./env.ts";

const STRIPE_API = "https://api.stripe.com/v1";

// Flatten { a: 1, b: { c: 2 }, d: [1,2] } -> a=1, b[c]=2, d[0]=1, d[1]=2 (Stripe's format).
function toForm(params: Record<string, unknown>, prefix = ""): [string, string][] {
  const out: [string, string][] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const field = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item !== null && typeof item === "object") {
          out.push(...toForm(item as Record<string, unknown>, `${field}[${i}]`));
        } else {
          out.push([`${field}[${i}]`, String(item)]);
        }
      });
    } else if (typeof value === "object") {
      out.push(...toForm(value as Record<string, unknown>, field));
    } else {
      out.push([field, String(value)]);
    }
  }
  return out;
}

async function stripePost(path: string, params: Record<string, unknown>): Promise<any> {
  const body = new URLSearchParams(toForm(params)).toString();
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ENV.stripeSecretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Surface Stripe's message but never the request body (may contain identifiers).
    const msg = json?.error?.message ?? "Stripe request failed";
    throw new AppError(res.status === 400 ? 400 : 502, "stripe", msg);
  }
  return json;
}

// Create a subscription Checkout Session and return its hosted URL.
export async function createCheckoutSession(opts: {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
  customerEmail?: string;
  clientReferenceId: string; // our user id, echoed back on the webhook
  metadata?: Record<string, string>;
}): Promise<{ id: string; url: string }> {
  const session = await stripePost("/checkout/sessions", {
    mode: "subscription",
    "line_items": [{ price: opts.priceId, quantity: 1 }],
    "success_url": opts.successUrl,
    "cancel_url": opts.cancelUrl,
    "client_reference_id": opts.clientReferenceId,
    ...(opts.customerId ? { customer: opts.customerId } : {}),
    ...(opts.customerId ? {} : opts.customerEmail ? { "customer_email": opts.customerEmail } : {}),
    ...(opts.metadata ? { metadata: opts.metadata } : {}),
  });
  return { id: session.id, url: session.url };
}

// Create a Customer Portal session so a teacher can manage/cancel their plan.
export async function createPortalSession(opts: {
  customerId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  const session = await stripePost("/billing_portal/sessions", {
    customer: opts.customerId,
    "return_url": opts.returnUrl,
  });
  return { url: session.url };
}

// Verify a Stripe webhook signature (the `Stripe-Signature` header) WITHOUT the SDK.
// Implements the standard scheme: signed_payload = `${t}.${body}`, HMAC-SHA256 with the
// endpoint secret, constant-time compared against one of the v1 signatures. Tolerance guards
// against replay. Throws AppError(400) on any failure so the webhook fails loud.
export async function verifyWebhook(
  rawBody: string,
  sigHeader: string,
  secret: string,
  toleranceSeconds = 300,
): Promise<any> {
  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => p.split("=").map((s) => s.trim()) as [string, string]),
  );
  const timestamp = parts["t"];
  const expected = parts["v1"];
  if (!timestamp || !expected) throw new AppError(400, "webhook", "Malformed Stripe-Signature");

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSeconds) {
    throw new AppError(400, "webhook", "Webhook timestamp outside tolerance");
  }

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, enc.encode(`${timestamp}.${rawBody}`));
  const computed = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (!timingSafeEqual(computed, expected)) {
    throw new AppError(400, "webhook", "Invalid webhook signature");
  }
  return JSON.parse(rawBody);
}

// Constant-time string compare to avoid leaking signature info via timing.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
