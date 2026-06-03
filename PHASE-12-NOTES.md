# Phase 12 — Billing (Stripe)

Implements **BILL-01** (subscribe to + manage a paid plan via Stripe) and **BILL-02**
(plan/usage gating: free vs paid limits).

## What was built

### Database
- `supabase/migrations_v2/0012_billing.sql` — additive + idempotent.
  - New `public.subscriptions` table keyed by `user_id` (PK, FK → `public.users` on delete cascade):
    `stripe_customer_id`, `stripe_subscription_id`, `plan`, `status`, `current_period_end`,
    `created_at`, `updated_at`.
  - Indexes on `stripe_customer_id` + `stripe_subscription_id` (webhook lookups).
  - `updated_at` trigger reuses `public.set_updated_at()` from the 0001 baseline.
  - **RLS enabled.** Owner-scoped `select` policy only (`auth.uid() = user_id`). There is
    **no client write policy** — inserts/updates happen exclusively via the service-role
    webhook (`adminClient`, which bypasses RLS). Mirrors the privileged-column pattern on
    `public.users`.

### Edge functions (follow `_shared` conventions: withErrors/ok/AppError, handlePreflight, getUserFromJWT, adminClient, ENV)
- `supabase/functions/_shared/stripe.ts` — thin Stripe REST client over `fetch` (no SDK):
  `createCheckoutSession`, `createPortalSession`, and `verifyWebhook` (HMAC-SHA256 signature
  check via Web Crypto, replay-tolerance window, constant-time compare).
- `supabase/functions/stripe-checkout/index.ts` — **authed**. Creates a subscription Checkout
  Session for the `pro` plan and returns the hosted URL. Reuses an existing Stripe customer id
  if the webhook already recorded one.
- `supabase/functions/stripe-portal/index.ts` — **authed**. Returns a Stripe Customer Portal
  URL so a teacher can update payment / switch / cancel (the "Manage subscription" button).
- `supabase/functions/stripe-webhook/index.ts` — **no JWT** (Stripe is server-to-server; auth
  is the signature). Verifies the signature, then upserts the subscription row via `adminClient`
  and mirrors the effective plan onto `users.plan` so the existing server gate keeps working.
  Handles `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`.

### Frontend
- `src/lib/billingApi.ts` — `PLAN_LIMITS` (canonical client-side limits), `getSubscription`,
  `startCheckout`, `openBillingPortal`.
- `src/hooks/usePlan.ts` — `usePlan()` exposes `plan`, `limits`, `status`, `isPaid`, `loading`,
  and `isWithinGradingLimit(usedThisMonth)` for gating (BILL-02).
- `src/pages/Billing.tsx` — Free vs Pro tiers, Subscribe (Checkout redirect) + Manage
  subscription (Portal redirect), surfaces the current plan + monthly limits. Copy is factual
  only (no compliance/guarantee claims).
- `src/App.tsx` — lazy `Billing` import + `/billing` route (AuthGuard-protected).
- `src/components/Navbar.tsx` — "Plans & billing" item in the account dropdown.

## Plan limits (single source of truth: `src/lib/billingApi.ts` → `PLAN_LIMITS`)
| Plan | Monthly grading runs | Classes |
|------|----------------------|---------|
| Free | 25 | 1 |
| Pro | 1,000 | Unlimited |
| Enterprise | Unlimited | Unlimited |

These are the demo defaults — tune freely. Keep the client copy and the server enforcement
(below) in sync.

## Required configuration (Supabase secrets — never commit)
```
supabase secrets set STRIPE_SECRET_KEY=sk_live_or_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_PRICE_PRO=price_...          # required for Pro checkout
supabase secrets set STRIPE_PRICE_ENTERPRISE=price_...   # optional; only if enterprise checkout is enabled
supabase secrets set APP_URL=https://app.aita.example    # success/cancel/return redirects (no trailing slash)
# ALLOWED_ORIGINS must already include APP_URL for browser calls (see _shared/cors.ts).
```

### Stripe Dashboard
1. Create a recurring **Price** for the Pro plan; put its id in `STRIPE_PRICE_PRO`.
2. Developers → **Webhooks** → add endpoint:
   `https://<project-ref>.functions.supabase.co/stripe-webhook`
   Subscribe to: `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
3. Enable the **Customer Portal** (Settings → Billing → Customer portal) for the Manage button.

### Deploy note (not run here)
`stripe-webhook` MUST be deployed with JWT verification **off**, e.g.
`supabase functions deploy stripe-webhook --no-verify-jwt` — Stripe cannot present a Supabase
JWT, so the signature is the auth boundary. `stripe-checkout` and `stripe-portal` keep the
default JWT verification.

## Dependencies added
**None.** No npm packages, no new Deno deps — the Stripe integration is a thin `fetch` wrapper
(`_shared/stripe.ts`) and Web Crypto for signature verification. (`stripe.ts` reuses the
existing `@supabase/supabase-js` pin only indirectly via `_shared/db.ts`.)

## BILL-02 server-side enforcement — integration hook (intentionally NOT wired)

The grading edge functions were **not** modified (per phase constraints). Plan gating is
currently UI-only via `usePlan()`. To make the limit authoritative, plug enforcement in here:

- **Where:** `supabase/functions/grade-submission/index.ts`, immediately after
  `const { userId } = await getUserFromJWT(req);` (currently line 19), before any grading work.
- **What:** mirror the existing pattern in
  `supabase/functions/record-feedback-usage/index.ts` (weekly counter + reset + `429` on
  limit). Read `users.plan` (kept in sync by the webkook), look up the matching
  `monthlyGradingLimit` (mirror the numbers from `PLAN_LIMITS`), count this month's grading
  runs, and `throw new AppError(429, "limit", "Monthly grading limit reached for your plan")`
  when exceeded — then increment on success.
- **Suggested counter:** either reuse/extend the privileged `users.weekly_feedback_count`
  pattern (add a monthly counter column in a future additive migration) or count rows in an
  existing per-run table scoped to `userId` for the current month.
- **Keep in sync:** the limit numbers must match `src/lib/billingApi.ts → PLAN_LIMITS` so the
  UI gate (`usePlan().isWithinGradingLimit`) and the server gate agree.

Until that hook is wired, the limit is advisory (shown in the UI) but not enforced on the
grading path.
```
// grade-submission/index.ts — PLAN-GATING INTEGRATION POINT (Phase 12 / BILL-02)
const { userId } = await getUserFromJWT(req);
// >>> insert monthly-grading-limit check here (see record-feedback-usage for the pattern) <<<
```
