# aiTA — Launch & XPRIZE Plan

> Master plan for two chained goals: **Product Hunt launch this week** → **Build with Gemini XPRIZE submission by Aug 17, 2026**.
> Created 2026-06-08. Supersedes the launch sequencing in `STATE.md`/`continue.md` (those remain valid for grading/demo context).
> Companion docs: `.planning/ROADMAP.md` (production phases), `.planning/GOAL-ALIGNMENT-REVIEW.md` (punch list).

---

## 0. North star & the hard constraint

Two deadlines, deeply complementary:

| Goal | Deadline | What "done" means |
|------|----------|-------------------|
| **Product Hunt launch** | This week (~Jun 12) | Live public URL, launch-grade UI, pricing live, assets ready |
| **Build with Gemini XPRIZE** | **Aug 17, 2026 · 1pm PT** | Real users + real revenue + production proof + <3min video + writeup |

**The PH launch is the XPRIZE engine.** PH drives real users → freemium converts to paid → that becomes the revenue/user/testimonial evidence the XPRIZE scores. They are one funnel, not two projects.

**The hard constraint:** you chose a **full re-platform off Supabase to Google Cloud**, but a full re-platform cannot finish this week, and PH launches this week. Resolution — **sequence, don't serialize**:

1. **This week:** PH launches on the *current* Supabase backend, with the **frontend already moved to Firebase Hosting** (gives the public URL AND the first Google Cloud product immediately).
2. **Weeks 2–10:** the backend migrates to Google Cloud incrementally (strangler-fig — app stays working the entire time), finishing well before Aug 17.
3. **Eligibility is locked early:** Firebase Hosting + Vertex AI + Cloud Run land in the first ~2 weeks, so the XPRIZE "uses ≥1 Google Cloud product" gate is satisfied long before the risky DB/Auth migration completes.

> ⚠️ **Risk acknowledgement (founder owns this call):** Re-platforming a working, security-hardened, voice-convergence-proven app 10 weeks before a *revenue* deadline is the single biggest risk in this plan. The phasing below is designed so that revenue generation never blocks on the migration, and so the migration can stop after M3 and still satisfy XPRIZE eligibility if M4/M5 run long.

---

## 1. Workstreams

- **A. Product Hunt launch** (this week) — make it live, polished, payable, with assets.
- **B. Pricing** — design (below) + build out freemium + per-teacher subscription on live Stripe.
- **C. Google Cloud re-platform** (M0–M6) — full migration off Supabase, phased.
- **D. XPRIZE evidence** — revenue, users, production proof, video, writeup, eligibility framing.

---

## 2. Horizon A — Product Hunt launch (THIS WEEK)

### Founder actions (blockers only you can do)
- [ ] **F-A1 — Get the public URL today** (custom domain or Firebase default). Tell me the domain so I wire env + assets.
- [ ] **F-A2 — Rotate exposed secrets BEFORE public traffic:** DB password, Stripe `sk_live_`, Gemini key (all were shared in chat). New values → `supabase secrets set` (and later Secret Manager).
- [ ] **F-A3 — Create the Google Cloud project + Firebase project** (needed for hosting). Share project IDs.
- [ ] **F-A4 — Stripe live mode:** confirm a live account + products can be created (I'll define the products).
- [ ] **F-A5 — Approve pricing** (Section 3).

### My code tasks
- [ ] **A1 — Frontend → Firebase Hosting (this is M0).** Build config, `firebase.json`, SPA rewrites, env wiring to the cloud Supabase project, custom-domain steps. → live URL + first GCloud product.
- [ ] **A2 — Real README** replacing the default Lovable template (public repo is judged by XPRIZE).
- [ ] **A3 — Merge the stranded grading fix** (`aita-fix-grading-context-contract` → `main`).
- [ ] **A4 — Launch-grade UI polish:** finish redesign on the highest-traffic pages (Auth, Dashboard, SubmissionDetail are done; do Onboarding pick, CreateAssignment, AssignmentDetail, Pricing/Billing). Delete dead pages (`Upload.tsx`, `GradingPreview.tsx`, `Index.tsx`, `Onboarding.tsx`/`OnboardingFlow.tsx`, podcast pages, `GeminiSetup.tsx`).
- [ ] **A5 — Pricing page + paywall** wired to Stripe (Section 3 build).
- [ ] **A6 — Analytics sanity:** confirm PostHog captures signup → first-grade → paywall → checkout (this is your XPRIZE "user evidence").
- [ ] **A7 — PH launch assets:** tagline, 1-liner, description, gallery captions, maker's first comment, Education-angle maker story, hunter outreach list.

### PH launch-day checklist (founder)
- [ ] Assets uploaded, gallery + demo GIF, first comment queued
- [ ] Live URL smoke-tested on mobile + desktop, fresh-incognito signup works end-to-end
- [ ] Free tier works without a card; paid checkout works with a real card (test then refund)
- [ ] Support channel ready (email/Intercom) for launch-day questions

---

## 3. Horizon B — Pricing (design + build)

**Model:** Freemium + per-teacher subscription. Optimized for fast PH signups (top of funnel = XPRIZE user evidence) and fast recurring revenue (XPRIZE viability score).

### Tiers

| Tier | Price | Limits | Purpose |
|------|-------|--------|---------|
| **Free** | $0, no card | ~15 gradings/mo · 1 teacher · core grading + basic voice | Drive PH signups; top of funnel; user-evidence volume |
| **Pro** | **$15/mo** or **$144/yr** (20% off) | Fair-use ~500 gradings/mo · full voice-convergence learning loop · bulk grading · exports · priority | **The revenue driver** |
| **School / Dept** | "Contact us" | Multi-seat, admin, SSO | Lead-capture only — sales cycle too long for the 90-day sprint; list it to collect leads |

- **Trial:** new signups get a **14-day Pro trial** (no card or card-required — A/B later), then drop to Free. Boosts early conversion + revenue.
- **Price rationale:** teachers expense ~$15/mo out-of-pocket comfortably; annual option improves cash + retention (helps the "sustainability" half of the viability score).
- **Why a generous free tier:** PH rewards low-friction signups; 15 free gradings ≈ enough to feel the voice-convergence "wow," capped so power users convert.

### Build-out (much already exists)
Already present: `stripe-checkout`, `stripe-portal`, `stripe-webhook`, `_shared/stripe.ts`, `_shared/quota.ts`, `record-feedback-usage`, `Billing.tsx`, `FreemiumDashboard.tsx`, migration `0015_grading_quota_rpc.sql`.

- [ ] **B1 — Define Stripe products/prices** (Free is app-side; Pro monthly + annual price IDs).
- [ ] **B2 — Wire subscription status → plan limits:** webhook updates a `plan`/`subscription_status` on the user; `quota.ts` enforces Free vs Pro caps; grading gate reads it.
- [ ] **B3 — Pricing page** (public, launch-grade) + in-app upgrade paywall at the Free cap.
- [ ] **B4 — Apply migration `0015`** (quota RPC) — currently fails-open; needed for real gating. (Founder: DB password.)
- [ ] **B5 — Stripe live:** live keys (Secret Manager), live webhook endpoint, test a real purchase → refund.
- [ ] **B6 — Billing portal** (cancel/update card) via `stripe-portal` — required for a trustworthy paid product.

---

## 4. Horizon C — Google Cloud re-platform (M0–M6, strangler-fig)

**Principle:** the app stays fully working at every step. Migrate one concern at a time, verify parity, then cut over. Front-load the gate-satisfying surface.

### Target architecture

| Concern | Current | Target (Google Cloud) | Risk |
|---|---|---|---|
| Frontend host | none (local) | **Firebase Hosting** | low |
| LLM | Gemini Developer API (`generativelanguage`) | **Vertex AI** (Gemini) | low |
| Serverless API (~16 Deno fns) | Supabase Edge Functions | **Cloud Run** (Deno containers) | med |
| Async worker | Cloud Run-shaped, undeployed | **Cloud Run** + **Cloud Tasks/Pub-Sub** | low |
| Object storage | Supabase Storage + signed URLs | **Cloud Storage (GCS)** + signed URLs | med |
| Cron (privacy-tasks) | Supabase cron | **Cloud Scheduler** → Cloud Run | low |
| Secrets | Supabase secrets | **Secret Manager** | low |
| **Database** | Supabase Postgres + RLS (33 migrations) | **Cloud SQL for Postgres** | **high** |
| **Auth** | Supabase Auth (email+Google) | **Firebase Auth / Identity Platform** | **high** |
| Analytics | PostHog | PostHog (keep) | none |
| Payments | Stripe | Stripe (keep) | none |

### Migration phases

- **M0 — Frontend → Firebase Hosting** *(this week; = task A1).* Points at the existing Supabase backend. **Outcome: live URL + GCloud product #1.**
- **M1 — LLM → Vertex AI.** Swap `_shared/ai/gemini.ts` endpoint + auth (service account / ADC). Keep functions where they are. Low blast radius, strong "AI-native on Google Cloud" story. **GCloud product #2.**
- **M2 — Compute → Cloud Run.** Containerize the Deno functions; deploy as Cloud Run service(s); move the worker + queue to Cloud Run + Cloud Tasks; Cloud Scheduler for cron. Keep Supabase DB + Auth (functions still verify Supabase JWT for now). **GCloud products #3–5.**
- **M3 — Storage → GCS.** Move buckets, signed-URL logic, `ingest-document` I/O, retention cleanup. Migrate existing objects.
- **— Eligibility checkpoint —** After M0–M3 you have 4–5 Google Cloud products live in production. **XPRIZE gate is convincingly satisfied even if M4/M5 slip.**
- **M4 — Database → Cloud SQL for Postgres.** Port the 33 migrations; stand up Cloud SQL; backfill data; dual-read verify; cut over. Rework RLS predicates that depend on `auth.uid()` (coupled to M5).
- **M5 — Auth → Firebase Auth / Identity Platform.** The hardest: migrate users, swap client auth (45 call-sites + `ensureUserProfile` bootstrap), JWT verification in Cloud Run, rewrite RLS identity predicates. Do near-last because everything depends on identity.
- **M6 — Decommission Supabase** after full parity + a soak period.

### Migration guardrails
- One concern per PR; each ships behind config so it can be reverted.
- Parity test before every cutover (esp. M4/M5): grading round-trip, auth/login, owner-isolation (user A cannot read user B), storage signed-URL access.
- **Never** cut over DB/Auth without a verified rollback. Keep Supabase as warm fallback through M6.
- Re-run the Sleuth regression checks (F-001/F-002 + RLS isolation) after M4/M5.

---

## 5. Horizon D — XPRIZE submission evidence

Judged on 3 equal criteria. Map work to each:

### Business viability (1/3) — *revenue + sustainability*
- [ ] Stripe live (B5) so revenue is real and collectible.
- [ ] Track revenue **by month** (May–Aug) — required field. Pull from Stripe.
- [ ] Track costs (excl. marketing) + CAC spend — required fields.
- [ ] Report related-party revenue separately (rules require it) — keep founder/friend accounts flagged.

### AI-native operations (1/3) — *AI live in production making key decisions*
- [ ] The grade IS the AI executing the core business decision — document the agent pipeline (`grade-submission` → engine → evidence-verify → anchor → HITL).
- [ ] Vertex AI in production (M1) + agent execution logs as production proof.
- [ ] Voice-convergence learning loop (Phase 15) = AI improving from teacher edits — the differentiator.

### Category impact — Education & Human Potential (1/3)
- [ ] **Finish Phase 15 voice-convergence proof with a real teacher** — falsifiable edit-rate decline data ("I barely had to edit this"). This is the category-impact centerpiece.
- [ ] Collect **teacher testimonials** (required user evidence) — gather from PH users.

### Deliverables (assemble in the final 2 weeks)
- [ ] **Code repo URL** (public, real README).
- [ ] **<3-min demo video** (YouTube) — lead with the Brandon off-topic "trust moment" + Sarah's-voice convergence.
- [ ] **Text writeup** — category fit + the eligibility framing (below).
- [ ] **Financial evidence** (revenue by month, costs, CAC).
- [ ] **User evidence** (counts, demographics, testimonials).
- [ ] **Production proof** — agent logs, Vertex AI/API usage records, metrics dashboard screenshots.

### Eligibility framing (founder to finalize — "newly created after May 19")
aiTA predates the window. Rules permit pre-existing code **with a written explanation of how it was enhanced.** Honest framing: the **production system was built in the window** — full GCloud re-platform, Vertex AI, live billing/revenue, security-hardening, and the voice-convergence proof all land May 19→Aug 17. Be transparent; lead the writeup with the in-window business + technical build, not the prototype origin.

---

## 6. Sequenced timeline (today = Jun 8)

| Window | Focus |
|--------|-------|
| **Jun 8–14 (PH week)** | M0 (Firebase Hosting) · README · merge stranded fix · pricing live + Stripe live (B1–B6) · UI polish · launch assets · **Product Hunt launch** · start M1 (Vertex AI) |
| **Jun 15–Jul 6** | M1 done · M2 (Cloud Run + worker/queue) · M3 (GCS) → **eligibility locked** · begin real user acquisition · recruit Phase-15 test teacher |
| **Jul 6–Aug 3** | M4 (Cloud SQL) · M5 (Auth) · accumulate revenue + testimonials + production proof · run Phase-15 experiment (≥4 batches) |
| **Aug 3–17** | M6 decommission · stabilize · record demo video · write submission · compile evidence · **submit before Aug 17 1pm PT** |

---

## 7. Risk register

| Risk | Severity | Mitigation |
|------|----------|------------|
| Full re-platform breaks a working app | **High** | Strangler-fig; one concern/PR; parity tests; warm Supabase fallback through M6; stop-after-M3 still satisfies eligibility |
| M4/M5 (DB+Auth) run long | High | Front-loaded eligibility (M0–M3); revenue never blocks on migration |
| No paying users by Aug 17 | High | Generous free tier + low $15 price + 14-day trial; PH + teacher communities for acquisition |
| Exposed secrets abused pre-rotation | High | F-A2 rotation before any public traffic |
| "Newly created" eligibility challenge | Med | In-window build framing + transparency (Section 5) |
| Gemini free-tier rate limits under real load | Med | Vertex AI billing (M1) removes free-tier caps; key-rotation pool already in place |

---

## 8. Open founder actions (consolidated)
1. Public URL/domain — today (F-A1)
2. Rotate secrets — before public traffic (F-A2)
3. Create GCP + Firebase projects, share IDs (F-A3)
4. Stripe live account + approve pricing (F-A4, F-A5)
5. Apply migrations 0015/0016 (DB password)
6. Recruit a real test teacher for Phase 15
7. Finalize the eligibility framing in the writeup

---
*Owner legend: tasks prefixed **F-** are founder/ops actions; all others are code tasks I execute.*
