# Product Marketing Context — aiTA

> Foundational context for all marketing work. Other marketing skills read this first.
> Full research + positioning rationale: `docs/marketing/ICP-RESEARCH-AND-POSITIONING.md`.
> Product north star: `docs/v2-planning/GOAL.md`. Last updated 2026-06-03.

## Product
**aiTA** — an AI-native instructional co-pilot that helps teachers give timely, rubric-aligned,
personalized written feedback **in their own voice**, while keeping the teacher as final grader.
Upload assignment + rubric + student work → a visible multi-agent pipeline produces rubric-aligned
scores, inline annotations, and summary feedback → the teacher approves/edits/dismisses → aiTA learns
from those edits (persistent pedagogical memory). Stack: Vite/React + Supabase + Google Gemini.
Status: production build on `main`; live grading verified in cloud.

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
**One-liner:** *"aiTA grades like you would — to your rubric, in your voice — and gets more like
you every week. You stay the teacher."* (Speed is the byproduct, not the headline.)

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
- **DO:** lead with voice/trust/relief; name human-in-the-loop as a virtue; show real student work; quantify learning (edit-rate trending down).
- **DON'T:** lead with raw speed; imply teacher replacement; bundle/imply punitive AI-detection; claim "fully compliant"; use sterile corporate-AI aesthetics.

## GTM
Bottom-up freemium ("Start teaching aiTA your voice") → in-product champion → department/school.
Channels: r/Teachers, teacher FB groups, ed-social, TPT audience, PD, word-of-mouth.
