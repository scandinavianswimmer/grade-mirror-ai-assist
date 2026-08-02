# Mr Selby — release handoff

> Product: **Mr Selby** (formerly aiTA / Grade Mirror), a teacher-controlled grading co-pilot.
> Last verified: **August 1, 2026**.
> Competition gate: [`docs/launch/XPRIZE-SUBMISSION.md`](docs/launch/XPRIZE-SUBMISSION.md).
> Protected-product activation: [`docs/GO-LIVE-RUNBOOK.md`](docs/GO-LIVE-RUNBOOK.md).

## Recorded public baseline

- Branch: `codex/xprize-submission-sprint-20260801`
- Draft PR: [#30](https://github.com/scandinavianswimmer/grade-mirror-ai-assist/pull/30)
- Baseline commit: [`028c0c75873e3da0929c40afa446eceb80231402`](https://github.com/scandinavianswimmer/grade-mirror-ai-assist/commit/028c0c75873e3da0929c40afa446eceb80231402)
- Cloudflare Worker: `mr-selby`
- Worker version: `4740b352-418a-46b6-bbda-f21ba30fa296`
- Remote quality gate: [GitHub Actions run 30727576006](https://github.com/scandinavianswimmer/grade-mirror-ai-assist/actions/runs/30727576006)

The baseline remote gate passed lint, both TypeScript projects, **25 test files / 249 tests**, the production build, deterministic eval dry runs, and the false-auto-finalize calibration gate. The current candidate passes **26 test files / 256 tests** locally and a frozen Deno check of all 16 Edge Functions. Record its immutable commit, Worker version, and remote CI run in the private evidence manifest after deployment; do not try to embed a commit's own identity in that commit.

## What is live

[mrselby.app](https://mrselby.app) serves a safe, public-only Cloudflare Workers build:

- the product overview at `/`;
- polished Privacy and Terms launch previews;
- a guarded setup state for account routes;
- `robots.txt`, `sitemap.xml`, `llms.txt`, brand marks, and the social image;
- permanent HTTP-to-HTTPS and `www`-to-apex redirects with path and query preservation;
- HSTS, CSP, frame, content-type, referrer, and permissions headers; and
- self-hosted brand fonts, without Supabase, PostHog, authentication, or classroom-data code in the public-preview bundle.

This is a verified public site. It is **not** a working judge account or a verified production grading service.

## What remains closed

No approved Mr Selby Supabase project is connected. The protected build therefore remains intentionally unavailable and accepts no accounts, passwords, classes, rubrics, or student work.

Do not treat historical project identifiers, old CLI links, backup locations, test accounts, or prior claims of deployed functions as current instructions. Before any backend creation or spend:

1. confirm the intended Supabase organization;
2. retrieve and report the exact creation cost;
3. obtain explicit cost approval;
4. provision a fresh, isolated project rather than reusing another application's backend; and
5. record the approved project reference privately before linking, migrating, or deploying.

After provisioning, the release still needs a reviewed schema plan, an explicit Edge Function runtime manifest, secret and redirect configuration, and the full acceptance journey in [`docs/GO-LIVE-RUNBOOK.md`](docs/GO-LIVE-RUNBOOK.md).

## Current blockers

1. **Backend approval:** organization and cost approval for a fresh Supabase project.
2. **Protected deployment:** reviewed schema, required Edge Functions, Gemini/Google Cloud path, secrets, auth redirects, and Cloudflare rebuild with the public client configuration.
3. **Judge acceptance:** fresh signup/sign-in, emailed password recovery, synthetic upload, on-topic grading, off-topic withholding, persisted teacher edits, account deletion, and redacted production traces.
4. **Repository license:** the public repository has no `LICENSE`; the owner must choose relevant licensing or use the contest's private-repository sharing path.
5. **Historical credential alert:** GitHub secret scanning found one open historical Google API-key alert in commit `ef9b808`. The current `.env.example` value is empty, but the owner must still verify the historical key, restrict or revoke it if active, and record the alert's final disposition without reproducing the value.
6. **Submission evidence:** private organizer ruling, exact release record, real or explicit-zero users/revenue, complete expenses, judge instructions, captioned video under three minutes, and the final narrative.

## Evidence already established

- The founder confirmed written organizer approval on August 1, 2026. Preserve the complete ruling privately and follow every condition.
- The current public-preview release is deployed and reachable over HTTPS.
- Public routes, canonical metadata, redirects, security headers, console health, responsive layout, and primary overview interactions were verified against the live domain.
- Password recovery, accessible route focus, legal previews, recursive storage erasure, and retention behavior are implemented and covered locally; their live backend journeys remain open.
- A local Safari beta pass covered VoiceOver, exact 200% zoom, Increase Contrast, keyboard/dialog focus, and narrow-screen reflow. Repeat the relevant checks against the final protected release.
- GitHub secret scanning and push protection are enabled. One historical Google API-key alert remains open for owner verification and, if necessary, restriction or revocation.
- The current React Router advisory affects unstable React Server Component APIs; this Vite `BrowserRouter` SPA does not use those packages or APIs. Continue tracking the advisory for a compatible patched release.

## Historical provenance — not current deployment evidence

The repository and earlier product names predate the competition window. Historical May 2026 notes described an older restored database, additive migrations, test accounts, and deployed grading functions. Those records explain the code's evolution, but the recorded backend endpoints are now unavailable or unapproved and their data state has not been reverified.

Keep the history for auditability. Do not copy its account details, connection strings, migration assumptions, or “live” claims into a new deployment. A fresh project must be evaluated from its actual schema rather than treated as the historical restored environment.

## Safe current commands

```sh
nvm use
npm ci
npm run verify
npm run cloudflare:dry-run

curl -I https://mrselby.app/
curl -I http://mrselby.app/privacy
curl -I https://www.mrselby.app/terms
npx wrangler deployments list --name mr-selby --json
```

Supabase mutation commands are intentionally absent until the organization, cost, project reference, and schema path are explicitly approved.
