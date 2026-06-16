# Trial Conversion Copy — landing / signup surface (Cohort A)

> Teacher-facing copy for the page strangers land on from Reddit/FB/PH → into the **14-day full-access
> trial** (no card; onboards on pre-loaded sample essays, no student PII). Pulls voice from
> `MESSAGING.md`. Teacher-facing = lead with time + voice; NEVER mention bias here.
> CRO note: one primary CTA repeated ("Start your free trial — no card"); every section ladders to it.

---

## HERO

**Eyebrow:** For high-school ELA & humanities teachers

**Headline (primary):**
# Grade like *you* would — in your voice, to your rubric.
**Subhead:** aiTA drafts rubric-aligned feedback that reads like you wrote it, refuses to score
off-topic work, and gets more like you every set. You stay the final grader.

**Primary CTA:** `Start your free 14-day trial — no card`
**Secondary CTA (ghost):** `Watch a 90-sec demo`
**Trust microcopy under CTA:** Try it on 5 sample essays right now — no class setup, no student data.

**Hero visual:** the side-by-side voice toggle — same essay, "generic AI draft" vs *"in your voice."*

---

### Headline alternates (A/B bank)
- **A (voice):** "Grade like you would — in your voice, to your rubric." *(default)*
- **B (relief):** "Give every student real feedback — without giving up your weekend."
- **C (trust):** "An AI grader you can actually trust — because it knows when *not* to grade."
- **D (authority):** "Your feedback, drafted faster — that you still sign off on."

---

## SOCIAL PROOF STRIP *(fill as testimonials land — start with what's true)*
> Placeholder until ≥3 testimonials: a quiet stat line instead of fake logos.
"Teachers save ≈5.9 hours a week with AI grading (Walton Family Foundation) — aiTA gives you those
hours *without* the robotic comments that make you redo the work."

*(After Wk3–5, swap in:)*
> *"I barely had to edit this. It sounded like me."* — {Name}, {grade/subject}, {state}

---

## SECTION 1 — "It sounds like you, and it proves it"
**Heading:** It learns *your* voice — not a generic bot's.
Most AI graders hand you comments you'd be embarrassed to send. aiTA watches every edit you make and
converges on how *you* give feedback — your phrasing, your warmth, your standards. Flip the toggle on
any graded essay and see the difference: generic draft vs. *your* voice.
**Micro-CTA:** `See it learn your voice →`

## SECTION 2 — "It won't rubber-stamp garbage"
**Heading:** A grade you can trust — because it refuses the ones it shouldn't give.
aiTA grades strictly to *your* rubric, flags and **withholds** scores on off-topic or off-assignment
work, and shows its evidence for every criterion. No more taking points off for things that aren't in
your rubric. No more a 9th-grade paragraph graded like a college essay.
**Micro-CTA:** `See the refusal in action →`

## SECTION 3 — "You stay the teacher"
**Heading:** A co-pilot you supervise — never an autopilot.
Every grade is yours to approve, edit, or reject. Turn on **auto-finalize** and aiTA will publish the
high-confidence, on-topic grades for you and route only the tricky ones to your desk — so you spend
your time where your judgment actually matters. Outsource the typing, not the thinking.

## SECTION 4 — "On your side, not policing your students"
**Heading:** No AI-detection. No false accusations. No surveillance.
aiTA exists to amplify *you*, not to interrogate your students. We don't bundle a cheating detector
that wrongly flags ESL and neurodivergent kids and poisons your classroom trust.

---

## HOW IT WORKS (3 steps)
1. **Paste your assignment + rubric** (or paste just the prompt — aiTA builds the rubric for you).
2. **aiTA drafts** rubric-aligned scores + inline annotations + summary feedback, in your voice.
3. **You approve, edit, or reject** — and aiTA learns from every change. Next set, it's more like you.

**CTA:** `Start free — try it on 5 sample essays`

---

## PRICING

**Heading:** Simple pricing. Start free for 14 days — no card.

| | **Free** | **Pro** *(most teachers)* | **Annual** |
|---|---|---|---|
| Price | $0 | **$15/mo** | **~$150/yr** *(save ~2 months)* |
| Grades | 15 / month | Unlimited | Unlimited |
| Voice learning | ✓ | ✓ | ✓ |
| Trust/refusal gates | ✓ | ✓ | ✓ |
| Auto-finalize | — | ✓ | ✓ |
| Priority support | — | ✓ | ✓ |

**14-day full-access trial** of Pro — no credit card to start. Keep using the free tier (15 grades/mo)
forever if Pro isn't for you.

**ROI line:** At ≈5.9 hours saved a week, Pro pays for itself in the first weekend you get back.

**CTA:** `Start your free 14-day trial`

---

## OBJECTION FAQ *(mirrors MESSAGING §2; trial-surface phrasing)*
- **"Will it actually sound like me?"** It learns from your edits and converges on your style — and
  you can see the side-by-side difference. We even measured it (and pre-registered the study).
- **"What if it grades wrong?"** It withholds off-topic grades and shows evidence per criterion. You
  approve everything — nothing reaches a student you didn't sign off on.
- **"Is my students' data safe?"** Student names are stripped before anything is processed, your data
  is owner-scoped and erasable, and the free trial runs on *sample* essays — no student data at all.
  We tell you exactly what we do; we never claim "fully compliant."
- **"Do I have to set up a rubric?"** No — paste your prompt and aiTA drafts the rubric. Edit it if you like.
- **"Is this going to replace teachers?"** No. You're the final grader by design. It's a co-pilot you supervise.

---

## FINAL CTA BANNER
**Heading:** Get your weekend back — without the robotic comments.
**Sub:** Start free for 14 days. Try it on 5 sample essays in the next 5 minutes. No card, no student data.
**Button:** `Start your free trial`

---

## META / SEO
- **Title tag:** aiTA — the AI grading co-pilot that learns your voice | Free 14-day trial
- **Meta description:** Grade essays to your rubric, in your voice, with an AI co-pilot that refuses
  off-topic work and learns from every edit. You stay the final grader. Free 14-day trial, no card.
- **OG image:** the voice toggle (generic vs. your voice).
- **Implementation note:** wire the page to `loadSampleEssays` empty-state CTA (already shipped,
  commit `fe22dc7`) so "try it on 5 sample essays" is one click from signup.
