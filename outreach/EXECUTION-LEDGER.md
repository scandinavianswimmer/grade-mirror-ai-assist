# GTM Execution Ledger — aiTA

> Operates under `~/Desktop/AGENT_EXECUTION_OS.md`. Every item ends `executed` / `awaiting_approval` /
> `blocked` with evidence. Strategy: `../.planning/milestone-2-launch/XPRIZE-MASTER-PLAN.md`.

## Shipped (executed)

```yaml
id: aita-gtm-20260615-001
commitment: Build the agent-operated outreach engine (no paid email API).
owner: agent
status: executed
evidence:
  - outreach/personalize.mjs (Mail.app driver, dependency-free)
  - outreach/mailer.applescript (AppleScript draft/send)
  - run output: "10 drafts -> outreach/outbox/"; manifest at outreach/outbox/_manifest.json
```
```yaml
id: aita-gtm-20260615-002
commitment: Replace Resend with a credential-free sender.
owner: agent
status: executed
evidence:
  - Resend removed; delivery now via Mail.app account already on this Mac.
  - Verified live: draft created in Mail Drafts (osascript query returned the message).
```
```yaml
id: aita-gtm-20260615-003
commitment: Generate sourced target lists (FB/influencers, Reddit, PH, Cohort-B).
owner: agent (4 sub-agents)
status: executed
evidence:
  - docs/marketing/gtm/targets/{facebook-and-influencers,reddit-threads-and-rules,product-hunt-and-directories,cohort-b-teacher-sourcing}.md
```
```yaml
id: aita-gtm-20260615-004
commitment: Produce the GTM asset suite (messaging, trial copy, onboarding seq, recruiting kit, PH kit).
owner: agent
status: executed
evidence:
  - docs/marketing/MESSAGING.md; docs/marketing/gtm/trial-conversion-copy.md
  - outreach/trial-onboarding-sequence.md; docs/recruiting/RECRUITING-KIT.md
  - docs/marketing/gtm/product-hunt-launch-kit.md; .agents/product-marketing-context.md (reconciled)
```

## Shipped (executed) — continued

```yaml
id: aita-gtm-20260615-005
commitment: Send the Edutopia guest-post pitch.
owner: agent (approved by Luke "send Edutopia")
action: send_outbound_email
recipient: guestblog@edutopia.org
from: Luke Mladenoff <luke.mladenoff@gmail.com>
subject: 'Guest post pitch: "Let AI Draft the Feedback — But Keep the Red Pen"'
status: executed
evidence:
  - SENT via Mail.app (ok:send); verified present in Google / Sent Mail; not stuck in Outbox.
  - delivery.log.jsonl entry (mode:send). Leftover drafts cleaned up (2 deleted).
```
```yaml
id: aita-gtm-20260615-008
commitment: Build the complete, fileable OSF pre-registration + locked judge rubric.
owner: agent
status: executed
evidence:
  - docs/recruiting/osf-prereg.md (full OSF-template pre-reg; defensible defaults; honest small-N framing + kill criterion)
  - eval/convergence/judge-rubric.md (v1.0 LOCKED primary instrument, frozen judge prompt + calibration)
```

## Awaiting approval

```yaml
id: aita-gtm-20260615-009
commitment: File the OSF pre-registration (by Jul 7, 2026).
owner: human (Luke)
status: awaiting_approval
prepared_artifact: docs/recruiting/osf-prereg.md (paste-ready sections 1–7)
blockers_to_clear: lock [CONFIRM] values (final teacher count, N batches, IRB/exempt status); freeze judge model.
if_approved: create the OSF project, paste, file, keep the registration DOI/link for the XPRIZE submission.
```
```yaml
id: aita-gtm-20260615-006
commitment: Deliver the 9 manual-channel pitches (Cult of Pedagogy, Ditch That Textbook, Potash, Neibauer,
  Wexler, Brave New Teaching, Dan Fitzpatrick, 2ndary ELA admins, AP Lit admins).
owner: human or agent-via-browser
status: awaiting_approval
prepared_artifact: outreach/outbox/<id>.md (each has the exact draft + where to paste it)
if_approved: paste into each outlet's form/DM/Messenger — OR have the agent drive your logged-in browser per send.
note: never self-post to FB/Reddit; pitch admins / use value-first per the strategy.
```

## Blocked

```yaml
id: aita-gtm-20260615-007
commitment: Pull the live top-8 Reddit threads to answer.
status: blocked
blocker: reddit.com is blocked for WebSearch/WebFetch/curl in this environment; browser extension not connected.
workaround_taken: agent produced verified subreddit list + live-search runbook + reply bank instead (no fabricated links).
unblock: connect the Claude-in-Chrome extension (logged into Reddit) → agent pulls + drafts replies for the real threads.
```

## Metrics
- Prospects in registry: 10 (borrowed-channel) + Cohort-B templated for individual rows.
- Drafts rendered: 10 · Mail.app drafts created: 1 (Edutopia) · Sent: 0 (awaiting approval).
- Manual-channel drafts staged: 9 · Sub-agent target lists: 4.

## Next physical action
Run `--mail-drafts` across all email prospects as their addresses are added; meanwhile Luke approves/sends
the Edutopia draft. Agent's next build (on go): full OSF pre-reg draft, or the free-PD webinar kit.
