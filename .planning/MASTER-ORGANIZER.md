# aiTA — MASTER ORGANIZER (1-Year Roadmap)

**Created:** 2026-06-20 · **Horizon:** Jun 20 2026 → Jun 15 2027 · **Status:** canonical
**Supersedes for top-level sequencing:** `ROADMAP.md` (14-phase), `LAUNCH-PLAN.md` (M0–M6), and the timing claims in `milestone-2-launch/XPRIZE-MASTER-PLAN.md`. Those remain as detail/source; **when they disagree with this file, this file wins** through the horizon above. (The lean pass flagged that the old plans actively contradict each other — this declares one source of truth.)

> Built by synthesizing three independent lenses (artifacts in `.planning/master-organizer/`): **deep-plan** (the roadmap), **adversarial-review** (17 findings — folded in as guardrails/kill-gates), **lean-pass** (cut/defer list — applied below). Grounded in `docs/v2-planning/GOAL.md`.

---

## 1. North Star (the contract no sprint may break)

**aiTA is infrastructure for capturing, preserving, and scaling educational expertise** — an instructional co-pilot that drafts feedback in *this teacher's* voice, which she reviews and owns.

**The 7 non-negotiables (GOAL.md):** (1) HITL approval mandatory · (2) suggestions stay editable · (3) rubric-aware · (4) outputs align with teacher voice · (5) teacher trust > automation speed · (6) educational quality > aggressive automation · (7) context/memory are core.

**The one defensible move:** a closed *per-teacher voice loop* (correction-history → generation-shift). Every funded competitor ships voice as a manual overlay; none ships the loop at the generation step. **It is real but perishable — Edexia (YC W25) is hiring to build exactly this.** The single strategic variable for the year is **time-to-per-teacher-voice-density**, not feature count.

---

## 2. Where we are (2026-06-20, honest)

- **On `main`, green** (tsc 0, ~153 tests): full launch build (auto-finalize, 14-day trial, sample onboarding, PQL), the redesigned proof harness (GPT-judge + LUAR + holdout + pre-registered kill criterion), On-the-Loop monitoring UI, GTM layer + referral spec, ponytail cleanup.
- **NO REAL USERS YET.** Pre-launch. Frontend on Firebase Hosting (`aita-5aca5`); backend still Supabase (Auth + 23-table Postgres + 16 Deno edge fns).
- **Founder-gated, pending:** deploy `grade-submission` (the live grading **trust-fix**, undeployed for weeks), apply migrations 0015–0021, Stripe live, Firebase Hosting deploy, OSF prereg filing, recruit Cohort-B teachers, record the <3-min demo video.

---

## 3. Four headline decisions (where the lenses converged — read before the roadmap)

These are the high-leverage, partly hard-to-reverse calls. Three are settled by lens-consensus; **Decision A needs your explicit sign-off** because it reverses prior intent.

### A. Firebase backend migration → **DEMAND-GATED, OFF the year-1 critical path** ⚠️ *your call*
All three lenses converge: the migration adds **zero XPRIZE value**, the Google-Cloud gate is **already met by Firebase Hosting + Gemini**, and porting 16 functions + Auth + a 23-table DB is a multi-quarter rewrite of a *just-hardened, working* backend. **Year-1 critical-path minimum = repoint `_shared/ai/gemini.ts` → Vertex AI** (low-risk; "AI on Google Cloud" story; removes free-tier caps = two Google products live). The full migration — spec + Phase-1 plan already written (`docs/superpowers/specs/2026-06-18-...`, `docs/superpowers/plans/2026-06-18-...`) — is **shelved, ready, and triggered by a named signal** (≥$3–5K MRR *or* a concrete compliance/scale need), not scheduled as committed S1–S4 work.
*This reverses the "begin the Firebase migration now" direction. Recommendation: accept the demand-gate (the spec isn't wasted — it executes the moment a trigger fires). Your call.*

### B. The proof's metric is self-contradictory — **must-fix before any batch** (adversarial CRITICAL-1)
The strategy redesigned the proof to GPT-judge + LUAR (because edit-rate-decline is dead: Borchers, 51% never edit), **but the actually-locked, instrumented artifacts** (`VERDICT.md`, `PROTOCOL.md`, `15-CONTEXT.md`, `convergenceMetrics.ts`, `ConvergencePanel`, and the referral hero card) **still define PROVEN as edit-rate ≥40% decline.** You cannot pre-register after seeing which design passes. **S1 Week-1 blocker:** reconcile every artifact to the judge+LUAR+holdout design, then OSF-file. No batch runs on the dead metric.

### C. Auto-finalize must default **OFF** and never eat the signal that feeds the moat (adversarial CRITICAL-2 + HIGH-14)
Auto-finalize currently `DEFAULT_ENABLED = true`, publishing on self-reported `confidence ≥ 0.85` — violating non-negotiables #1 (HITL) and #5 (trust). **And the deeper trap:** auto-finalize removes the teacher-edit step, which is the *exact signal the voice-moat learns from* — the headline XPRIZE feature and the moat consume each other. **Resolution:** default OFF; calibrate false-auto-finalize <5% on holdout before any "AI operates the business" claim; scope auto-finalize to genuinely low-stakes/high-confidence cases and **always route signal-bearing/edited/flagged cases to the human.** On-the-Loop, never out-of-the-loop.

### D. The proof cohort is the longest pole and **nothing has started** — recruit **today** (adversarial CRITICAL-3)
Zero teachers, no DPA, consent unflipped, 0017/0018 unapplied — and the chain (recruit teachers *on summer break* → school signs an SDPC NDPA in July → source ≥4 batches of same-assignment essays *after the year ended* → ≥4 edit sessions) realistically **cannot finish before Aug 17.** Mitigation, starting now: recruit **today**, **over-recruit to 8–10** (one dropout collapses a tiny n), source **archived prior-year essays**, hard **Jul 1 go/no-go** that triggers the time-savings pivot if proof can't complete.

---

## 4. The Roadmap — four 90-day sprints

Arc: **S1 SHIP+PROVE → S2 GROW+HARDEN → S3 SCALE+MOAT → S4 PLATFORM.** Every exit gate is a kill/pivot off-ramp; **no sprint assumes the prior one succeeded.**

### SPRINT 1 — SHIP + PROVE · Jun 20 → Sep 18 2026
*Contains XPRIZE submission (Aug 17) + back-to-school launch.*
**Objective:** turn a built-but-undeployed system into a *live, paid, proven* product; land the three must-go-rights.
**Key Results**
- **Proof:** metric reconciled (Decision B) + OSF filed by **Jul 7**; ≥4 batches × 4–6 Cohort-B teachers; `VERDICT.md` filled against the pre-registered kill criterion. *Jul 1 go/no-go (Decision D).*
- **Revenue:** ≥48 paying teachers / ~$720 MRR by Aug 17 (honest floor); arms-length % tracked, ≥1 documented arms-length conversion; related-party revenue quarantined.
- **AI-native:** auto-finalize live, **default OFF, calibrated <5% false-finalize** (Decision C), demoable on an unattended batch with flagged cases routed to the teacher.
- **Ship gate:** `grade-submission` trust-fix deployed; 0015–0021 applied; Stripe live; **Vertex repoint done** (Decision A minimum); Hosting URL smoke-tested signup→grade→checkout.
- **Submission:** 7 XPRIZE deliverables in ≥24h before the Aug 17 1pm PT cliff.
**Exit/off-ramps:** HARD — trust-fix live + auto-finalize calibrated + Stripe live + ≥10 active teachers by Wk2. **Wk7 KILL-GATE (Aug 2):** proof clears criterion? If NO → pivot Criterion-C narrative to measured time-savings + refusal-trust (no fabricated voice claim); voice becomes S2 R&D.
**Non-goals:** no Firebase Functions/Auth/DB migration · no B2B/district · no eval-in-CI · no KTO training · no expansion beyond gr9–12 ELA · no bias-led messaging.

### SPRINT 2 — GROW + HARDEN · Sep 19 → Dec 17 2026
**Objective:** prove aiTA *gets stickier with use*; gate quality, don't hope it.
**Key Results**
- **Growth:** ≥200 active teachers, MRR ≥$2.5K, arms-length ≥60%, referral coefficient tracked.
- **Stickiness:** signup→activation >35%; week-4 retention ≥40%; convergence "wow" felt within the first 1–2 sessions for ≥60% of activated teachers (instrumented).
- **Quality gate:** **eval-in-CI live** — proof harness runs on every prompt/model change; off-topic-100/100 + injection + voice-fidelity floor **fail the build**; reference dataset versioned.
- **Signal capture:** binary accept/reject + behavioral signal (accept latency, criterion-level flags) captured per teacher — *the future KTO training data; capture now, train in S3.*
- **Onboarding gate:** ≥10 samples + subject/level + harshness captured; cold-start path measured (no day-one-generic churn).
**Exit/off-ramps:** flywheel real (activation/retention met) else re-examine ICP/onboarding before scaling spend; eval-in-CI gating. **Kill check:** if GRR trends toward the 23% commodity death rate and convergence isn't felt early → escalate KTO to S3's top priority.
**Non-goals:** no Auth migration · no referral *engineering* beyond the existing spec until ≥25 active teachers (lean) · no district/LMS build · no KTO training yet.

### SPRINT 3 — SCALE + MOAT · Dec 18 2026 → Mar 17 2027
**Objective:** turn captured correction-history into a compounding switching cost. **This is the make-or-break technical bet** — the moat doesn't exist yet (adversarial HIGH-8); S3 is where it's built or disproven.
**Key Results**
- **Moat / learning loop:** **KTO (binary-signal) loop live** — accept/reject measurably shifts next-draft generation per teacher; **measured** edit-burden reduction over session count on a holdout (honest fast-then-plateau shape; measured, not unbounded).
- **Retention proof:** GRR ≥60% (toward the ~70% vertical-AI benchmark); teacher-reported "feels like starting over."
- **Scale:** ≥800 active teachers, MRR ≥$8K; ≥3 schools showing the "3+ teachers/school" density signal.
- **B2B/LMS:** discovery only — ≥5 design-partner conversations, an LMS spike; **build decision deferred to S4.** (Lean: do *not* migrate the half-built `LMSIntegration/LMSCallback` — delete them; rebuild only if validated.)
**Exit/off-ramps:** KTO shows measured convergence on a holdout **or it doesn't — honest kill:** if binary-signal learning doesn't reduce edit-burden in ELA, the *algorithmic* moat doesn't exist → pivot the durable differentiator to deep behavioral context + workflow lock-in + trust posture, compete on execution/distribution.
**Demand-gated this sprint (only if a trigger fired):** Firebase Functions migration Phase 1 (proof-first port) — *not committed; slots in only if Decision A's signal fires.*
**Non-goals:** no DB-target decision · no multi-tenant build · no expansion beyond ELA essays.

### SPRINT 4 — PLATFORM · Mar 18 → Jun 15 2027
**Objective:** make the thesis real — pedagogical-memory as a platform.
**Key Results**
- **Platform/memory:** per-teacher standards/exemplars queryable + portable across assignments/classes + visibly reused ("digital extension of the teacher"); ≥1 expertise-scaling feature beyond single-essay grading.
- **Scale/business:** ≥2,000 active teachers, MRR ≥$20K, GRR ≥65%; first institutional contract(s) *if* S3 validated the motion (else parked).
- **Expansion:** one new format/grade-band shipped, proven to retain the voice loop's value.
- **Demand-gated:** Firebase Auth + DB migration (Phases 2–3) execute here **only if** the MRR/compliance trigger fired in S3; the DB-target decision (Firestore vs Cloud SQL) is made now that all access is routed through functions. **Note:** the migration spec's "no real users → clean Auth cutover" is false by now — a real Firebase Auth user-migration plan (dual-auth window or scheduled cutover + comms) is required.
**Exit/off-ramps:** memory features retaining; expansion retains value (or rolled back); GRR ≥65% — if retention is still commodity-level, **the platform thesis is unproven; do not raise/scale on it.**
**Non-goals:** no premature multi-subject sprawl · no cold district procurement without bottom-up density · no abandoning HITL/authorship.

---

## 5. Applied cut / defer list (lean pass — what we are NOT doing, and the gate to revisit)

| Cut / Defer | Why now | Cheaper alternative | Revisit when |
|---|---|---|---|
| **Full Firebase re-platform** | zero XPRIZE value; rewrites a working backend | Vertex repoint of `gemini.ts` only | ≥$3–5K MRR or a compliance need |
| **LMS/Canvas integration** (`LMSIntegration/LMSCallback`) | 0 users → 0 LMS demand | delete; mailto for interest | S3 validates a real LMS ask |
| **District/B2B/SSO motion** | sales cycle too slow pre-PMF | "Contact us" mailto | ≥3 teachers/school density (S3) |
| **Engineered referral loop** | nothing to multiply at 0 users | the existing spec, dormant | ≥25 active teachers (S2) |
| **Upstash/Cloud Run async queue** | auto-finalize is a threshold, not a queue | existing key-rotation pool | real throughput pressure |
| **KTO/DPO training loop** | premature before signal density | capture binary signal first (S2) | S3 entry gate (data density) |
| **Beyond-essays breadth, heavy tracing** | premature before the core loop is measured | — | S4, post-moat |
| **In-repo duplicates** (2 dashboards, dead pages, `ai-router.ts`) | porting dead code pays twice | consolidate/delete first | now (cheap win) |

**~10–13 engineer-quarters saved** — dominated by demand-gating the re-platform, which returns the 9-week XPRIZE window to the three must-go-rights.

---

## 6. Risk register / standing kill-gates

| When | Kill/pivot question | If it fails |
|---|---|---|
| S1 Jul 1 | Can the proof cohort realistically complete ≥4 batches by Aug 17? | Trigger time-savings pivot narrative; treat voice as S2 R&D |
| S1 Wk7 (Aug 2) | Does the proof clear the pre-registered (judge+LUAR) kill criterion? | Pivot Criterion-C to measured time-savings + refusal-trust; no fabricated voice claim |
| S2 exit | Is the flywheel real (activation >35%, retention ≥40%)? | Re-examine ICP/onboarding before scaling spend |
| S3 exit | Does KTO measurably cut edit-burden in ELA? | Algorithmic moat doesn't exist → pivot to behavioral/workflow lock-in + distribution |
| S4 exit | GRR ≥65% (durable retention)? | Platform thesis unproven — don't raise/scale on it |

**Cross-cutting standing risks:** auto-finalize cannibalizing the edit signal (Decision C); the wedge being a perishable head-start vs Edexia (speed + deeper-than-edit-bit behavioral signal); disclosure-devaluation (keep authorship-via-review central, never concealment); founder-gated bottlenecks compressing against deadlines.

---

## 7. Goal-consistency (every sprint vs the 7 non-negotiables)

HITL (#1) — auto-finalize stays On-the-Loop, default OFF, flagged cases routed to human · Editable (#2) — edits preserved + become the learning signal · Rubric-aware (#3) — trust-fix + eval-in-CI gate · Voice (#4) — the spine: proven S1, felt S2, compounding S3, portable S4 · Trust>speed (#5) — conservative auto-finalize + refusal kept · Quality>automation (#6) — eval-in-CI gates every change · Context/memory (#7) — capture S2 → learn S3 → memory platform S4.

---

## 8. Immediate next actions (S1, this week)

1. **(Founder)** Deploy `grade-submission` trust-fix + apply 0015–0021 + Stripe live + Vertex repoint + Hosting deploy (the gated chain in `WEEK-1-FOUNDER-RUNBOOK.md`).
2. **(Founder, longest pole)** Start Cohort-B recruiting **today**; over-recruit to 8–10; source archived essays.
3. **(Agent-doable)** Reconcile the proof metric across all artifacts to judge+LUAR (Decision B) so OSF can be filed by Jul 7.
4. **(Agent-doable)** Flip auto-finalize default OFF + add the holdout false-finalize calibration (Decision C).
5. **(Decision needed from you)** Confirm Decision A (demand-gate the Firebase migration) so the roadmap is locked.
