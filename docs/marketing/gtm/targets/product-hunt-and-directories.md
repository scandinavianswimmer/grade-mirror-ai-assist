# aiTA — Product Hunt & Launch-Directory Playbook

**Product:** aiTA — AI essay-grading co-pilot for high-school ELA teachers (learns the teacher's voice, grades to their rubric, refuses off-topic work; teacher stays final grader).
**Target launch:** Late July 2026, a Tuesday–Thursday, one-day spike during back-to-school season. Part of the Build with Gemini XPRIZE campaign.
**Research date:** 2026-06-15. All figures sourced; unverified items explicitly flagged.

> **Reliability note:** PH mechanics, self-hunting status, the directory list, and maker/first-comment norms are well-sourced below. **Category-specific upvote thresholds for AI-grading/edtech and named PH launches of direct competitors are poorly documented in public sources** — flagged inline. Treat any number without a source link as a planning estimate, not a fact.

---

## 1. Product Hunt Mechanics (verified)

### 1a. Best launch day & time

- **Time: 12:01 AM Pacific (PST/PT).** Set your account timezone to Pacific, not local. The PH "day" runs ~24h from 12:01 AM PT, so launching at the start of the window maximizes time-on-leaderboard. ([Demand Curve](https://www.demandcurve.com/playbooks/product-hunt-launch))
- **Day: trade-off between traffic and competition.**
  - Tue/Wed = highest traffic but highest competition (and highest #1 threshold).
  - Thursday = the common "sweet spot": full-work-week visibility, less crowded than mid-week.
  - Sat/Sun = lowest competition and lowest #1 threshold, but far less overall traffic and fewer downstream signups. ([teract.ai](https://www.teract.ai/resources/launch-product-hunt-2026), [signals.sh](https://signals.sh/blog/how-many-upvotes-to-hit-1-on-product-hunt-2026))
- **For aiTA's back-to-school spike:** a **Tuesday or Wednesday in late July** maximizes the audience of teachers/admins browsing during prep season. If the goal is a #1 badge with a smaller list, Thursday is the safer ranking play. Recommendation in §6.

### 1b. How the 2026 ranking algorithm works

The algorithm is a **quality-weighted points system, not a raw upvote count.** ([poindeo.com](https://poindeo.com/blog/product-hunt-upvote-ranking), [reviewsell.com](https://www.reviewsell.com/blog/product-hunt-launch-upvotes-2026/))

| Signal | How it's weighted (2026) |
|---|---|
| Upvote from a verified account >6 months old | Full weight ([signals.sh](https://signals.sh/blog/how-many-upvotes-to-hit-1-on-product-hunt-2026)) |
| Upvote from a brand-new (≈2-day) account | ~20% of a vote — or zero, depending on trust signals ([signals.sh](https://signals.sh/blog/how-many-upvotes-to-hit-1-on-product-hunt-2026)) |
| Quality comment | Reported ≈ 40–50 upvotes-equivalent in weighting *(directionally cited across guides — treat as heuristic, not official)* ([poindeo.com](https://poindeo.com/blog/product-hunt-upvote-ranking)) |
| Velocity | Now measured as **average upvotes/hr across the ~20-hr window**, not a front-loaded spike ([signals.sh](https://signals.sh/blog/how-many-upvotes-to-hit-1-on-product-hunt-2026)) |
| Geographic concentration | If ~80 of the first 100 votes come from one city in 30 min, the clearing pass flags them ([reviewsell.com](https://www.reviewsell.com/blog/product-hunt-launch-upvotes-2026/)) |

**Clearing passes** run roughly every ~2 hours and strip low-trust votes, so the public "headline" number typically sits **10–30% above the net (counted) number.** ([signals.sh](https://signals.sh/blog/how-many-upvotes-to-hit-1-on-product-hunt-2026))

**Implication for aiTA:** steady engagement from *real, established* PH accounts beats a midnight spike of new accounts. A burst of brand-new teacher accounts created just to upvote will be heavily discounted and can trigger clearing. ([teract.ai](https://www.teract.ai/resources/launch-product-hunt-2026))

### 1c. Upvotes/comments to win "Product of the Day"

**General #1 thresholds by weekday (Q1 2026, net upvotes):** ([signals.sh](https://signals.sh/blog/how-many-upvotes-to-hit-1-on-product-hunt-2026))

| Day | ~Net upvotes for #1 | Sustained rate |
|---|---|---|
| Monday | ~950 | 45–55/hr |
| Tuesday | ~1,050 | 45–55/hr |
| Wednesday | ~1,000 | 45–55/hr |
| Thursday | ~950 | 45–55/hr |
| Friday | ~750 | 45–55/hr |
| Saturday | ~550 | 30–35/hr |
| Sunday | ~600 | 30–35/hr |

> ⚠️ **Source conflict — read this.** signals.sh reports ~950–1,050 net for weekday #1. Other 2026 guides cite #1 winners landing in the **200–500** range (e.g. Origami #1 with **309 upvotes**, Feb 2026; "#1s pulling ~500 on average"). ([blog.mean.ceo](https://blog.mean.ceo/product-hunt-launches-news-june-2026/), [origami.chat](https://origami.chat/blog/origami-launches-on-product-hunt-number-one)) The gap is real: it depends heavily on the specific day's competition. **Plan for the worst case (~800–1,000 net weekday) to win #1; ~300–500 net is often enough for a top-3/top-5 badge**, which is still a strong PH badge for marketing.
>
> ⚠️ **No AI/edtech-category-specific threshold was found** in any source. PH ranks overall "Product of the Day," not per-category; category badges (e.g. "#1 in Education") follow from your overall rank plus topic tagging. Mark this **UNVERIFIED** until tested.

**Comments:** aim for **30+ quality comments in the first ~6 hours.** Comment density is reported as the strongest single "worth featuring" signal — a launch with fewer upvotes but high comment quality can outrank one with more upvotes and thin comments. ([dev.to playbook](https://dev.to/iris1031/product-hunt-launch-playbook-the-definitive-guide-30x-1-winner-1pbh), [poindeo.com](https://poindeo.com/blog/product-hunt-upvote-ranking))

### 1d. First-comment & maker-engagement norms

- **Post the maker's first comment within seconds of launch.** "Products with strong first comments average 166% more upvotes" and "70% of Product of the Day winners have a maker first comment." ([signals.sh](https://signals.sh/blog/how-many-upvotes-to-hit-1-on-product-hunt-2026))
- **First-comment formula:** human + humble, light on hype. Walk through *problem → solution → who it's for → (optionally) how you make money.* Show a bit of vulnerability. ([Demand Curve](https://www.demandcurve.com/playbooks/product-hunt-launch))
  - For aiTA: lead with the teacher's-grading-time pain, the "learns *your* voice / grades to *your* rubric / refuses off-topic work" differentiator, and the "teacher stays final grader" trust line. Tie to back-to-school.
- **Respond to every comment within ~30 min** all day; be present the full window. ([dev.to playbook](https://dev.to/whoffagents/product-hunt-launch-day-playbook-hour-by-hour-for-maximum-ranking-1g66))

### 1e. Rules on soliciting upvotes (important)

- **Never directly ask for upvotes.** PH demotes posts showing "signs of fishing for upvotes" and monitors X/Twitter for vote-fishing. Use **"I'd love your feedback"**, not "please upvote." ([Demand Curve](https://www.demandcurve.com/playbooks/product-hunt-launch))
- Purchased votes, coordinated voting, and new-account voting can get a launch **unfeatured entirely.** ([reviewsell.com](https://www.reviewsell.com/blog/product-hunt-launch-upvotes-2026/))
- Velocity rule of thumb: keep incoming under ~100/hr with geographic diversity to avoid clearing flags. ([reviewsell.com](https://www.reviewsell.com/blog/product-hunt-launch-upvotes-2026/))

---

## 2. Hunters / Supporters — **self-hunting is now the norm**

**Bottom line: hunt aiTA yourself.** In 2025 PH reduced the weight of "top hunters," and in 2026 self-hunting is standard. PH reports **79% of featured posts were self-hunted** and **60% of #1 Product-of-the-Day winners were self-hunted.** Self-hunting gives you control of the narrative and lets the maker respond instantly. ([getlaunchlist.com](https://getlaunchlist.com/blog/how-to-launch-on-product-hunt-2026), [zeda.io](https://zeda.io/blog/producthunt-launch-guide))

> ⚠️ One hunter directory still argues hunters add credibility/reach ([launchpedia.co](https://launchpedia.co/product-hunt-hunters/)) — but that's a directory selling hunter access. The weight of 2026 sources and PH's own stats favor self-hunting. **Recommendation: self-hunt.**

### What "self-hunting" prep replaces a hunter with

1. A **mature maker PH account** (created weeks ahead, real avatar/bio, some genuine activity/comments — new accounts get discounted).
2. A **supporter list of established PH users** (see §5), not a hunter's audience.
3. A few **respected makers/educators who already have PH presence** to comment authentically on launch day (ask for *feedback*, not upvotes).

### Named hunters (only if you choose to use one — lower priority)

These are general high-volume hunters; **none verified as edtech/grading specialists.** Reach via their PH profile / linked socials (phhunters.com aggregates contacts). ([launchpedia.co](https://launchpedia.co/product-hunt-hunters/))

| Hunter | Hunts / Followers | Notes | Verified edtech focus? |
|---|---|---|---|
| Nathan Baschez | 146 / ~14,640 | High-volume, broad tech | No |
| Andrian Valeanu | 45 / ~3,207 | Multi-project founder | No |
| Matt Hodges | 23 / ~2,025 | Ex-Atlassian/Intercom/Loom | No |
| Gajus Kuizinas | 9 / ~1,924 | Co-founder, Contra | No |
| Ignacio Velasquez | 54 / ~971 | Notion/productivity tools | No |

> ⚠️ I could **not verify** any currently-active hunter who specializes in K-12/edtech or AI-grading tools. Do not over-invest here — self-hunt and spend the energy on the supporter list.

---

## 3. Comparable launches (edtech / AI / grading)

> ⚠️ **Honest gap:** Public PH data for *direct* AI-grading-tool launches is thin. EssayGrader is verifiable; the rest are flagged. Use these for tagline/asset patterns, not as exact benchmarks.

| Product | What it is | PH result | Notes / takeaway | Source |
|---|---|---|---|---|
| **EssayGrader** | "Grade essays and papers with AI" | **#32 day rank**, 76 pts (2023 launch) | Direct comp. Tagline is plain + benefit-first. Founder-origin story (wife grading over break) is exactly aiTA's emotional hook — but a #32 day-rank shows a thin launch underperforms. **Out-execute this.** | [PH](https://www.producthunt.com/products/essaygrader) |
| **Origami** (AI lead-gen) | "AI lead generation with one prompt" | **#1 Product of the Day, 309 upvotes** (Feb 2026) | Not edtech, but a clean recent data point: ~300 upvotes won #1 on a low-competition day. Single-prompt simplicity in the tagline. | [origami.chat](https://origami.chat/blog/origami-launches-on-product-hunt-number-one) |
| **Cursor v2.0** (AI IDE) | AI code editor | **#1 Day + #1 Week** (2025) | Asset pattern: tight demo GIF, version-launch cadence. Shows incumbents win with polish + audience. | [PH forum](https://www.producthunt.com/p/producthunt/best-developer-tools-launched-on-product-hunt-in-2025) |
| **Appwrite Sites** | "Open-source Vercel alternative" | #1 Day + #1 Week/Month (2025) | Tagline pattern: position against a known incumbent ("X for Y"). aiTA could use "an AI TA that grades in *your* voice." | [PH forum](https://www.producthunt.com/p/producthunt/best-developer-tools-launched-on-product-hunt-in-2025) |
| **Lingo.dev** (AI localization) | YC F24, AI localization engine | #2 Day, #1 Dev Tool of Week/Month (2025) | Strong comment engagement + YC network drove ranking. | [PH forum](https://www.producthunt.com/p/producthunt/best-developer-tools-launched-on-product-hunt-in-2025) |
| **Brisk Teaching** *(UNVERIFIED on PH)* | AI feedback in Google Docs for teachers | PH launch/upvotes **not verified** | Closest live competitor; a PH reviewer praised its text-leveling. Study its tagline/positioning even if launch data is unconfirmed. | [tooliverse](https://tooliverse.ai/tools/brisk-teaching) |

**Tagline/asset patterns that worked:** (1) plain benefit-first line ("Grade essays with AI"), (2) "X for Y" incumbent framing, (3) a 15–30s demo GIF as the first gallery asset, (4) founder origin-story in the first comment. aiTA's differentiators (voice-learning, rubric-grading, off-topic refusal, teacher-as-final-grader) are sharper than any comp above — lead with them.

---

## 4. Other launch directories (beyond PH)

Ranked roughly by payoff for an edtech/AI SaaS. Run PH as the centerpiece; stack the rest around it for backlinks + a second traffic wave.

| Platform | URL | Audience fit for aiTA | Submission path | Cost | Effort → Payoff |
|---|---|---|---|---|---|
| **EdTech Index / ISTE LTD** ⭐ | [iste.org/edtech-index](https://iste.org/edtech-index) | **Best fit — actual teachers/admins** (~45k/mo) evaluating tools | Register product via ISTE's Learning Technology Directory (LTD) | Free (Premium upsell) | Med → **High** (buyer-intent, syncs to other edu directories) |
| **Hacker News — Show HN** | [news.ycombinator.com](https://news.ycombinator.com) | Technical/maker crowd; AI + Gemini angle plays well | "Show HN: aiTA – …" self-post | Free | Low → High *if it catches* (volatile; one strong post = thousands of visits) |
| **BetaList** | [betalist.com](https://betalist.com) | 100k+ early adopters who try betas | Submit, wait in queue | Free / **$129 expedited** | Low → Med (good for waitlist/early signups) |
| **Indie Hackers** | [indiehackers.com](https://indiehackers.com) | Bootstrapped/solo founders; build-in-public | Post a launch/story in the community | Free | Low → Med (engagement + feedback, less raw traffic) |
| **Fazier** | [fazier.com](https://launchdirectories.com/directory/fazier) | AI-startup discovery; **highly indexed for AI search**, less crowded than PH | Free submission | Free | Low → Med (SEO/AI-citation value) |
| **AlternativeTo** | [alternativeto.net](https://alternativeto.net) | People searching "alternative to MagicSchool/Brisk/EssayGrader" | List product + as alternative to competitors | Free | Low → Med (evergreen comparison traffic) |
| **Uneed** | [uneed.best](https://launchdirectories.com/blog/product-hunt-alternatives-18-places-to-launch-in-2026) | Daily product discovery | Free submission | Free | Low → Low/Med (backlink + minor traffic) |
| **G2 / Capterra** | [g2.com](https://g2.com) / [capterra.com](https://capterra.com) | B2B/school buyers researching grading software | Claim/create a listing; gather reviews | Free basic | Med → **High over time** (review-driven buyer intent; slow build) |
| **EdSurge / EdTech Digest** | [edsurge.com](https://www.edsurge.com), [edtechdigest.com](https://www.edtechdigest.com) | Edu press + product guides | Pitch editorial / submit to indexes | Free / editorial | Med → Med (credibility + edu reach) |
| **Reddit (r/Teachers ~2.3M, r/teachingresources)** | [reddit.com/r/Teachers](https://reddit.com/r/Teachers) | Real teachers — but **strict self-promo rules** | Value-first post / AMA, not a drop-link | Free | Med/High → High *if done as genuine participation* (read each sub's rules first; ban risk) |
| **AppSumo** | [appsumo.com](https://appsumo.com) | Deal hunters; lifetime-deal revenue | Apply as a partner | Rev-share | High → Med (revenue, but discounts your ASP — likely skip for a teacher SaaS) |

> ⚠️ Exact queue times/prices beyond BetaList ($129 expedited) and the free tiers were not individually re-verified per platform; the free-vs-paid split above is from aggregated 2026 directory roundups ([startupa.ge](https://startupa.ge/blog/best-startup-directories-launch), [launchdirectories.com](https://launchdirectories.com/blog/product-hunt-alternatives-18-places-to-launch-in-2026)).

---

## 5. Pre-launch checklist & timeline (backward from a late-July Tuesday)

Assume **Launch = Tuesday, T-0.**

### T-4 weeks (~late June)
- [ ] Create/warm up the **maker PH account** (avatar, bio, link aiTA, leave a few genuine comments so it isn't a fresh account).
- [ ] Start building the **supporter list — target ≥400 established PH users / teachers / network contacts.** ([Demand Curve](https://www.demandcurve.com/playbooks/product-hunt-launch))
- [ ] Begin **adding value in communities** (Indie Hackers, teacher Slack/FB groups, X) to bank social capital. ([Demand Curve](https://www.demandcurve.com/playbooks/product-hunt-launch))
- [ ] Draft taglines (≤60 char) + the maker first-comment (problem→solution→who→trust line).
- [ ] Register **EdTech Index / ISTE LTD** listing (slow to index — start early).

### T-3 weeks
- [ ] Produce assets: **15–30s demo GIF** (voice-learning + rubric grade + off-topic refusal), 3–5 gallery images, logo, og-image.
- [ ] Recruit **5–10 credible makers/educators** to comment on launch day (ask for *feedback*).
- [ ] Submit **BetaList** (free queue is slow — submit now; or pay $129 if timing is tight).
- [ ] Write the **"I'd love your feedback" outreach** (never "please upvote").

### T-2 weeks
- [ ] Send supporter list **email #1**: explain PH, ask them to create/log into a PH account (not to vote yet). ([Demand Curve](https://www.demandcurve.com/playbooks/product-hunt-launch))
- [ ] Finalize landing page + a launch-day signup offer (e.g. free back-to-school setup).
- [ ] Line up **Show HN** post draft + **Fazier / Uneed / AlternativeTo** submissions (schedule for launch day or T+1).

### T-1 week
- [ ] Confirm **Tuesday 12:01 AM PT** scheduled launch; account timezone = Pacific.
- [ ] Dry-run the first-comment, gallery order, and links.
- [ ] **Email #2** to supporters: ask them to engage with *other* PH products this week (warms accounts, builds trust signal). ([Demand Curve](https://www.demandcurve.com/playbooks/product-hunt-launch))
- [ ] Prep teacher-community posts (value-first, rule-compliant) for r/Teachers etc.

### T-1 day (Monday)
- [ ] Final asset/link check. Pre-write comment replies for likely questions (accuracy, FERPA/student-data, "does it replace teachers?" — emphasize teacher-as-final-grader).
- [ ] Notify launch-day commenters of the exact go-live time.

### T-0 — Launch day (hour-by-hour) ([dev.to playbook](https://dev.to/whoffagents/product-hunt-launch-day-playbook-hour-by-hour-for-maximum-ranking-1g66))
- [ ] **12:01 AM PT:** go live; **post maker first comment immediately.**
- [ ] **Wave 1 (12:01 AM):** notify core supporters (feedback ask).
- [ ] **Wave 2 (~6 AM PT):** wider network email/DM.
- [ ] Post **Show HN**, fire **Fazier/Uneed/AlternativeTo** submissions, post to teacher communities (value-first).
- [ ] Reply to **every comment within 30 min**, all day. Keep velocity steady (target ~45–55 net upvotes/hr; avoid one-city bursts).
- [ ] **Wave 3 (~6 PM PT):** final reminder to stragglers.
- [ ] Watch for clearing-pass dips; keep engagement organic.

### T+1 to T+7
- [ ] Thank supporters; share the badge/result.
- [ ] Submit/finish remaining directories (G2, Capterra, EdSurge/EdTech Digest pitch).
- [ ] Convert PH traffic: onboard signups, gather reviews (G2/Capterra), capture testimonials for back-to-school sales.

---

## 6. Launch-Day Priority Order (ranked)

1. **Maker first comment, posted at 12:01 AM PT** — the single highest-leverage move (166% more upvotes; 70% of #1 winners have one).
2. **Activate the established-supporter list in 3 timed waves (12 AM / 6 AM / 6 PM PT)** — feedback asks only, never "upvote." Real, aged accounts only.
3. **Reply to every comment within 30 min, all day** — comment density is the strongest "feature this" signal; drive ≥30 quality comments early.
4. **Maintain steady velocity (~45–55 net upvotes/hr), geographically diverse** — avoid spikes/one-city bursts that trip the clearing pass.
5. **Cross-post for the second traffic wave:** Show HN → teacher communities (rule-compliant) → Fazier/Uneed/AlternativeTo.
6. **EdTech Index/ISTE + BetaList** working in the background (started weeks earlier; these are setup-ahead, not launch-day scrambles).
7. **G2/Capterra/EdSurge** as the T+1→T+7 follow-through for durable buyer-intent traffic.
8. **Hunters: skip** — self-hunt. Spend that energy on items 1–3.

---

### Verification status summary
- **Verified & well-sourced:** launch time (12:01 AM PT), quality-weighted algorithm, clearing passes, no-upvote-soliciting rule, self-hunting as the 2026 norm, first-comment stats, directory list, maker norms, EssayGrader's PH page.
- **Source-conflicted (flagged):** exact #1 upvote threshold — guides split between ~300–500 and ~800–1,050 net for weekday #1. Plan for the high end to win #1; ~300–500 often earns a top-3/5 badge.
- **UNVERIFIED (flagged in-line):** AI/edtech-category-specific upvote thresholds; named edtech-specialist hunters; PH launch numbers for Brisk/MagicSchool/Class Companion; per-platform exact queue times/prices beyond BetaList.
