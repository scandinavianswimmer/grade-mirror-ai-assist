# aiTA — QA Findings: Authenticated Grading Surface

**Companion to `BUG_REPORT.md`.** That file (parallel Playwright agent) covers the **unauthenticated** surface (auth/pitch/pricing/404/security/deps). This file covers the **authenticated grading product** — exercised live, logged in as `test.teacher` via chrome-devtools, 2026-06-08, branch `aita-launch-prep`. Minimal overlap with the other report.

**Headline:** the grading-trust bugs (F-001/F-002) are **live in production** because the PR #13 fix is **not deployed**. For a grading product, that's the #1 launch blocker.

---

## CRITICAL / HIGH

### GR-001 — F-001/F-002 grading-trust bugs are LIVE in production — CRITICAL [LIVE]
Confirmed from real graded data on `/history` (cloud backend):
- **F-002:** `Noah_Weak_Gatsby` → **100/100**, `Bianca_Strong_Gatsby` → 100/100 (weak essays, full marks).
- **F-001:** `Mateo_Proficient_Rhetoric` → 30/100 **"off topic"**, `Devon_Weak_Rhetoric` → 20/100 "off topic" (real MLK essays falsely flagged off-topic).
- **Root cause:** `grade-submission` reads `assignments.instructions` + canonical `rubrics` tables, but the create-assignment UI writes `description` + `rubric_text` → grader sees title-only context. (Full analysis: the PR #13 commit `4274336` on this branch.)
- **Why still live:** the fix is committed on `aita-launch-prep` but **not deployed** to the Supabase project. The cloud function is the old buggy version.
- **Fix:** `supabase functions deploy grade-submission` (founder/deploy-gated). Code fix already done (PR #13).

### GR-002 — Grade non-determinism despite temperature 0 — HIGH [LIVE]
- `Mateo_Proficient_Rhetoric` re-graded **25 / 30 / 30 / 40 / 40** (same essay); `Logan Mitchell` graded **35 vs 43** across two runs (Thesis 10→15, Conventions 5→8; `unverified_evidence` flag inconsistent).
- **Root cause:** `gemini-2.5-flash` dynamic thinking varies even at temp 0; the grading call doesn't pin `thinkingBudget` (relevance + rubric-synth already do).
- **Fix (code-doable):** pin `thinkingBudget` on the grading call in `_shared/grading/engine.ts` `callModel`; evaluate `gemini-2.5-pro` once XPRIZE credits land.

### GR-003 — Off-topic withholding (relevance gate) failed open on every grade — HIGH [LIVE→fixed in PR #13]
- `agent_events` showed `relevance_risk: error → "failed open"` on every historical grade → off-topic withholding silently disabled.
- **Root cause:** relevance call used `gemini-2.5-flash` (thinking model) with `maxOutputTokens:256` and no `thinkingBudget:0` → empty JSON → threw → failed open.
- **Fix:** done in PR #13 (`thinkingBudget:0` + 512 tokens). **Needs deploy** to take effect.

## MEDIUM

### GR-004 — Metrics convergence panel queries 404/400 on cloud — MEDIUM [LIVE]
- `/metrics` → `ConvergencePanel` queries `grading_batches` (404), `submissions.batch_id` / `annotations.edit_distance` (400). Migrations `0017`/`0018` unapplied on cloud. Panel degrades gracefully to empty state (no crash).
- **Fix:** apply `0017`/`0018` (founder, DB pw).

### GR-005 — Pro plan price not displayed on /billing — MEDIUM [LIVE]
- `/billing` Pro card shows the word **"Pro"** in the price slot instead of "$X/mo"; no monthly/annual toggle. User can't see Pro's cost before subscribing.
- **Root cause:** likely Stripe price IDs unset → null price → falls back to plan name.
- **Fix (code-doable):** render a real/default price + annual toggle; handle null-price gracefully. (`src/pages/Billing.tsx`)

### GR-006 — Submission page auto-navigated to Dashboard — DOWNGRADED, NOT REPRODUCED [LIVE]
- Observed once on Logan's submission (redirected to `/` after a delay). **Re-test on a clean load (Diego `5e550004`) did NOT reproduce** — page stayed put. Likely session-token-refresh timing or an interaction side effect, not a per-load bug. **Not a confirmed defect**; re-open only if it recurs. (If real, it would touch `App.tsx`/`AuthProvider` — the parallel agent's lane.)

### GR-007 — Annotations mutated on submission load — DOWNGRADED, NOT REPRODUCED [LIVE]
- Observed PATCH `annotations` + POST `annotation_edits` on Logan's submission, which I attributed to page load. **Re-test on a clean load (Diego `5e550004`) shows the load is entirely READ-ONLY** (GETs only — no annotation writes). The earlier writes were almost certainly from a prior accept/edit/dismiss interaction in that session, not an on-mount auto-mutation. **Not a confirmed defect.** HITL signal integrity looks intact on clean loads.

## LOW

### GR-008 — DOM nesting error on /billing (`<div>` in `<p>`) — LOW [LIVE]
- `src/pages/Billing.tsx:31` — `<Badge>` (renders `<div>`) inside a `<p>` → React `validateDOMNesting` console error.
- **Fix (code-doable):** use a `<span>` container or make Badge render a span.

### GR-009 — Token accounting empty in Grading History — LOW [LIVE]
- `/history` "TOKENS (IN/OUT)" column all `– / –`. `llm_sessions` not populating.
- **Fix:** confirm `llm_sessions` write path + migration; else hide the column.

### GR-010 — No real paywall enforcement (quota fails open) — CRITICAL severity but founder-gated [STATIC]
- `enforceGradingQuota` fails open until migration `0015` applied → unlimited free grading. (Also in `BRIEFING.md`.) Founder: apply `0015`.

---

## Code-doable in my lane (no collision with the parallel agent's `App.tsx`/`TypewriterText`/`index.css`)
- **GR-005 + GR-008** → `src/pages/Billing.tsx`
- **GR-002** → `supabase/functions/_shared/grading/engine.ts`
- **GR-007** → `src/pages/SubmissionDetail.tsx` (investigate first)

## Founder-gated (the real "make it work" unlocks)
- **Deploy `grade-submission`** (fixes GR-001/GR-003 live) — #1 lever.
- Apply migrations `0015`, `0017`, `0018`.
- Stripe live products + secrets.
- Merge + push `aita-launch-prep`.
