# aiTA (Grade Mirror) — Engineering Reconnaissance Briefing

> Skeptical, code-verified onboarding briefing. Repo: `~/grade-mirror-ai-assist`.
> Generated 2026-06-08 by reconnaissance pass (read-only; verified against real code, git, build/typecheck/tests).
> Where docs and code disagree, the code wins — discrepancies are flagged inline.

---

## 1. Essence

aiTA is an **AI grading co-pilot for middle/high-school teachers**. A teacher sets up a class + rubric-aligned assignment, uploads student submissions (PDF/DOCX/text), and aiTA returns rubric-aligned scores plus margin annotations written in the teacher's own voice. The teacher stays the final authority: every comment is accept/edit/dismiss, and those edits feed a "voice-convergence" learning loop. The product's differentiating promise is **trustworthiness by construction** — off-topic/adversarial submissions are flagged and withheld (never silently given a fabricated grade), evidence is verified server-side, and totals are recomputed by the server rather than trusted from the model.

---

## 2. Architecture & Stack

**Frontend** — Vite + React 18 + TypeScript + shadcn/ui (Radix) + Tailwind. ~20 pages in `src/pages/`, React Router, TanStack Query, react-hook-form + zod. PostHog analytics (no-ops if key unset). PDF via `pdfjs-dist`/`jspdf`, DOCX via `mammoth`. Deployed to **Firebase Hosting** (`firebase.json`, project `aita-5aca5`). Entry: `index.html` → `src/main.tsx` → `src/App.tsx`.

**Backend** — **Supabase** (Postgres + Deno Edge Functions). 18 edge functions in `supabase/functions/`, sharing a `_shared/` core. There is also a small async grading **worker** (`worker/index.mjs`, Dockerfile) intended for Cloud Run. No traditional Node server — all server logic is edge functions.

**The grading pipeline** (the crown jewel — genuinely production-grade, `_shared/grading/engine.ts`, 473 lines):
1. **Relevance/risk gate** (cheap `gemini-2.5-flash`, deterministic) — independently decides if the submission attempts the task; below threshold (0.5) the grade is **withheld** with `off_topic`/`grade_withheld` flags. If the check itself errors, it fails closed with `relevance_check_unavailable`/`grade_withheld`, proposes no score, and routes the work to review without calling the grading model.
2. **Rubric resolution** — loads the canonical structured rubric; if none exists, synthesizes a strict one from the assignment + class level and persists it. Refuses to grade against nothing (`missing_context` → 422, fails closed).
3. **Grading call** — schema-constrained Gemini JSON (`responseSchema`, temp 0), with a stable cacheable system prefix (system + class calibration + teacher style + few-shot exemplars + rubric) and the volatile delimited essay last.
4. **Server-side finalize** — schema-validate, **verify each evidence quote actually exists in the essay** (unverifiable evidence is capped at 50% of max score), **recompute the weighted total server-side**, anchor annotations to character offsets, add `low_confidence`/`unverified_evidence` flags.
5. **Fail-loud** — never returns a fabricated grade; persists grade + annotations + an `agent_events` pipeline trace + `llm_sessions` token accounting + `access_audit_log`.

Cost/abuse controls are real: per-request call budget (max 4 Gemini calls/grade), 100k-char essay cap, global cross-tenant rate ceiling, health-based model fallback (`pro` → `flash`), and a multi-key rotation pool for free-tier quota.

**LLM models & how** — **Google Gemini**, default `gemini-2.5-pro` for grading (overridable via `GEMINI_GRADING_MODEL` secret), `gemini-2.5-flash` for the relevance gate and as grading fallback. Structured output via Gemini's `responseSchema` (REST `generateContent`), temperature 0 for determinism, implicit prompt caching via stable-prefix ordering. Two transport backends in `_shared/ai/gemini.ts`: the default **generativelanguage API-key** path and an additive **Vertex AI OAuth** path (selected only when `GEMINI_BACKEND=vertex`/`VERTEX_AI_ENABLED` *and* GCP creds present — otherwise silently stays on the key path).

> ⚠️ **Stale/misleading:** `_shared/ai-router.ts` (the legacy v1 multi-provider router listing `lovable`/`openai`/`gpt-5-mini`/`claude-sonnet-4`/`gemini-2.5-flash`) is **NOT the active grader**. HANDOFF flags it for deletion. The live v2 grader is Gemini-only via `_shared/ai/router.ts` + `_shared/ai/gemini.ts`. Don't let `ai-router.ts` mislead you about which models run. (`.env.example` also still mentions `ANTHROPIC_API_KEY` in a stale comment — no Anthropic call path is live.)

**Data stores** — Postgres (Supabase). Schema is **v1-restored + additive v2 layer**, NOT a clean v2 baseline (intentional — never drop restored v1 data, add v2 alongside). Key v2 tables: `submission_grades`, `annotations`, `annotation_edits`, `rubric_criteria`, `teacher_style_profiles`, `teacher_feedback_exemplars`, `consent_records`, `agent_events`, `llm_sessions`, `subscriptions`, `access_audit_log`. 30+ migrations in `supabase/migrations_v2/` (`0001_baseline.sql` is reference-only — do NOT apply on the live project). File storage: Supabase Storage today; an additive **GCS adapter** exists (OFF by default).

**Payments** — Stripe (`stripe-checkout`, `stripe-portal`, `stripe-webhook` functions + `_shared/stripe.ts`). Webhook is the source of truth, upserts `subscriptions` and mirrors `users.plan`.

---

## 3. Actual Current State (verified, not claimed)

| Check | Result |
|---|---|
| **Tests** (`npm test`, vitest) | ✅ **69/69 pass** (9 files). Unit tests cover pricing, billing, plan limits, convergence metrics, assignment-context, profile bootstrap. |
| **Production build** (`npm run build`) | ✅ **Passes, exit 0** (5.5s). Code-split bundles; largest is pdf (871kB). Browserslist data 21mo stale (cosmetic warning). |
| **Typecheck** (`tsc -p tsconfig.app.json --noEmit`) | ❌ **45 errors in 9 files.** Build still passes because Vite uses esbuild and does NOT typecheck. Main cause: generated Supabase types are missing tables the code uses (e.g. `grading_batches`), plus `SubmissionDetail.tsx` type mismatches. These are **type-safety gaps, not runtime breakage** — but they mean `tsc` is not a green gate and regressions can slip in. HANDOFF/commit messages claim "tsc clean"; **that is no longer true on this branch.** |
| **Git branch** | On `aita-launch-prep`, NOT `main`. Working tree clean except untracked `STATUS.md` + `docs/loose-assets-2026-06/`. |

**⚠️ MAJOR GIT-REALITY DISCREPANCY:** `STATUS.md` claims *"Full production build is **merged to main**."* **This is false.** The 6 launch commits (Vertex AI path, Firebase Hosting, pricing UI, annual pricing + plan-limit gating, analytics funnel, paywall-at-grading-gates, GCS adapter, and the critical grading-context fix `4274336`) live **only on `aita-launch-prep`** and are **not in `main`** (verified: `git branch --contains 0f8b281` → only `aita-launch-prep`; `git rev-list --count main..aita-launch-prep` → 6). `main`'s HEAD is the Phase-15 voice-convergence merge from Jun 4. `origin/main` matches local `main` (also missing the launch work). **The launch work is unmerged and unpushed.**

**Is it deployable right now?** The frontend *builds* and can deploy to Firebase Hosting. The backend functions are written and (per HANDOFF) the core ones were deployed to the Supabase project at an earlier point — but the **launch-branch versions of functions are not confirmed deployed**, several **migrations are not applied** to the cloud DB (so quota gating fails-open, i.e. no real paywall enforcement yet), and **no end-to-end grade round-trip has ever been validated** (HANDOFF explicitly: "NOT yet validated"). So: *technically launchable as a frontend shell + earlier-deployed backend, but NOT validated, NOT gated, and the production launch code isn't on main.*

---

## 4. "Founder-config-gated" Reality — concrete blocker checklist

Everything below is config/secrets/ops that only the founder can do (sourced from `HANDOFF.md` + `.planning/LAUNCH-PLAN.md` §2/§3 + code fail-open paths):

**Security / secrets (do BEFORE any public traffic — these were shared in chat):**
- [ ] Rotate Supabase `sb_secret_` service key.
- [ ] Reset the Supabase DB password.
- [ ] Rotate/restrict the Gemini API key.
- [ ] Confirm `.env` is untracked (`git rm --cached .env` if needed).

**Stripe / billing (no revenue without this):**
- [ ] Create a **live** Stripe account + Pro monthly + Pro annual products.
- [ ] Set price-ID secrets: `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_ANNUAL` (webhook reads these to map price→plan).
- [ ] Set `STRIPE_WEBHOOK_SECRET` + register the webhook URL (`checkout.session.completed`, `customer.subscription.updated/deleted`); deploy `stripe-webhook` with `--no-verify-jwt`.
- [ ] Set live `sk_live_` key as a secret.
- [ ] Test a real purchase → refund.

**Database migrations (paywall + features are inert until applied):**
- [ ] Apply `0015_grading_quota_rpc.sql` (and `0019` monthly caps) — until applied, `enforceGradingQuota` **fails open** → there is **no real grading limit**, free users are uncapped.
- [ ] Apply the additive batch `0003`–`0011`, `0012_billing`, `0013_agent_events`, `0014`/`0016` RLS hardening, `0017` convergence, `0018` exemplars. Until applied, several code paths log-and-continue on missing columns (annotations `ai_comment`, `rubric_snapshot`, `agent_events`, `teacher_feedback_exemplars`).

**Hosting / cloud:**
- [ ] Create the Google Cloud project + Firebase project; share project IDs.
- [ ] Get the public URL (custom domain or Firebase default) so env + launch assets get wired.
- [ ] Set frontend env (`.env`): `VITE_SUPABASE_*`, optional `VITE_POSTHOG_KEY`. (Firebase web config is already in `.env.example`.)

**Function secrets (Supabase `secrets set`):**
- [ ] `GEMINI_API_KEY` (+ optional pool of keys), `GEMINI_GRADING_MODEL`, `CRON_SECRET`, `ALLOWED_ORIGINS`, `INTERNAL_GRADE_SECRET` (worker path).

**Vertex AI (XPRIZE eligibility, can lag launch):**
- [ ] Set `GEMINI_BACKEND=vertex` or `VERTEX_AI_ENABLED`, `VERTEX_PROJECT`, `VERTEX_LOCATION`, `GOOGLE_SERVICE_ACCOUNT_JSON`. Removes free-tier rate caps. Code path exists and is dormant-safe.

**GCS storage (M3, optional/later):**
- [ ] Set `STORAGE_BACKEND=gcs` + `GCS_BUCKET` + the same `GOOGLE_SERVICE_ACCOUNT_JSON`. **Caveat:** the GCS adapter's V4 signed-URL signing is marked `TODO(verify)` — never round-tripped against a real bucket. Do not rely on signed URLs there without testing.

---

## 5. Critical Path — the real next 1–3 moves to get live & earning

1. **Merge & push the launch branch.** `aita-launch-prep` (and the stranded `aita-fix-grading-context-contract`) must land on `main` and push to origin. Right now the entire production build is one unmerged local branch on one machine — a single-point-of-failure. Fix the `tsc` errors (or at least the `grading_batches` types regen) as part of this so `tsc` is a real gate again.
2. **Flip the founder config that turns the app from "shell" to "earning":** rotate secrets → apply migration `0015` (real quota gate) → set Stripe live products + secrets → deploy the launch-branch functions. This is the difference between an uncapped free demo and a gated, payable product.
3. **Run the one validation that has never happened: a real end-to-end grade round-trip** (sign in as a real teacher, grade a submission, confirm `submission_grades` + `annotations` rows + the workspace render + a real Stripe checkout). Everything else is well-tested in units but the integration path is unproven.

---

## 6. Risks, Debt, Half-Finished Threads

- **CRITICAL — production code unmerged/unpushed.** All launch work is local-only on `aita-launch-prep`. STATUS.md's "merged to main" is wrong. Highest risk: data loss / divergence.
- **No real paywall enforcement yet.** `enforceGradingQuota` fails open until `0015` is applied → free tier is currently uncapped. Cost + abuse exposure on launch day.
- **Never integration-validated.** Zero confirmed end-to-end grade runs. Browser testing was impossible in the agent env. Known fragile spots: annotation anchoring on duplicate text (first-match fallback), malformed PDFs, the upload→`ingest-document` path on real files.
- **45 tsc errors / type drift.** Generated Supabase types lag the schema (`grading_batches` and others). `tsc` is not green, so type regressions are invisible to the build.
- **Exposed secrets.** DB password, service key, Gemini key, (and live Stripe key when created) were shared in chat — must rotate before traffic.
- **Schema is v1+additive, not clean v2.** Code is littered with defensive "column may be missing → log and continue" fallbacks (a pragmatic but real maintenance tax). Applying migrations out of order, or applying `0001_baseline.sql`, will break the live DB.
- **Dead/duplicate code not yet deleted.** Legacy `ai-router.ts`, v1 edge functions (`generate-grading-feedback`, `test-ai-grading`, `generate-podcast`), and ~half-dozen dead pages (`Upload.tsx`, `GradingPreview.tsx`, `Index.tsx`, `Onboarding*.tsx`, `GeminiSetup.tsx`) still ship. Three competing onboarding flows exist; only `TeacherOnboarding` is the chosen one.
- **GCS signed URLs unverified** (`TODO(verify)`), GCS adapter entirely off-path.
- **Grading-integrity posture is strong** (relevance gate, evidence verification, server-recompute, injection delimiters, fail-closed) — this is a genuine strength, not debt. The main residual integrity risk is the relevance gate **failing open** if the flash call errors, and de-id name-masking being best-effort.
- **Bundle size:** pdf chunk 871kB (lazy-loaded, acceptable but heavy).
- **Re-platform risk (founder-acknowledged):** the plan re-platforms a working app off Supabase onto Google Cloud 10 weeks before a revenue deadline. Sequenced as strangler-fig so revenue never blocks on migration, but it's the single biggest plan risk.

---

## 7. Key Files Map

| Path | Why it matters |
|---|---|
| `supabase/functions/_shared/grading/engine.ts` | **The grading brain.** Relevance gate → prompt assembly → schema call → evidence-verify → server-recompute → anchor → fail-loud. Read this first. |
| `supabase/functions/grade-submission/index.ts` | Core grader entry point. Auth (JWT or internal-secret worker), rubric resolution, de-id, quota gate, persistence of grade/annotations/trace. |
| `supabase/functions/_shared/ai/gemini.ts` | Gemini transport: `responseSchema` JSON, temp 0, key-rotation pool, Vertex AI dual-backend, global rate ceiling. |
| `supabase/functions/_shared/ai/router.ts` | Model registry + health-based fallback (`gemini-2.5-pro` → `flash`). The *real* v2 router (not `ai-router.ts`). |
| `supabase/functions/_shared/grading/{anchor,rubric-synth,assignment-context,exemplars}.ts` | Annotation anchoring, rubric synthesis, the F-001/F-002 context-resolution fix, few-shot voice exemplars. |
| `supabase/functions/stripe-webhook/index.ts` | Billing source of truth — maps Stripe price→plan, upserts `subscriptions`, mirrors `users.plan`. |
| `supabase/functions/_shared/quota.ts` | Per-teacher grading quota gate. **Fails open** until migration `0015` applied — the paywall's enforcement point. |
| `supabase/functions/_shared/storage/gcs-store.ts` | M3 GCS adapter (OFF by default; signed-URL signing `TODO(verify)`). |
| `src/hooks/useGradingGate.ts` + `src/components/pricing/UpgradePaywall.tsx` | Frontend paywall: free-cap-hit shows upgrade dialog at grading gates (fail-open). |
| `src/pages/SubmissionDetail.tsx` | The v2 grading workspace UI (invokes grade-submission, renders grades + pen-highlighted annotations, accept/edit/dismiss). Also the source of most tsc errors. |
| `supabase/migrations_v2/*.sql` | 30+ additive migrations. `0001_baseline.sql` = reference-only (do NOT apply). `0015` = the quota RPC the paywall needs. |
| `.planning/LAUNCH-PLAN.md` | The actual launch + XPRIZE roadmap with the founder-action checklist (§2 founder blockers, §3 pricing). Most authoritative current doc. |
| `HANDOFF.md` | Detailed (but dated 2026-05-21) session handoff — accurate on architecture, **stale on git state** (predates the launch branch). |

---

## 8. Open Questions for the Owner

1. **Why is the production build still on `aita-launch-prep` and not merged/pushed?** Is the merge to `main` intended imminently, or is the branch still in flight? (STATUS.md says merged; reality says no.)
2. **Has the launch-branch version of the edge functions actually been deployed** to the Supabase project, or only the older HANDOFF-era versions?
3. **Which migrations are actually applied on the cloud DB today?** (Determines whether quota gating, agent_events, exemplars, and billing tables work or silently no-op.) Specifically: is `0015` applied — i.e. is the paywall really enforcing, or fully fail-open?
4. **Has a single real grade round-trip ever succeeded** against the live project? (Never validated per HANDOFF.)
5. **Have the exposed secrets been rotated yet?** (DB password, service key, Gemini key.)
6. **Stripe: is there a live account with products created, and which price IDs?** Webhook is built but needs the price→plan secret mapping.
7. **Do we want to delete the dead v1 surface now** (ai-router, v1 functions, dead pages, duplicate onboarding) before launch, or after? It's shipping in the bundle today.
8. **Vertex AI for launch or later?** It's dormant-safe; flipping it removes free-tier rate caps but needs the GCP service account.
</content>
</invoke>
