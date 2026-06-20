---
type: adversarial-review
role: independent skeptical red-team
target: aiTA strategy + 1-year roadmap (S1 SHIP+PROVE → S2 GROW+HARDEN → S3 SCALE+MOAT → S4 PLATFORM)
date: 2026-06-20
basis: read of GOAL.md, XPRIZE-MASTER-PLAN.md, ROADMAP.md, STATE.md, GOAL-ALIGNMENT-REVIEW.md, LAUNCH-PLAN.md, LAUNCH-PROGRESS.md, phase-15 (CONTEXT/PROTOCOL/VERDICT), Firebase migration design, WEEK-1-FOUNDER-RUNBOOK, next-build-research, + code (auto-finalize.ts, deid.ts)
disposition: find what is weak/wrong/missing/mis-sequenced/over-optimistic. NOT praise.
---

# aiTA — Adversarial Strategy & Roadmap Review

The plan is internally articulate and the trust spine is genuinely real. That is exactly why the failure
modes below are dangerous: they are the ones a confident, well-documented plan papers over. Severity:
CRITICAL = can sink the submission or violate the product's own contract; HIGH = likely to cost a sprint
or a credibility hit; MEDIUM = real but survivable.

---

## CRITICAL-1 — The pre-registered proof STILL uses the metric the strategy itself declared dead. Pick one before any teacher grades a batch.

**Claim challenged:** "We have a clean, pre-registered, honestly-killable voice-convergence proof"
(XPRIZE-MASTER-PLAN §must-go-right #2; the redesign in §Proof).

**Why it's risky:** The master plan (Jun 15) says the **edit-rate-decline ≥40%** design is *INVALID* —
"Borchers et al. (AIED 2026, n=117): 51.3% of teachers never edit AI feedback, so a 'decline' is
uninterpretable" — and redesigns the proof around a GPT-judge voice-trait rubric + LUAR-MUD cosine +
holdout. **But the actual pre-registered artifacts were never updated.** `15-CONTEXT.md` §Success
Criteria, `PROTOCOL.md`, and `VERDICT.md` §1 (LOCKED) all still define PROVEN as "edit-rate declines
≥40% batch-1→N." The *code* (`convergenceMetrics.ts`, `eval/run.mjs --convergence`,
`ConvergencePanel.verdictFor()`) computes the dead metric. So there are two contradictory
"pre-registered" proofs in the repo, and the one that is actually LOCKED and instrumented is the one the
strategy says a methodologically-literate judge will reject. You cannot "pre-register" after you've seen
which design passes — that is the one move that destroys the proof's entire credibility claim ("a proof
that could have failed").

**Falsifiable test / fix:** Before Batch 1 (Wk2–3), rewrite `VERDICT.md` §1, `PROTOCOL.md`, and
`15-CONTEXT.md` to the GPT-judge + LUAR + holdout design, re-implement the metric in code, and OSF-file
*that* (Jul 7). If you cannot reconcile the two designs in writing this week, the proof is not
pre-registered — it is post-hoc, and should not be claimed as the moat.

---

## CRITICAL-2 — Auto-finalize defaults ON and publishes grades unattended. That directly breaks GOAL non-negotiable #1 ("HITL approval is mandatory") and #5 (trust > automation).

**Claim challenged:** Auto-finalize is "On-the-Loop, a first-class agentic pattern" that "makes the
AI-native claim TRUE" (XPRIZE-MASTER-PLAN §must-go-right #1) and is harmless because the teacher
"monitors exceptions."

**Why it's risky:** `auto-finalize.ts` sets `AUTO_FINALIZE_DEFAULT_ENABLED = true` and publishes any
"graded", flag-free grade with model `confidence >= 0.85` **with no human in the loop**. GOAL.md lists as
non-negotiable: *"Human-in-the-loop approval is mandatory,"* *"nothing final without teacher approval"*
(ROADMAP Phase 5), and *"Teacher trust is more important than automation speed."* Auto-finalize-on-by-
default is the literal inversion of all three. Worse, the gate trusts the **model's self-reported
confidence** — a notoriously poorly-calibrated signal; LLMs are routinely confidently wrong on subtle
off-rubric or partially-on-topic essays, and those are exactly the cases that won't carry a blocking flag.
A single auto-published wrong grade on a real student is the kind of story that ends a teacher tool. The
XPRIZE incentive (show unattended grading on video) is actively pushing the product to violate its own
spine — this is the clearest goal-vs-prize conflict in the plan.

**Falsifiable test / fix:** Default auto-finalize **OFF**; make it opt-in per-assignment after a teacher
has seen ≥1 batch. For the video, demo it as an explicit teacher-enabled mode, not the default. Add a
calibration check: on the holdout set, measure the false-auto-finalize rate (auto-published grades the
teacher would have changed) — if it's >5%, the 0.85 threshold is unsafe and the "On-the-Loop" claim is
marketing, not engineering. Do NOT claim "AI operates the business" on the back of an uncalibrated
self-confidence number.

---

## CRITICAL-3 — The proof cohort (Cohort B) is the longest pole and is gated on a chain no one has started: recruit → DPA → consent → ≥4 batches over the summer. The math doesn't fit before Aug 17.

**Claim challenged:** "Prove the voice wedge with 4–6 teachers in one summer," batches 1–4 across Wk3–Wk6,
kill-criterion decision Wk7 (XPRIZE-MASTER-PLAN timeline).

**Why it's risky:** As of 2026-06-20 there are **zero recruited teachers, no signed DPA, no consent
flipped, and migrations 0017/0018 (the proof instrumentation) are unapplied.** The dependency chain is:
recruit gr9–12 ELA teachers *who are on summer break* → get a *school* to sign an SDPC NDPA over the
summer (district legal is slow-to-absent in July) → teacher flips consent → teacher sources real student
essays (school year is over — where do 4 batches × 10–15 *fresh, comparable-ability, same-assignment*
essays come from in July?) → grade + HITL-edit ≥4 batches with ≥1 week between for the rebuild to matter.
Each batch needs a real edit session; that's weeks of a volunteer teacher's summer. The plan even admits
the cohort "runs on its own DPA clock (longest pole)." A single teacher dropping out (likely — unpaid,
summer, no product loyalty yet) collapses an already-tiny n. This is the single most likely sprint-sinker.

**Falsifiable test / fix:** Start recruiting **today**, not Wk1; over-recruit to 8–10 to survive
attrition; line up the essay corpus *now* (use a teacher's archived prior-year sets under DPA, not
freshly-collected summer work). If 2 DPAs aren't signed and 2 teachers aren't grading by **Jul 1**, the
"measured proof" claim for Aug 17 is dead — fall back to the pre-committed Wk7 pivot (time-savings) *now*
rather than discovering it in late July with no time to rebuild.

---

## CRITICAL-4 — n = 4–6 teachers (and a tiny holdout) cannot produce a statistically meaningful voice-convergence result. The proof's rigor claim oversells what the data can support.

**Claim challenged:** The proof "survives a methodologically literate judge" and is the moat
(XPRIZE-MASTER-PLAN).

**Why it's risky:** A methodologically literate judge is precisely who will note that n=4–6 teachers,
≥8 feedback samples each, with a per-teacher holdout of ~8–10 essays, has no power to establish anything
beyond an anecdote — and LUAR-MUD itself "degrades on short text (≤250-word feedback)" per the plan's own
caveat, which is exactly the regime teacher feedback lives in. The honest convergence shape is "fast-then-
plateau from ~8 examples," so even a positive result shows a small, bounded effect. The plan's framing
("verifiable, not a marketing claim") invites the rigor scrutiny it can't withstand at this n. Over-
claiming rigor to a judge who can see through it is worse than honestly framing it as a pilot signal.

**Falsifiable test / fix:** Frame the proof as a **pre-registered pilot with a pre-committed kill
criterion**, not a powered study; lead with "could have failed and didn't" + per-teacher case studies,
and state the n and the power limits *yourself* before the judge does. Pre-commit the analysis to a
per-teacher within-subject comparison (each teacher is their own control via the holdout arm), which is
the only design that's defensible at this n.

---

## HIGH-5 — The Firebase backend migration is on the roadmap at all. The master plan calls it zero-XPRIZE-value and non-blocking — so its presence is pure opportunity cost during a 9-week revenue sprint.

**Claim challenged:** The Firebase/Cloud-Functions migration (design dated 2026-06-18) as a roadmap
workstream (S2/S3, LAUNCH-PLAN Phase E / migration "M4–M6").

**Why it's risky:** The migration design itself says it is a "non-blocking strangler … never blocks the
launch path," and the XPRIZE master plan doesn't list it among the three must-go-rights. So by the
project's own assessment it generates **no XPRIZE points** (Vertex AI + Cloud Run already satisfy the
"≥1 Google Cloud product" gate per LAUNCH-PROGRESS M1/M2). Porting 16 Deno functions + 12 shared modules
Deno→Node, plus the auth cutover that "breaks 21 direct supabase-js frontend reads," is weeks of high-
risk refactoring on a working, security-hardened app — every hour of which is an hour not spent on the
three things that actually decide the prize (auto-finalize calibration, the proof cohort, arms-length
revenue). It also re-opens the security surface (new secret handling, new auth path, RLS predicate
rewrites) that was just hardened. The mere existence of an approved 2026-06-18 design doc signals it's
competing for attention it shouldn't get until after Aug 17.

**Falsifiable test / fix:** Freeze the migration until the XPRIZE submission ships. Put it explicitly in
S3+ ("post-prize"), not S2. Opportunity-cost test: for every migration PR before Aug 17, name the XPRIZE
point it earns — if the answer is "none" (it will be), it doesn't get merged before submission. Keep
Supabase as-is; it works.

---

## HIGH-6 — The ~48-paid / ~$720-MRR floor and "arms-length strangers paid" gate are over-optimistic given there are zero users, no live deploy, and the acquisition window is summer break.

**Claim challenged:** "Base case ~48 paying teachers / ~$720 MRR by Aug 17"; "acquire STRANGERS via PH /
Reddit / FB" (XPRIZE-MASTER-PLAN).

**Why it's risky:** The hardest gate is "did a *stranger* pay you," and the plan is trying to clear it
during **June–August, when teachers are on break and not grading** — the worst possible acquisition
window for a grading tool. Trust-fix deploy, Stripe live, and migrations are all still founder-gated and
undone, so the funnel isn't even live yet. The channel plan is fragile: FB self-promo = "permanent ban,"
so it depends on *teacher users* proxying posts (you have no teacher users yet — chicken/egg); Reddit
r/Teachers = "zero self-promo"; PH is a one-day spike that converts poorly to a niche B2B paid tool.
Working backward from 48 paid at EdTech trial-conversion (~24.8% cited) needs ~190+ activated trials from
strangers, in summer, from cold channels, in 9 weeks. That is aggressive-to-fantasy. And related-party
(founder-network) dollars are explicitly quarantined and don't count, removing the easiest revenue.

The GTM research is blunt: the **bear case (~8 paid / ~$120 MRR) "fails the credibility bar entirely,"**
and the *most likely quiet failure* is activation undershoot — if summer signups activate below ~20% (vs
the 50–60% assumed), the base case "collapses to ~15–20 paid / ~$225–$300 MRR — below the bar." Product
Hunt has a documented **0.25% signup→paid floor** ("PH sends curious people, not buyers"). So the 48-paid
base case sits on an activation rate the season works against.

**Falsifiable test / fix:** Set a Wk3 leading-indicator gate (the research demands "a hard Week-3
checkpoint with a pre-decided pivot to live 'grade-along' onboarding calls"): if signup→activation isn't
>25% AND there aren't ≥10 genuinely arms-length active teachers, the 48-paid base case is invalid. Pre-
write the "small but real + steep slope + high arms-length %" narrative as the *primary* case, not the
fallback — but note MEDIUM-17: the tie-break compares absolute revenue first, so slope alone won't save a
tie.

---

## HIGH-7 — De-identification only masks roster names passed in. Real essays leak peer names, teacher names, schools, locations, and self-identifying details to Gemini. The "PII stays out of the model" / FERPA-path claim is overstated.

**Claim challenged:** "send-time de-identification keeps PII out of Vertex"; "the compliance keystone"
(XPRIZE-MASTER-PLAN; WEEK-1-FOUNDER-RUNBOOK §5; COMPLIANCE-POSTURE).

**Why it's risky:** `deid.ts` (`maskNamesPreservingOffsets`) only redacts the **specific student names
the caller passes in `names[]`** — i.e., the roster. The runbook itself admits "other in-text PII is not"
masked. Student essays routinely contain *other* students' names, the teacher's name, the school name, a
hometown, a parent's name, a sports team, an immigrant/personal-narrative detail — none of which are in
the roster array, all of which are FERPA-relevant identifiers, all of which go to Gemini in cleartext.
Calling this "the FERPA answer for Cohort A" is the kind of overstatement that a careful district counsel
(or an adversarial judge) will puncture, and the project's own rule is "never claim fully compliant."
This is also the exact data flowing through the proof cohort's *real* student essays.

**Falsifiable test / fix:** Run a NER pass (or a Gemini de-id pre-pass) over essay bodies before grading,
not just roster-name regex; or restrict Cohort A strictly to the pre-loaded sample essays (no real PII at
all) and be explicit that Cohort B's real essays go to the model with only roster-name masking + a signed
DPA as the legal basis. Audit: feed 10 real-style essays through `deid.ts` and count residual identifiers
— if >0, the "PII out of the model" claim is false as written.

---

## HIGH-8 — The wedge (teacher-voice learning) is a perishable head-start, not a moat. Competitors market the same thing and the technique is a prompt pattern anyone can copy.

**Claim challenged:** "aiTA is the only entrant with a … MEASURED voice-convergence proof … That + trust-
by-construction is the moat" (XPRIZE-MASTER-PLAN §Competitive wedge).

**Why it's risky:** The differentiator as built is **binary-signal few-shot retrieval into the prompt**
(15-CONTEXT explicitly defers real KTO/DPO) — i.e., put the teacher's accepted/edited exemplars in the
context window. That is a weekend feature for any competitor, not defensible IP. Graide/Pensive already
*market* "learns your style"; the plan's only claimed edge is that aiTA *measured* it — but a measurement
is a one-time marketing asset, not a moat, and competitors (Edexia among them, per the brief) are hiring
for exactly this loop. The real durable moats in this space — proprietary teacher-edit data at scale,
district contracts/integrations, switching costs — are precisely what aiTA has none of yet (zero users).
The strategy is betting the company on a head-start in a feature with no structural defensibility.

**Hardest evidence (from the competitive research):** **Edexia (YC W25) is actively hiring a Founding AI
Engineer whose JD names "reinforcement learning from teacher corrections."** The research's own words:
"Your wedge is on a competitor's job board, written down, with equity attached." Edexia already has 81.2%
exact-agreement on 579 VCE English essays, funding, and stated intent. Brisk (2M educators, $20M) and
MagicSchool ($65M, 6M educators) own the *distribution* to ship a voice loop "to all of them in a release
cycle" if/when they build it (whether they already have it in dev is an open question, not disproven).
CoGrader (50k teachers, districts, compliance) "could close it the instant it chooses." The research's
verdict is explicit: the wedge is "**real but not yet defensible … a head start you must convert before
the window closes,**" with a moat window of only **~18–36 months** and **near-zero switching cost today**
(the loop hasn't learned anyone's voice yet). The technique aiTA actually built (few-shot retrieval) is
weaker than the research's load-bearing recommendation (**KTO** — "the single most load-bearing
engineering decision in the company"), which the roadmap explicitly *defers*.

**Falsifiable test / fix:** Name the *actual* moat being built toward in S3/S4 (accumulated per-teacher
edit data → KTO → switching cost; or LMS/SIS integration lock-in). "We measured it first" is a one-time
*judging* asset, not a market moat. Test: if Edexia ships its RL loop in Q4, what stops aiTA's users from
leaving? If "nothing yet," the moat work is missing (MISSING-11) and S3 is named "SCALE+MOAT" on a moat
that doesn't exist. Prioritize KTO into S2/S3, not "deferred."

---

## HIGH-9 — The growth loop's believe-moment is wired to the dead convergence metric, creating a hidden cross-dependency.

**Claim challenged:** The referral/share loop (next-build-research; S2 GROW) as an independent growth
workstream.

**Why it's risky:** Per `next-build-research/referral-and-trial.md`, the T1 referral hero card mounts
under `ConvergencePanel`'s positive verdict and renders the copy *"aiTA is learning your voice — edit
rate down {delta}%"*, where `delta` comes from `editRateDeltaPct` — **the exact edit-rate metric the
strategy declared invalid (CRITICAL-1).** So the primary viral trigger fires off a number the product
shouldn't be standing behind, and if CRITICAL-1 is fixed (metric replaced), the referral loop's main
surface silently breaks or shows nothing. The referral *reward economics* (K-factor, free-month credits)
are also flagged "founder-gated" and unbuilt — so the loop can't actually drive paid acquisition yet.

**Falsifiable test / fix:** Sequence the metric fix (CRITICAL-1) *before* the referral loop, and re-point
the T1 card at whatever the new proof metric is (or at time-saved, which is judge-and-teacher-safe). Don't
ship a viral loop whose headline is a deprecated number.

---

## HIGH-10 — "Newly created after May 19" eligibility is a real submission risk being managed by narrative framing, not by a verified rule reading.

**Claim challenged:** "aiTA predates the window … lead the writeup with the in-window build" + the Week-1
task "verify 'newly created' in writing" (LAUNCH-PLAN §5; XPRIZE-MASTER-PLAN Wk1 gate).

**Why it's risky:** The eligibility paragraph is being *written* (a persuasive framing) before the rule is
*confirmed* (the Wk1 gate is "verify rule language" — i.e., it's not yet verified). If the rule actually
requires a project created after the start date and disqualifies enhanced pre-existing apps, the entire
9-week effort is ineligible regardless of how good the framing is. This is a binary, plan-ending risk
parked behind soft language ("be transparent," "lead with the in-window build"). The repo's public Git
history also plainly shows pre-window origin (Lovable template, May commits) — a judge can check.

**Falsifiable test / fix:** Get the rule confirmed in writing from the organizer *this week* before
investing another sprint. If pre-existing-enhanced is allowed: document it and move on. If not: this is a
STOP — re-scope or withdraw. Do not let "framing" substitute for a yes/no answer on eligibility.

---

## HIGH-14 — The safety pillar and the learning signal are the SAME mechanism (teacher review), and the auto-finalize push actively starves it. This is a self-contradiction at the heart of the design.

**Claim challenged:** HITL gives both trust ("teacher stays in control") AND the learning loop ("edits
improve grading"), while auto-finalize lets the AI publish unattended (XPRIZE-MASTER-PLAN; GOAL.md).

**Why it's risky:** The competitive research states it plainly: "aiTA's safety pillar and its learning
signal are the *same* mechanism — teacher review — and the evidence says teachers do not always perform
it." Borchers (n=1,349, 117 teachers): teachers accept **77.8% of AI feedback unchanged, 51.3% never edit
at all**, edits semantically near-identical (cosine ~0.88–0.97). So even *with* a human in the loop, the
edit signal is "a near-flat gradient" — and **auto-finalize (CRITICAL-2) removes the human entirely on
high-confidence grades, which are exactly the ones a teacher was most likely to accept and thus the
richest "this is good" signal.** The plan is simultaneously (a) betting the moat on learning from teacher
edits and (b) building/defaulting-on a feature that eliminates the review step that produces those edits.
"When review is theater, the trust guarantee is hollow AND the learning loop is starved." You can't have
unattended grading as the headline AND teacher-edit-driven voice convergence as the moat — they consume
each other.

**Falsifiable test / fix:** Decide which is the strategy. If voice-convergence is the moat, auto-finalize
must route the *learnable* cases (medium-confidence, on-rubric) to review and only auto-publish the
trivial ones — and you must measure whether enough edit signal survives. Pre-commit: if <X% of grades get
a substantive edit per batch, the few-shot loop has no fuel and "it learns you" is unprovable regardless
of n.

---

## HIGH-15 — "Make it sound like the teacher" may backfire: disclosed AI feedback is rated less genuine, and louder voice-mimicry is a better deception with a sharper backlash. The core value prop has an evidence-based downside the plan never addresses.

**Claim challenged:** "Outputs must align with teacher voice"; "looks like the teacher graded it" as the
central wedge (GOAL.md #4; competitive thesis).

**Why it's risky:** Nazaretsky et al. (2026, n=472): students rate *identical* feedback "significantly
lower on genuineness the moment it is disclosed as AI." The competitive research's adversarial read:
"Making AI sound *more* like the teacher could, at worst, be a more effective deception that produces a
sharper backlash when discovered" — defeated only by genuine teacher authorship, "exactly the labor aiTA
promises to reduce." There is also a documented **values-skeptic teacher segment** ("Nobody learns,
nobody gains") that is a hard NO to any voice-grader, plus a **transparency-first counter-market** (PAIRR;
Common Sense Media rates this tool category "Moderate Risk," calling them "invisible influencers"). If the
disclosure/transparency norm wins, aiTA's wedge is "on the wrong side of it." None of this risk appears in
the plan, which treats voice-mimicry as unambiguously good.

**Falsifiable test / fix:** Add a disclosure stance to the strategy (is AI authorship disclosed to
students? to parents?) and pressure-test the wedge against the transparency-first scenario. Carve the
values-skeptic segment out of the TAM explicitly so the addressable market isn't overstated.

---

## MEDIUM-16 — Day-one value is generic; the plan needs voice-convergence felt in the first 3–5 papers, but ships the same generic LLM draft as everyone else cold. The PLG and moat bets are coupled and the latency between them is unmodeled.

**Claim challenged:** Generous free tier + trial drives PLG conversion (LAUNCH-PLAN §3); voice-convergence
is the differentiator.

**Why it's risky:** The competitive research: "on day one its output is the same generic LLM draft as
everyone else's, because it has not learned the teacher's voice yet. The PLG playbook demands instant
value; the voice flywheel delivers delayed value." Resolvable only one way: "experiential proof of
voice-convergence must land inside the first one to two grading sessions (3–5 papers) … a product
requirement aiTA must hit, not an outcome the evidence predicts." Few-shot retrieval from a cold store
won't converge that fast. And the two bets are coupled: "knock out the flywheel and the GTM collapses
into a commodity race aiTA loses on price to a four-person bootstrapped team" (EssayGrader is the bear
profile). GRR for undifferentiated sub-$50 AI tools is **23%**; specialized vertical AI ~**70%** — if the
loop doesn't visibly close, aiTA retains like the 23% cohort.

**Falsifiable test / fix:** Set a hard product target: a measurable voice shift the teacher can *feel* by
paper 5 of session 1, and instrument it. If cold-start few-shot can't deliver that, the trial converts on
generic feedback (commodity) and the moat thesis is decoupled from the actual purchase — say so.

---

## MEDIUM-17 — Tie-break compares revenue FIRST, and Google's under-18 service terms (§20(d)) are an unconfirmed compliance landmine. Two specific XPRIZE realities the plan underweights.

**Claim challenged:** "Lead the viability case with trajectory, not the absolute dollar figure";
de-identification is the compliance keystone (XPRIZE-MASTER-PLAN).

**Why it's risky:** Per the GTM research, the **tie-break runs Business Viability first**, then AI-Native,
then Category Impact — "a documented disadvantage, not a soft risk." aiTA's "comparatively modest revenue
is the *first* number compared," and growth-rate optics "mitigate, not resolve" it. Separately, Google's
Service-Specific Terms **§20(d)** restrict applications "directed towards or likely to be accessed by
individuals under 18" — flagged as a Week-1 diligence item to confirm *in writing with Google*, "not a
settled question." A grading tool for K-12 student work is squarely in that zone. And 46 states have
student-privacy laws stricter than FERPA (CA SOPIPA, NY Ed Law 2-D) that bind vendors directly regardless
of teacher attestation. The plan's compliance section leans on de-id + an NDPA and doesn't surface §20(d)
or state laws.

**Falsifiable test / fix:** Confirm §20(d) applicability with Google this week (binary, like eligibility).
Maximize *absolute* arms-length revenue, not just slope, given the tie-break order. Map the top states
your Cohort-B teachers are in against their specific student-privacy statutes before signing DPAs.

---

## MEDIUM-11 — Whole workstreams are missing from the roadmap: post-trial churn/retention, support/success, unit economics & CAC, and FERPA legal depth beyond copy.

**Claim challenged:** The S1→S4 arc as a complete plan.

**Why it's risky:** The plan is heavily front-loaded on *acquisition* and *the prize*, and thin-to-absent
on what makes a teacher tool a business: (a) **Retention/churn** — a 14-day trial that converts in summer
says nothing about whether teachers stay once school starts and they actually grade daily; there's a
`churn-prevention` concern with no workstream. (b) **Support/customer success** — real teachers will hit
real bugs (the bucket-name inconsistency surfaced in LAUNCH-PROGRESS is one live example) and there's no
support function. (c) **Unit economics / CAC** — XPRIZE requires CAC and cost fields, and the plan has no
CAC model; at $15/mo, CAC tolerance is tiny and the channel plan (webinars, proxy posts) has unmeasured
cost. (d) **FERPA depth** — only a "copy audit" and an NDPA signature; no DPA template reviewed by
counsel, no data-subprocessor list, no breach plan — thin for handling minors' education records.

**Falsifiable test / fix:** Add explicit S2 workstreams for retention (cohort-retention metric, not just
trial-conversion), a minimal support loop, and a one-page CAC/LTV model. For FERPA, get the DPA stub
reviewed by an actual attorney before a single real student essay flows under it (Cohort B).

---

## MEDIUM-12 — Founder-gated single points of failure form an unbroken critical path; nothing downstream can be verified until the founder executes a serial chain.

**Claim challenged:** "the code is all built; remaining work is founder-config-gated" (STATE, runbooks).

**Why it's risky:** Auto-finalize, the trust-fix, trial, real Free/Pro gating, and the proof loop are ALL
inert until the founder, serially, (1) confirms the right project ref [the runbook flags a live
`config.toml` vs STATE project-ref **mismatch** — using the wrong one is "hard to undo"], (2) merges PR
#14, (3) applies migrations 0015–0021, (4) deploys grade-submission, (5) goes Stripe-live, (6) rotates
the exposed `sk_live_` + DB secrets. None is verified working in production. The whole "we built it"
status is unfalsifiable until this chain runs, and an exposed live Stripe key sitting un-rotated while
planning a public launch is an active security exposure, not a backlog item.

**Falsifiable test / fix:** Treat the founder chain as the real Week-1 critical path with its own dated
gate; resolve the project-ref mismatch and rotate the `sk_live_` key **first** (before anything public).
Until a real essay is graded → auto-finalized/withheld correctly in *production*, treat every "done"
claim as unverified.

---

## MEDIUM-13 — The kill/pivot criteria are honest on the proof but soft everywhere else.

**Claim challenged:** "The schedule is a sequence of off-ramps, not a growth curve" (XPRIZE-MASTER-PLAN).

**Why it's risky:** The proof has a genuinely pre-committed kill criterion (good). But the *other* two
must-go-rights don't: there's no pre-committed threshold for "auto-finalize is too inaccurate to ship"
(see CRITICAL-2), and the revenue off-ramp ("pivot Criterion-C to time-savings" at Wk7) is about the
proof, not about "we have ~0 arms-length paid by Wk5." Soft gates let a sunk-cost plan limp to Aug 17 and
discover failure at the cliff.

**Falsifiable test / fix:** Pre-commit numeric gates now: auto-finalize ships only if holdout false-
finalize <5%; revenue stays the headline only if ≥10 arms-length active by Wk3 and first arms-length paid
by Wk4 (already a gate — enforce it as a STOP, not a status line).

---

## Top sequencing corrections (summary)
1. **Fix & re-pre-register the proof metric (CRITICAL-1)** before any batch or the referral loop (HIGH-9).
2. **Confirm XPRIZE eligibility in writing (HIGH-10)** before spending another sprint — it's binary.
3. **Default auto-finalize OFF + calibrate (CRITICAL-2)** — protect the product's own contract.
4. **Start Cohort-B recruiting + essay sourcing today (CRITICAL-3)**; over-recruit; Jul 1 go/no-go.
5. **Freeze the Firebase migration until post-Aug-17 (HIGH-5).**
6. **Run the founder serial chain + rotate the live Stripe key first (MEDIUM-12).**
