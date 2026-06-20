# aiTA — 1-Year Roadmap (Four 90-Day Sprints)

**Created:** 2026-06-20 · **Horizon:** Jun 20 2026 → Jun 15 2027
**Author basis:** GOAL.md (7 non-negotiables + strategic thesis), XPRIZE-MASTER-PLAN.md, LAUNCH-PLAN.md, STATE.md, GOAL-ALIGNMENT-REVIEW.md, the Firebase backend-migration design (2026-06-18), the competitive-whitespace deep-research report (`final_report_ai-grading-competitor-whitespace-fc4570.md`), and the GTM deep-research report referenced by the master plan.

---

## 0. The spine everything hangs on

**The 7 non-negotiables (GOAL.md) — the contract no sprint may violate:**
1. HITL approval is mandatory. 2. AI suggestions stay editable. 3. Feedback is rubric-aware. 4. Outputs align with teacher voice. 5. Teacher trust > automation speed. 6. Educational quality > aggressive automation. 7. Context/memory are core features.

**Strategic thesis:** aiTA is *infrastructure for capturing, preserving, and scaling educational expertise*.

**The one defensible move (from the whitespace report):** a **closed per-teacher voice loop** — drafts that converge toward how *this* teacher writes feedback, that she reviews and *owns*. Every funded competitor (CoGrader, Brisk, Edexia, MagicSchool, EssayGrader, Graide, Pensive) ships voice as a *manual overlay*; none ships a correction-history → generation-shift loop at the generation step. That gap is **real but perishable** — Edexia is literally hiring to build it. The single strategic variable for the year is **time-to-per-teacher-voice-density**, not feature completeness.

**Three hard truths that shape the arc:**
- **No real users yet.** Every "growth" KR in S1 starts from zero. The hardest XPRIZE gate is "did an *arms-length stranger* pay," not "is the demo cool."
- **The auto-finalize tension vs. non-negotiable #5.** Confidence-thresholded auto-finalize (the #1 XPRIZE must-go-right) is "On-the-Loop," not "out-of-the-loop." It is only goal-consistent if low-confidence/off-topic always routes to the teacher and the teacher can audit/override every auto-finalized grade. The whitespace report's failure-mode #2 (review collapses into rubber-stamping) is the live risk: if review becomes theater, both the trust guarantee *and* the learning signal die. **Auto-finalize must never silence the human on the cases that carry signal.**
- **Edit-rate-decline is a dead metric.** Borchers (n=117): 51.3% of teachers never edit AI feedback. The proof must use GPT-judge voice-trait fidelity (primary) + aggregated LUAR-MUD cosine + LZ77 corroborators + a with/without holdout, **pre-registered on OSF**. KTO (binary accept/reject), not naive pairwise DPO, is the load-bearing learning technique.

**Arc:** S1 SHIP+PROVE → S2 GROW+HARDEN → S3 SCALE+MOAT → S4 PLATFORM. Each sprint's exit gate is an *off-ramp / kill check*, not a victory lap.

---

## SPRINT 1 — SHIP + PROVE (Jun 20 → Sep 18 2026)

> Contains the XPRIZE submission (Aug 17) and the back-to-school launch (mid-Aug → Sep).

**Theme:** Get the trust-fix live, prove the voice wedge with real teachers, submit XPRIZE, launch into back-to-school for arms-length revenue.

**Strategic objective:** Convert a built-but-undeployed system into a *live, paid, proven* product. Land all three XPRIZE must-go-rights (auto-finalize, killable voice-proof, arms-length growing revenue) and a credible viability floor. This sprint is a sequence of off-ramps, not a growth curve.

### Key Results (measurable)
- **KR1 (proof):** OSF pre-registration filed by **Jul 7**; voice-convergence proof run across **≥4 batches** with **4–6 Cohort-B gr9–12 ELA teachers**; VERDICT.md filled with a real go/no-go against the pre-registered kill criterion (GPT-judge fidelity uplift with-vs-without holdout, p-backed; LUAR + LZ77 corroborators agree in direction).
- **KR2 (revenue):** **≥48 paying teachers / ~$720 MRR** by Aug 17 (honest floor), with **arms-length % tracked and ≥1 documented arms-length paid conversion**; related-party revenue quarantined.
- **KR3 (AI-native):** confidence-thresholded **auto-finalize live in production**, demonstrably grading an unattended test batch with low-confidence/off-topic routed to the teacher; agent-pipeline logs (input/output/model/latency/tokens) demo-ready.
- **KR4 (ship gate):** `grade-submission` trust-fix **deployed**; migrations **0015–0021 applied**; Stripe **live**; Firebase Hosting live URL smoke-tested signup→first-grade→checkout.
- **KR5 (submission):** all **7 XPRIZE deliverables** assembled and submitted **≥24h before Aug 17 1pm PT** (repo+README, <3-min video showing unattended grading + voice + refusal, writeup, financials by month, user evidence, production proof, testimonials).

### Workstreams
- **Product:** Build auto-finalize (confidence-threshold publish; On-the-Loop exception UI — leverages the shipped On-the-Loop monitoring UI). 14-day full-access trial + 15-grade/mo free floor + grade-12 PQL trigger. Pre-load Sarah-Martinez seed as Cohort-A sample essays (no PII). Launch-grade UI polish on signup→grade→paywall path. *(Files: `grade-submission`, `_shared/grading/auto-finalize`, trial/quota gating, `_shared/quota.ts`, paywall/Billing.)*
- **Growth/GTM:** Recruit strangers — Facebook teacher groups via teacher-proxy + free-PD webinars (no direct self-promo = ban), Reddit value-posts, referral loop (in-app referral spec already built), Product Hunt launch **Wk6 (~late Jul)** as a one-day spike timed to back-to-school. Hold **$15/mo + ~$150/yr**; lead with time-saved + authorship, never bias (spooks AI-skeptics).
- **Proof/eval:** Redesigned proof harness (GPT-judge rubric + LUAR-MUD aggregate + holdout + LZ77 + pre-registered kill criterion). Calibrate LUAR **in-domain** (do NOT reuse Reddit defaults). Cohort-B DPAs signed; ≥8–10 reference essays/teacher collected pre-enrollment. *(Files: `.planning/phase-15-voice-convergence-proof/`, proof harness, OSF prereg.)*
- **Infra/migration:** Firebase Hosting already live. Confirm Vertex/Gemini path + key-rotation pool under real load. **Do NOT start the Firebase Functions migration this sprint** — it is explicitly non-blocking and deferred to S2. Apply migrations; rotate exposed secrets (DB pw + `sk_live_`) before public traffic.
- **Compliance:** Foreground the already-shipped send-time de-identification (keeps student PII out of Vertex). ToS attestation + SDPC NDPA (~5–7 days, <$2k). Cohort A = de-id only (no PII); Cohort B = DPAs + de-id. All copy "FERPA-aware," never "fully compliant." Write the "newly created after May 19" eligibility paragraph + verify rule language.

### Entry gate
Trust-fix deployable; founder available for the deploy/Stripe/DB/DPA/recruiting/OSF/video actions (all founder-gated). PR #14 mergeable.

### Exit gate (off-ramp logic)
- **HARD:** trust-fix live + auto-finalize unattended on a test batch + Stripe live + ≥10 active teachers by Wk2, else launch slips.
- **Wk7 KILL-GATE (Aug 2):** does the proof clear the pre-registered kill criterion? **If NO → pivot Criterion-C narrative to measured time-savings + refusal-trust (do NOT fabricate a voice claim), and treat voice convergence as an S2 R&D problem, not a shipped moat.**
- **XPRIZE:** submitted early. Then: did back-to-school convert PH/FB trials to paid?

### Top risks
1. **Proof fails / signal too sparse to converge in ELA** (the shared falsifier for both GTM and moat). → Wk7 kill-gate + time-savings fallback narrative.
2. **Auto-finalize erodes HITL trust** (non-negotiable #5) if thresholds are loose or override is buried. → conservative threshold, mandatory routing of low-confidence/off-topic, full auditability of auto-finalized grades.
3. **Zero arms-length revenue** (strangers don't pay) — founder-network dollars don't count. → PH + Reddit + FB-proxy + referral; lead with ROI.
4. **Founder-gated bottlenecks** (deploys, DPAs, recruiting, OSF, video) compress against the Aug-17 cliff. → front-load all three must-go-rights to Wk1–3; never touch the 1pm cliff.

### Explicit non-goals / deferrals
- **No Firebase Functions/Auth/DB migration** (S2+). - **No B2B/district sales** (procurement cycle too slow; collect leads only). - **No eval-in-CI** (S2). - **No KTO/online learning** (S3 — S1 ships the few-shot voice loop + binary signal *capture*, not the training loop). - **No expansion beyond gr9–12 ELA essays.** - **No bias-led teacher messaging.**

---

## SPRINT 2 — GROW + HARDEN (Sep 19 → Dec 17 2026)

**Theme:** Turn the launch spike into a repeatable PLG funnel, harden quality with eval-in-CI, and begin the non-blocking Firebase Functions migration.

**Strategic objective:** Establish that aiTA *gets stickier with use* (the coupled PLG+flywheel bet) and that quality is gated, not hoped. Beat the 23%-GRR death rate of undifferentiated AI tools by making voice-convergence experientially obvious inside the first 1–2 grading sessions.

### Key Results
- **KR1 (growth):** **≥200 active teachers**, MRR **≥$2.5K**, with arms-length share **≥60%** and a working referral coefficient tracked (target k > 0.3).
- **KR2 (activation/stickiness):** **signup→activation >35%**; **week-4 retention ≥40%**; convergence "wow" lands within **first 1–2 grading sessions (3–5 papers)** for ≥60% of activated teachers (instrumented).
- **KR3 (quality gate):** **eval-in-CI live** — the proof harness runs on every prompt/model change; the off-topic-100/100 regression + injection + voice-fidelity floor **fail the build**; reference dataset versioned.
- **KR4 (migration):** Firebase Functions migration **Phase 1 proven** — `create-class` + `generate-style-summary` ported to Cloud Functions (Node/TS) behind the invoker shim, **with `grade-submission` still on Supabase** (non-blocking, app never breaks).
- **KR5 (onboarding):** onboarding gate captures ≥10 samples + class subject/level + harshness; cold-start path measured (no "day-one generic" cliff that churns week-one users).

### Workstreams
- **Product:** Onboarding gates that fight rubber-stamping (surface low-confidence + withheld, require explicit touch on flagged cases, route the hard ~10% to the teacher — this is where trust-through-refusal *earns its keep* and where high-value preference signal is captured). Conversion/paywall optimization. In-product "your voice is getting closer" feedback so convergence is *felt*.
- **Growth/GTM:** PLG loop — referral program, free-PD webinars cadence, content/AI-SEO seeding (slower channels now worth starting), ELL-heavy-classroom beachhead messaging ("no punitive detection" converts in >25–30% ELL rooms). Watch for the "3+ teachers per school" institutional-upsell signal — *capture* it, don't yet *chase* it.
- **Proof/eval:** Convert the one-shot XPRIZE proof into **continuous eval-in-CI**. Versioned reference dataset (off-topic + injection + teacher cases). Track edit-burden / accept-latency / fidelity per teacher over time as the live "it learns me" artifact. Instrument binary accept/reject signal capture (the future KTO training data) — **capture now, train in S3**.
- **Infra/migration:** Begin Firebase Functions strangler **Phase 1** (proof-first: `create-class` → `generate-style-summary` → Stripe trio/ingest/privacy → `grade-submission` last). Port `_shared/` once into `functions/src/shared/`. Secrets → Firebase Secret Manager. *Never block the live revenue path.* *(Files: `docs/superpowers/specs/2026-06-18-backend-firebase-migration-design.md`, new `functions/`, `src/lib/fnInvoke.ts` shim.)*
- **Compliance:** Maintain de-id + DPA posture as user count grows. Begin structuring retention/deletion for a future legal review. FERPA-aware copy audit across the app.

### Entry gate
S1 exited with proof go (or an honest time-savings pivot) + live paid product + ≥48 paying teachers. If proof was killed in S1, S2's KR2/flywheel KRs are *replaced* by a focused voice-convergence R&D track (see "pivot" note) before growth scaling resumes.

### Exit gate
- Signup→activation >35% and week-4 retention ≥40% (the flywheel is real), else the GTM thesis is in question → re-examine ICP/onboarding before scaling spend.
- Eval-in-CI green and gating. - Functions Phase 1 proven on ≥2 functions without a production incident.
- **Kill/pivot check:** if GRR is tracking toward the 23% commodity death rate and convergence is *not* felt early, escalate to S3's KTO loop as the top priority (the moat isn't forming on few-shot alone).

### Top risks
1. **Flywheel idles** — convergence not felt early → week-one churn → PLG collapses to a price race against bootstrapped EssayGrader. → instrument early-session "wow"; difficulty-based case selection to capture signal fast.
2. **Review collapses into rubber-stamping** → trust guarantee hollow + signal starved. → onboarding/UI that resists "approve all."
3. **Migration leaks into the revenue path** despite "non-blocking" intent. → strict one-function-at-a-time, invoker shim, `grade-submission` untouched until last.
4. **Competitor ships voice-learning first** (Edexia). → speed; deepen behavioral signal beyond the edit bit (accept latency, criterion-level flags) that a competitor can't reconstruct from the UI.

### Explicit non-goals / deferrals
- **No Auth migration** (Phase 2 = S3). - **No DB-target decision** (Phase 3 = S4). - **No district/LMS integration build** (S3 exploration only). - **No KTO/online training loop yet** (capture signal only). - **No expansion beyond ELA essays.**

---

## SPRINT 3 — SCALE + MOAT (Dec 18 2026 → Mar 17 2027)

**Theme:** Turn the captured correction history into a real, compounding switching cost (the KTO loop), flip Auth to Firebase, and run controlled B2B/LMS exploration.

**Strategic objective:** Build the actual moat — make replacing aiTA "feel like starting over" (Bessemer's emotional switching cost; the 70%-GRR dynamic of vertical AI). This is where the strategic thesis ("scaling educational expertise") starts to be *true*, not narrated.

### Key Results
- **KR1 (moat / learning loop):** **KTO (binary-signal) voice-learning loop live in production** — accept/reject + sparse-rejection signal measurably shifts next-draft generation per teacher; **measured edit-burden reduction over session count** on a holdout (the honest "fast-then-plateau / FSPO ~8-examples" shape, claimed as measured-not-unbounded).
- **KR2 (retention/moat proof):** **GRR ≥60%** (toward the ~70% vertical-AI benchmark); demonstrable per-teacher switching cost (teacher-reported "feels like starting over" + ≥X papers of accumulated history).
- **KR3 (scale):** **≥800 active teachers**, MRR **≥$8K**; ≥3 schools showing the "3+ teachers/school" density signal.
- **KR4 (migration):** Firebase **Auth migration (Phase 2) complete** — frontend on Firebase Auth, ported functions verify Firebase ID token, the **21 direct `supabase-js` frontend reads routed through functions**; `grade-submission` ported to Cloud Functions.
- **KR5 (expansion exploration):** **B2B/district + LMS (Google Classroom/Canvas) discovery** — ≥5 design-partner conversations, a validated (or invalidated) institutional motion, an LMS-integration spike — **build decision deferred to S4**.

### Workstreams
- **Product:** KTO learning loop at the generation step (the single most load-bearing engineering decision in the company — getting it wrong means the moat never forms). Difficulty-based case selection (hardest ~10% to the teacher — DPO reaches full performance on 10% of data when it's the hard cases). Deepen behavioral signal capture. Pedagogical-memory surfacing (the teacher sees aiTA "remembering" her standards). *(Files: `_shared/grading/exemplars`, style-profile build, learning-loop training job.)*
- **Growth/GTM:** Scale PLG; activate the "3+ teachers/school" → low-touch institutional outreach (not cold procurement — the AllHere/Writable wreckage proves cold district sales fail without usage evidence). ELL beachhead expansion. Annual-prepay push for retention/cash.
- **Proof/eval:** Eval-in-CI now gates the KTO loop (no regression in voice fidelity, calibration, off-topic catch, injection resistance from a model/loop change). Longitudinal convergence dashboard per teacher.
- **Infra/migration:** Firebase **Phase 2 (Auth)** — clean cutover (no real-user password import: recreate accounts; but by S3 there ARE real users, so this needs a real migration plan — **revise the migration design's "no real users" assumption**, see "sequencing decisions"). Route direct reads through functions. Postgres still the DB (accessed via service-role through functions), which sets up Phase 3.
- **Compliance:** Auth migration must preserve owner-isolation (RLS identity predicates → Firebase ID token). Re-run isolation parity tests (user A cannot read user B). DPA posture scales with B2B exploration.

### Entry gate
S2 exited with a real flywheel (activation/retention KRs met) + eval-in-CI gating + Functions Phase 1 proven. Enough accumulated correction history per teacher to train KTO (the signal density the whitespace report flags as the central unvalidated bet — if S1/S2 show ELA edit signal is as sparse as Borchers' STEM data even with binary KTO, this gate fails).

### Exit gate
- KTO loop shows **measured** convergence on a holdout, or it doesn't — **honest kill check:** if binary-signal learning does not measurably reduce edit-burden over sessions in ELA, the inherent moat does not exist; pivot the durable differentiator to deep behavioral context + workflow lock-in + trust posture, and compete on execution/distribution rather than an algorithmic moat. **No ego-boost — this is the make-or-break technical bet.**
- Auth migration complete with verified rollback + isolation parity green.
- B2B/LMS motion validated or explicitly killed before any S4 build.

### Top risks
1. **KTO doesn't converge in ELA** (the inherent-moat falsifier). → behavioral-signal + workflow-lock fallback; difficulty-based selection to maximize signal.
2. **Auth migration breaks owner-isolation or logs out real users.** → migration design assumes no real users — that's now false; needs a real Firebase Auth user-migration plan + dual-auth window or scheduled cutover with comms.
3. **Disclosure-devaluation backlash** — better mimicry without genuine authorship can *worsen* student trust. → keep authorship-via-mandatory-review the core mechanism, not concealment.
4. **B2B distraction** pulls focus from the moat. → discovery only, build deferred.

### Explicit non-goals / deferrals
- **No DB migration / Firestore-vs-CloudSQL decision** (S4). - **No multi-tenant district build** (S4, gated on S3 validation). - **No expansion beyond ELA essays into other subjects/formats yet** (S4). - **No grand-prize / gross-revenue-race positioning.**

---

## SPRINT 4 — PLATFORM (Mar 18 → Jun 15 2027)

**Theme:** Make the strategic thesis real — pedagogical-memory as a platform, the DB-target decision, multi-tenant scale, and the first deliberate broadening beyond essays.

**Strategic objective:** Move from "a grading tool with a voice loop" to "infrastructure for capturing/scaling educational expertise." Complete the backend migration (DB decision) and build the multi-tenant + memory features that make aiTA a platform, not a feature.

### Key Results
- **KR1 (platform/memory):** **pedagogical-memory features live** — accumulated per-teacher standards/exemplars are queryable, portable across assignments/classes, and visibly reused (the "digital extension of the teacher"); ≥1 expertise-scaling feature beyond single-essay grading shipped.
- **KR2 (DB migration):** **Phase 3 DB-target decision made and executed** (Firestore NoSQL remodel vs Cloud SQL lift-and-shift), with all data access already flowing through functions (Phase 2 set this up); migration completed with verified parity + rollback.
- **KR3 (scale/business):** **≥2,000 active teachers**, MRR **≥$20K**, GRR **≥65%**; first **institutional/district contract(s)** closed if S3 validated the motion (else explicitly parked).
- **KR4 (expansion):** validated broadening beyond gr9–12 ELA essays — **one new format or grade-band** shipped (e.g., short-answer/discussion responses, or another writing-heavy subject), proven to retain the voice loop's value.
- **KR5 (multi-tenant):** multi-tenant scale + admin/SSO foundation for B2B, with owner-isolation provably preserved at tenant scale.

### Workstreams
- **Product:** Pedagogical-memory platform features (portable teacher expertise, cross-class/cross-assignment memory — directly serves non-negotiable #7 + the strategic thesis). LMS integration if S3 validated it. New format/grade-band expansion. Multi-tenant admin.
- **Growth/GTM:** Layer enterprise advocates once 20–30 teachers cluster in a district (the validated land-and-expand end-state). Maintain PLG as the top of funnel. Annual + institutional pricing.
- **Proof/eval:** Eval coverage extends to new formats/grade-bands (no quality regression on expansion). Continued longitudinal moat measurement.
- **Infra/migration:** **Phase 3 DB** — make the deferred decision now that Phases 1–2 contained the blast radius. Multi-tenant data model. Decommission remaining Supabase. *(Files: migration design Phase 3, new DB layer behind functions.)*
- **Compliance:** Full legal-review-ready retention/deletion + tenant data isolation; FERPA-aware posture scaled to institutional buyers; SSO/admin governance.

### Entry gate
S3 exited with a *measured* moat (KTO convergence) or an honest pivot to behavioral/workflow lock-in + a validated-or-killed B2B/LMS motion + Auth on Firebase with isolation parity. Sufficient scale + retention to justify platform investment (don't build platform features for a churning base).

### Exit gate
- Pedagogical-memory features in use and retaining. - DB migration complete with parity + rollback + Supabase decommissioned. - Expansion format retains the voice loop's value (or is rolled back). - GRR ≥65% (the moat is durable) — **if retention is still commodity-level, the platform thesis is unproven; do not raise/scale on it.**

### Top risks
1. **Platform-building ahead of demand** (YAGNI/speculative generality) — building multi-tenant + memory + expansion before the base proves durable. → gate every platform feature on retention evidence.
2. **DB migration (highest-irreversibility decision) breaks production.** → Phase 1–2 routed all access through functions specifically to contain this; parity + rollback mandatory.
3. **Expansion dilutes the wedge** — broadening beyond ELA essays before the core moat is locked re-opens the commodity race. → one format at a time, prove value retention.
4. **Foundation models commoditize generation** — rising base-model floor erodes any non-memory differentiator. → lean into the per-teacher corpus + memory (the only durable asset).

### Explicit non-goals / deferrals
- **No premature multi-subject sprawl** beyond one validated expansion. - **No cold district procurement** without bottom-up density. - **No abandoning HITL/authorship** for fuller automation (violates non-negotiables #1, #5, #6).

---

## Goal-consistency check (every sprint vs. the 7 non-negotiables + thesis)

| Non-negotiable | How the roadmap honors it |
|---|---|
| 1. HITL mandatory | Auto-finalize is On-the-Loop with mandatory routing of low-confidence/off-topic (S1); anti-rubber-stamp UI (S2); authorship-via-review is the core value mechanism throughout. |
| 2. Editable suggestions | Preserved in every sprint; edits are also the learning signal (S2 capture → S3 KTO). |
| 3. Rubric-aware | Trust-fix + rubric-synth (S1); eval-in-CI gates rubric alignment (S2+). |
| 4. Teacher-voice-aligned | The entire spine — proven (S1), felt-early (S2), compounding via KTO (S3), portable memory (S4). |
| 5. Trust > speed | Auto-finalize is conservative + auditable; refusal/abstention kept; trust posture leads compliance. |
| 6. Quality > automation | Eval-in-CI gates every change (S2+); expansion gated on value retention (S4). |
| 7. Context/memory core | Signal capture (S2) → learning loop (S3) → pedagogical-memory platform (S4) — the thesis made real. |

**Where the master plan and reality conflict (flagged):**
- The Firebase migration design's **"no real users yet → clean Auth cutover"** is true *today* but **false by S3**. The S3 Auth migration needs a real user-migration plan (this roadmap calls it out as a top S3 risk + sequencing decision).
- The old LAUNCH-PLAN's **full Supabase→GCloud re-platform on a 10-week clock** (M0–M6 by Aug 17) was over-aggressive; the newer Firebase migration design's **non-blocking strangler over S2–S4** is the realistic shape this roadmap adopts. The re-platform does **not** finish before XPRIZE and does not need to (Hosting already satisfies the Google-Cloud-product gate).
- **Edit-rate-decline** as the proof metric (old Phase 15) is dead; this roadmap uses the redesigned GPT-judge + LUAR + holdout harness throughout.

---

## The three biggest sequencing decisions (and the rationale)

1. **Capture the binary signal in S1–S2, but defer the KTO training loop to S3.** S1 ships the few-shot voice loop and *instruments* accept/reject signal; the actual KTO online-learning loop (the real moat) waits until there's enough per-teacher correction history to train on. Building KTO too early (before signal density exists) trains on noise; building it too late lets Edexia close the gap. S3 is the earliest sprint with both the data and a stable funnel — but if S1/S2 show ELA edit-signal is fatally sparse even for binary KTO, that's the make-or-break kill check, surfaced honestly at the S3 entry gate.

2. **Backend migration runs as a strictly non-blocking strangler behind the live revenue path, sequenced Functions (S2) → Auth (S3) → DB (S4) — never before revenue is proven.** The launch ships on Supabase + Firebase Hosting (S1). Functions port one-at-a-time with `grade-submission` *last* (S2). The most-irreversible decision (DB target) is deferred to S4 once Phases 1–2 route all access through functions and contain the blast radius. This protects XPRIZE revenue and the launch from migration risk — the single biggest risk the LAUNCH-PLAN itself named.

3. **Prove the wedge (S1) before scaling growth (S2) before building the moat (S3) before platforming (S4) — each sprint's exit is a kill/pivot off-ramp, not a victory lap.** The whitespace report is explicit: voice is a *head start to convert*, not an inherent moat, and the strategic variable is time-to-density. So: don't scale spend until the flywheel is real (S2 gate), don't build the KTO moat until signal density exists (S3 gate), don't build platform features until retention proves durable (S4 gate). At every gate the honest question is "could this have failed, and did it?" — proof kill (S1 Wk7), flywheel idle (S2), KTO non-convergence (S3), commodity retention (S4). No sprint assumes the previous one succeeded.
