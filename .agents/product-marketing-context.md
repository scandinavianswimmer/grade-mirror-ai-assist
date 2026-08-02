# Product Marketing Context — Mr Selby

> Foundational context for all marketing work. Other marketing skills read this first.
> Full research + positioning rationale: `docs/marketing/ICP-RESEARCH-AND-POSITIONING.md`.
> Launch/GTM strategy (authoritative): `.planning/milestone-2-launch/XPRIZE-MASTER-PLAN.md`
> + `~/research/notes/final_report_aita-xprize-gtm-launch-5f2d05.md`.
> Product north star: `docs/v2-planning/GOAL.md`. Last updated 2026-06-15 (XPRIZE master-plan reconcile).

## Product
**Mr Selby** — a teacher-controlled grading co-pilot that helps teachers give timely, rubric-aligned,
personalized written feedback **in their own voice**, while keeping the teacher as final grader.
Upload assignment + rubric + student work → a visible multi-agent pipeline produces rubric-aligned
scores, inline annotations, and summary feedback → the teacher approves/edits/dismisses → Mr Selby learns
from those edits (persistent pedagogical memory). Stack: Vite/React + Supabase + Google Gemini.
Status: release candidate on the submission sprint branch; automated gates pass, but the current
frontend, backend, and exact-release grading path are not yet verified live.

## Target audience (ICP)
**Individual high-school English/humanities teacher** ("Sarah" archetype) — writing-heavy grading
load (120–180 students), high integrity, cares about feedback quality, burned out on grading,
wary of robotic AI. Buys bottom-up for herself; may champion to department/school later.
Adjacent expansion: departments/schools (B2B2C), higher-ed, tutoring centers.

## Core problem
Teachers face a constant tradeoff between grading speed and feedback quality → fatigue, generic
comments, burnout. AI tools they've tried feel robotic, misapply the rubric, and miscalibrate —
so they "spend more time correcting the AI than benefiting from it."

## Positioning — sell FIDELITY, not speed
**One-liner:** *"Thoughtful grading support, shaped by how you teach. You stay the final word."*
(Speed is the byproduct, not the headline.)

**Name story:** Mr Selby is a personal tribute to a favorite teacher whose care in teaching,
designing assignments, and grading them set the standard behind the product. Never imply the
teacher's affiliation, endorsement, voice, likeness, or biography.

**Three territories (use together):**
- **In your voice, and it proves it** — voice-learning loop + visible with/without-style difference. Moat = persistent pedagogical memory; switching cost grows with every edit.
- **It won't rubber-stamp garbage** — trust-through-refusal: off-topic withholding + deterministic rubric/relevance gates + level calibration. Answers the #1 distrust fear.
- **On the teacher's side, not policing students** — counter-position vs. detection-first incumbents (Turnitin/EssayGrader/GPTZero); no punitive AI-detection.

## Differentiators (white space)
1. Genuinely **learns the teacher's voice** via a closed edit→reinforce loop (others: static prompts / "more rubrics").
2. **Visible trust mechanics**: withholds grades on off-assignment work; stays inside the rubric; shows confidence + evidence per criterion.
3. **"AI workforce you supervise"** — named, traced agents, not a black box.
4. **Anti-slop craft UI** (Marginalia design system) + Grammarly-style inline review.
5. **Honest, FERPA-aware privacy** (de-identification before the model, owner-scoped data, right-to-erasure) — never "fully compliant."

## Competitors
EssayGrader (leader: speed + rubric library + detection), CoGrader (free, claims "sounds like you"
as a prompt not a loop), GPTZero (detection-first + calibration), Turnitin (integrity/expensive),
Brisk (formative, no scoring), Gradescope (STEM/handwritten), MagicSchool (breadth), Marking.ai/Writable.

## Messaging do / don't
- **DO:** lead with voice/trust/relief; name human-in-the-loop as a virtue; show real student work;
  prove learning with the **measured voice-convergence result** (GPT-judge rubric + aggregated LUAR-MUD
  cosine over ≥4–8 samples, with/without-profile holdout) — NOT a single "edit-rate" number.
- **DON'T:** lead with raw speed; imply teacher replacement; bundle/imply punitive AI-detection;
  claim "fully compliant"; use sterile corporate-AI aesthetics; **cite edit-rate decline as proof**
  (dead — Borchers AIED 2026: 51% of teachers never edit AI feedback, so it's uninterpretable).

## Audience split (bifurcated messaging — CRITICAL)
Two audiences, two narratives, never blended:
- **Teachers (the buyers):** lead with **time saved** + **authority/voice** ("your voice, you stay in
  command"). Do **NOT** lead with bias — it spooks the AI-skeptical majority.
- **XPRIZE judges (Criterion-C narrative):** lead with the documented AI-grading **bias** problem
  (Stanford LAK26; ETS Asian-American 1.1pt penalty) → Mr Selby's structural fix (rubric-grounded + HITL +
  refusal + voice) → the **measured, pre-registered** proof. No student-outcome claims (not credible in 9 wks).

## Offer / pricing (locked)
**$15/mo** (CoGrader market anchor) + **annual ~$150/yr** + **14-day full-access trial** (no card to start;
beats permanent freemium ~10x — EdTech 24.8% vs 2.6%) + a thin **15-grade/mo free floor**. Don't discount
below market; justify with ROI (≈5.9 hrs/wk saved). Trial onboards on **pre-loaded sample essays** (no PII).

## GTM (two-cohort, acquire STRANGERS)
- **Cohort A (revenue):** 14-day trial on sample essays → arms-length paying teachers. Founder-network
  dollars are **related-party** (reported separately, do NOT count) → must acquire strangers.
- **Cohort B (proof):** 4–6 recruited gr9–12 ELA teachers under school DPAs grading real essays ≥4 batches.
- **Channels (rank):** Facebook teacher groups (#1, but NO direct self-promo → proxy via teacher-users +
  free-PD webinars) · Reddit (r/Teachers zero-promo, r/edtech value-posts) · Product Hunt (Wk6 spike) ·
  referral loop. Content/SEO + district = deferred (too slow for a 9-wk window).
- **Motion:** bottom-up trial ("Start teaching Mr Selby your voice") → in-product champion → department/school.
