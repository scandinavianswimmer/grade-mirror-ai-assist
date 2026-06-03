# STATE — aiTA Production Milestone 1

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-22)

**Core value:** The grade must be valid and trustworthy — rubric-aligned, teacher-calibrated, never awarded to off-assignment work.
**Current focus (2026-06-03):** X-Prize deadline has passed — pivoted from "polish the demo for recording" to **"continue building toward production launch."** The **complete production build is now on `main`** (PR #2 merged the production branch; PR #3 folded in 31 stranded commits — the full security-hardening pass + grading fixes + demo seed that had never been pushed; PR #4 landed two reliability-optics fixes). Remaining high-value work is mostly **founder-config gated** (DB password for migrations 0015/0016, `gemini-2.5-pro` billing, OAuth bootstrap migration, secret rotation, a frontend host). **Read `.planning/continue.md` for the exact pick-up point.**

## Milestone

- **production-1** — the full production grading system (no MVP/demo). 7 phases (see ROADMAP.md).

## Status

| Phase | Status |
|-------|--------|
| 1. Data foundation & isolation | ▶ next |
| 2. Trustworthy grading core | pending |
| 3. Human-in-the-loop review | pending |
| 4. Evaluation harness | pending |
| 5. Onboarding, classes & samples | pending |
| 6. Teacher-style learning loop | pending |
| 7. Privacy, isolation hardening & launch | pending |

## Live facts (verified through 2026-05-29)

- App: `npm run dev` → :8080 (background, intentional). Browser automation via chrome-devtools MCP.
- Cloud project: `yhdobsmmhdvqswjpousc`. Migrations 0003-0014 applied. `grade-submission` deployed with `--no-verify-jwt`.
- **Grading mechanics verified live:** off-topic withheld (oil-change → 0/100 + `off_topic`), HITL accept/edit/dismiss persist, agent-pipeline trace renders, strong essay → 100/100, Metrics dashboard renders. Style profile injection works — Sofia Reyes graded in Sarah's voice this session.
- **Sarah Martinez demo account live in cloud** (rebranded test teacher, login `test.teacher@school.edu`, id `b1a916bb-21fa-4cfd-9959-ce737a5cf465`): 6 classes, 10 assignments, 14 student essays, Sarah's voice profile + consent + 10 training samples. Sofia = `graded`; the other 13 = `uploaded`. Reproducible via `scripts/seed-demo-sarah-martinez.sql`; demo runbook at `docs/DEMO-SARAH-MARTINEZ.md`.
- Grading is **on `gemini-2.5-flash`** (pro quota = 0). Flash free quota on the primary key exhausted — **resolved 2026-05-30 via key rotation:** `call()` now rotates through a pool (`GEMINI_API_KEY` + `GEMINI_API_KEYS`) on 429/RESOURCE_EXHAUSTED. Two fresh flash keys added to `GEMINI_API_KEYS`. Pro billing is now optional (quality upgrade), not a blocker.
- **Three changes committed but NOT deployed:** `56ee14b` (synth truncation → assignment-specific criteria), `9023e54` (no dup notes on re-grade), `7e26109` (Gemini key rotation). All ship with one `grade-submission --no-verify-jwt` deploy. Deploy gated on `--no-verify-jwt` perm.
- Old test-data coexists under the Sarah account (Luke class / two "English" classes / Unassigned, incl. the verified oil-change + Stanley artifacts) — not deleted; user decision.

## Merge to main + reliability fixes (2026-06-03)

- **Full production build merged to `main`.** PR #2 merged an earlier remote snapshot; **31 commits were stranded on the local-only `aita-production-build` branch and never pushed** (the entire security-hardening pass, grading fixes — rubric persistence / annotation dedup / Gemini key rotation / synth calibration — AgentPipeline refetch, bulk-grade button, Sarah demo seed). Pushed the branch and folded them in via **PR #3**. `main` now = the complete build.
- **Reliability-optics fixes (PR #4, punch-list HIGH #2 + #4):** (a) stale `grade_error` no longer shows "Grading failed" over a valid grade — `effectiveStatus()`/`hasStaleGradingError()` added to `submissionStatus.ts`, reconcile when a grade exists, **`needs_review` withholding preserved**; SubmissionDetail shows a calm "last attempt didn't finish" note; AssignmentDetail rows learn `hasGrade`. (b) turnaround metric is now **median with >168h outlier exclusion** (kills "2685 hrs"; "—" when all data stale). Frontend-only; takes effect on next `npm run dev`/build — no edge deploy.
- **Gotcha:** RTK proxy caches git read output — `git log`/`rev-parse`/`status` can return stale results mid-session. Use `rtk proxy git <cmd>` to bypass the cache when verifying git state. Direct `git push origin main` is **denied** by the auto-mode classifier (PR-merge authorized, not direct pushes) — push a branch + `gh pr merge`.

## Security hardening (2026-05-30)

Full-lockdown pass done. Live-DB probes confirmed **v2 migrations are applied in prod** → the
audit's CRITICAL/HIGH RLS findings (public buckets, log-table leaks) were already fixed live.
Genuine gaps were code-level and are now fixed on `aita-production-build` (commits a66ff72→0cb3376):
rate-limit Layers A/B/C/D (kills the API-key-drain DoS), `generate-podcast` auth hole, send-time
de-identification before Gemini, right-to-erasure (`delete-data`) + retention storage cleanup,
config drift, constant-time cron compare. Full writeup: `.planning/security/REMEDIATION.md`.

## Open dependencies on the user

- ✅ **DONE 2026-05-30: deployed** all changed functions to prod (grade-submission, grade-enqueue,
  generate-podcast, privacy-tasks, build-style-profile, delete-data + others). Ships the demo grading
  fixes (synth/dedup/key-rotation) AND the full security pass. (esm.sh 522s during deploy were
  transient CDN errors, cleared by retry.)
- **Apply migrations** `0015_grading_quota_rpc.sql` + `0016_rls_force_and_comments.sql` (DB password;
  same path as 0002–0014). Quota gate fails open until 0015 lands, so grading/demo isn't blocked. Not urgent.
- _(Optional)_ deploy stripe-* to pick up the new config.toml verify_jwt declarations (not demo-relevant).
- _(Optional)_ `GEMINI_GLOBAL_QPM` secret to tune the global ceiling (default 60/min). Confirm Upstash secrets set or Layer B no-ops.
- _(Optional)_ **Enable `gemini-2.5-pro` billing** — quality upgrade; flash key rotation already unblocks grading.
- Secret rotation (DB password + exposed `sk_live_` key) before any public hosting.
- Domain + frontend host (free subdomain agreed as launch path).
- Optional later: Upstash + Cloud Run worker (bulk grading), Stripe live config, OAuth bootstrap migration apply.

## Active focus (2026-06-03): Milestone 2 — prove-the-wedge

Pivoted from production-1 breadth to the ONE defensible wedge from the competitive research: **voice-convergence**. **Phase 15 (Voice-Convergence Proof) is PLANNED** at `.planning/phase-15-voice-convergence-proof/` (CONTEXT + PLAN, manual GSD). 30-day goal: falsifiable proof aiTA learns a teacher's feedback voice ("I barely had to edit this") — instrument edit-rate/edit-distance per batch, upgrade the Phase-9 prose-blurb reinforce to a binary-signal few-shot loop, run a ≥4-batch real-teacher experiment, write an honest go/no-go verdict (kill criterion: <15% edit-rate decline → wedge disproven). Next: execute Phase 15 Wave 1 (instrumentation). Founder actions: apply migration 0017, deploy changed fns, recruit the test teacher.

## Next step

Code-doable punch-list items are largely exhausted (HIGH #2/#4 done; #3 style-loop proven live for Sofia; #5 live eval run needs `GEMINI_API_KEY` locally). The next production-launch increments are **founder-config gated** — pick from: apply migrations `0015`/`0016` (DB password), enable `gemini-2.5-pro` billing, apply the OAuth bootstrap migration, rotate exposed secrets, host the frontend on a free subdomain. Each unblocks a corresponding agent task. Otherwise: deepen test coverage (no test runner yet — Phase 10 eval harness is the grading-quality story), or a FERPA-aware copy audit (punch-list MEDIUM #11).

---
*Last updated: 2026-06-03 — merged full build to main + reliability fixes; X-Prize behind us, building toward launch*
