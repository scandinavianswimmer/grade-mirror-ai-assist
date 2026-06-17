# In-App Referral / Share Loop — teacher-to-teacher (Cohort A)

> The viral loop that turns an activated trial user into a recruiter. It rides the two moments where a
> teacher *feels* the value — the **"Is aiTA learning you?"** convergence verdict and the **time-saved**
> moment — and hands them a one-tap way to bring a colleague in. Owned surface, zero ad spend, compounds.
> Voice from `../MESSAGING.md` — teacher-facing: lead with time + voice, NEVER bias, never student-outcome
> claims. Pairs with `../../../outreach/trial-onboarding-sequence.md` (email nurture) and slots into the
> master plan at **Week 4, Jul 6–12** ("Referral loop; first arms-length paid").
>
> **Scope:** copy + loop mechanics spec only. The `src/` implementation (share surfaces, referral codes,
> attribution events) is owned by another agent — this doc is the contract they build against.

---

## Why this loop, and why now

Teachers are a dense, trust-driven referral graph: department PLCs, grade-level teams, subject Facebook
groups, and "what are you using?" hallway conversations move tools faster than any ad. aiTA's wedge is a
*felt* moment, not a claim — the colleague who says "it actually sounds like me" is more persuasive than
our landing page. The loop's whole job is to **catch that teacher at the moment they believe it** and make
sharing the path of least resistance.

The two believable moments, straight from the product:
- **The convergence verdict** — the `ConvergencePanel` ("Is aiTA learning you?") prints *"aiTA is learning
  your voice — edit rate down N%."* That's a teacher seeing the core promise *measured on their own work*.
- **The time-saved moment** — the day-9 "weekend back" beat (≈5.9 hrs/week), already in the email sequence.

We do NOT trigger off a raw signup or a single first grade — sharing before belief produces low-quality
invites and burns the colleague's first impression. **Belief precedes the ask.**

---

## Loop mechanics spec (the contract for `src/`)

### Trigger moments (when the share surface appears)

| # | Trigger | Event (in-app) | Why it's a believe-moment | Surface |
|---|---|---|---|---|
| T1 | **Convergence verdict turns positive** — panel shows the "learning your voice — edit rate down N%" headline (tone=`good`) | first `convergence_verdict_good` per assignment | The promise, measured on their own grading | Inline card under the ConvergencePanel verdict |
| T2 | **First "barely edited" set** — a finalized batch with low edit distance | `low_edit_batch` | "It sounded like me and I barely touched it" | Toast after finalize + persistent banner on the batch summary |
| T3 | **Time-saved milestone** — cumulative hours saved crosses a round number (first ≥5 hrs) | `time_saved_milestone` | The relief payoff, quantified | The day-9 "weekend back" email CTA + an in-app dashboard tile |
| T4 | **PQL reached** — ≥12 grades in a month | `pql_grade_12` (already fires, commit `656c6ca`) | Established habit; high intent | Soft prompt in the upgrade/settings area |

**Rule:** show at most one share prompt per session, and never on the same session as a trial-conversion
prompt (don't make a teacher choose between paying and sharing in the same breath). Suppress for 7 days
after a dismiss; suppress permanently after a successful share or an explicit "don't ask again."

### Share surfaces (where they share to)

1. **Copy invite link** (primary, frictionless) — a personal referral URL (`aita.app/i/<code>`). Works
   everywhere a teacher already talks: text, email, Slack, a Facebook group comment, an MTSS doc.
2. **Email a colleague** (in-app composer) — pre-filled subject + body (copy below); they add a name and send.
3. **Share the artifact** (see below) — a shareable visual, link or image, that *shows* the proof rather
   than describing it.

No auto-posting to social platforms (same ban-risk + value-first stance as the rest of the GTM layer — see
`README.md` human-gate map). The teacher is always the sender; we only stage and pre-fill.

### The shareable artifact (the thing that travels)

A teacher's belief is most contagious when it's **visible and theirs**. The artifact is a small, no-PII
"voice card":

- **What it shows:** the `ConvergencePanel` verdict line — *"aiTA is learning my voice — edit rate down N%"* —
  plus an anonymized, opt-in **side-by-side voice toggle** snippet (generic AI draft vs. *their* voice) on a
  sample/their-own essay with all student identifiers stripped. A small "Made with aiTA" mark + the invite link.
- **Privacy gate (hard requirement):** the artifact is **off by default and never auto-generated.** The teacher
  explicitly opts in, and the only essay content that can appear is a **pre-loaded sample essay** or a snippet the
  teacher hand-selects — student work is de-identified before display and excluded unless the teacher affirmatively
  chooses it. No PII, ever, on a shareable surface. (Cohort A grades sample essays only, so the default path is clean.)
- **Why it works:** it's *measured proof in the teacher's own hand* — the same "could-have-failed-and-didn't"
  credibility the judge narrative leans on, translated into a teacher-to-teacher flex.

### Incentive

Keep it pro-teacher and trust-safe — no spammy "refer 10 friends" mechanics that cheapen the brand:

- **Referrer:** **one free month of Pro** when a referred colleague activates (grades their first set on
  their own trial). Stackable up to a sensible cap (e.g., 6 months) so a department champion is rewarded but
  it can't be gamed.
- **Referred colleague:** lands on an extended **21-day trial** (vs. the standard 14) — "a friend vouched for
  you," lower-friction entry, and a longer runway to hit their own believe-moment.
- **Free-tier users** can refer too (it's a reactivation lever): a successful referral grants the referrer a
  **14-day Pro pass**, re-exposing them to auto-finalize and the convergence panel.

Incentive is **activation-gated, not signup-gated** — reward fires only when the colleague actually grades,
which keeps invite quality high and the loop honest.

### Attribution & measurement (events for `src/` + analytics)

- `referral_prompt_shown` (trigger, surface) · `referral_link_copied` · `referral_email_sent` ·
  `referral_artifact_shared` · `referral_signup` (code) · `referral_activated` (referred user's first grade) ·
  `referral_reward_granted`.
- **North-star:** referred-signup → activation rate (should beat cold trial activation; if not, the artifact
  isn't carrying the proof). **K-factor:** invites sent × referred-activation rate, per activated user.
- Watch: prompt → share conversion by trigger (which believe-moment converts best — fund that surface).

---

## The copy

> All copy is teacher-facing. Lead with voice/time, "you stay the teacher," never "bias," never a
> student-outcome claim. `{first_name}`, `{delta}`, `{hours}`, `{invite_link}` are merge fields.

### T1 — convergence-verdict share card (the hero moment)

**Heading:** It's learning your voice. Know a teacher who'd want that?
**Body:** aiTA's editing your feedback **{delta}% less** than when you started — it's writing in *your*
voice now. That's the part every teacher you know is still doing by hand at 9pm.
**Primary CTA:** `Send a colleague a friend-pass →`
**Secondary:** `Copy my invite link`
**Microcopy:** They get a 21-day trial; you get a free month of Pro when they grade their first set.

### T2 — "barely edited" toast + banner

**Toast:** That set barely needed you — aiTA's sounding like you. **Share the friend-pass →**
**Banner:** You just finalized a set you hardly edited. That's the whole promise, working. Know a teacher
buried in essays this week? `Send them a 21-day pass →`

### T3 — time-saved milestone (in-app tile + email CTA)

**Tile heading:** You've saved about {hours} hours with aiTA.
**Tile body:** That's a weekend you got back — without sending a comment you didn't approve. Pass it on.
**CTA:** `Give a colleague their weekend back →`
**(Email variant, appended to the day-9 "weekend back" email):**
> P.S. Know a teacher drowning in the same stack? Send them a friend-pass — they get 21 days, you get a
> free month of Pro when they grade their first set. `[Send a friend-pass]`

### T4 — PQL soft prompt (settings / upgrade area)

**Heading:** You're clearly getting value out of aiTA.
**Body:** So would the teacher down the hall. Refer a colleague — when they grade their first set, your
next month of Pro is on us.
**CTA:** `Refer a colleague`

### Invite-link composer — pre-filled email (the teacher edits + sends)

**Subject:** The AI grader that actually sounds like me
**Body:**
> Hey {{their_name}},
>
> You know how I've been buried in essay feedback? I've been using aiTA — it drafts comments to my rubric
> *in my voice*, refuses to score the off-topic stuff, and I stay the final grader. It's genuinely sounding
> like me now (it told me my edit rate is down {delta}%).
>
> I've got you a 21-day friend-pass — no card, and you can try it on sample essays before touching any of
> your own. Here's the link: {invite_link}
>
> — {first_name}

### Referred-colleague landing variant (extended-trial entry)

**Eyebrow:** {first_name} vouched for you — here's your 21-day pass.
**Headline:** Grade like *you* would — in your voice, to your rubric.
**Subhead:** A teacher you trust uses aiTA. Same deal they get: rubric-aligned feedback that reads like *you*
wrote it, refuses off-topic work, and you stay the final grader. 21 days, no card.
**CTA:** `Claim my 21-day pass`
**Microcopy:** Start on 5 sample essays — no class setup, no student data.

### Reward-granted confirmation (referrer)

**Toast:** {{colleague}} just graded their first set — your next month of Pro is on us. Thanks for spreading
the word.

---

## Guardrails (don't break these)

- **Belief precedes the ask** — never prompt to share before an activation/believe-moment (no signup-trigger).
- **One ask per session;** never collide with a conversion prompt; honor dismiss/"don't ask again."
- **No PII on any shareable artifact** — opt-in only, de-identified, sample-essay default. Cohort A never
  shares student work by design.
- **Reward on activation, not signup** — keeps invite quality high; can't be farmed.
- **Teacher is always the sender** — we pre-fill and stage; no auto-posting (consistent with the GTM
  human-gate map).
- **Never lead with "bias" or any student-outcome claim** — this is the buyer story, not the judge story.

## Founder / human-gated bits

- Final **incentive economics** (free-month cap, 21-day length, free-tier reward) — founder sign-off; tune
  against the $15/mo unit economics in the master plan.
- **Legal/ToS line** for referral rewards (cap, no-cash-out, abuse clause) — founder.
- `src/` implementation of surfaces, referral codes, and the attribution events above — owned by the app agent.
