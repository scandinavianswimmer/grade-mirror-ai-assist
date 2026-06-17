---
milestone: 2-launch-prove-compete
phase: A
name: trust-live
status: planned
created: 2026-06-08
gate: true
---

# Phase A — Trust Live (the gate before anything public)

**Goal (goal-backward anchor):** the grading product is *trustworthy in production* — a real teacher can grade a real
submission through the live app and get a correct, rubric-aligned grade (not a weak essay at 100/100, not a real essay
marked off-topic). Nothing — no launch, no design-partner onboarding (Phase B), no XPRIZE evidence — is valid until
this holds. This phase exists because **the trust bug is LIVE in prod right now** and the fix is built but undeployed.

## must_haves
- [ ] **M1** — `grade-submission` (the PR #13 grading-context + relevance-thinkingBudget fix) is **deployed** to the cloud Supabase project. F-001/F-002 no longer reproduce on an **app-created** assignment.
- [ ] **M2** — **One real end-to-end grade is validated**: an assignment created *through the app UI* (not seed data), with a real essay, grades against the teacher's real prompt + rubric — verified live in the browser.
- [ ] **M3** — The launch branch (`aita-launch-prep`) is **merged + pushed** to `origin/main` (kills the single-point-of-failure: the entire launch build is currently one local branch).
- [ ] **M4** — Migration `0015_grading_quota_rpc.sql` is **applied** to cloud → `enforceGradingQuota` actually enforces (the paywall stops failing open / uncapped free grading).

## threat_model / risk
- Deploying the wrong/stale function version, or deploying with `--no-verify-jwt` incorrectly. Mitigate: deploy from the merged `main` after the branch lands; confirm the deployed version greps the new `assignment-context` code path.
- Merging concurrent work: a **parallel QA agent** is editing `App.tsx`/`TypewriterText`/`index.css` uncommitted. Do NOT `git add -A` / `stash` / `reset` on the shared tree. Coordinate the merge so neither agent's work is lost.
- Applying migrations out of order, or applying `0001_baseline.sql`, will break the live (v1-derived) DB. Apply only `0015` here.

---

## Task A1 — Deploy the grading-trust fix · autonomous: **false** (deploy-gated, founder)
<action>
Deploy the launch-branch `grade-submission` function (contains the F-001/F-002 assignment-context fix + the relevance
`thinkingBudget:0` fix) to the cloud Supabase project: `supabase functions deploy grade-submission`. This is the single
highest-impact action in the milestone — it flips the live grading from "scores weak essays 100/100" to correct.
Also deploy `generate-grading-feedback` (the prior freemium F-001 fix) while at it.
</action>
<acceptance_criteria>
- The deployed `grade-submission` reads `assignments.description` / `rubric_text` (not just `instructions`) — i.e. the
  `_shared/grading/assignment-context.ts` path is live.
- Re-grading a previously-broken Sleuth submission (`Mateo_Proficient_Rhetoric`, `Noah_Weak_Gatsby`) no longer mis-scores.
</acceptance_criteria>
<founder_note>Agent cannot deploy (permission-gated). Founder runs the deploy; agent verifies the result (A2).</founder_note>

## Task A2 — Validate one real end-to-end grade (the never-done test) · autonomous: **true** (after A1)
<action>
In the live app (chrome-devtools, logged-in teacher): **create an assignment through the UI** (real prompt + rubric via
`/create-assignment`), upload a real essay, grade it, and confirm — via the rendered grade + the `submission_grades` row +
the `agent_events` trace — that it grades against the teacher's real prompt/rubric, relevance gate runs (status `ok`, not
`error/failed-open`), evidence verifies, and the score is sane. This closes the BRIEFING's "never integration-validated"
gap and proves A1 worked end-to-end.
</action>
<read_first>
- `BUG_REPORT_GRADING.md` (GR-001/GR-003 — the exact bugs being closed)
- `supabase/functions/grade-submission/index.ts` (the path under test)
</read_first>
<acceptance_criteria>
- A fresh, app-created assignment grades correctly (no false off-topic, no 100/100-from-nothing).
- `agent_events` shows `relevance_risk: ok` (the fail-open is gone) and `rubric.source` reflects the teacher's rubric.
- Result documented in `BUG_REPORT_GRADING.md` (GR-001/GR-003 → resolved).
</acceptance_criteria>

## Task A3 — Merge + push the launch branch · autonomous: **true** (coordinate)
<action>
Land `aita-launch-prep` on `origin/main` (it carries PR #13 + all launch work + the Billing QA fix). Open a PR and merge
via the PR flow (direct push to main is denied). **Coordinate with the parallel QA agent** — ensure its in-flight fixes
(App.tsx/TypewriterText/index.css) are committed first or explicitly folded in; never sweep uncommitted work. Also fix
or at least triage the 45 `tsc` errors enough that `tsc` can become a real gate (regen Supabase types for `grading_batches`).
</action>
<acceptance_criteria>
- `origin/main` contains the launch build + the grading fix (single-point-of-failure gone).
- No parallel-agent work lost in the merge.
- `npm run build` green on `main`; `npm test` green; tsc error count reduced + documented.
</acceptance_criteria>

## Task A4 — Apply the paywall-enforcing migration · autonomous: **false** (DB pw, founder)
<action>
Apply `supabase/migrations_v2/0015_grading_quota_rpc.sql` (and `0019` monthly caps if present) to the cloud DB via psql
(session pooler). Until applied, `enforceGradingQuota` fails open → free tier is uncapped (cost/abuse exposure). Optionally
apply `0017`/`0018` here too (un-inert the Metrics convergence panel). Document the apply commands; never include credentials.
</action>
<acceptance_criteria>
- `enforceGradingQuota` enforces the free cap (verify: a free teacher hitting the cap is blocked / sees the paywall).
- (If applied) `/metrics` convergence panel queries stop 404/400ing.
</acceptance_criteria>

---

## Verification (phase-level)
- **Goal-backward:** can a real teacher create an assignment in the app and get a correct grade, live? (M1+M2 are the gate.)
- **Trust:** the History page no longer accrues new 100/100-on-weak or false-off-topic grades after the deploy.
- **Durability:** the launch build is on `origin/main` (not one laptop).
- **Paywall:** free grading is actually capped (M4).

## Founder actions (cannot be agent-done)
- **A1:** `supabase functions deploy grade-submission generate-grading-feedback` (deploy-gated). **← highest impact.**
- **A4:** apply migration `0015` (+ optionally `0017`/`0018`) via psql (DB password).
- Rotate the secrets shared in chat (DB pw, Stripe `sk_live_`, Gemini key) before any public traffic.

## Exit → Phase B
Once A1+A2 prove trust is live, Phase B (prove the moat) can safely put real design-partner teachers on the product.
That is the summer centerpiece and the XPRIZE "real users" + the moat proof.

## Notes
- Manual-driven GSD (no gsd-sdk), matching `phase-15-voice-convergence-proof/` convention.
- Companion: `.planning/LAUNCH-PLAN.md` (addendum 2026-06-08 PM = locked decisions), `BUG_REPORT_GRADING.md` (the live bugs).
