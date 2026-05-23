# Continue — aiTA production build

> Note: this project's GSD was driven manually (no `gsd-sdk` CLI installed — `gsd-pi` v2.80.0 is the installed tool but uses a different interface). Planning artifacts live in `.planning/` (PROJECT.md, ROADMAP.md, REQUIREMENTS.md, STATE.md), NOT `.gsd/`. Work is on branch **`aita-production-build`** (PR **#2** → main). Cloud Supabase ref: `yhdobsmmhdvqswjpousc`.

## Last action (2026-05-23, verify session)
Ran a **full E2E live verify** in-browser (chrome-devtools MCP) against cloud. Confirmed working live: off-topic gate (oil-change → **0/100 + off_topic + needs_review**), inline annotations, **HITL Accept persists across reload** (DB `status:accepted` + green UI state — the a11y tree doesn't expose the selected-button style, verify visually), agent-pipeline trace, strong essay → 100/100, Metrics dashboard. Found + **fixed two grading bugs** (committed, NOT yet deployed):
- `56ee14b` — rubric synthesis truncated: ran on flash w/ 2048 tokens + default thinking → thinking ate the budget → empty JSON → silent free-text fallback. Added `thinkingBudget` to `geminiGenerateJSON`; synth now `thinkingBudget:0` + 4096 tokens.
- `9023e54` — **duplicate annotations on re-grade**: `grade-submission` inserted a new annotation set without clearing the old one (saw 9 near-dup praise notes on the Stanley essay). Now deletes prior annotations (+ their edits, edits-first for v1-schema safety) before inserting. Best-effort/non-fatal.

Both fixes are in `grade-submission`'s path → **redeploy `grade-submission` to activate them.** Working tree clean (branch 55 ahead of main).

### Open observations from the verify (not yet fixed)
- **Stanley essay shows "Grading failed" with a full 100/100 grade visible** — a *failed* re-grade set `status=grade_error` (index.ts:194) but the earlier grade row still displays (read is `created_at.desc limit 1`). Resolves once re-graded successfully on the deployed fixes; deeper fix = don't show a stale grade under `grade_error`.
- **Generic Clarity/Accuracy/Depth criteria** instead of assignment-specific — the synth free-text fallback (the `56ee14b` target). Re-grade after deploy to confirm assignment-specific criteria now appear.
- **Metrics "Feedback turnaround 2685.0 hrs"** — stale test data (2025 uploads, 2026 grades). Cosmetic; fresh demo data reads as minutes.
- **`ensureUserProfile` 403** still firing in browser console (OAuth bootstrap migration `supabase/migrations/20260522000000_oauth_profile_bootstrap.sql` unapplied) — apply before relying on Google sign-in.
- **`gemini-2.5-pro` still quota=0** (trace: pro 264ms 429-fail → flash fallback). Enable Google billing for pro.

### Deploy is blocked for the agent
`supabase functions deploy grade-submission --no-verify-jwt` was **denied by the auto-mode classifier** (the `--no-verify-jwt` flag weakens auth; "deploy" didn't cover it). The fn is already live with that flag from a prior session. To ship the two fixes: user runs `supabase functions deploy grade-submission --no-verify-jwt`, or adds a `Bash(supabase functions deploy:*)` permission rule.

## Earlier action
Added the bulk **"Grade all ungraded"** button to `src/pages/AssignmentDetail.tsx` (calls the deployed `grade-enqueue` fn). Build green, committed (`f34fa16`).

## State (verified live this session)
- **Core grading fix WORKS in prod**: off-topic motor-oil submission scores **0/100 + `off_topic`** (was 100/100). HITL annotations render + Accept/Edit/Dismiss work. Agent-pipeline ("AI workflow") card shows the named-agent trace.
- **Migrations `0003–0014` applied to cloud** (clean). v2 schema live.
- **Deployed edge fns**: `grade-submission`, `grade-enqueue`, `stripe-checkout`, `stripe-portal`, `stripe-webhook` (`--no-verify-jwt`).
- **Secret set**: `STRIPE_SECRET_KEY` (a `sk_live_` key — flagged for rotation).
- All 14 roadmap phases are code-complete (see `.planning/ROADMAP.md`).

## Next action
No agent code work is blocked-open. The remaining steps are **user config** (cannot be done by the agent — accounts/keys/domain):
1. Stripe: `supabase secrets set STRIPE_PRICE_PRO=price_… STRIPE_WEBHOOK_SECRET=whsec_… APP_URL=https://<domain>` + register the webhook endpoint `…/functions/v1/stripe-webhook` in Stripe.
2. Async queue: provision **Upstash Redis** + deploy the Cloud Run **`worker/`** + set `UPSTASH_REDIS_REST_URL`/`_TOKEN` + `INTERNAL_GRADE_SECRET` (see `worker/README.md`). Until then `grade-enqueue` returns 503 (handled gracefully in UI).
3. Domain + host the frontend; rotate exposed secrets (DB password + `sk_live_` key, both pasted in chat).

If the user wants more *agent* work, the one concrete investigation is below.

## Open threads (agent-doable, not blocking)
- **Rubric synthesis fell back to free-text** on the live grade (logged). The synthesis Gemini call (`_shared/grading/rubric-synth.ts`, model `gemini-2.5-flash`) failed → graceful free-text fallback. Investigate: re-grade a no-rubric submission, inspect the `rubric` agent step + function logs (Supabase dashboard) for the synthesis error. Likely cause: cloud Gemini key quota, or the nested `SYNTH_SCHEMA` (fullMarks/noMarks) tripping `toGeminiSchema`.
- **`gemini-2.5-pro` quota = 0** on the cloud key → grading runs on `flash` (visible in the agent-pipeline trace: pro tried, 264ms 429-fail, then flash). Enable billing on the Google project for pro.
- Auth `users` upsert returns 403 in browser (the OAuth-bootstrap migration `supabase/migrations/20260522000000_oauth_profile_bootstrap.sql` isn't applied — only `migrations_v2/` were). Apply it if Google OAuth / profile bootstrap is needed.

## Do not
- Do NOT apply `supabase/migrations_v2/0001_baseline.sql` to cloud — it's a clean-room reference; the cloud is the evolved v1+v2 schema. Only `0002` (pre-applied) + `0003–0014` (applied this session) belong on cloud.
- Do NOT remove the v1-graceful degradation in `grade-submission` (conditional `user_id` select, v1-safe assignment load, resilient grade insert) — the cloud schema is v1-origin; these prevent regressions.
- Do NOT commit any secret (Stripe key, DB password, Gemini key) — they go to `supabase secrets set` only.
- The agent CANNOT self-grant deploy permission or run cloud deploys unless the user's `Bash(supabase functions deploy:*)` settings rule is present (it is, this session).

## Running process
- Vite dev server on **:8080** (background). Leave it; user uses it for browser verification. Restart: `npm run dev` (system Node 23; `nvm` Node-20 alias not installed).
