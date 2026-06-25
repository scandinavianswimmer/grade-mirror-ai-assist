# aiTA — AI-Authorship Disclosure Stance & TAM Carve-Out

> Strategy doc addressing adversarial finding **HIGH-15**. Agent-drafted 2026-06-25 from `docs/v2-planning/GOAL.md`
> (non-negotiables), `docs/marketing/MESSAGING.md` (the two-audience rule), `docs/marketing/ICP-RESEARCH-AND-POSITIONING.md`
> (the Sarah persona), and `docs/COMPLIANCE-POSTURE.md` (honest-not-"fully-compliant" framing). Sections marked
> **[FOUNDER VERIFY]** assert facts the agent cannot confirm. This is a position doc, not product spec — but it
> recommends concrete product behavior the team should ratify before launch.

---

## 0. The finding we are answering (HIGH-15)

The launch plan sells aiTA on **voice fidelity**: feedback that "reads like *you* wrote it." The plan never
reconciles that promise with a piece of evidence that cuts directly against it:

> **Nazaretsky et al. (2026, n=472):** students rate *identical* feedback significantly lower on **genuineness**
> once it is disclosed as AI-authored. The penalty attaches to the *label*, not the *content*.  **[FOUNDER VERIFY
> citation — confirm authors, venue, n, and effect size before any external use.]**

The adversarial reading is sharp and we should state it plainly rather than soften it:

1. **Voice fidelity is, mechanically, better camouflage.** A tool that makes AI feedback sound *more* like the
   teacher makes the AI origin *harder* to detect. If genuineness collapses on disclosure, then a more convincing
   imitation is not a neutral feature — it is a more effective concealment, with a **sharper backlash when
   discovered** (the gap between "what I thought was personal" and "what was machine-drafted" is wider).
2. **The only clean defeat of the backlash is genuine teacher authorship** — exactly the labor aiTA is built to
   reduce. So we cannot wave the problem away by saying "but the teacher is involved." We have to show the
   involvement is *authorship*, not a rubber stamp.
3. **There is a market on the other side of this.** A **values-skeptic teacher segment** treats any
   voice-mimicking grader as a hard NO on principle. And a **transparency-first counter-market** is forming
   (PAIRR-style "process-and-AI-resistant" assessment norms; Common Sense Media rates this whole tool category
   **"Moderate Risk / invisible influencers"**). **[FOUNDER VERIFY both references.]** If disclosure norms win,
   a "sounds like you, don't worry about it" posture is on the wrong side of the trend.

This doc takes a position on all three: a disclosure stance (§1), a pressure-test against the transparency-first
future (§2), and a TAM correction that removes the segment we *cannot honestly serve* (§3).

The honesty bar is the same one `COMPLIANCE-POSTURE.md` already sets for privacy: **never claim more than is true.**
We did not say "fully compliant" on FERPA; we will not say "it's just like you wrote it, no caveats" on authorship.

---

## 1. Disclosure stance

### 1.1 The recommended stance, in one line

> **Teacher-authored, AI-drafted, teacher-disclosed.**
> aiTA produces a *draft*. A human teacher reviews, edits, and **signs off on every grade** — the teacher is the
> author and the accountable party of record. Whether students/parents are *told* AI helped produce the draft is
> the **teacher's disclosure decision, made under their school/district policy** — and aiTA makes that disclosure
> easy, defaulting to honest rather than hidden.

This is deliberately three claims, not one:

| Layer | Claim | Who owns it |
|---|---|---|
| **Authored by** | The teacher. They review/edit/approve and are accountable for the grade. | aiTA enforces this (non-negotiable #1, mandatory HITL). |
| **Drafted with** | AI assistance, to the teacher's rubric and voice. | aiTA's architecture. |
| **Disclosed to** | Students/parents, per the teacher's institutional policy. | The teacher decides; aiTA *enables*, never *conceals*. |

### 1.2 Why mandatory-HITL-authorship makes this honest, not concealment

The Nazaretsky penalty is a penalty on **deception about authorship** — "I was told a person wrote this; a machine
did." aiTA's architecture is specifically what makes the authorship claim *true* rather than a cover story:

- **The teacher is the final grader by design** (GOAL.md non-negotiable #1; MESSAGING §2: "auto-finalize is opt-in &
  confidence-gated"). Nothing publishes that the teacher didn't see — *unless* they deliberately turn on
  auto-finalize for the easy cases, which is itself a disclosed, teacher-made choice (see §1.5).
- **Suggestions remain editable** (#2). The teacher's edits are the actual authorship act, and the edit→reinforce
  loop means the published feedback increasingly *is* the teacher's own prior judgment, re-applied.
- **The grade is the teacher's, evidenced.** Per-criterion confidence + evidence citations + server-side recompute
  mean the teacher signs off on a reasoned grade, not a black-box number.

So the honest framing is: **aiTA is a drafting tool, the way a teacher who dictates comments to an aide is still the
author of those comments.** The aide drafting in the teacher's style is not deception *if the teacher reviews, owns,
and is accountable for the result, and the institution's disclosure norms are honored.* Concealment would be claiming
"a human wrote every word, unaided" — which we never claim. The Common Sense "invisible influencer" critique bites
hardest on tools that hide the AI *from the teacher too* (auto-everything). aiTA's whole UX makes the AI **visible to
the teacher** (the named agent workforce, the "I withheld this grade because…" card, the with/without-voice toggle).
Visibility-to-the-operator is the precondition for honest disclosure-to-the-student.

### 1.3 Reconciling with non-negotiable #4 (voice) without becoming deception

Non-negotiable #4 — "outputs must align with teacher voice" — is the requirement that *looks* like it manufactures
the deception. The reconciliation is to be precise about **what voice fidelity is for**:

- **Voice fidelity serves the teacher's standards, not the student's perception.** The job (per the Sarah persona,
  ICP §3): feedback that is calibrated to *her* rubric, *her* level expectations, *her* instructional priorities, so
  it is pedagogically right and she isn't ashamed of it — and so she barely has to edit it. The legitimate target of
  "sounds like me" is **consistency with the teacher's own judgment**, not **fooling the reader about origin**.
- **The deception risk lives entirely in the disclosure layer, and that's where we govern it.** Voice fidelity +
  *concealed* origin = the Nazaretsky trap. Voice fidelity + *honest* origin = a teacher scaling their own voice
  with their reader's knowledge. We keep #4 and defuse the trap by **never coupling voice fidelity to a
  concealment claim** in product or marketing (see the words-we-avoid update, §1.6).
- **"Outsource the typing, not the thinking"** (already in MESSAGING) is the exact line that keeps #4 honest. It
  asserts the teacher's authorship of the *judgment* while admitting the AI did the *drafting labor*. We should
  treat that phrase as load-bearing, not a throwaway.

### 1.4 The stance, by audience

- **To students:** disclosure is **teacher-and-policy-governed, not vendor-mandated and not vendor-suppressed.**
  aiTA's default-honest posture: provide a ready-made, low-friction way to disclose (§1.5) and *never* market the
  tool as a way to hide AI from students. We do **not** unilaterally force a per-grade "AI was used" stamp on the
  student-facing artifact, because (a) authorship is genuinely the teacher's, (b) policies differ by
  school/district/state, and (c) a forced label on teacher-authored work could misrepresent the authorship the
  teacher actually exercised. We make honesty the easy path; the teacher and their institution set the rule.
- **To parents:** same governance. Where a school discloses instructional-AI use at the program level (syllabus,
  AUP, back-to-school letter), aiTA supports that with plain-language boilerplate (a sibling to the
  `COMPLIANCE-POSTURE.md` §3 ToS attestation, written for parents).
- **To admins / districts:** disclosure capability is a **procurement feature**, not a liability. Districts
  increasingly require an AI-use disclosure policy; aiTA shipping the controls + boilerplate to comply is a sales
  asset.

### 1.5 How it shows up in product (concrete)

1. **A workspace-level Disclosure Setting** (teacher or, in district tier, admin-set) with three modes:
   - **Off** — no automatic disclosure; teacher discloses out-of-band per their own practice (default for the
     individual free-tier teacher, who often has *no* institutional policy and is the author anyway).
   - **Footer** — appends a short, teacher-editable line to published feedback, e.g. *"Feedback drafted with
     aiTA and reviewed by [Teacher Name]."* Teacher-editable so it matches local policy wording.
   - **Policy** — pulls district-configured disclosure text; locked at admin level for the district tier.
   The setting is **a setting, not a default-hidden behavior** — its existence is the honesty signal. Recommended
   global default: **Footer for district/proof cohort, Off for individual free tier** — pending founder ratification.
2. **An authorship/disclosure boilerplate pack** (parent letter + syllabus paragraph + the per-feedback footer
   line), mirroring the COMPLIANCE-POSTURE §3 pattern. Honest wording only; no "a human wrote every word" claims.
3. **Auto-finalize is the one place to be most careful.** When auto-finalize publishes a high-confidence grade
   unattended, the teacher's "review" was a *threshold policy decision*, not a per-grade read. The honest posture:
   (a) auto-finalize stays opt-in and confidence-gated (already true); (b) auto-finalized items are **flagged in the
   teacher's record** as auto-published so the teacher's accountability is real, not notional; (c) if the workspace
   Disclosure Setting is Footer/Policy, **the footer still attaches** to auto-finalized feedback. This keeps the
   "teacher-authored" claim defensible even for the unattended path — the teacher authored the *policy*, and the
   disclosure travels with the output.
4. **No deception affordances, ever.** aiTA must never offer a "make this look more handwritten / hide that AI was
   used" feature, and marketing must never imply one. That is the bright line that separates "honest drafting tool"
   from "more effective deception."

### 1.6 Marketing guardrail (update the message house)

`MESSAGING.md` §2 already lists words to **avoid** ("fully automated," "fully compliant"). Add to that list any
phrasing that frames voice fidelity as *concealment*: avoid **"no one will know," "passes as human," "undetectable,"
"like you never used AI."** Keep the honest fidelity claims ("reads like *you* wrote it," "in your voice") — those
describe consistency with the teacher's judgment, which is true — but never pair them with a concealment promise. The
**"outsource the typing, not the thinking"** line is the canonical honest framing and should lead the authorship
objection-handling.

---

## 2. Pressure-test vs. the transparency-first scenario

**Scenario:** disclosure norms harden. Schools adopt PAIRR-style process-visible assessment; states/districts
mandate AI-use disclosure on graded work; Common Sense's "invisible influencer" framing becomes the default lens
parents and journalists apply to grading tools. The "sounds like you" pitch reads, to that audience, as "sounds like
you so the kid can't tell."

**Is aiTA on the right or wrong side?** With the §1 stance, **right side — but only if we ship the disclosure
controls and hold the marketing bright line.** The argument:

- **Authorship-via-review is the structurally honest model.** Transparency-first norms target *automation that
  hides the machine*. aiTA's non-negotiables (#1 HITL, #5 teacher trust > automation speed, #6 quality > automation)
  put a human author and accountable party on every grade. A disclosure mandate is satisfied by a tool that *can*
  disclose and whose origin story is "teacher drafted with AI," not "AI graded, teacher glanced."
- **The visible-AI UX is an asset under transparency norms, not a liability.** The named agent workforce, the
  withholding card, the with/without-voice toggle, the edit-rate metric — all of these make the AI's contribution
  *legible*. A transparency-first market rewards legibility. Tools that hid the AI to feel "magic" will be the ones
  scrambling.
- **The counter-position vs. detection-first incumbents compounds.** aiTA already refuses punitive AI-detection
  (MESSAGING territory C). "We don't secretly surveil your students, and we don't secretly ghost-write either —
  the teacher authors, and you're told how" is a coherent, pro-trust stance that survives a transparency audit.

**What we must change / commit to for the claim to hold:**

1. **Ship the Disclosure Setting (§1.5.1) before the district/proof cohort touches real student-facing feedback.**
   Without the control, "we support disclosure" is vapor.
2. **Hold the marketing bright line (§1.6).** A single "they'll never know it's AI" ad would forfeit the high
   ground permanently. This is the cheapest thing to get wrong and the hardest to recover from.
3. **Make auto-finalize honest (§1.5.3).** The unattended path is where a transparency critic will press hardest;
   flagging + traveling disclosure is the defense.
4. **Treat the values-skeptic segment as out-of-scope, not as a conversion target (§3).** Trying to *argue them
   into* a voice-grader is where marketing drifts toward the deception framing. Carving them out keeps us honest by
   construction.

**Residual exposure (state it):** even with everything above, a teacher who sets Disclosure = Off and does not
disclose out-of-band, on real student work, reproduces the Nazaretsky condition. aiTA reduces this risk (default
toward Footer for cohorts that handle real student data; no concealment affordances) but **cannot eliminate it** —
the teacher is the disclosing authority and can choose silence. We own this the way COMPLIANCE-POSTURE owns the
residual PII leak: name it, mitigate by default, don't claim it's solved.

---

## 3. TAM carve-out

### 3.1 The correction

The plan's voice-fidelity thesis is **not addressable to every gr9–12 ELA teacher.** A real segment will reject any
voice-mimicking grader on principle, no matter how honest the disclosure. Counting them inflates TAM and, worse,
tempts marketing into deception-adjacent persuasion to "win" them. **Remove them explicitly.**

**Carve-out — the values-skeptic segment (NOT served):** teachers for whom *any* AI drafting of student feedback
is a values violation — the objection is "a machine should not author words to my students," and disclosure does
not resolve it (it may even sharpen it: "now you want me to *admit* I did this"). Per ICP §3, this is the *"my
students deserve feedback from me, not from a robot"* teacher at its strongest, principled, non-negotiable end. They
are a legitimate market for *human-only* assessment norms and PAIRR-style workflows — they are **not aiTA's market**,
and we should stop pretending otherwise. Counting them is the TAM overstatement HIGH-15 flags.

### 3.2 The real serviceable segment

**Serviceable target: gr9–12 ELA/humanities teachers who want time-savings + voice-fidelity AND want to stay in
command.** These are teachers whose objection to current AI tools is **"it doesn't sound like me / it grades wrong"**
(a *quality* objection, solvable) — **not** "AI shouldn't touch this at all" (a *values* objection, not solvable by
product). The Sarah persona (ICP §1) is squarely this segment: high-integrity, cares about feedback quality, *already
tried* ChatGPT and bailed because it was robotic — i.e., she's not anti-AI-on-principle, she's anti-*bad*-AI. The
edit→reinforce loop and trust-through-refusal are built precisely for her.

Practical filter (the line between served and carved-out):

| Signal | Serviceable (aiTA's market) | Carved out (not served) |
|---|---|---|
| Core objection | "It doesn't sound like me / it grades wrong" (quality) | "AI shouldn't author student feedback" (values) |
| Tried AI grading? | Yes, bailed on *quality* | No, won't on *principle* |
| Reaction to honest disclosure | "Fine — I authored it, students can know I used a tool" | "Disclosure makes it worse, not better" |
| Convertible by product? | Yes (fidelity + HITL + refusal) | No (no product move converts a values NO) |

### 3.3 Sizing (directional — flag the gap, don't fake precision)

We have no first-party data on the values-skeptic share (ICP §7 flags the missing first-party VOC). So size it as a
**range with an explicit assumption**, not a false point estimate:

- **Top line:** U.S. public secondary English/language-arts teachers ≈ **~250K** order-of-magnitude (gr9–12 ELA,
  public). **[FOUNDER VERIFY against NCES; treat as order-of-magnitude, add independent/private + history/humanities
  essay graders as adjacent.]**
- **Carve-out haircut:** remove the principled values-skeptic share. With no first-party number, model it as a
  **scenario band — 15% / 25% / 40%** of the segment is hard-NO-on-principle. (Anchor: ICP Theme 4 shows strong
  "augment-don't-replace" consensus, but "augment" ≠ "won't touch it" — most of that consensus is *serviceable*
  because it wants HITL, which aiTA leads with. The unservable tail is the subset for whom even disclosed,
  reviewed, teacher-owned AI authorship is unacceptable.)
- **Resulting serviceable share:** **60–85%** of the gr9–12 ELA base, i.e. roughly **~150K–210K** teachers, before
  the *normal* funnel haircuts (awareness, willingness-to-pay, free→paid conversion — which apply to everyone and
  are not part of this carve-out).
- **Why the band matters more than the midpoint:** the carve-out's job is to **stop the plan from booking the
  values-skeptic tail as pipeline.** Whether it's 15% or 40%, the discipline is the same: don't spend acquisition
  on them, don't soften the disclosure stance to chase them, and **validate the real share with first-party VOC**
  (ICP §7) before any number leaves this doc.

> **No-ego-boost note:** this carve-out makes TAM *smaller*, on purpose. A smaller, honestly-served market that the
> product actually fits beats a bigger number that includes people no feature can convert without crossing the
> deception line. The 250K is itself unverified — treat all figures here as directional until founder-confirmed.

### 3.4 Tie to the two-audience messaging rule

The carve-out is enforced by **holding the two-audience discipline** (MESSAGING §0), not by a new pitch:

- **To the teacher (the buyer):** lead with **time saved + your voice/authority + you stay in command.** Never
  "bias," never "undetectable." The disclosure stance is a *trust* asset here: *"You're the author; aiTA drafts to
  your rubric and voice; you can disclose however your school asks — we make that easy."* This naturally selects the
  serviceable segment (quality-objectors hear a solution) and naturally lets the values-skeptics self-deselect
  (they hear an honest "this tool drafts feedback," recognize it's not for them, and leave — which is the correct
  outcome, not a lost sale).
- **To the judge (XPRIZE Criterion C):** the spine is unchanged — **documented bias → structural fix → measured
  proof.** Disclosure slots in as part of the *structural fix*: bias and authorship-deception are both constrained
  **by construction** (rubric-grounded + mandatory HITL + honest, governable disclosure), not by a disclaimer. The
  voice-convergence study is the *measured proof*; the disclosure controls are the *honest-by-construction* claim
  that a transparency-first judge will probe. **Do not** bring the Nazaretsky genuineness finding to the *teacher*
  audience (it spooks the buyer the way "bias" does); it belongs in the judge/structural-fix narrative and in this
  internal doc.

---

## 4. Summary (the position, condensed)

1. **Stance:** *Teacher-authored, AI-drafted, teacher-disclosed-per-policy.* Mandatory HITL makes the authorship
   claim true; visible-to-the-teacher AI makes disclosure-to-the-student honest; voice fidelity serves the
   teacher's standards, and the deception risk is governed entirely in the disclosure layer — where aiTA defaults
   to honest and offers **no concealment affordances**.
2. **Transparency-first test:** aiTA is on the **right side** *if* it ships the Disclosure Setting, holds the
   marketing bright line (no "undetectable" language), makes auto-finalize honestly-flagged, and carves out — rather
   than chases — the values-skeptic segment. Residual exposure (a teacher who chooses silence) is named, not denied.
3. **TAM carve-out:** remove the principled values-skeptic tail (model 15–40%); the real serviceable segment is the
   ~60–85% of gr9–12 ELA teachers whose objection is *quality* ("doesn't sound like me / grades wrong"), not
   *values* ("AI shouldn't touch this"). Smaller, honest, product-fitting TAM > inflated TAM. Enforce it by holding
   the two-audience rule: teacher = time + voice + command; judge = bias → structural fix (now incl. honest
   disclosure) → measured proof.

**Open items for the founder:** ratify the global Disclosure Setting default; verify the Nazaretsky / PAIRR /
Common Sense citations; verify the NCES TAM figure and replace the values-skeptic scenario band with a first-party
VOC number (ICP §7); approve the §1.6 message-house word-list additions.
