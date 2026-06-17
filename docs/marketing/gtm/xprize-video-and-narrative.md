# XPRIZE Submission — <3-min Video Script + Judge Narrative

> The two judge-facing deliverables. Strategy: `XPRIZE-MASTER-PLAN.md` (target = $50K runner-up on the
> balanced 3-criteria score; win on **AI-native operations** + the **measured voice-convergence proof**).
> Judge-facing framing only — lead with the documented **bias** problem and the measured proof; **no
> student-outcome claims.** The video must SHOW unattended grading (auto-finalize), or the AI-native claim
> is narrated, not true.

---

# PART 1 — Demo video script (target 2:50, hard cap 3:00)

Format: `[TIME] ON-SCREEN — VO`. ~430 words VO (~150 wpm) leaves room for demo beats. Record the demo on
the real app (`aita-launch-prep` build); auto-finalize is shipped (commit `1e95e9a`).

```
[0:00–0:12]  ON-SCREEN: a teacher's desk, a tall stack of essays; cut to a generic AI feedback blurb.
VO: "Every English teacher knows this stack. And they know the catch with AI grading: it's biased,
     it's generic, and it doesn't sound like them — so they stop trusting it."

[0:12–0:30]  ON-SCREEN: aiTA dashboard, clean. Title card: "aiTA — grades in your voice, you stay in command."
VO: "aiTA is different by construction. It grades to your rubric, learns your feedback voice, refuses work
     it shouldn't touch — and it runs as an AI workforce you supervise."

[0:30–1:25]  ON-SCREEN: click "Grade all" on a 25-essay batch. The named agent pipeline animates
            (Rubric → Relevance → Grading → Annotation → Feedback → Style). Grades populate UNATTENDED.
            The dashboard reframes as a monitoring view: "22 auto-finalized · 3 routed to you."
VO: "Watch it grade a full set — unattended. High-confidence, on-topic grades publish automatically.
     This is auto-finalize: the AI does the work, and only the cases that need a human get routed to one.
     The teacher isn't grading 25 essays. They're supervising an exception queue of 3."

[1:25–1:55]  ON-SCREEN: open one of the 3 exceptions — an off-topic submission. aiTA shows a WITHHELD grade
            + the reason ("off-assignment — not scored"). Then the voice toggle: "generic draft" vs
            "in the teacher's voice," side by side.
VO: "Here's why you can trust the ones it publishes: when work is off-topic, aiTA refuses to grade it and
     says why. And the feedback it does write is in the teacher's own voice — not a bot's. Flip the toggle:
     same essay, generic versus theirs."

[1:55–2:20]  ON-SCREEN: teacher edits one comment, clicks Approve. A small "aiTA learned from your edit" toast.
VO: "Every edit teaches aiTA that teacher's voice. The loop is the product — and we measured it."

[2:20–2:48]  ON-SCREEN: the convergence chart (with-profile vs holdout, rising) + a line: "Pre-registered
            on OSF · honest kill criterion." Then a Stripe revenue-by-month sparkline + "arms-length teachers."
VO: "We pre-registered a study — with a kill criterion that could have failed — showing aiTA converges on a
     teacher's voice. Real teachers are paying. Real grading is running in production, mostly unattended."

[2:48–2:58]  ON-SCREEN: logo + "aiTA — your voice. You stay the teacher." + trial URL.
VO: "aiTA. The grading runs itself. The teacher stays in command."
```

**Shot list to capture (real app):** Grade-all on a 25-batch · the agent pipeline animation · the
"N auto-finalized / M routed" summary · an off-topic WITHHELD card · the voice toggle · an edit→approve→learn
toast · the convergence chart · a Stripe revenue-by-month chart. **B-roll:** the Marginalia UI wide shot.

**Production notes:** ≤3:00 hard (the rules cap it). Captions burned in (judges may watch muted). Show real
timestamps/counts — verifiable beats polished. End on the AI-native + command-stays-human dual message.

---

# PART 2 — Judge narrative (≈700 words)

> Order: documented bias → aiTA's structural fix → the measured proof → AI-native operations → viability.
> Maps to the three judging criteria without ever claiming student outcomes.

**The problem is measured, not asserted.** AI essay grading carries documented bias. Stanford's LAK26 work
and ETS data — including a ~1.1-point penalty against Asian-American writers — show that generic LLM graders
are unreliable and unfair. Teachers feel it too: the majority don't trust-and-edit AI feedback, because it
misapplies the rubric and reads like a machine. The result is an entire category of tools that teachers try
once and abandon. That distrust is the real market failure, and it's the failure aiTA is built to fix.

**aiTA fixes it by construction, not by disclaimer.** Four mechanisms work together. First, **rubric-grounded
scoring** with a deterministic relevance gate: aiTA grades strictly to the teacher's rubric and **withholds**
a grade on off-topic or off-assignment work rather than inventing one. Second, **mandatory human-in-the-loop**:
the teacher is the final grader, always. Third, **trust-through-refusal**: per-criterion evidence and
confidence, server-side score recomputation, and visible reasons when it declines. Fourth, **voice learning**:
aiTA learns each teacher's feedback voice from their accept/edit/dismiss signals, so the output sounds like the
teacher — which is exactly what makes them willing to use it. Bias is constrained at the architecture level.

**The proof is pre-registered and could have failed.** Most "learns your style" claims in this market are
marketing. Ours is a study. We pre-registered on OSF — before collecting outcome data — a holdout-controlled,
within-teacher design with a **blinded GPT-judge** scoring voice-trait fidelity as the primary metric,
corroborated by aggregated LUAR-MUD stylometric similarity, and an **honest kill criterion**: if aiTA's
with-profile feedback doesn't measurably beat a no-profile holdout, we say the wedge failed and pivot to a
time-savings claim. A proof that could have failed and didn't is worth more than any demo. (We deliberately
replaced an earlier edit-rate metric after evidence — Borchers et al., AIED 2026 — showed 51% of teachers
never edit AI feedback, making edit-rate uninterpretable. We changed the metric because the science said to.)

**The operation is genuinely AI-native.** aiTA runs as a traced, named multi-agent pipeline — Rubric,
Relevance/Risk, Grading, Annotation, Feedback, Style — and, with confidence-thresholded **auto-finalize**,
publishes high-confidence, on-topic grades **unattended**, routing only low-confidence or off-topic cases to
the teacher. This is the On-the-Loop pattern: the AI does the grading; the human supervises exceptions. The
dashboard is a monitoring-and-exception surface, not a manual workbench. The business's core unit of work —
grading — is performed by AI agents in production, which is precisely what an AI-native company should be able
to show, not narrate.

**Viability is arms-length and growing.** We launched on a 14-day full-access trial (no card; onboards on
sample essays, no student data), priced at the market anchor with annual prepay, and we acquire strangers
through teacher communities, content, and Product Hunt — quarantining every founder-network dollar as
related-party so the headline revenue is genuinely arms-length. We report **trajectory, arms-length share,
and unit economics**, not a vanity total. Compliance is real and specific: send-time de-identification keeps
education records out of the model, so we state exactly what we do and never claim "fully compliant."

**Why aiTA, specifically.** Competitors market "sounds like you" as a prompt setting or refuse to score at
all. aiTA is the only entrant pairing **trust-by-construction** (it refuses what it shouldn't grade) with a
**pre-registered, measured** voice-convergence result. That combination — an AI that operates the business
unattended *and* has proof it earns the teacher's trust — is the case for viability, AI-native operations, and
category impact, in one product.

---

## Founder-gated vs agent-done
**Founder:** recording/narrating the video, the real Stripe + convergence numbers at submission time, final
edit. **Agent-done (this doc + on request):** the full script, shot list, the narrative, and a tightened
60-second cut-down if you want a teaser.
