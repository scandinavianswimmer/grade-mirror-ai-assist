# Trial Onboarding Email Sequence (owned channel)

> The nurture that converts a 14-day trial signup → activated → paying. Owned channel (we control it),
> so it compounds. Load into the product's transactional email system (or wire through `personalize.mjs`
> with a `trial-d0` … `trial-d13` template set). Voice from `../docs/marketing/MESSAGING.md` — teacher-facing:
> lead with time + voice, never bias. Trigger = trial start; halt the sequence on conversion.

**Goal funnel:** signup → first grade (activation) → "it sounds like me" moment → habit (≥12 grades/mo PQL)
→ convert before day 14. The activation moment is everything — a trial that never grades never converts.

---

### Email 0 — instant (on signup) · Subject: "You're in. Grade your first set in 5 minutes."
You just started your aiTA trial — full Pro access for 14 days, no card.
Fastest way to see what it does: **grade the 5 sample essays we pre-loaded** (no setup, no student data).
You'll watch aiTA score to a rubric, draft inline feedback, and *refuse* the off-topic one — then you
approve, edit, or reject. → **[Grade the sample set]**
Reply to this email if anything's confusing — a real person (me) reads it.

### Email 1 — day 1 (only if NOT activated) · Subject: "Your first set is waiting"
Haven't run a grade yet? It takes about 90 seconds on the sample essays — and it's the only way to feel the
difference from the robotic graders you've tried. → **[Grade the sample set]**
Prefer your own assignment? Paste the prompt and aiTA builds the rubric for you.

### Email 2 — day 2 (after first grade) · Subject: "Now make it sound like *you*"
You graded a set — nice. Here's the part that matters: **edit a few comments to your voice.** Every edit
teaches your aiTA how *you* give feedback. Then flip the side-by-side toggle and watch the next set come
back more like you. That loop is the whole point. → **[Open your assignments]**

### Email 3 — day 4 · Subject: "The grade it *refused* to give"
The feature teachers don't expect: aiTA withholds a score when work is off-topic or off-assignment, and
tells you why. No more a maintenance guide scored as a perfect essay. That's why you can trust the grades
it *does* give. Try uploading something off-topic and watch it flag it. → **[Try it]**

### Email 4 — day 6 · Subject: "Stop approving the easy ones one by one"
Turn on **auto-finalize**: aiTA publishes the high-confidence, on-topic grades for you and routes only the
tricky ones to your desk. You stay in command of the calls that need you. → **[Turn on auto-finalize]**

### Email 5 — day 9 (engaged) · Subject: "Your weekend, by the numbers"
You've graded {{grade_count}} pieces this week. At ~5.9 hours saved a week, that's roughly a weekend back —
without sending a single comment you didn't approve. Pro is $15/mo (or ~$150/yr). → **[Keep Pro]**

### Email 6 — day 12 · Subject: "Your trial ends in 2 days"
Your full-access trial ends {{trial_end_date}}. Keep your trained aiTA — it's already learning your voice,
and that doesn't transfer anywhere else. **$15/mo, cancel anytime**, or stay on the free tier (15 grades/mo).
→ **[Continue with Pro]**  ·  → **[Switch to annual & save ~2 months]**

### Email 7 — day 14 (expired, not converted) · Subject: "You're on the free tier now (15 grades/mo)"
Your trial wrapped — you're on the free plan, so aiTA's still here for 15 grades a month, voice-learning
included. When grading season hits, Pro is one click away and your trained voice is waiting. → **[Upgrade]**
Mind sharing why Pro wasn't right yet? One reply helps me build the tool you'd actually pay for.

---

## Conversion-moment triggers (event-driven, not time-driven)
- **≥12 grades in a month (PQL):** "You're clearly getting value — lock in Pro before the trial ends."
  (The `pql_grade_12` event already fires in-app, commit `656c6ca`.)
- **First auto-finalized batch:** "aiTA just graded {{n}} essays unattended and flagged {{m}} for you."
- **First 'barely edited' moment (low edit distance):** "That set barely needed you. That's aiTA learning your voice."

## Measurement
Track: signup→activation (first grade) %, activation→PQL %, trial→paid %, and time-to-first-grade.
Activation is the leading indicator — if signups aren't grading, fix Email 0/1 before anything else.
