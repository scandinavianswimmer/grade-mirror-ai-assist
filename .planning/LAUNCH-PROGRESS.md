# aiTA — Launch Prep Progress Log

> Autonomous 20-min loop (cron `701fe3ba`). Branch: `aita-launch-prep`. Tracks execution of `.planning/LAUNCH-PLAN.md`.
> Guardrails: no push/deploy/migrations/secret-rotation/DB-Auth-cutover. Commit locally; keep build green.

## Status legend
✅ done · 🔨 in progress · ⛔ founder-gated · ⏭ next

---

## Iteration 1 — 2026-06-08
**Done (committed):**
- ✅ Full launch plan written (`LAUNCH-PLAN.md`) — PH + GCloud M0–M6 + pricing + XPRIZE evidence.
- ✅ README replaced (Lovable boilerplate → real product README).
- ✅ Firebase Hosting configured (`firebase.json` + `.firebaserc`, project `aita-5aca5`); security headers ported + PostHog added to CSP.
- ✅ Firebase web config recorded in `.env.example`.
- ✅ **Pricing frontend** (Agent A): `src/pages/Pricing.tsx`, `src/components/pricing/*` (PricingCard, BillingIntervalToggle, UpgradePaywall, useUpgradeCheckout), `src/lib/pricingPlans.ts`, `billingApi.ts` (interval-aware), `/pricing` route (public). TS + ESLint clean.
- ✅ **Vertex AI backend path** (Agent B, M1 code): `_shared/ai/gemini.ts` (env-gated Vertex transport), `_shared/ai/google-auth.ts` (SA→OAuth mint via Web Crypto + token passthrough fallback + caching), `_shared/env.ts`, `supabase/functions/.env.example`. Default generativelanguage path byte-for-byte unchanged.
- ✅ Build green (`✓ built`), `tsc --noEmit` clean.

**Open reconciliations (logged, not blocking):**
- ⚠️ Free-tier cap mismatch: marketing copy says ~15 gradings/mo (per plan); actual gate constant in `billingApi.ts` is 25. **Founder decision: 15 or 25?** Then align both.
- ⚠️ Annual checkout: `stripe-checkout` edge fn maps only `plan`→price, ignores `interval`. Frontend now sends `interval`. Backend must branch `pro+annual`→annual price id (a `supabase/` change — next backend iteration).
- ⚠️ School/Dept contact email is placeholder `hello@aita.app` in `pricingPlans.ts`.

**Founder-gated (cannot do autonomously):**
- ⛔ `firebase login && firebase deploy --only hosting` → live URL.
- ⛔ `ALLOWED_ORIGINS` secret must include the Firebase domain or live API calls fail CORS.
- ⛔ Rotate exposed secrets (DB pw, Stripe key, Gemini key).
- ⛔ Stripe live: create Pro monthly/annual prices; set `VITE_STRIPE_PRICE_PRO_MONTHLY/_ANNUAL` + server price-id env.
- ⛔ GCP: enable Vertex AI API, create SA (`roles/aiplatform.user`), set `GEMINI_BACKEND=vertex` + `VERTEX_PROJECT` + `GOOGLE_SERVICE_ACCOUNT_JSON` secrets.
- ⛔ Apply migrations 0015/0016 (DB password).
- ⛔ Merge `aita-fix-grading-context-contract` + `aita-launch-prep` to main (needs OK).

**⏭ Next codeable (for iteration 2):**
- Annual-interval support in `stripe-checkout` + `ENV.stripePriceId` (backend).
- Wire subscription status → plan limits in `_shared/quota.ts` (Free vs Pro caps) so gating is real once live.
- UI polish + dead-page cleanup (delete `Upload.tsx`, `GradingPreview.tsx`, `Index.tsx`, `Onboarding.tsx`/`OnboardingFlow.tsx`, podcast pages, `GeminiSetup.tsx`; pick one onboarding flow) — own App.tsx routing carefully.
- PH launch assets draft (tagline, description, gallery copy, maker story).
- PostHog event coverage for paywall view → checkout start (XPRIZE user evidence).
