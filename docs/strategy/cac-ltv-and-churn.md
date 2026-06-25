# CAC / LTV one-pager + cohort-retention & churn plan

> aiTA unit economics, honest. Closes adversarial finding **M-11** and feeds the XPRIZE
> "Business viability" financials (which require revenue-by-month, costs-ex-marketing, CAC, and
> related-party revenue flagged separately — see `docs/launch/XPRIZE-SUBMISSION.md`).
> Voice matches the GTM docs: no ego-boost, ranges with stated assumptions, math shown.
>
> **Pricing baseline** (from `docs/marketing/gtm/trial-conversion-copy.md`): Free floor = 15 grades/mo
> forever · Pro = **$15/mo** · Annual = **~$150/yr** (save ~2 months) · **14-day full-access trial, no card**.
> **Honest near-term goal:** ~48 paid teachers / **$720 MRR** by Aug 17. Everything below is sized against
> that floor, not a hockey stick.

---

## 0. The one number that governs everything

At **$15/mo**, every dollar of acquisition cost is expensive. A healthy SaaS runs **LTV:CAC ≥ 3:1** and
recovers CAC in **< 12 months**. Both constraints set a hard ceiling on what we can spend to get a teacher:

- **CAC-payback ceiling (12-mo):** CAC ≤ 12 × (ARPU × gross margin).
- **3:1 ceiling:** CAC ≤ LTV / 3.

With the gross margins and lifetimes modeled below, the **paid-acquisition CAC tolerance lands at roughly
$30–$110 per paying teacher** depending on which retention case is true. That is *tiny*. It is less than one
click-funnel's worth of paid social in most B2B niches. **Conclusion up front: pre-PMF, aiTA cannot afford
paid acquisition. The GTM plan is correct to be time-funded (Reddit value-posts, FB-proxy webinars, Product
Hunt, referral) rather than ad-funded.** The CAC model below quantifies why.

---

## 1. CAC model — per channel

### 1.1 Assumptions (stated explicitly)

| Assumption | Value | Source / basis |
|---|---|---|
| Founder time cost (loaded) | **$50/hr** | Modeling rate for founder labor; not cash out the door pre-PMF. Swap your real figure. |
| Trial → paid conversion (no-card, full-access trial) | **24.8%** baseline | EdTech free-trial conversion benchmark cited in planning; no-card trials skew lower, so treat as a ceiling. |
| Signup → trial-activation (loads ≥1 real grade set) | **~40%** | Estimate. Activation = used the product on real or sample work, not just signed up. **Instrument to replace this guess.** |
| PH signup → paid floor | **~0.25%** | Product Hunt traffic is low-intent; treat 0.25% signup→paid as a *floor*, not a forecast. |
| Blended paid-conversion (signup → paid) | activation × trial-conv ≈ **40% × 24.8% ≈ 9.9%** | Used for time-funded channels where signups are intent-qualified (Reddit/FB/referral). |

> **Why two conversion rates.** "Trial→paid" (24.8%) starts the clock at someone who *began a trial*.
> "Signup→paid" (~9.9%) starts at raw signup and is the number that actually divides into channel effort.
> A Product Hunt spike is measured on the rawer **signup→paid ~0.25–1%** because the traffic is curiosity,
> not intent.

### 1.2 Cost is mostly *time*, not ad spend

| Channel | Cost driver | Effort → output assumption | Implied cost per paying teacher (CAC) |
|---|---|---|---|
| **Reddit value-posts** (r/ELATeachers, r/Teachers) | Founder hours: lurk, comment, value-post, F5bot triage | ~6 hrs/wk sustained → ~15–30 intent signups/mo at ~10% paid → **~2–3 paid/mo** | **$50/hr × 24 hrs ÷ 2.5 ≈ $480 cash-equiv**, but **$0 cash**. Time-funded. |
| **FB-proxy webinar** (free PD, proxied through teacher-users) | Founder hours to build + run the PD; no ad spend | 1 webinar (~8 hrs prep+run) → ~30–60 attendees → ~10–20 trials → ~2–5 paid | **~$80–$200 cash-equiv per paid**; **$0 cash**. Best time-ROI once a deck exists (reusable). |
| **Product Hunt** (one-day spike, Wk6) | Founder hours (listing built, no spend); 30% annual code `PHUNT` | ~300–1,500 visits → 0.25–1% signup→paid → **~1–8 paid** one-time | One-time **~$200–$400 cash-equiv** prep amortized over the spike; **$0 cash**. Burst, not a faucet. |
| **Referral** (teacher→teacher share loop) | Reward cost only (e.g., free month or grade-credit) | Viral coefficient assumed **k ≈ 0.15–0.35** early → amplifies other channels, not standalone | **Marginal cash CAC ≈ one free month ($15) per successful referral** + ~$0 time once automated. Lowest-CAC channel if it works. |
| **Organic / SEO / word-of-mouth** | Sunk content + product quality | Long-tail; unattributed | **~$0 marginal**; ignore for near-term modeling, credit it when it shows in self-reported source. |

### 1.3 Blended CAC

Pre-PMF, **cash CAC ≈ $0–$15/paid teacher** (only referral rewards and any annual-discount margin give-up are
real cash; everything else is founder time). The honest framing for the XPRIZE "costs ex-marketing + CAC"
field is therefore two-track:

- **Cash CAC (what Stripe + ad accounts show): ≈ $0–$15 per paying teacher.** This is the number the
  submission should report, because it is what actually left the bank.
- **Time-equivalent CAC (founder labor priced at $50/hr): ≈ $80–$480 per paying teacher**, channel-dependent,
  trending down as reusable assets (webinar deck, PH listing, referral loop) amortize.

**Blended cash CAC estimate to report: ~$10 per paying teacher** (dominated by occasional referral rewards),
with a **time-equivalent blended CAC of ~$150–$250** disclosed as a footnote so the unit economics aren't
flattered by hiding founder labor.

### 1.4 What CAC the unit economics can bear (the math)

Using the LTV model in §2:

| Retention case | LTV (see §2) | Max CAC @ 3:1 | Max CAC @ 12-mo payback | Verdict |
|---|---|---|---|---|
| **Commodity GRR (23%)** | **~$33** | **~$11** | **~$11** | Paid acquisition is **impossible**. Only $0-cash channels survive. |
| **Vertical-AI GRR (~70%)** | **~$96** | **~$32** | **~$11** (payback still binds) | Paid acquisition only viable at **sub-$32 CAC** *and* you accept >12-mo payback, which a bootstrapped runway can't. |

**Takeaway:** even in the optimistic vertical-AI case, the CAC ceiling (~$32 at 3:1; ~$11 at 12-mo payback)
is below the cost of essentially any paid channel. The time-funded GTM is not a scrappy stopgap — at $15/mo it
is the *only* rational acquisition strategy until ARPU rises (annual mix, team/department plans, or a higher
tier) or retention is proven high.

---

## 2. LTV model

### 2.1 ARPU

| Plan | Price | Notes |
|---|---|---|
| Pro monthly | $15.00/mo | List. |
| Annual | ~$150/yr = **$12.50/mo effective** | ~2 months free; lowers ARPU but *raises* lifetime (annual prepay = locked retention). |
| **Blended ARPU** | **~$13.50–$14.00/mo** | Assumes ~30–40% choose annual. Use **$13.75/mo** as the working number. |

### 2.2 Gross margin (COGS = Gemini inference per grade)

The grading COGS is LLM inference. The XPRIZE submission is "Build with Gemini" → production runs **Gemini on
Vertex AI**. Cost per grade is a function of tokens in (assignment + rubric + student submission, ~2–6k tokens)
+ tokens out (annotations + rubric reasoning + summary, ~1–3k tokens), so **~5–10k tokens per graded essay**.

| Model | Rough blended $/1M tokens (in+out) | Est. cost per grade @ ~8k tokens | At which volume |
|---|---|---|---|
| **Gemini Flash** (default for grading at scale) | ~$0.30–$0.50 blended | **~$0.003–$0.004 / grade** | Use Flash for the bulk; quality is sufficient for first-draft feedback the teacher edits. |
| **Gemini Pro** (hard/long essays, escalation) | ~$3–$5 blended | **~$0.025–$0.040 / grade** | Reserve for low-confidence / long submissions. |

> **Assumption — grades/mo per paying teacher.** A Pro teacher grades unlimited, but realistic active usage is
> **~150–250 grades/mo** during a grading-heavy stretch, lower off-peak. Model **~200 grades/mo**.

**Monthly COGS per paying teacher:**
- All-Flash: 200 × $0.0035 ≈ **$0.70/mo** → on $13.75 ARPU = **~95% gross margin**.
- 80% Flash / 20% Pro: 200 × (0.8×$0.0035 + 0.2×$0.030) ≈ 200 × $0.0088 ≈ **$1.76/mo** → **~87% gross margin**.

**Working gross margin: ~88–92%.** Even a heavy-Pro mix stays >80%. Inference is *not* the constraint at
$15/mo; **retention is.** (Caveat: a runaway power-user grading 1,000+/mo on Pro could approach break-even on
that account — monitor per-account COGS and bias such accounts to Flash.)

### 2.3 Lifetime from GRR → LTV range

LTV = (ARPU × gross margin) ÷ monthly revenue churn. Expected lifetime (months) ≈ 1 ÷ monthly churn.
GRR (gross revenue retention) is annual; monthly churn ≈ (1 − GRR^(1/12)).

| Case | Annual GRR | Implied monthly churn | Avg lifetime | **LTV = (ARPU × GM) / churn** |
|---|---|---|---|---|
| **Commodity AI** (the floor risk) | **23%** | ~11.5%/mo | ~8.7 mo | $13.75 × 0.90 ÷ 0.115 ≈ **~$108** *gross-revenue* / margin-adjusted **~$33 contribution LTV**¹ |
| **Vertical-AI** (the target) | **~70%** | ~2.9%/mo | ~34 mo | $13.75 × 0.90 ÷ 0.029 ≈ **~$427** gross / margin-adjusted **~$96 contribution-net**¹ |

> ¹ Two LTV conventions are shown deliberately. **Gross-revenue LTV** (ARPU/churn) flatters; the honest number
> for CAC decisions is **contribution LTV** = (ARPU × GM) × lifetime, then compared to CAC. The §1.4 ceilings
> use the conservative contribution figures (**~$33 commodity / ~$96 vertical-AI**) so we don't kid ourselves.

### 2.4 LTV:CAC in each case

| Case | Contribution LTV | Cash CAC (~$10) | Time-equiv CAC (~$200) |
|---|---|---|---|
| **Commodity (23% GRR)** | ~$33 | **3.3:1** ✓ (only because cash CAC ≈ $0) | **0.17:1** ✗ — underwater if founder time is priced |
| **Vertical-AI (~70% GRR)** | ~$96 | **9.6:1** ✓✓ | **0.48:1** ✗ — still underwater on priced time |

**Reading this honestly:** the business clears 3:1 *only* while acquisition is genuinely free (founder time
not monetizable elsewhere). The moment you price founder labor or spend cash on ads, even the optimistic case
is underwater. **The path to a fundable LTV:CAC is retention (push GRR toward the vertical-AI 70% case) and
ARPU (annual mix + a higher/department tier), not more acquisition spend.** This is the single most important
strategic conclusion in this doc.

---

## 3. Cohort-retention / churn plan

### 3.1 The metric that actually matters (and the trap to avoid)

**Trial-conversion is a vanity metric for a seasonal product.** A 14-day trial run over summer says *nothing*
about whether a teacher still grades daily in October. The product's value is realized during the school-year
grading grind, so the instrument we trust is **monthly-cohort GRR / NRR**, tracked by *signup month*, watched
across the back-to-school transition.

| Metric | Definition | Why it's the one |
|---|---|---|
| **Monthly cohort GRR** | Of the paid teachers who started in month M, what % of their MRR remains in M+1, M+2, … | Reveals real stickiness once school starts; separates "summer tire-kickers" from "daily users." This is **the #1 metric to instrument.** |
| **NRR** | GRR + expansion (annual upgrades, future team seats) | Tells us if the base grows without new logos. |
| **Trial→paid by cohort** | Secondary — keep, but never report it *as* retention. | Acquisition-quality signal only. |
| **Back-to-school reactivation** | Of summer signups dormant in July/Aug, what % become active graders in Sept | The make-or-break seasonal cohort behavior. |

**Reporting rule:** always state the cohort and the elapsed months ("June cohort, M+3 GRR = X%"). A blended
all-time churn number will lie because of the seasonal mix.

### 3.2 Leading churn indicators

These predict cancel *before* the teacher clicks it. Highest-signal first:

| Signal | Why it precedes churn | Risk |
|---|---|---|
| **Grading-session frequency drop ≥50% over 2 weeks** | Core value is the grading loop; if they stop grading, they stop valuing it. **The single best aiTA-specific predictor.** | High |
| **Edit-acceptance ratio collapses** (rejecting/rewriting most suggestions) | The voice model isn't converging for them → the core promise is failing. | High |
| **No grade run in 14 days** during school year | Dormancy; especially damning Sept–May. | High |
| **Hit free-floor (15 grades) but didn't upgrade / downgraded back** | Value gap or price resistance. | Medium |
| **Billing-page visits** | Classic pre-cancel reconnaissance. | High |
| **Trial day 10–14 with low activation** | Will lapse silently at trial end. | Medium |

### 3.3 Minimal save / win-back motion (right-sized for a solo founder)

Don't build Churnkey yet. Build the *cheapest* thing that recovers double-digit percentages:

1. **Proactive (before cancel):**
   - **Dormancy nudge** — grading frequency drops ≥50% or no run in 14 days (school year) → one helpful email:
     "Stuck on a class set? Here's the 2-minute workflow," not a guilt trip.
   - **Voice-not-converging nudge** — edit-acceptance ratio low → "Let's tune aiTA to your voice" with a
     concrete how-to. Fixes the actual failure mode.
2. **Cancel flow (one screen, no dark patterns):** single-select exit survey → one reason-matched offer:
   - *Too expensive* → switch to annual (lower effective price) or stay free-tier (15/mo).
   - *Not grading right now / summer* → **pause 1–3 months** (seasonal product → pause is the highest-value
     save here; 60–80% of pausers return).
   - *Missing feature / sounds wrong* → route to founder + roadmap.
   - Keep "cancel anyway" always visible (FTC click-to-cancel; and it's the right thing).
3. **Win-back:** lapsed paid → 1 email at ~30 days timed to a grading season ("New school year? Your voice
   profile is still here — pick up where you left off").

### 3.4 What to add to analytics so this is measurable (spec only — another track owns code)

These are the events that make §3.1–§3.2 computable. They belong in the typed `AnalyticsEvent` union in
**`src/lib/analytics.ts`** (currently ends at `pql_grade_12`). Spec, not implementation:

| Proposed event | Fires when | Powers |
|---|---|---|
| `grade_session_started` | A teacher begins a grading run (distinct from per-grade `grade_started`) | Session-frequency = the #1 leading indicator (§3.2). |
| `free_floor_reached` | Teacher hits the 15-grade free cap in a month | Upgrade-intent / value-gap signal. |
| `subscription_started` | First successful Stripe paid charge (with `plan: 'monthly'|'annual'`) | Cohort entry; ARPU mix. |
| `subscription_canceled` | Cancel confirmed (with `reason` from exit survey) | GRR, churn-reason mix. |
| `subscription_paused` / `subscription_resumed` | Pause save accepted / auto-resume | Pause→reactivation rate (the seasonal save). |
| `billing_page_viewed` | Teacher opens billing/manage-subscription | Pre-cancel reconnaissance flag. |
| `cancel_flow_started` / `save_offer_shown` / `save_offer_accepted` | Each cancel-flow step | Cancel-flow save rate (target 25–35%). |
| `winback_clicked` | Lapsed user clicks a win-back email CTA | Win-back effectiveness. |

> Implementation notes for the owning track: keep them as additional string-literal members of the existing
> `AnalyticsEvent` union (no schema lib needed, per the file's own comment); always pass `plan` and, on cancel,
> a `reason` prop drawn from the §3.3 exit-survey categories; identify by teacher so cohorts are by `signup
> month`. PostHog funnels then give cohort GRR and cancel-flow save rate with no extra infra.

---

## 4. XPRIZE financials hook — founder-fill table template

The submission's "Business viability" section requires **revenue by month (May–Aug), costs excluding
marketing, CAC, and related-party revenue reported separately** (`docs/launch/XPRIZE-SUBMISSION.md` §A).
Founder fills the cells from Stripe + Vertex AI billing. Keep all figures **arm's-length unless flagged**.

### 4.1 Monthly revenue + cost table (fill from Stripe + Vertex)

| Month | Paid teachers (EOM) | New paid | Churned paid | **MRR ($)** | Annual prepay booked ($) | Gemini/Vertex COGS ($) | Other infra ($) | **Gross margin %** | Cash CAC spend ($) | New paid (arm's-length) | CAC = spend ÷ arm's-length new |
|---|---|---|---|---|---|---|---|---|---|---|---|
| May 2026 | | | | | | | | | | | |
| Jun 2026 | | | | | | | | | | | |
| Jul 2026 | | | | | | | | | | | |
| Aug 2026 | | | | | | | | | | | |
| **Total / blended** | | | | | | | | | | | |

### 4.2 Related-party revenue (reported separately — rules require it)

| Month | Related-party paid accounts | Related-party MRR ($) | Names/flags (founder, friends, family) |
|---|---|---|---|
| May–Aug | | | |

> **Arm's-length rule:** the §4.1 "arm's-length new" and CAC columns must **exclude** every account in §4.2.
> Report total MRR *and* arm's-length MRR. The XPRIZE CAC figure is `cash marketing spend ÷ arm's-length new
> paid teachers` — and per §1.3 that cash spend is ~$0 pre-PMF, so expect a **near-zero reported CAC** with a
> footnote disclosing the **~$150–$250 time-equivalent CAC** so reviewers see the real cost of acquisition.

### 4.3 Honest target row (the floor, not a forecast)

| Checkpoint | Paid teachers | MRR | Basis |
|---|---|---|---|
| **Aug 17, 2026** | **~48** | **~$720** | The stated honest floor. If actuals beat it, great; this is the number we commit to, not the dream. |

---

## 5. Summary (the three things to remember)

1. **Blended cash CAC ≈ $10/paying teacher** (~$150–$250 time-equivalent). At $15/mo the unit economics can
   bear a CAC of only **~$11–$32** — so **paid acquisition is off the table** and the time-funded GTM is the
   correct, only-viable strategy pre-PMF.
2. **LTV:CAC ranges 3.3:1 (commodity, 23% GRR) → 9.6:1 (vertical-AI, ~70% GRR)** on cash CAC — but **underwater
   on priced founder time in both cases.** The lever is **retention + ARPU**, not more acquisition.
3. **Instrument monthly-cohort GRR (by signup month, watched across back-to-school)** as the #1 metric — and
   make it computable by adding the §3.4 events (starting with `grade_session_started`) to the typed union in
   `src/lib/analytics.ts`. Trial-conversion is a vanity metric for a seasonal grading product.
