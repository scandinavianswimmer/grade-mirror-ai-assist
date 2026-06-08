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

---

## Iteration 2 — 2026-06-08
**Done (committed):**
- ✅ **Annual interval (backend):** `stripe-checkout` reads `interval`; `ENV.stripePriceId(plan, interval)` resolves monthly/annual; webhook `planForPrice` interval-aware. New env `STRIPE_PRICE_PRO_MONTHLY/_ANNUAL` (legacy `STRIPE_PRICE_PRO` still works).
- ✅ **Plan-limit enforcement (backend):** canonical caps in new `_shared/plan-limits.ts` (Free=15, Pro=500); webhook→`users.plan`→`consume_grading_quota`→`grade-submission` flow; **new migration `0019_grading_quota_monthly_caps.sql`** fixes the broken `0015` (it used weekly caps keyed on a `'freemium'` label that never matched `'free'`/`'pro'` → free users were effectively uncapped). Fail-open preserved until applied.
- ✅ **PostHog funnel events (frontend):** `pricing_page_viewed`, `paywall_viewed{source}`, `upgrade_clicked{plan,interval}`, `checkout_started{plan,interval}` wired into Pricing/Paywall/checkout hook.
- ✅ **Free-cap reconciled:** `billingApi.ts` 25/1000 → **15/500** to match backend + plan.
- ✅ **Launch assets drafted:** `docs/launch/PRODUCT-HUNT.md` (taglines, gallery, maker comment, checklist) + `docs/launch/XPRIZE-SUBMISSION.md` (criteria mapping, deliverables checklist, <3min video script, eligibility framing).
- ✅ Build green, `tsc` clean.

**New founder-gated (added):**
- ⛔ **Apply migration `0019`** (DB password) — turns on real Free-vs-Pro gating. Until then grading fails open. (`0015` is superseded; `0019` is the live one.)
- ⛔ Set `STRIPE_PRICE_PRO_MONTHLY` + `STRIPE_PRICE_PRO_ANNUAL` secrets (server-side) in addition to the `VITE_` ones.

**⏭ Next codeable (iteration 3):**
- Dead-page cleanup + onboarding-flow consolidation (own App.tsx routing carefully; verify build) — delete `Upload.tsx`, `GradingPreview.tsx`, `Index.tsx`, `Onboarding.tsx`/`OnboardingFlow.tsx`, podcast pages + `generate-podcast`, `GeminiSetup.tsx`.
- UI polish on remaining old-styled pages (CreateAssignment, AssignmentDetail, Profile, Training, UploadTraining) to the Marginalia system.
- Fire `paywall_viewed` from the actual cap-hit render sites (callers weren't in iteration-2 scope).
- M2 scaffolding: containerize an edge function for Cloud Run (Dockerfile + entry) as a proof, non-destructive.

---

## Iteration 3 — 2026-06-08
**Done (committed):**
- ✅ **Dead-page cleanup (frontend):** deleted 8 dead/duplicate files (`Upload.tsx`, `GradingPreview.tsx`, `Index.tsx`, `Onboarding.tsx`, `OnboardingFlow.tsx`, `PodcastDetail.tsx`, `PodcastGenerator.tsx`, `components/GeminiSetup.tsx`); removed 7 lazy imports + 6 routes from `App.tsx`. Onboarding consolidated to the single `TeacherOnboarding` flow. No dangling nav. tsc + build verified green by the agent.
- ✅ **M2 Cloud Run proof (non-destructive):** hardened `worker/` for Cloud Run (`$PORT` bind, `.dockerignore`); new `deploy/cloud-run/` — generic Deno Dockerfile + `serve-edge-function.ts` shim that runs an **unmodified** Supabase edge function on Cloud Run ($PORT), worked example `grade-submission`, + README with exact `gcloud run deploy` commands and Supabase→Cloud Run secret mapping. Strangler-fig: Supabase path keeps working. **This is the Google Cloud product that locks XPRIZE eligibility** (alongside Vertex AI from M1).
- ✅ Build green, `tsc` clean.

**New founder-gated (added):**
- ⛔ Deploy the Cloud Run service (`gcloud builds submit` + `gcloud run deploy` per `deploy/cloud-run/README.md`) → locks the GCloud-product gate live. Needs gcloud auth + project + secrets.

**⏭ Next codeable (iteration 4):**
- UI polish on remaining old-styled pages (CreateAssignment, AssignmentDetail, Profile, Training, UploadTraining) → Marginalia design system.
- Fire `paywall_viewed` + enforce the Free cap UX at the real grading cap-hit sites (wire `UpgradePaywall` where a Free user is blocked).
- README/docs: add the public URL + a screenshot/GIF once the founder deploys.
- M3 scaffolding (Storage → GCS) design doc + a non-destructive adapter sketch.
- Consider merging `aita-launch-prep` once the founder OKs (still local-only).

---

## Iteration 4 — 2026-06-08
**Done (committed):**
- ✅ **Paywall wired at grading gates (frontend):** new `src/hooks/useGradingGate.ts` (fail-open `atCap` = free plan + monthly grade count ≥ 15); `AssignmentDetail` (bulk grade) + `SubmissionDetail` (single grade) now show `UpgradePaywall` (source-tagged) instead of grading when a Free user is at cap. Pro/Enterprise/within-limit/unknown users grade normally. `paywall_viewed` fires on render. **This is the conversion mechanic** (Free cap → upgrade → revenue).
- ✅ **Test coverage:** 36 new unit tests (`pricingPlans.test.ts`, `billingApi.test.ts`, `planLimitsShared.test.ts`) — annual-savings math, price points, `PLAN_LIMITS` 15/500, interval forwarding, `monthlyGradingLimit`. Full suite **69 passing**.
- ✅ Discovery: the 5 "old-styled" pages already use Marginalia design tokens (0 hardcoded colors) — **UI-polish task was stale, dropped.**
- ✅ tsc clean, build green, tests green.

**Notes / minor (non-blocking):**
- `vitest.config.ts` `include` glob is `src/**` only → backend tests under `supabase/` aren't collected; the shared plan-limits module is covered via a `src/lib/` test instead. Broaden the glob later if backend tests should live beside source.

**⏭ Next codeable (iteration 5):**
- M3 (Storage → GCS) design doc + non-destructive adapter sketch in `_shared/` (mirrors the M1/M2 strangler pattern).
- Public-repo hygiene for judges: ensure `.env`/secrets fully gitignored, LICENSE, CONTRIBUTING note, screenshot placeholders in README (real shots after founder deploys).
- Reconcile `freemiumApi`/`usePlan` usage source with the new monthly-cap semantics if any drift.
- Approaching done: after M3 sketch + repo hygiene, remaining work is largely founder-gated (deploys, secrets, Stripe, migrations, real users/revenue) → prepare to CronDelete and hand off.
