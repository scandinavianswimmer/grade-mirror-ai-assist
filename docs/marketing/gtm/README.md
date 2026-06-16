# aiTA GTM Execution Layer

> The agent-executable half of `../../../.planning/milestone-2-launch/XPRIZE-MASTER-PLAN.md`. Strategy
> lives there; **execution lives here**. Built 2026-06-15. Designed so an agent (me) operates it and the
> human surface shrinks to: provide a credential / press send / sign / show up.

## Map
| Asset | What it is | Status |
|---|---|---|
| `../MESSAGING.md` | Canonical message house (teacher vs judge, objections, proof points) | ✅ done |
| `../../../.agents/product-marketing-context.md` | Foundation doc, reconciled to the master plan | ✅ updated |
| `trial-conversion-copy.md` | Cohort-A landing/trial copy (the acquisition surface) | ✅ done |
| `targets/facebook-and-influencers.md` | 16 FB groups + 10 newsletters + 10 influencers, sourced | ✅ done |
| `targets/reddit-threads-and-rules.md` | 15 subreddits + rules + live-search runbook + reply bank | ✅ done |
| `targets/product-hunt-and-directories.md` | PH mechanics + directories + timeline | ✅ done |
| `targets/cohort-b-teacher-sourcing.md` | 18 channels to recruit proof teachers + DPA reality | ✅ done |
| `../../../outreach/` | **The engine** — prospects + templates + send script + drafts | ✅ runs |
| `../../../outreach/trial-onboarding-sequence.md` | Owned-channel nurture (signup → paid) | ✅ done |
| `../../recruiting/RECRUITING-KIT.md` | Cohort-B operating playbook (sourcing → DPA → sprint) | ✅ done |
| `product-hunt-launch-kit.md` | Full PH listing, first comment, gallery, comment bank, timeline | ✅ done (fires Wk6) |
| `webinar-kit.md` | Free-PD webinar (deck, run-of-show, landing, promo) — #1 ban-proof FB motion | ✅ done |
| `xprize-video-and-narrative.md` | <3-min demo video script + ~700w judge narrative | ✅ done |
| `../../recruiting/osf-prereg.md` | Complete fileable OSF pre-registration (file by Jul 7) | ✅ done |
| `../../../eval/convergence/judge-rubric.md` | v1.0 LOCKED GPT-judge voice-fidelity instrument | ✅ done |

## How it's operated (agent vs human)
**The agent does:** find targets, write + personalize every message, generate drafts (`outreach/outbox/`),
sequence + track, draft launch assets, draft the OSF/compliance docs. All done above; re-runnable.

**The single human gate (by design, not omission):**
1. **Cold email** → drop a `RESEND_API_KEY` + `OUTREACH_FROM` and the agent sends + logs it end-to-end.
2. **Reddit / FB / Product Hunt** → posts are identity-bound AND these platforms ban automated promo, so
   the agent stages the exact post; a human (you, or a teacher-user proxy) taps send. Auto-posting here
   would get the account banned and violates the value-first strategy. The agent can drive your
   logged-in browser per-post if you'd rather approve than paste.
3. **DPA signatures, teacher calls, OSF filing, the demo video** → irreducibly yours.

## Run the engine
```bash
node outreach/personalize.mjs                 # regenerate all drafts (no creds)
# send the email-channel prospects:
RESEND_API_KEY=… OUTREACH_FROM="Luke <luke@aita.app>" node outreach/personalize.mjs --send
```

## What I'd do next (all agent-doable, on your go)
- **Reddit value-post replies** for the top-8 threads — BLOCKED on the Chrome extension (connect it logged
  into Reddit → I pull the live threads + draft replies). Same unblock delivers the 9 staged manual pitches.
- Expand `prospects.json` with individual teachers as lists are built; draft the **referral-loop** in-app copy.
- A **60-second cut-down** of the XPRIZE video (teaser) from `xprize-video-and-narrative.md`.
- Full **slide copy** for the webinar deck (outline is in `webinar-kit.md`).

✅ Done since first pass: OSF pre-reg + judge rubric · free-PD webinar kit · XPRIZE video script + judge
narrative · Edutopia pitch sent.
