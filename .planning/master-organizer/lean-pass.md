# aiTA — Lean / YAGNI Pass on the 1-Year Roadmap

> **Lens:** ruthless lean (ponytail). Founder is **budget-constrained, pre-launch, ZERO real users.** Today is **2026-06-20.**
> **The only thing that earns effort right now:** the 3 must-go-rights (auto-finalize, killable voice-convergence proof, arms-length growing revenue) and the shortest path to a stranger paying.
> **The test for every item below:** *Is there a real user who needs this yet? If not, defer it behind a demand gate.*
>
> Source docs read: `docs/v2-planning/GOAL.md`, `.planning/ROADMAP.md` (14 phases + Phase 15), `.planning/STATE.md`, `.planning/LAUNCH-PLAN.md` (M0–M6 re-platform), `XPRIZE-MASTER-PLAN.md`, `docs/superpowers/specs/2026-06-18-backend-firebase-migration-design.md`, `.planning/REQUIREMENTS.md`, `docs/marketing/gtm/`.

---

## TL;DR — the verdict

The single biggest YAGNI on the roadmap is the **full Firebase/Google-Cloud backend re-platform (LAUNCH-PLAN M1–M6 + the 3-phase Firebase migration spec).** By the master plan's own admission the Google-Cloud eligibility gate is *already met* by Firebase Hosting + Gemini. Migrating 16 functions + Auth + a 23-table/21-migration DB adds **zero XPRIZE points, zero user value, and zero revenue** while consuming the exact 9 weeks the 3 must-go-rights need. Cut it to **one line of work (point Gemini calls at Vertex AI)** and defer everything else past the deadline.

Second-biggest cluster: a wave of **pre-PMF speculative systems** — referral loop, district/B2B motion, LMS/Canvas (already half-built in the repo), multi-tenant scale infra (Upstash/Cloud Run queue), KTO/DPO training, broadening beyond essays. None has a user asking for it. All should be gated behind real demand signals.

Third: **duplicate systems already in the repo** (two dashboards, dead onboarding/upload pages, a dead ai-router, an LMS integration nobody's using) that should be **deleted, not maintained or migrated.**

**Estimated effort saved: ~10–13 engineer-quarters** of the planned year arc (see tally at the bottom), and — more importantly — it clears the runway so the 9-week XPRIZE sprint isn't strangled by a re-platform.

---

## RANKED CUT / DEFER LIST (biggest scope-saving first)

### 1. CUT (to a single task): the full Firebase / Google-Cloud backend re-platform — M1–M6 + the 3-phase migration
- **What:** LAUNCH-PLAN Horizon C (M2 Cloud Run, M3 GCS, M4 Cloud SQL, M5 Firebase Auth, M6 decommission) **and** the entire `2026-06-18-backend-firebase-migration-design.md` (port 16 Deno fns → Node, flip Auth, remodel/lift the 23-table DB).
- **Why it doesn't earn its place NOW:** The XPRIZE-MASTER-PLAN explicitly says the migration **"adds ZERO XPRIZE value"** and the Google-Cloud gate is **already satisfied by Firebase Hosting + Gemini.** It generates no revenue (Criterion A), no AI-native points (Criterion B — the *grade* is the AI decision regardless of where it runs), and no category impact (Criterion C). It is a multi-quarter rewrite of a **working, security-hardened backend** (RLS proven live, rate-limit layers, de-id, right-to-erasure all shipped) — replacing working code with risk, 9 weeks before a *revenue* deadline. The migration spec even concedes Phase 1 "is independent of the launch track" — i.e. it competes with it for the same hands. This is textbook YAGNI: re-platforming for a scale that zero users are creating pressure for.
- **Cheaper / already-built alternative:** Keep Supabase (Postgres + Auth + Edge Functions + Storage) exactly as-is. For the Google-Cloud eligibility story, do **only M1: repoint `_shared/ai/gemini.ts` at Vertex AI** (low blast radius, strong "AI-native on Google Cloud" narrative, removes free-tier caps). Hosting is already on Firebase. That's **two Google-Cloud products live** — gate convincingly met. Stop there.
- **Gate that would justify revisiting:** Supabase hits a real ceiling — sustained paid load that Edge Functions/Postgres can't serve, a Supabase pricing cliff you're actually paying at, or a security/compliance requirement Supabase can't meet. None of those exist at 0 users. Revisit at **>$3–5k MRR or a contractual scale/compliance need**, not before.

### 2. DEFER: LMS / Canvas integration (and DELETE the half-built version)
- **What:** `src/pages/LMSIntegration.tsx` + `src/pages/LMSCallback.tsx` already exist in the repo; ROADMAP lists Canvas/LMS sync in "v2/Deferred" yet code is sitting there being carried.
- **Why:** Zero users → zero LMS-sync demand. REQUIREMENTS.md itself files it as "valuable, not on the critical path to trustworthy grading." LMS/Roster sync is a B2B/district feature; the GTM is teacher-individual ($15/mo, expense-it-yourself). Carrying dead integration pages adds migration surface and UI-polish debt for a feature no one can use.
- **Cheaper alternative:** Teachers upload files directly (already works — PDF/DOCX/TXT parsing shipped). **Delete `LMSIntegration.tsx` + `LMSCallback.tsx`** rather than maintain/migrate them.
- **Gate:** A signed pilot school/district that names LMS sync as a blocker to paying, or ≥3 paying teachers independently requesting Canvas. Until then, off the board.

### 3. DEFER: district / B2B / "School-Dept" multi-seat + SSO motion
- **What:** LAUNCH-PLAN pricing tier "School/Dept — Contact us, multi-seat, admin, SSO"; any admin console / seat-management / SSO build.
- **Why:** Sales cycles are months — the doc itself says "too slow for the 9-week sprint" and "deferred." Multi-seat admin + SSO is real engineering for a buyer who isn't in the funnel. Pre-PMF, the wedge is one teacher saying "I barely had to edit this," not a procurement officer.
- **Cheaper alternative:** A **single "Contact us" mailto link** for lead capture (already the stated intent). Zero build. Self-serve $15/mo Stripe for everyone.
- **Gate:** ≥3 inbound "can my whole department buy this" emails, or one warm district lead willing to sign. Then build seats. Not before.

### 4. DEFER: referral / share loop as engineered system
- **What:** `docs/marketing/gtm/referral-share-loop.md` (10.7K spec) + any referral-tracking/attribution code, double-sided incentives, share-link infra.
- **Why:** A referral loop multiplies an existing user base. With **zero users there is nothing to multiply** — it's premature optimization of a growth channel that has no input. The master plan's own channel priority is FB-proxy + Reddit + Product Hunt to acquire the *first* strangers; referral is a post-PMF amplifier.
- **Cheaper alternative:** A plain "tell a teacher friend" line in the product + manual tracking of any word-of-mouth in a spreadsheet. Build the engineered loop later.
- **Gate:** ≥25–50 active teachers with measured organic word-of-mouth already happening (so the loop has fuel). Then instrument it.

### 5. DEFER: async jobs + queue infra (Upstash Redis + Cloud Run worker) — Phase 4 / JOBS-01..05
- **What:** ROADMAP Phase 4: grading via Upstash Redis queue + Cloud Run worker; the undeployed worker; "bulk grading" at scale.
- **Why:** Queue+worker exists to absorb concurrency you don't have at 0 users. Auto-finalize (the #1 must-go-right) needs to **publish high-confidence grades unattended** — that's a confidence-threshold decision in the grading path, **not** a distributed queue. STATE marks Upstash/Cloud Run worker as "optional later." It's scale infra ahead of scale.
- **Cheaper alternative:** Synchronous (or simple background) grading on the existing function path, with idempotency + retry-on-transient already partly in place. For the "N grades/hr unattended" video moment, batch-loop the existing path — no Redis needed.
- **Gate:** A real user batches enough submissions that synchronous grading times out or rate-limits visibly. Then add a queue. (Key-rotation pool already handles the 429 case that prompted this.)

### 6. DEFER: KTO / DPO fine-tuning training pipeline
- **What:** STATE's kill-criterion fallback ("escalate to KTO") and any preference-tuning / model-training pipeline for voice-convergence.
- **Why:** Training a custom model is the most expensive possible way to learn a teacher's voice, and the proof hasn't even validated that the *cheap* approach (profile injection + few-shot exemplars) works yet. Building KTO/DPO before the in-context approach is measured is building the rocket before checking the bicycle works.
- **Cheaper alternative:** The already-shipped **style-profile injection + few-shot exemplar store** (LEARN-02..04, `build-style-profile`, `rebuild-exemplars`). The redesigned Phase-15 proof tests exactly this. Measure it first.
- **Gate:** Phase-15 proof shows in-context voice-convergence **plateaus below the bar** AND there's revenue to justify training spend. Only then consider tuning.

### 7. DEFER: broadening beyond essays + deep "pedagogical memory" vision features
- **What:** GOAL.md's "short answers, discussion responses, projects, revisions" breadth + the "digital extension of the teacher / persistent pedagogical memory / infrastructure layer for educational expertise" long-term vision, beyond the minimum profile/exemplar loop.
- **Why:** The wedge is **grades 9–12 ELA essay voice-convergence** (master plan, Cohort B). Every additional content type is a new rubric/parse/calibration surface that dilutes the one proof you must nail. The grand "infrastructure for educational expertise" vision is the Series-A story, not the pre-PMF build.
- **Cheaper alternative:** Nail essays for ELA. The existing profile + exemplar loop *is* the seed of "pedagogical memory" — don't build more memory machinery until the basic loop is proven to converge.
- **Gate:** Voice-convergence proven on essays + paying teachers asking for short-answer/other formats. Expand on demand.

### 8. CONSOLIDATE / DELETE: duplicate + dead in-repo systems (don't migrate them)
- **What:** Two dashboards (`Dashboard.tsx` + `FreemiumDashboard.tsx`); dead pages LAUNCH-PLAN A4 already flagged (`Upload.tsx`, `GradingPreview.tsx`, `Index.tsx`, legacy `Onboarding.tsx`/`OnboardingFlow.tsx`, podcast pages, `GeminiSetup.tsx`); `Pitch.tsx`; the dead `ai-router.ts` (migration spec notes it should be dropped); overlapping submit/upload pages (`PdfSubmission.tsx`, `SubmitAssignment.tsx`, `UploadTraining.tsx`, `Training.tsx`).
- **Why:** Every duplicate page is double UI-polish cost, double migration cost, and a fork-drift bug source (ponytail: many small *cohesive* files, not parallel competing ones). The Firebase migration spec would otherwise **port dead code into Node** — paying twice for code that should be deleted once.
- **Cheaper alternative:** Pick the canonical one per concern (one dashboard, one onboarding flow = `TeacherOnboarding.tsx`, one submit path), **delete the rest now** before any further build/migration touches them.
- **Gate:** None — this is pure cleanup; do it now (it's free scope reduction). Confirm the keeper per concern, then delete.

### 9. DEFER: heavyweight observability / tracing — Phase 11 OBS-01/02 beyond minimal
- **What:** Full request-tracing-per-grading-job spans, a separate jobs/events view, queryable trace infra.
- **Why:** Distributed tracing serves on-call ops at scale. At 0 users the "AI-native operations" evidence the judges want is **agent step logs** (input/output/model/latency/tokens — AGENT-02), which already exist and render in the pipeline UI. Full tracing is gold-plating the same story.
- **Cheaper alternative:** Keep the per-agent step logs (already built, demo-ready). Skip the tracing framework.
- **Gate:** Real production incidents you can't diagnose from step logs. Not a pre-launch concern.

### 10. CUT: planning/process overhead that doesn't ship value
- **What:** Overlapping, partially-contradictory plan docs: ROADMAP's 14 production phases vs Milestone-2 vs LAUNCH-PLAN's M0–M6 vs XPRIZE-MASTER-PLAN's 9-week table vs the Firebase migration spec — several actively contradict each other (LAUNCH-PLAN says "PH launch THIS WEEK," its own addendum reverses it; LAUNCH-PLAN mandates a full re-platform the master plan says adds zero value).
- **Why:** Multiple competing source-of-truth plans cost re-reconciliation every session and create the risk of executing a superseded plan (e.g. starting M2 Cloud Run because LAUNCH-PLAN still lists it). The 14-phase production roadmap is largely **already done or founder-gated** per STATE — it's no longer the live plan.
- **Cheaper alternative:** Declare **XPRIZE-MASTER-PLAN.md the single source of truth** through Aug 17; mark ROADMAP.md (14-phase) and LAUNCH-PLAN.md M-section as **superseded/archived**; delete or shelve the Firebase migration spec per cut #1. One plan, one timeline.
- **Gate:** Post-XPRIZE, write one fresh roadmap from what actually got traction.

### 11. DEFER: GTM content over-production until there's a converting funnel
- **What:** The `docs/marketing/gtm/` set is large (webinar kit + slides 16K, PH kit, FB/influencer 17K, reddit threads 17K, cohort-B sourcing 21K, trial-conversion copy, video teaser, etc.) — much written before a single user has converted.
- **Why:** Producing a full webinar deck, influencer program, and multi-channel copy library before the product has *one* paid stranger is optimizing distribution for an offer not yet validated. Channels that convert are unknown at 0 users.
- **Cheaper alternative:** Run the **two cheapest stranger-acquisition channels first** (Reddit value-posts + FB-proxy via early teacher users, per master plan), measure signup→activation, and only then invest in the channel that's working. Keep PH assets (one dated event) and the cohort-B sourcing (needed for the proof). Shelve the rest until a channel proves out.
- **Gate:** signup→activation >25% on a channel (the master plan's own Wk3 gate). Then scale that channel's content, not all of them.

---

## "Minimum actually needed" for Google Cloud (the one thing to keep from the migration)
- **Firebase Hosting** — already live. ✓
- **Vertex AI** — repoint `_shared/ai/gemini.ts` endpoint + service-account auth. ~days, low risk, removes free-tier caps, gives the "AI on Google Cloud" line. **This is the entire justified migration scope for year 1.**
- Everything else (Cloud Run, GCS, Cloud SQL, Firebase Auth, function port, DB remodel) → **deferred past the deadline behind a real-scale gate.**

---

## Effort-saved tally (rough engineer-quarters off the planned arc)

| Cut/Defer | Est. quarters saved |
|---|---|
| 1. Full Firebase/GCloud re-platform (M2–M6 + 3-phase migration) | **6–8** |
| 5. Async queue + Cloud Run worker infra | 0.5–1 |
| 2+3. LMS/Canvas + district/B2B/SSO | 1–1.5 |
| 4. Engineered referral loop | 0.5 |
| 6. KTO/DPO training pipeline | 1 |
| 7. Beyond-essays breadth + heavy pedagogical-memory | 1 |
| 9. Heavy tracing/observability | 0.5 |
| 8. Dead-code deletion (negative cost — *saves* ongoing maintenance) | (frees capacity) |
| **Total** | **~10–13 quarters** |

The decisive number: cutting the re-platform alone returns **the full 9-week XPRIZE window** to the 3 must-go-rights instead of spending it relocating a working backend for a scale no user is generating.

---

## What stays ON the critical path (do NOT cut)
1. **Auto-finalize** (confidence-threshold unattended publish) — #1 must-go-right, the AI-native proof.
2. **Voice-convergence proof v2** (GPT-judge + LUAR-aggregate + holdout, OSF pre-reg) — the moat.
3. **Stripe live + 14-day trial + free floor + PQL** — arms-length revenue engine.
4. **Deploy the built trust-fix** (grade-submission) + apply gating migration — already built, just gated.
5. **Vertex AI repoint** — the one justified piece of "Google Cloud."
6. **Cohort-B teacher recruiting + DPA** — the proof's longest pole.

*Lean-pass author's note: every deferred item is deferred behind a **named demand gate**, not deleted from the vision — the discipline is "build it when a real user creates the pressure," not "never build it."*
