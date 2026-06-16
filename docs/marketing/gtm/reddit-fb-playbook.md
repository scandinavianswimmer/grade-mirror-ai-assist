# Reddit & Facebook Playbook — value-first community marketing for aiTA

> Operationalizes Luke's 5-step Reddit/FB playbook for aiTA. The throughline matches our strategy
> (`XPRIZE-MASTER-PLAN.md`): **earn trust before you pitch.** Live thread drafts → `../../../outreach/reddit-engagement-queue.md`.
> Targets → `targets/reddit-threads-and-rules.md` + `targets/facebook-and-influencers.md`.

## The access reality (and the workaround)
Reddit WAF-blocks our automation browser's IP, and reddit.com is blocked for direct fetch in this env. So
we **read Reddit through its Google index** (`site:reddit.com …` — Google isn't blocked, fetches server-side)
and, for ongoing discovery, **F5bot email alerts** (step 4). For full-thread reads when needed, a public
**Redlib/Libreddit** instance proxies Reddit server-side. **Posting is always manual from Luke's logged-in
account** — Reddit bans automation and rewards established accounts; we never auto-post.

---

## Step 1 — Map target communities (done + repeatable)
**Keywords / interests (the seed list — use for searches, F5bot, and Map of Reddit):**
`AI grading` · `grading essays` · `essay feedback` · `grading burnout` · `grading takes forever` ·
`AI feedback teacher` · `rubric` · `sounds robotic` · `generic feedback` · `auto grader` · `EssayGrader` ·
`CoGrader` · `Brisk teaching` · `grade faster` · `ELA teacher` · `AP Lang` · `AP Lit`.

**Subreddits (ranked, value-first):** r/ELATeachers (best ICP) · r/Teachers (huge, strict no-promo) ·
r/edtech · r/AIEducation · r/Internationalteachers · r/Professors · r/teaching. Full rules + tiers:
`targets/reddit-threads-and-rules.md`.
**FB groups:** 2ndary ELA, AP Lang/Lit, Creative HS English, The AI Classroom, ChatGPT for Teachers — full
list + ban-proof entry notes: `targets/facebook-and-influencers.md`.
**Expand reach:** use **Map of Reddit** (anvaka.github.io/map-of-reddit) to traverse from r/ELATeachers /
r/Teachers to adjacent untapped communities (writing-instruction, homeschool-ELA, tutoring, specific-state
teacher subs); add new finds to the subreddit list.

## Step 2 — Lurk and learn before you post
For each new community: read 1–2 weeks of top + new posts first. Note the **exact vocabulary** for the pain
(e.g., "I spend more time fixing the AI than grading," "it grades a 9th-grader like a college essay") and
feed it back into `MESSAGING.md` + ad copy. Read the **Rules tab / sidebar** and log the self-promo policy
before engaging. No posting until you know the room.

## Step 3 — Start in the comments, with a goal
Per community, pick ONE goal: discover pain · research alternatives · recruit beta/proof teachers · drive
trials. **Comment before you ever top-post** — it's the low-risk sandbox. The live drafts in
`reddit-engagement-queue.md` are all *comment* replies on existing threads, not top-level posts. Only
graduate to a top-level post once your comments consistently land.

## Step 4 — Real-time keyword alerts (F5bot)
Automate discovery so you catch threads at the moment of need:
1. Go to **f5bot.com**, enter Luke's email.
2. Add the Step-1 keywords (start with: `AI grading`, `grading essays`, `essay feedback`, `AI feedback teacher`,
   `grade essays faster`, `EssayGrader`, `CoGrader`, plus your brand `aiTA`).
3. F5bot emails you whenever any term appears on Reddit (and HN). Triage daily; add hot threads to the
   engagement queue. *(Free; one-time email setup. This is the durable replacement for scraping.)*
**Backup discovery:** the weekly Google searches below.

### Weekly Google search runbook (the block workaround)
Run these in any browser; harvest fresh thread URLs into the engagement queue:
- `site:reddit.com (r/Teachers OR r/ELATeachers) AI grading essays`
- `site:reddit.com teachers AI feedback "sounds robotic" OR "generic" grading`
- `site:reddit.com r/ELATeachers rubric grading burnout`
- `site:reddit.com "essay grader" OR EssayGrader OR CoGrader teacher review`

## Step 5 — Earn the right to pitch
Spend your first energy on **unconditional value** — answer questions, share workflows, give the rubric
template, with zero ask. Build a reputation as a helpful ELA/teaching peer, not a vendor. Only after that
do you *naturally* mention aiTA — and even then, lead with the workflow and disclose you build it. The
ladder:
1. Pure-value comments (no mention) → build karma + recognition.
2. Helpful comments where, *if asked* "what tool?", you disclose + share.
3. Eventually, an allowed value post (e.g., "Here's the AI feedback workflow that gave me my weekends back"
   + the free template) where the rules permit.
4. The **free-PD webinar** (`webinar-kit.md`) is the scaled version of "earn the right" for FB groups —
   you give a whole PD session before any mention.

## Compliance / don't-get-banned
- Never blind-drop links. Disclose you build aiTA whenever you name it. One value-first identity per platform.
- FB: never self-post to groups — proxy through teacher-users, or pitch admins the free webinar.
- Respect each sub's promo rule (logged in `targets/reddit-threads-and-rules.md`); when unsure, value-only.
- Posting stays manual + human (Luke's account). The agent drafts, sources, and tracks — it does not post.

## Founder-gated vs agent-done
**Founder:** posting/commenting from his account, lurking, the F5bot email confirm, the webinar.
**Agent-done:** sourcing live threads (via Google-index workaround), drafting every value-first reply,
maintaining the engagement queue, the keyword list, the search runbook, and the cadence.
