# aiTA — Product Hunt Launch Kit

> Launch the freemium grading co-pilot that grades in the teacher's own voice — and refuses to rubber-stamp off-topic work.
> Funnel goal: PH signups → freemium → paid + testimonials → XPRIZE user/revenue evidence. (See `.planning/LAUNCH-PLAN.md` §2.)

---

## 1. Tagline options (≤60 chars)

Each option is character-counted; pick one for the PH "tagline" field.

1. **Grade essays in your own voice — you stay the boss** (51)
2. **An AI co-pilot that grades like *you* — not like AI** (49)
3. **Your grading voice, on every essay. You hit finalize.** (53)
4. **AI essay grading that sounds like the teacher** (47)
5. **It grades in your voice — and flags the off-topic ones** (55)

**Recommended: #2 — "An AI co-pilot that grades like *you* — not like AI."**
It leads with the defensible wedge (voice-convergence), uses the co-pilot framing from the README, and the "not like AI" contrast is the line teachers feel in their gut. #5 is the strong backup because it names both proof moments (voice + the off-topic flag) in one breath.

---

## 2. Short description (the "what is it" blurb)

> aiTA is a grading co-pilot for middle- and high-school English teachers. Paste your rubric, upload student essays, and aiTA returns rubric-aligned scores and margin comments written *the way you write them* — learned from your own past feedback, with your consent. Off-topic or adversarial submissions are flagged and withheld, never silently scored. Every grade is yours to accept, edit, or dismiss — and your edits teach aiTA your voice for the next batch. Five hours of grading becomes ninety minutes, and the feedback still sounds like you.

Alt one-liner (for tweets / outreach): *aiTA grades student essays in the teacher's own voice — and refuses to grade off-topic work. You stay the final authority.*

---

## 3. Topics / categories to tag

Primary:
- **Education**
- **Artificial Intelligence**
- **Productivity**

Secondary (pick from PH's live list at launch):
- **Teacher Tools** / **EdTech**
- **SaaS**
- **Writing**

Positioning note for the listing: lead the Education angle, not the "AI tool" angle. The audience that converts is teachers, and the PH Education community is where testimonials (XPRIZE user evidence) come from.

---

## 4. Gallery plan (~5 slides)

Lead with the two proof moments — voice-convergence and the trust moment — because those are the only things competitors can't copy. (Moments map to `docs/DEMO-SARAH-MARTINEZ.md` §5.)

| # | Slide | Caption |
|---|-------|---------|
| 1 | **Voice-convergence (hero)** — split view: a generic-AI comment vs. the same essay graded in Sarah's voice ("name the strength, push your analysis one step further, integrate quotes naturally"). | *"It sounds like me." aiTA learns your feedback voice from your own past comments — so margin notes read like yours, not like ChatGPT.* |
| 2 | **The trust moment** — Brandon Davis's off-topic jump-shot essay shown **withheld / needs-review**, not scored 95%. | *It won't rubber-stamp off-topic work. Brandon wrote about basketball, not Gatsby — aiTA flags and withholds instead of fabricating a grade.* |
| 3 | **The visible agent pipeline** — Rubric → Relevance/Risk → Grading → Annotation → Feedback Summary → Style, chewing through a batch. | *Not one black-box call. A transparent pipeline validates the rubric, verifies every evidence quote, recomputes totals, and anchors each comment to the text.* |
| 4 | **Human-in-the-loop review** — accept / edit / dismiss on annotations, with the "AI originally suggested…" trace after an edit. | *aiTA drafts; you decide. Accept, edit, or dismiss every comment — nothing is final without you, and your edits teach it your voice.* |
| 5 | **Metrics dashboard** — time saved, approval rate, turnaround. | *Five hours of grading became ninety minutes — measured, not guessed. Real numbers from a real grading week.* |

Demo GIF (PH loves motion as slide 1 or the embedded video): the agent pipeline running on the Gatsby batch, ending on Sofia Reyes's in-voice feedback. Keep it under ~10s.

Honesty guardrail for the gallery (from `docs/DEMO-SARAH-MARTINEZ.md`): the grades, annotations, evidence citations, the in-voice feedback, the off-topic refusal, and the metrics are all **real, produced by the live grader**. Don't caption fabricated "thousands of annotations" volume.

---

## 5. Maker's first comment (~150 words, founder voice, Education angle)

> Hi PH 👋 I built aiTA because grading essays is the part of teaching that quietly burns good teachers out — five hours a week of writing the same margin comments, then feeling guilty when you rush the last ten.
>
> I didn't want another tool that spits out generic AI feedback a teacher has to rewrite anyway. So aiTA does two stubborn things. First, it grades **in your voice** — it learns from your own past comments (only with your consent) so the notes read like yours. Second, it **refuses to fake a grade**: off-topic or adversarial essays get flagged and withheld, never silently scored 95%. You stay the final authority on every comment — accept, edit, dismiss, finalize.
>
> It's freemium — ~15 gradings free, no card. I'd genuinely love feedback from teachers: does it sound like *you*? What would make you trust it with a real stack of essays? 🙏

---

## 6. Maker story / "why I built this"

Grading is where teaching integrity and teaching exhaustion collide. A conscientious English teacher will spend an entire evening on one class set because the feedback is the teaching — the margin note that says *push your analysis one step further* is worth more than the number at the top. But that care doesn't scale, and most "AI graders" make it worse: they hand back generic, voiceless comments that a teacher has to rewrite line by line, or — worse — they confidently score an off-topic essay 95% because they were built to always produce a number.

aiTA is built around the opposite conviction: **the grade must be valid and trustworthy — rubric-aligned, teacher-calibrated, and never awarded to off-assignment work.** Two things follow from that. It learns the teacher's own voice from their consented past feedback, so the output reads like the teacher graded it — not like a chatbot. And it's trustworthy by construction: relevance-gated, rubric-mandatory, evidence-anchored, and it fails loud rather than guessing. When Brandon turns in a basketball essay for a Gatsby assignment, aiTA withholds it and says so. That refusal is the feature.

The teacher never leaves the loop. aiTA drafts; the teacher decides; and every edit the teacher makes sharpens aiTA's grasp of their voice on the next batch. The goal isn't to replace the teacher's judgment — it's to give it back the evening.

---

## 7. Launch-day checklist

**Hunter & timing**
- [ ] Line up a hunter with EdTech/AI reach (or self-hunt — fine for a first launch). Confirm 24h before.
- [ ] Launch **12:01am PT** (PH day resets at midnight Pacific). Target a Tuesday–Thursday to dodge weekend low traffic.
- [ ] First comment (§5) queued to post **within the first minute**.

**Pre-launch (the night before)**
- [ ] Live URL smoke-tested on **mobile + desktop**; fresh-incognito signup works end-to-end. (Launch-plan checklist §2.)
- [ ] Free tier works **without a card**; paid checkout works with a real card (test, then refund).
- [ ] Gallery (5 slides) + demo GIF uploaded; tagline + description + topics set.
- [ ] **Secrets rotated before any public traffic** (DB password, Stripe `sk_live_`, Gemini key — all were shared in chat). Non-negotiable. (Launch-plan F-A2.)
- [ ] Support channel (email/Intercom) staffed for the day.
- [ ] PostHog confirmed capturing signup → first-grade → paywall → checkout (this *is* the XPRIZE user evidence).

**Outreach (day-of)**
- [ ] Personal post on X / LinkedIn at launch with the demo GIF; ask for an honest comment, not just an upvote (PH down-ranks vote-begging).
- [ ] DM the teacher communities you're already in (r/Teachers, English-teacher Discords/FB groups, your beta list). Lead with "does this sound like you?" not "please upvote."
- [ ] Email any beta teachers + Phase-15 test-teacher candidate.

**FAQ replies (have these drafted)**
- *"Is this just ChatGPT with a prompt?"* → No — it's a transparent multi-step pipeline (rubric validation → relevance/risk gate → grading → evidence-anchored annotation → style injection), and it learns *your* voice from *your* consented past feedback. It also withholds off-topic work instead of scoring it.
- *"Does the AI grade for me?"* → It drafts; you decide. Accept/edit/dismiss every comment, finalize when you're satisfied. Nothing is final without you.
- *"What about student privacy / FERPA?"* → Owner-isolated data, private storage with signed URLs, de-identification before any model call, right-to-erasure, retention controls. Voice learning is consent-gated.
- *"Will it hallucinate a grade?"* → It's relevance-gated and evidence-anchored; off-topic/adversarial work is flagged and withheld, and it fails loud rather than guessing.
- *"Pricing?"* → Free: ~15 gradings/mo, no card. Pro: $15/mo or $144/yr (full voice-convergence loop, bulk grading, exports). 14-day Pro trial on signup. Schools: contact us.
- *"What grade levels / subjects?"* → Built for middle- and high-school English essays today (rubric + prose feedback). Other rubric-graded writing works; that's the near roadmap.

**After launch**
- [ ] Reply to every comment within the hour for the first 8 hours.
- [ ] Capture every positive teacher reply as a **testimonial** (with permission) → XPRIZE user evidence.
- [ ] Note conversion drop-off in PostHog; the paywall/onboarding fixes become next week's work.
