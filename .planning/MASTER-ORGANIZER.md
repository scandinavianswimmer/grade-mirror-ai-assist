# aiTA — MASTER ORGANIZER (1-Year Roadmap)

**Created:** 2026-06-20 · **Horizon:** Jun 20 2026 → Jun 15 2027 · **Status:** CANONICAL (final)
**Single source of truth** for top-level sequencing through the horizon. Supersedes `ROADMAP.md` (14-phase), `LAUNCH-PLAN.md` (M0–M6), and the timing claims in `milestone-2-launch/XPRIZE-MASTER-PLAN.md` — those remain as detail/source; **when they disagree with this file, this file wins.** (Lean-pass cut #10: the old plans actively contradict each other; this ends that.)

> Synthesized from three independent lenses (full artifacts in `.planning/master-organizer/`): **deep-plan.md** (the roadmap), **adversarial-review.md** (17 findings — folded in below as gates/guardrails), **lean-pass.md** (11 cuts — applied in §6). Grounded in `docs/v2-planning/GOAL.md`.

---

## 1. North Star (the contract no sprint may break)

**aiTA is infrastructure for capturing, preserving, and scaling educational expertise** — an instructional co-pilot that drafts feedback in *this teacher's* voice, which she reviews and owns.

**7 non-negotiables (GOAL.md):** (1) HITL mandatory · (2) suggestions editable · (3) rubric-aware · (4) outputs align with teacher voice · (5) trust > speed · (6) quality > automation · (7) context/memory core.

**The one defensible move:** a closed *per-teacher voice loop* (correction-history → generation-shift). Real but **perishable** — Edexia (YC W25) is hiring a Founding AI Engineer whose JD literally names "RL from teacher corrections" (your wedge is on a competitor's job board). Moat window ~18–36 months; switching cost ~0 today (the loop hasn't learned anyone's voice yet). **The strategic variable for the year is time-to-per-teacher-voice-density.**

---

## 2. Where we are (2026-06-20, honest)

- **On `main`, green** (tsc 0, ~153 tests): launch build (auto-finalize, 14-day trial, sample onboarding, PQL), proof harness (GPT-judge + LUAR + holdout + kill criterion), On-the-Loop UI, GTM layer + referral spec, ponytail cleanup.
- **NO REAL USERS.** Pre-launch. Frontend on Firebase Hosting (`aita-5aca5`); backend Supabase (Auth + 23-table Postgres + 16 Deno fns).
- **Nothing is verified in production** until the founder serial chain runs (§4). "We built it" is unfalsifiable until a real essay grades → auto-finalizes/withholds correctly in prod.

---

## 3. Headline decisions (the synthesis crux)

### A. Firebase backend migration → **DEMAND-GATED, off the year-1 critical path** ✅ *DECIDED (reversible)*
All three lenses converge (lean cut #1, adversarial HIGH-5, deep-plan): the full migration adds **zero XPRIZE value**, the Google-Cloud gate is **already met by Hosting + Gemini**, and porting 16 fns + Auth + a 23-table DB is a multi-quarter rewrite of a just-hardened backend that re-opens the security surface. **Year-1 critical-path scope = repoint `_shared/ai/gemini.ts` → Vertex AI only** (days, low risk, "AI on Google Cloud" story, removes free-tier caps = two Google products live). The full migration — spec + Phase-1 plan already written (`docs/superpowers/{specs,plans}/2026-06-18-*`) — is **shelved, ready, and triggered by a named signal (≥$3–5K MRR or a concrete compliance/scale need)**, not committed S1–S4 work.
> *Reverses the 06-18 "begin the migration now" direction. The spec isn't wasted — it executes the moment a trigger fires. Say the word to re-prioritize it.*

### B. The proof metric is self-contradictory — **fix before any batch** (CRITICAL-1, HIGH-9)
Strategy redesigned the proof to **GPT-judge + LUAR + holdout** (edit-rate-decline is dead: Borchers, 51.3% never edit), but the **locked, instrumented** artifacts (`VERDICT.md §1`, `PROTOCOL.md`, `15-CONTEXT.md`, `convergenceMetrics.ts`, `ConvergencePanel.verdictFor()`, and the referral hero card) **still define PROVEN as edit-rate ≥40% decline.** You can't pre-register after seeing which design passes. **S1-Wk1 blocker:** reconcile every artifact to judge+LUAR+holdout, re-implement in code, OSF-file *that*. Frame as a **pre-registered pilot** (n=4–6, within-subject, each teacher their own control via holdout) — state the n/power limits yourself; LUAR degrades on ≤250-word text, so lead with "could have failed and didn't," not "powered study" (CRITICAL-4).

### C. Auto-finalize defaults **OFF**; never eat the signal that feeds the moat (CRITICAL-2 + HIGH-14)
`auto-finalize.ts` is `DEFAULT_ENABLED = true`, publishing on self-reported `confidence ≥ 0.85` — inverting non-negotiables #1/#5 on a poorly-calibrated signal. **And the trap:** auto-finalize removes the teacher-edit step that is the *exact signal the voice-moat learns from* — the headline feature and the moat consume each other. **Resolution:** default OFF; opt-in per-assignment after ≥1 batch; demo as an explicit teacher-enabled mode; calibrate **false-auto-finalize <5% on holdout** before any "AI operates the business" claim; auto-publish only trivial cases, **always route medium-confidence/on-rubric/edited/flagged cases to the human.** Pre-commit: if <X% of grades get a substantive edit/batch, the few-shot loop has no fuel — "it learns you" is unprovable.

### D. The proof cohort is the longest pole and **nothing has started** — recruit **today** (CRITICAL-3)
Zero teachers, no DPA, consent unflipped, 0017/0018 unapplied. The chain (recruit summer-break teachers → school SDPC NDPA in July → source ≥4 batches of same-assignment essays post-school-year → ≥4 edit sessions) **can't realistically finish by Aug 17.** Recruit **today**, over-recruit to **8–10**, source **archived prior-year essays** (not fresh summer work), hard **Jul 1 go/no-go** → trigger the time-savings pivot if it can't complete.

---

## 4. Week-0 immediate (the binary STOP checks + founder serial chain — do FIRST)

**Two binary, plan-ending questions — confirm in writing THIS WEEK before investing another sprint:**
- **XPRIZE eligibility (HIGH-10):** is an *enhanced pre-existing* app eligible, or must the project be created after May 19? The repo's git history plainly shows pre-window origin. Get the rule confirmed by the organizer in writing. If "newly-created only" → **STOP / re-scope / withdraw.** Framing is not a substitute for a yes/no.
- **Google §20(d) under-18 terms (MEDIUM-17):** Google's Service-Specific Terms restrict apps "directed toward / likely accessed by under-18s." A K-12 grading tool is squarely in-zone. Confirm applicability with Google in writing.

**Founder serial chain (MEDIUM-12) — the real Week-1 critical path; resolve in order:**
1. **Rotate the exposed `sk_live_` Stripe key + DB password FIRST** (active security exposure before any public traffic).
2. Resolve the `config.toml` vs STATE **project-ref mismatch** (using the wrong ref is hard to undo).
3. Merge PR #14 → apply migrations 0015–0021 → deploy `grade-submission` trust-fix → Stripe live → **Vertex repoint** → Hosting deploy. Smoke-test signup→grade→checkout in prod.

Until that chain runs, every "done" is unverified.

---

## 5. The Roadmap — four 90-day sprints

Arc: **S1 SHIP+PROVE → S2 GROW+HARDEN → S3 SCALE+MOAT → S4 PLATFORM.** Every exit gate is a kill/pivot off-ramp; no sprint assumes the prior succeeded.

### SPRINT 1 — SHIP + PROVE · Jun 20 → Sep 18 (XPRIZE Aug 17 + back-to-school)
**Objective:** turn a built-but-undeployed system into a *live, paid, proven* product; land the three must-go-rights.
**KRs:** (1) **Proof** — metric reconciled (Dec. B) + OSF filed by Jul 7; ≥4 batches × 4–6 (over-recruited 8–10) Cohort-B teachers; VERDICT filled vs the kill criterion. (2) **Revenue** — ≥48 paying / ~$720 MRR by Aug 17, **arms-length % tracked + ≥1 documented arms-length paid**; absolute arms-length $ maximized (tie-break compares revenue *first* — MEDIUM-17). (3) **AI-native** — auto-finalize live, **default OFF, false-finalize <5% on holdout** (Dec. C). (4) **Ship gate** — trust-fix deployed, 0015–0021 applied, Stripe live, Vertex repoint done, Hosting smoke-tested. (5) **Submission** — 7 deliverables ≥24h before the Aug 17 1pm PT cliff.
**STOP/kill gates:** eligibility + §20(d) confirmed (§4) — else STOP. **Wk3 leading-indicator gate (HIGH-6/MEDIUM-13):** signup→activation >25% AND ≥10 arms-length active AND first arms-length paid by Wk4 — else the 48-paid base case is invalid; pivot to live "grade-along" onboarding calls; make "small but real + steep slope + high arms-length %" the *primary* narrative. **Wk7 (Aug 2):** proof clears criterion? If NO → Criterion-C pivots to measured time-savings + refusal-trust (no fabricated voice claim).
**Compliance:** restrict **Cohort A to pre-loaded sample essays (no real PII)**; Cohort B real essays go to the model with roster-mask + signed DPA as the legal basis — because `deid.ts` only masks roster names, real essays leak peer/teacher/school/place names (HIGH-7); add an NER/Gemini de-id pre-pass before grading real bodies. Add a **disclosure stance** (is AI authorship disclosed to students/parents?) and pressure-test against the transparency-first counter-market; carve the values-skeptic teacher segment out of the TAM (HIGH-15).
**Non-goals:** no Firebase Functions/Auth/DB migration · no B2B/district · no eval-in-CI · no KTO training · no referral engineering · no expansion beyond gr9–12 ELA · no bias-led messaging.

### SPRINT 2 — GROW + HARDEN · Sep 19 → Dec 17
**Objective:** prove aiTA *gets stickier with use*; gate quality, don't hope it; add the business workstreams the launch sprint skipped.
**KRs:** (1) **Growth** — ≥200 active teachers, MRR ≥$2.5K, arms-length ≥60%, referral coefficient tracked. (2) **Stickiness** — signup→activation >35%, week-4 retention ≥40%, **voice-convergence felt within the first 1–2 sessions / 3–5 papers for ≥60% of activated teachers, instrumented** (MEDIUM-16 — a hard product requirement, since cold-start few-shot delivers generic day-one output). (3) **Quality gate** — **eval-in-CI live**: proof harness runs on every prompt/model change; off-topic-100/100 + injection + voice-fidelity floor fail the build; versioned reference dataset. (4) **Signal capture** — binary accept/reject + behavioral signal (accept latency, criterion-level flags) captured per teacher (the KTO training data; capture now, train S3). (5) **Onboarding gate** — ≥10 samples + subject/level + harshness; cold-start measured.
**NEW workstreams the review flagged as missing (MEDIUM-11):** **retention/churn** (cohort-retention metric, not just trial-conversion — a summer trial says nothing about daily-grading retention once school starts); **a minimal support/success loop** (real teachers hit real bugs); **a one-page CAC/LTV model** ($15/mo → tiny CAC tolerance; XPRIZE wants CAC/cost fields); **FERPA depth** (DPA stub reviewed by an actual attorney before any real student essay flows; subprocessor list; breach plan; map Cohort-B states' privacy laws — 46 states stricter than FERPA).
**Exit/kill:** flywheel real (activation/retention met) else re-examine ICP/onboarding before scaling spend; eval-in-CI gating. If GRR trends toward the 23% commodity death rate and convergence isn't felt early → escalate KTO to S3's top priority (the moat isn't forming on few-shot alone).
**Non-goals:** no Auth migration · no district/LMS build · no KTO training yet · referral only after ≥25 active teachers (lean #4).

### SPRINT 3 — SCALE + MOAT · Dec 18 → Mar 17
**Objective:** build the *actual* moat (it doesn't exist yet — HIGH-8). The make-or-break technical bet.
**KRs:** (1) **KTO (binary-signal) loop live** — accept/reject measurably shifts next-draft generation per teacher; **measured** edit-burden reduction over session count on a holdout (honest fast-then-plateau shape; difficulty-based selection routes the hardest ~10% to the teacher — DPO reaches full performance on 10% of data when it's the hard cases). (2) **GRR ≥60%** (toward ~70% vertical-AI benchmark); teacher-reported "feels like starting over." (3) **Scale** — ≥800 active teachers, MRR ≥$8K; ≥3 schools at "3+ teachers/school" density. (4) **B2B/LMS discovery only** — ≥5 design-partner convos + an LMS spike; **build deferred to S4**; **delete** the half-built `LMSIntegration/LMSCallback` (lean #2), rebuild only if validated.
**Exit/kill (honest, no ego-boost):** KTO shows measured convergence on a holdout **or it doesn't** — if binary-signal learning doesn't reduce edit-burden in ELA, **the algorithmic moat doesn't exist** → pivot the durable differentiator to deep behavioral context + workflow lock-in + trust/distribution. Watch disclosure-devaluation: keep authorship-via-review central, never concealment (HIGH-15).
**Demand-gated (only if Decision-A trigger fired):** Firebase Functions migration Phase 1.
**Non-goals:** no DB-target decision · no multi-tenant build · no expansion beyond ELA essays.

### SPRINT 4 — PLATFORM · Mar 18 → Jun 15 2027
**Objective:** make the thesis real — pedagogical memory as a platform. Gate every platform feature on retention evidence (don't platform a churning base).
**KRs:** (1) **Pedagogical-memory** features — per-teacher standards/exemplars queryable + portable across assignments/classes + visibly reused; ≥1 expertise-scaling feature beyond single-essay grading. (2) **Scale/business** — ≥2,000 active teachers, MRR ≥$20K, GRR ≥65%; first institutional contract(s) *if* S3 validated the motion (else parked). (3) **Expansion** — one new format/grade-band shipped, proven to retain the voice loop's value. (4) **Demand-gated:** Firebase Auth + DB migration (Phases 2–3) **only if** the trigger fired — and the spec's "no real users → clean Auth cutover" is **false by now**, so a real user-migration plan (dual-auth window or scheduled cutover + comms) is required; DB-target decision (Firestore vs Cloud SQL) made now that access routes through functions.
**Exit/kill:** memory features retaining; expansion retains value (or rolled back); **GRR ≥65% — if still commodity-level, the platform thesis is unproven; do not raise/scale on it.** Foundation-model commoditization risk: lean into the per-teacher corpus (the only durable asset).
**Non-goals:** no multi-subject sprawl beyond one validated expansion · no cold district procurement without bottom-up density · no abandoning HITL/authorship.

---

## 6. Applied cut / defer list (lean pass — all 11; detail in `lean-pass.md`)

| # | Cut / Defer | Cheaper alternative | Revisit gate |
|---|---|---|---|
| 1 | Full Firebase re-platform | Vertex repoint only | ≥$3–5K MRR or compliance need |
| 2 | LMS/Canvas (delete `LMSIntegration/LMSCallback`) | direct file upload (shipped) | signed school names it as a blocker / ≥3 teachers ask |
| 3 | District/B2B/SSO motion | "Contact us" mailto | ≥3 inbound dept asks / 1 warm district |
| 4 | Engineered referral loop | "tell a friend" line + manual tracking | ≥25–50 active w/ organic WOM |
| 5 | Upstash/Cloud Run async queue | sync/background grading + key-rotation pool | sync grading visibly times out |
| 6 | KTO/DPO training pipeline | shipped style-profile + few-shot exemplars | in-context proof plateaus below bar + revenue |
| 7 | Beyond-essays breadth / heavy memory machinery | nail gr9–12 ELA essays | proof on essays + paying teachers ask |
| 8 | **Dead/duplicate code (do NOW — free)** — 2 dashboards, dead onboarding/upload/podcast/pitch pages, overlapping submit paths, dead `ai-router.ts` | pick one canonical per concern, delete rest | none — pure cleanup |
| 9 | Heavy tracing/observability | existing per-agent step logs (demo-ready) | prod incidents undiagnosable from logs |
| 10 | Contradictory plan docs | **this Master Organizer = sole source of truth** | post-XPRIZE rewrite |
| 11 | GTM content over-production | run 2 cheapest channels first (Reddit + FB-proxy), gate on activation | signup→activation >25% on a channel |

**~10–13 engineer-quarters saved** — cutting the re-platform alone returns the full 9-week XPRIZE window to the three must-go-rights.

---

## 7. Risk register / kill-gates (17 adversarial findings — full text in `adversarial-review.md`)

| ID | Sev | Risk | Fix / gate (where handled) |
|---|---|---|---|
| C-1 | CRIT | proof still uses the dead edit-rate metric | Decision B — fix + re-OSF before any batch |
| C-2 | CRIT | auto-finalize default ON breaks HITL #1/#5 | Decision C — default OFF + <5% calibration |
| C-3 | CRIT | proof cohort longest pole, unstarted | Decision D — recruit today, over-recruit, Jul 1 go/no-go |
| C-4 | CRIT | n=4–6 underpowered; over-claims rigor | frame as pre-registered pilot, within-subject (S1) |
| H-5 | HIGH | Firebase migration = pure opportunity cost | Decision A — freeze/demand-gate |
| H-6 | HIGH | ~48-paid floor over-optimistic (summer break) | Wk3 activation gate; slope+arms-length primary narrative (S1) |
| H-7 | HIGH | de-id only masks roster; essays leak PII | NER pre-pass; Cohort A = samples only (S1 compliance) |
| H-8 | HIGH | wedge is perishable head-start, not a moat | name+build the real moat = KTO (S3); ship before window closes |
| H-9 | HIGH | referral loop wired to the dead metric | sequence after C-1; re-point to new metric/time-saved |
| H-10 | HIGH | XPRIZE eligibility unconfirmed (binary) | §4 — confirm in writing this week / STOP |
| H-14 | HIGH | auto-finalize starves the moat's learning signal | Decision C — route learnable cases to review |
| H-15 | HIGH | disclosed-AI feedback rated less genuine; backlash | disclosure stance + TAM carve-out (S1) |
| M-11 | MED | missing churn/support/CAC/FERPA-depth workstreams | added to S2 |
| M-12 | MED | founder serial-chain SPOF; un-rotated `sk_live_` | §4 — rotate key + ref-mismatch first |
| M-13 | MED | kill gates soft outside the proof | §4/S1 — numeric gates pre-committed |
| M-16 | MED | day-one value generic; PLG↔flywheel coupled | S2 KR2 — convergence felt by paper 5, instrumented |
| M-17 | MED | tie-break = revenue first; §20(d); state laws | §4 + maximize absolute arms-length $ (S1) |

**Standing gates:** S1 Jul 1 (cohort can finish?) · S1 Wk3 (activation >25% + arms-length?) · S1 Wk7 (proof clears?) · S2 exit (flywheel real?) · S3 exit (KTO converges?) · S4 exit (GRR ≥65%?).

---

## 8. Goal-consistency (vs the 7 non-negotiables)

#1 HITL — auto-finalize On-the-Loop, default OFF, learnable/flagged cases routed to human · #2 editable — edits preserved + are the learning signal · #3 rubric — trust-fix + eval-in-CI gate · #4 voice — the spine (proven S1, felt S2, compounding S3, portable S4) · #5 trust>speed — conservative auto-finalize + refusal kept + trust leads compliance · #6 quality>automation — eval-in-CI gates every change; expansion gated on value retention · #7 context/memory — capture S2 → learn S3 → memory platform S4.

---

## 9. Immediate next actions

1. **(Founder, §4)** Confirm eligibility + §20(d) in writing · rotate `sk_live_` + DB pw · resolve project-ref · run the deploy chain (incl. Vertex repoint).
2. **(Founder, longest pole)** Start Cohort-B recruiting **today**; over-recruit to 8–10; source archived essays.
3. **(Agent-doable)** Reconcile the proof metric across all artifacts → judge+LUAR (Decision B), ready for OSF by Jul 7.
4. **(Agent-doable)** Flip auto-finalize default OFF + add holdout false-finalize calibration (Decision C).
5. **(Agent-doable, free)** Delete the dead/duplicate code (lean #8) before any further build touches it.
