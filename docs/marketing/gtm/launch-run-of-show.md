# Launch Run-of-Show — the founder's single operational sequence

> The one doc you follow week by week. It sequences **every GTM asset already built** in this directory
> (and in `../../../outreach/` and `../../recruiting/`) onto the **9-week back-to-school timeline** from
> `../../../.planning/milestone-2-launch/XPRIZE-MASTER-PLAN.md`, and marks each step **🤖 agent-automated**
> or **🧑 human-gated**. Strategy lives in the master plan; Week-1 infra steps live in
> `../../../.planning/milestone-2-launch/WEEK-1-FOUNDER-RUNBOOK.md`; the asset index + gate map live in
> `README.md`. This doc is the **conductor's score** that points at all of them in order.
>
> **The submission target:** $50K runner-up (balanced 3-criteria), not the gross-revenue race. **Submit
> 24h early — never touch the 1pm Aug 17 cliff.**

---

## How to read the markers

- **🤖 agent** — an agent can do this end-to-end now (find, write, personalize, draft, stage, sequence).
- **🧑 human** — irreducibly yours: a credential, a send/tap, a signature, a call, a deploy, the camera.
- **🤖→🧑 staged** — agent stages the exact artifact; you press send (Reddit/FB/PH posts, cold-email key).

The design goal of the whole GTM layer: the agent does the work; **your surface shrinks to provide a
credential / press send / sign / show up.** (See `README.md` "How it's operated.")

---

## The off-ramp logic (read once before you start)

This schedule is **a sequence of off-ramps, not a growth curve.** The three "must-go-rights" all land in
Weeks 1–3 and each can independently kill the submission; the Week-7 kill-gate catches a failing proof with
two weeks left to pivot Criterion-C to time-savings. Front-load de-risking, back-load volume. Don't move to
the next week's *growth* work until the current week's *gate* clears.

---

## Week-by-week run-of-show

### Week 1 (Jun 22–28) — Make it live · GATE: trial signups grading?
**The week that can kill everything. Do `WEEK-1-FOUNDER-RUNBOOK.md` in order first.**

| Step | Marker | Asset / action |
|---|---|---|
| Merge PR #14 → main, deploy production | 🧑 | `WEEK-1-FOUNDER-RUNBOOK.md` §1–3 |
| Stripe $15/mo + annual live; apply migration 0019 (real caps) | 🧑 | runbook §4 |
| Confirm **auto-finalize** ships (the #1 must-go-right) | 🧑 | runbook / product |
| Trial landing + signup copy live | 🤖 | `trial-conversion-copy.md` |
| Trial onboarding emails wired (day 0 → day 14) | 🤖 / 🧑 wire | `../../../outreach/trial-onboarding-sequence.md` |
| Drop `RESEND_API_KEY` + `OUTREACH_FROM` → agent sends cold outreach | 🧑 key | `../../../outreach/` engine |
| **GATE:** are signups actually grading? (activation > signup) | 🧑 read | if no → fix Email 0/1 before any volume |

### Week 2 (Jun 22–Jul 5 overlap) — Seed the channels · GATE: activation >25%?

| Step | Marker | Asset / action |
|---|---|---|
| Stage Reddit value-first replies on live threads | 🤖→🧑 | `reddit-fb-playbook.md` · `../../../outreach/reddit-engagement-queue.md` |
| Stage FB-group + influencer outreach | 🤖→🧑 | `targets/facebook-and-influencers.md` |
| Begin Cohort-B teacher sourcing (proof teachers) | 🤖 source / 🧑 calls | `targets/cohort-b-teacher-sourcing.md` · `../../recruiting/RECRUITING-KIT.md` |
| Personalize + send next cold-email batch | 🤖 | `../../../outreach/personalize.mjs` |

### Week 3 (Jun 29–Jul 5) — First scale + proof baseline · GATE: signup→activation >25%?

| Step | Marker | Asset / action |
|---|---|---|
| **Free-PD webinar #1** (the #1 ban-proof FB motion) | 🤖 assets / 🧑 host | `webinar-kit.md` · `webinar-slides.md` |
| Build 300+ Product Hunt email list | 🤖 source / 🧑 connect | `targets/product-hunt-and-directories.md` |
| Capture **3–5 testimonials** ("I barely had to edit this") | 🧑 ask | feeds `trial-conversion-copy.md` social-proof strip |
| **Cohort B Batch 1** graded; baseline scores | 🧑 teachers | proof clock starts |
| OSF pre-reg **draft** | 🤖 draft / 🧑 review | `../../recruiting/osf-prereg.md` |

### Week 4 (Jul 6–12) — Turn on the loop · GATE: pre-reg filed + arms-length revenue forming?

| Step | Marker | Asset / action |
|---|---|---|
| **File OSF pre-registration (by Jul 7 — hard date)** | 🧑 file | `../../recruiting/osf-prereg.md` |
| **Ship the referral / share loop** | 🤖 copy+spec done / 🧑 incentive sign-off | `referral-share-loop.md` (src owned by app agent) |
| First **arms-length** paid conversion | 🧑 happens | quarantine related-party revenue |
| **Cohort B Batch 2**; holdout setup | 🧑 teachers | |

### Week 5 (Jul 13–19) — Build the launch assets · GATE: PH ready + MRR on curve + ≥3 testimonials?

| Step | Marker | Asset / action |
|---|---|---|
| Finalize PH hero = **paid voice-matched output** | 🤖 / 🧑 approve | `product-hunt-launch-kit.md` |
| Recruit PH hunters / supporters | 🤖 list / 🧑 ask | `targets/product-hunt-and-directories.md` |
| Dashboard as monitoring/exception UI (for the video) | 🧑 product | feeds the demo |
| **Cohort B Batch 3**; mid-trend vs. kill criterion | 🧑 teachers | early read on the proof |
| Capture refusal screenshots + agent-log throughput | 🤖 stage / 🧑 capture | proof collateral (`MESSAGING.md` §5) |

### Week 6 (Jul 20–26) — **Product Hunt launch** · GATE: PH converting to trials?

| Step | Marker | Asset / action |
|---|---|---|
| **PH launch — Tue–Thu, 12:01am PT** | 🤖→🧑 post | `product-hunt-launch-kit.md` (listing, first comment, gallery, comment bank) |
| Teaser cut live on PH/social/landing | 🤖 / 🧑 post | `video-teaser-60s.md` |
| Work the comment bank; route trials into onboarding | 🤖 drafts / 🧑 reply | onboarding sequence catches them |
| Load-test unattended throughput ("N grades/hr") | 🧑 product | the AI-native proof number |
| **Cohort B Batch 4**; finalize dataset; freeze judge creds | 🧑 teachers | |

### Week 7 (Jul 27–Aug 2) — Convert + the KILL-GATE · GATE: proof clears kill criterion?

| Step | Marker | Asset / action |
|---|---|---|
| Convert PH + FB via PQL; Back-to-School annual push | 🤖 sequence / 🧑 | onboarding day-9/12 + referral loop |
| **Convergence analysis → KILL-CRITERION decision** | 🧑 decide | **If it fails: pivot Criterion-C to time-savings.** Don't bluff the judges. |
| Bug-fix from PH cohort; lock code for filming | 🧑 product | |

### Week 8 (Aug 3–9) — Freeze + film · GATE: video shows AI grading unattended?

| Step | Marker | Asset / action |
|---|---|---|
| **Film the <3-min demo video** (unattended grading + voice + refusal) | 🧑 camera | script: `xprize-video-and-narrative.md` |
| Write the ~500–1000w **judge narrative** | 🤖 draft / 🧑 approve | `xprize-video-and-narrative.md` (judge-facing: bias → fix → measured proof) |
| Freeze code; tag release | 🧑 product | |
| Final Back-to-School spike push; lock arms-length/related split | 🤖 / 🧑 | revenue framing = trajectory + arms-length %, not absolute $ |

### Week 9 (Aug 10–17) — Assemble + **submit 24h early** · GATE: all done a day early?

| Step | Marker | Asset / action |
|---|---|---|
| Export Stripe revenue-by-month; MRR curve chart | 🧑 export | viability: lead with trajectory + arms-length % |
| OSF results link + testimonials assembled | 🤖 assemble / 🧑 | proof package |
| Assemble the **7 deliverables**; share repo w/ `testing@devpost` + `judging@hacker.fund` | 🧑 share | |
| **SUBMIT — target Aug 16, never the 1pm Aug 17 cliff** | 🧑 submit | |

---

## The two-audience reminder (do not blend, ever)

When you're assembling assets this is the easiest rule to break under deadline:

| Surface | Audience | Lead with | Never |
|---|---|---|---|
| Landing, PH, FB, Reddit, referral, onboarding, teaser | **Teachers (buyers)** | time saved + your voice + "you stay the teacher" | "bias"; student-outcome claims |
| Judge narrative, OSF, submission writeup | **XPRIZE judges** | documented bias → structural fix → **measured proof** | student-outcome claims (not credible in 9 wks) |

Revenue framing everywhere: **trajectory + arms-length % + unit economics** — never the absolute dollar
figure as the headline.

---

## The irreducibly-human shortlist (everything else the agent runs)

1. **Deploy / Stripe / migrations** (Week 1) — `WEEK-1-FOUNDER-RUNBOOK.md`.
2. **One credential each** — `RESEND_API_KEY` unlocks the whole cold-email engine; a logged-in browser
   unlocks the staged Reddit/FB/PH posts.
3. **DPA signatures + Cohort-B teacher calls + batch grading** — the proof clock; longest pole.
4. **OSF filing** (by Jul 7) and the **kill-criterion decision** (Week 7).
5. **The demo video** (you on camera, Week 8) and **the submission** (Week 9, a day early).
6. **Referral incentive economics + ToS sign-off** (Week 4) — `referral-share-loop.md`.

Everything not on this list, an agent already drafted or can re-run on your go.
