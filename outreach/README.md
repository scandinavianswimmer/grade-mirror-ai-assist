# aiTA Outreach System

A small machine that turns the researched target lists into sent outreach. Built so an **agent operates
it** end-to-end. **No paid email API** — it drives **Mail.app via AppleScript** using the account already
configured on this Mac (your real identity + deliverability). Pulls voice from
`../docs/marketing/MESSAGING.md`; targets from `../docs/marketing/gtm/targets/`. Operates under
`~/Desktop/AGENT_EXECUTION_OS.md` (execute → evidence; see `EXECUTION-LEDGER.md`).

## Files
- `prospects.json` — the registry. Each row has a `channel` that decides how it's sent.
- `templates/*.md` — message templates (`Subject:` line + body, `{{vars}}` placeholders).
- `personalize.mjs` — renders per-prospect drafts; creates Mail.app drafts / sends for `channel:"email"`.
- `mailer.applescript` — the Mail.app driver (draft or send). No API key.
- `outbox/` — rendered `.md` drafts, optional `.eml`, + `_manifest.json` (regenerated each run).
- `delivery.log.jsonl` — append-only log of every Mail.app draft/send.

## Channels → how they send
| channel | auto-delivered? | what happens |
|---|---|---|
| `email` | ✅ Mail.app **draft** by default (`--mail-drafts`); **send** with `--mail-send` | draft lands in your Drafts, one click from send |
| `form` | ❌ | paste the rendered draft into the outlet's contact form |
| `dm` | ❌ | send the draft as a DM |
| `fb` | ❌ | Messenger to the group admin — **never self-post** (ban + against strategy) |
| `exhibitor` | ❌ | paid/structured (e.g., NCTE booth) |

Non-email channels are manual **by design**: Reddit/FB/PH ban automated promo, and the strategy
(`XPRIZE-MASTER-PLAN.md`) is value-first / proxy / webinar — auto-blasting would nuke the account. The
script still does all the work *up to* the send (research, personalization, the exact draft + where to
paste it).

## Run it
```bash
# Dry run — render every draft to outbox/ (needs nothing).
node outreach/personalize.mjs

# EXECUTE: create real Mail.app drafts for the email prospects (reversible; sits in your Drafts).
OUTREACH_FROM="Luke Mladenoff <luke.mladenoff@gmail.com>" \
OUTREACH_SENDER_NAME="Luke Mladenoff" OUTREACH_SENDER_EMAIL="luke.mladenoff@gmail.com" \
  node outreach/personalize.mjs --mail-drafts --eml

# One prospect only
node outreach/personalize.mjs --mail-drafts --only=edutopia-guestblog

# SEND for real via Mail.app (approval-gated — only on explicit go)
OUTREACH_FROM="Luke Mladenoff <luke.mladenoff@gmail.com>" node outreach/personalize.mjs --mail-send
```

## The human gate (now tiny)
Email no longer needs a credential — it drafts straight into Mail.app off your existing account. So the
gate is just:
1. **Review the Drafts and hit send** (or run `--mail-send` once you say go — that's standing approval).
2. **Reddit/FB/PH** posts: identity-bound + automation-banned by those platforms, so you tap send (or the
   agent drives your logged-in browser per-post with approval).

Everything else — finding targets, writing/personalizing, drafting into Mail, sequencing, tracking — is
automated. To scale individual-teacher cold email, add rows to `prospects.json` (set `related_party:true`
on anyone in the founder network so the revenue count stays arms-length), then re-run `--mail-drafts`.

## Alternative delivery paths (if you prefer)
- **`.eml` files** (`--eml`): double-click any `outbox/*.eml` to open it in Mail.app pre-filled, ready to send.
- **Browser-driven Gmail**: the agent can compose+send in your logged-in Gmail via the Chrome tools (per-send approval).
- **SMTP/app-password**: a ~10-line swap in `personalize.mjs` if you ever want headless bulk send.
