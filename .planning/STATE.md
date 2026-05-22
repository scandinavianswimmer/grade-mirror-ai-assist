# STATE — aiTA Production Milestone 1

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-22)

**Core value:** The grade must be valid and trustworthy — rubric-aligned, teacher-calibrated, never awarded to off-assignment work.
**Current focus:** Phase 1 — Data foundation & isolation

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

## Live facts (verified 2026-05-22)

- App runs: `npm run dev` → :8080 (system Node 23; nvm Node-20 alias not installed). Browser automation works via chrome-devtools MCP (playwright MCP SIGTRAPs).
- Cloud project: `yhdobsmmhdvqswjpousc`. Live grading works (function 200), but accuracy is broken (off-topic → 100/100) and annotations are blocked by unapplied migrations `0003–0011` (`annotations.ai_comment` missing).
- Grading currently runs on `gemini-2.5-flash` (primary `gemini-2.5-pro` not used — investigate in Phase 2).
- Test artifacts in cloud: submissions `aita_unrelated` + `aita_injection` on Holes assignment `a228def0` (deletable).

## Open dependencies on the user

- DB password to apply migrations (Phase 1) — `GO-LIVE-RUNBOOK.md` §2; run in own terminal (don't echo password to chat).
- Secret rotation (Phase 7).

## Next step

`/gsd:plan-phase 1` — or aiTA plans Phase 1 directly (Data foundation & isolation).

---
*Last updated: 2026-05-22 after initialization*
