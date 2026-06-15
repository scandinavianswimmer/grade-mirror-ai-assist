---
milestone: 2-launch-prove-compete
plan: xprize-master
status: active
created: 2026-06-15
deadline: 2026-08-17T13:00:00-07:00
research: ~/research/notes/final_report_aita-xprize-gtm-launch-5f2d05.md
---

# aiTA → Build with Gemini XPRIZE — Master Plan (Jun 15 → Aug 17, 2026)

> Synthesized from a full deep-research pass (16-step pipeline, ~135 sources, adversarially reviewed).
> Full strategy + citations: `~/research/notes/final_report_aita-xprize-gtm-launch-5f2d05.md`.
> This file maps that strategy onto aiTA's actual codebase state.

## The thesis (what we are actually playing for)

**Target a $50K runner-up prize** (15 slots, awarded on the balanced 3-criteria score) — NOT the grand prize,
and NOT the Education *category* prize (a pure gross-revenue race we lose at $15/mo vs B2B tools at 3–10x ARPU).
We win on **AI-native operations** (a full third of the verdict, our cleanest asset) + a **measured
voice-convergence proof** no competitor has.

**The competition is "did a stranger pay you," not "is the demo cool."** The hardest gate is the gap between
"live" and "an arms-length stranger paid." Build May 19–Aug 17; revenue evidence by month (May–Aug); related-party
revenue (founder network) reported separately and does NOT count toward the headline number.

### The two-cohort split (the core operating decision)
- **Cohort A — Revenue:** broad **14-day full-access trial** grading **pre-loaded sample essays** (no student PII).
  Activates teachers in summer; produces arms-length revenue (Criterion A). Trial beats permanent freemium ~10x
  (EdTech 24.8% vs 2.6%).
- **Cohort B — Proof:** 4–6 recruited **grades 9–12 ELA** teachers under signed **school DPAs**, grading real
  essays across ≥4 batches → the pre-registered voice-convergence proof (Criterion C).
- Revenue engine avoids student PII for speed; proof requires it for rigor. **Build two engines, not one.**

### Honest outcome target
Base case **~48 paying teachers / ~$720 MRR** by Aug 17 — a credible viability *floor*, not a winning revenue
number. **Lead the viability case with trajectory** (steep week-over-week growth), **arms-length %**, and unit
economics — not the absolute dollar figure (it's compared first in any tie-break, so maximize growth optics).

## The three must-go-right items (everything else is subordinate)

1. **Ship confidence-thresholded AUTO-FINALIZE** — aiTA must publish high-confidence, on-topic, rubric-aligned
   grades *unattended*, routing only low-confidence/off-topic to the teacher. This makes the AI-native claim TRUE,
   not narrated, and is what the <3-min video must SHOW (unattended batch grading). **This is the #1 new build.**
   → On-the-Loop (teacher monitors exceptions), a first-class agentic pattern; the feared "minimal human
   intervention" phrase is NOT in the official rules, but Devpost says the business is "operated by AI agents" —
   so the architecture must earn it.
2. **A clean, pre-registered, honestly-killable voice-convergence proof** that survives a methodologically
   literate judge (see §Proof below — this REPLACES the old edit-rate design).
3. **Arms-length, growing, documented revenue** — acquire STRANGERS (PH, Reddit, FB-group word-of-mouth), quarantine
   every founder-network dollar as related-party.

## How this maps to aiTA's current codebase

| Strategy need | aiTA status | Action |
|---|---|---|
| Live production deploy | PR #14 open (launch build); grade-submission trust-fix built, undeployed | **Merge #14 + deploy** (Phase A A1/A3) = Week 1 |
| Stripe $15/mo + annual | coded; migration 0019 gates real caps | Stripe live + apply 0019 (Phase A A4) = Week 1 |
| Compliance keystone (no student PII to Gemini) | **send-time de-identification already shipped** (May-26 security pass) ✓ | Foreground it; add ToS attestation + SDPC NDPA (~5–7 days, <$2k) |
| FERPA path | standard Vertex/Gemini is NOT FERPA-covered (only Workspace-for-Edu is) | De-id is the answer for Cohort A; Cohort B uses DPAs + de-id |
| Auto-finalize (confidence threshold) | likely per-grade approval today — **NEEDS BUILD** | **Build in Week 1** — the #1 must-go-right |
| Voice-convergence proof | Phase 15 designed around **edit-rate decline** — now INVALID (Borchers: 51% never edit) | **Redesign** to LUAR-aggregate + GPT-judge (see §Proof) |
| Sample essays for trial onboarding | Sarah Martinez demo seed exists | Repurpose as the pre-loaded trial sample set |
| Pre-loaded trial flow + free floor + PQL | partial (paywall wired) | Build 14-day trial + 15-grade free floor + grade-12 PQL trigger |

## The proof, redesigned (Phase 15 v2)

The old edit-rate-decline metric is **dead** — Borchers et al. (AIED 2026, n=117): 51.3% of teachers never edit
AI feedback, so a "decline" is uninterpretable. And LUAR degrades on short text (≤250-word feedback is below its
reliable range). The defensible design:
- **Primary metric:** GPT-judge rubric on voice-trait fidelity (lexical diversity, sentence structure, hedging) —
  judge-legible.
- **Corroborator:** aggregated **LUAR-MUD cosine similarity** over ≥4–8 feedback samples/teacher (NOT single
  comments) vs. the teacher's pre-enrollment reference corpus; calibrate an **in-domain** floor/ceiling (do NOT
  reuse Reddit defaults). Add an LZ77 compression edit-distance corroborator (Borchers-robust).
- **Specificity:** with-profile vs without-profile **holdout** arm.
- **Rigor:** **pre-register on OSF by Jul 7** (hypothesis + holdout + honest kill criterion). The kill criterion
  is the most persuasive element — "a proof that could have failed and didn't" beats a glossy demo. Honest shape:
  fast-then-plateau (FSPO converges from ~8 examples), so claim *measured, verifiable* convergence, not unbounded.

## 9-week timeline (mapped to aiTA)

| Wk | Dates | Product / AI-Native | Cohort A (revenue) | Cohort B (proof) | Compliance / Evidence | Gate |
|---|---|---|---|---|---|---|
| 1 | Jun 15–21 | Merge PR#14 + deploy; Stripe live; **build auto-finalize**; agent logging | 14-day trial flow + 15-grade free floor + grade-12 PQL; pre-load sample essays (Sarah seed); DM first 10 teachers | Recruit 4–6 gr9–12 ELA teachers; draft DPA | **Verify "newly created" in writing**; ToS attestation + de-id confirm + SDPC NDPA; apply 0019 | Auto-finalize live + posture signed? |
| 2 | Jun 22–28 | AI onboarding agent + support chatbot (broaden AI governance) | FB-proxy posts via users; Reddit participation; 10 active teachers (tag founder-net as related-party) | Execute ≥2 DPAs; collect ≥8–10 reference essays/teacher; OSF draft | Stripe ledger; demographic tracking | Auto-finalize unattended on test batch + ≥10 active teachers? |
| 3 | Jun 29–Jul 5 | Calibrate LUAR in-domain; analytics agent | Scale FB + free-PD webinar #1; build 300+ PH email list; 3–5 testimonials | **Batch 1** graded; baseline scores | OSF pre-reg draft | Signup→activation >25%? |
| 4 | Jul 6–12 | Auto class-analytics agent; logs demo-ready | Referral loop; first arms-length paid | **Batch 2**; holdout setup | **Pre-register OSF (by Jul 7)**; evidence folder | Pre-reg filed + arms-length revenue forming? |
| 5 | Jul 13–19 | Dashboard as monitoring/exception UI (for video) | PH assets (hero = paid voice-matched output); recruit hunters | **Batch 3**; mid-trend vs kill criterion | Agent logs + throughput; refusal screenshots | PH assets ready + MRR on curve + ≥3 testimonials? |
| 6 | Jul 20–26 | Load-test unattended throughput ("N grades/hr"); freeze + judge creds | **Product Hunt launch** (Tue–Thu 12:01am PT) | **Batch 4**; finalize dataset | Snapshot PH metrics | PH converting to trials? |
| 7 | Jul 27–Aug 2 | Bug-fix from PH cohort; lock for filming | Convert PH+FB via PQL; Back-to-School annual push | **Convergence analysis + KILL-CRITERION decision** | Demographic breadth map | Proof clears kill criterion? If not, pivot Criterion-C to time-savings |
| 8 | Aug 3–9 | Freeze code; tag release | Final push into Back-to-School spike; lock arms-length/related split | Results section + holdout chart | **Film <3-min video** (unattended grading + voice + refusal) + 500–1000w narrative | Video shows AI grading unattended? |
| 9 | Aug 10–17 | Final smoke test | Export Stripe revenue-by-month; MRR curve chart | OSF results link + testimonials | Assemble 7 deliverables; share repo w/ testing@devpost + judging@hacker.fund; **submit** | All done 24h early? Never touch the 1pm cliff |

**Sequencing logic:** front-load de-risking (the 3 must-go-rights all land Wk1–3, each can kill the submission),
back-load volume. PH lands Wk6 (needs early cohort + testimonials + paid demo first; late-July catches
Back-to-School). The proof cohort runs on its own DPA clock (longest pole); Wk7 kill-gate catches a failing proof
with 2 weeks to rewrite. The schedule is a sequence of off-ramps, not a growth curve.

## Channels (acquire strangers — founder network is related-party)
- **Facebook teacher groups** = #1 channel BUT direct self-promo = permanent ban → proxy through teacher users +
  free-PD webinars. **Reddit** (r/Teachers zero self-promo; r/edtech value-posts only). **Product Hunt** = one-day
  spike + PR + the "launch" story (Wk6). **Referral** loop. Content/SEO + district = deferred (too slow for 9 wks).
- **Pricing:** hold **$15/mo** (= CoGrader market anchor) + **annual prepay (~$150/yr)** + 14-day trial + thin
  15-grade/mo free floor. Justify with ROI (5.9 hrs/wk saved). Don't discount below market.

## Messaging (bifurcated)
- **Teacher-facing:** lead with **time saved** ("grade a set in minutes") + **authority** ("your voice, you stay
  in command"). Do NOT mention bias (spooks the AI-skeptical majority).
- **Judges (Criterion C narrative):** lead with the documented AI-grading **bias** problem (Stanford LAK26, ETS
  Asian-American 1.1pt penalty) → aiTA's structural fix (rubric-grounded + HITL + refusal + voice) → the measured
  proof → testimonials + demographics. No student-outcome claims (not credible in 9 weeks).

## Competitive wedge (precise)
Graide/Pensive *market* "learns your style" but publish **zero measured convergence**; CoGrader (50k teachers) =
per-assignment review-and-adjust; Brisk = feedback-only (can't score); Google Classroom (Feb 2026) = generic.
**aiTA is the only entrant with a pre-registered, MEASURED voice-convergence proof** — verifiable, not a marketing
claim. That + trust-by-construction (refuses off-topic) is the moat.

## Immediate next 7 days (Week 1 — founder + agent)
1. **Merge PR #14** → main (founder: `gh pr merge 14 --merge`).  [durability]
2. **Deploy** grade-submission + functions to cloud (founder, deploy-gated).  [trust fix live]
3. **Build auto-finalize** (confidence-threshold publish) — the #1 must-go-right (agent can build; founder deploys).
4. **Stripe live** + apply migration **0019** (founder: DB pw).
5. **Compliance posture:** confirm send-time de-id keeps PII out of Vertex; add ToS attestation; sign SDPC NDPA;
   **write the "newly created" eligibility paragraph** + verify rule language.
6. **Build the 14-day trial flow** + 15-grade free floor + grade-12 PQL trigger; pre-load Sarah-seed sample essays.
7. **Recruit 4–6 grades 9–12 ELA teachers** for the proof cohort; draft the school DPA.

> Founder-gated (cannot be agent-done): PR merge, deploys, Stripe live, DB migrations, secret rotation, DPAs,
> teacher recruiting, OSF pre-registration, the demo video.
