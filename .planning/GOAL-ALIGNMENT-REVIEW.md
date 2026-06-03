---
type: goal-alignment-review
reviewers: [claude-code-in-session]
external_clis_attempted: [codex]
external_cli_status: "codex unavailable (CLI 0.121.0 pinned to gpt-5.5 which needs a newer CLI; ChatGPT-account auth rejects gpt-5/gpt-5-codex). gemini/opencode/qwen/cursor not installed."
reviewed_at: 2026-05-23
basis: "live in-browser verification against cloud + code read of grade-submission/engine/eval"
---

# aiTA — Full-System Goal-Alignment Review

> **Independence caveat:** external peer CLIs could not be invoked this run (see frontmatter).
> This is the in-session reviewer's grounded assessment, not an independent model's. For true
> cross-AI review, install the Gemini CLI (apt for a Gemini X Prize entry) or upgrade codex, then
> re-run `/gsd-review --gemini` / `--codex`.

## The GOAL (restated)
Cut grading time and **grade fatigue** (fatigue → lower quality → students aren't taught). Aid the
teacher like a TA, **never replace** them. Learn the teacher's style/preferences, grade accurately to
the assignment + rubric, make output **look like the teacher graded it**, keep the teacher reviewing,
and make it feel like **a bag of bricks lifted** — not a threat. Then: demo → publish → X Prize → beta.

## Summary
The **trust spine is real and verified** (rubric-aligned grading, deterministic off-topic refusal,
evidence verification, mandatory HITL, audit trail). That directly serves "accurate to the rubric" and
"teacher stays in control." **The marquee promise — "learns your style / looks like *you* graded it" —
is built but NOT yet demonstrated**, and is the single biggest gap between the goal and what's provably
true today. Several rough edges (generic criteria, a stale "Grading failed" status over a real grade,
duplicate notes, flash-not-pro, a nonsense turnaround metric) currently make the system feel
*unreliable* rather than *relieving* — the opposite of the "bag of bricks" emotion. None are deep; most
are a deploy + a data-cleanup + one founder-config away. **Overall risk: MEDIUM.**

## Goal-Alignment Findings
| Goal pillar | State | Verdict |
|---|---|---|
| **Accurate to assignment + rubric** | Off-topic oil-change → 0/100+withheld (verified); evidence verified server-side; totals recomputed; injection-resistant; eval gates the 100/100 regression | **ALIGNED — strongest pillar** |
| **Teacher stays in the loop** | HITL accept/edit/dismiss persists across reload (verified); finalize locks; export = accepted/edited only; nothing final without sign-off | **ALIGNED** |
| **Aid, don't replace** | HITL mandatory; "suggestions"; "AI originally suggested…"; no auto-submit | **ALIGNED in design** |
| **Less time / less fatigue** | Grade+annotate+summarize round-trip works; bulk "grade all"; metrics show time-saved | **CONDITIONALLY aligned** — only real if edit-rate is low; unproven on real teacher data. If teachers must heavily edit, fatigue just moves from grading → reviewing (net-zero). |
| **Learns style / "looks like the teacher graded it"** | Profile injection + edit→reinforce→rebuild loop are **built (Phase 9)** but **no live proof**: no teacher has ≥10 samples loaded; no with-vs-without demo; no edit-rate-dropping evidence. Current output is competent-but-generic (and generic Clarity/Accuracy/Depth criteria when no rubric). | **NOT YET DEMONSTRABLE — #1 gap vs the goal** |
| **Doesn't scare teachers / bricks lifted** | Calm Marginalia design + non-threatening HITL language help, but live rough edges ("Grading failed" over a grade, dup notes, generic feedback, 2685 hr metric, pro 429 in trace) read as *unreliable* | **MIXED — polish is load-bearing for the emotional goal** |

## Trust Risks (ranked)
1. **Generic, not-in-their-voice feedback** → a teacher thinks "this isn't how I grade," distrusts it,
   re-grades everything → worse than nothing. The style loop must *visibly* work. (Highest risk to the goal.)
2. **Reliability optics**: a real grade displayed under a "Grading failed" badge, and 9 duplicate notes,
   tell a teacher "I can't trust this." (Fix committed for dups; stale-status fix still open.)
3. **Running on flash with pro quota=0** (visible 429 in the trace) reads "unfinished" to X Prize judges.
4. **No live "measurable improvement" artifact** — the falsifiable "it learns" story isn't recorded yet.

## Demo-Readiness — minimum bar + script
**Must be true first (all small):**
- Deploy the two committed fixes (rubric-synth truncation + annotation dedup) and re-grade so criteria
  are **assignment-specific** and notes don't duplicate.
- Enable **gemini-2.5-pro** billing (or explicitly narrate flash as the fast tier).
- Seed **one teacher with a real style profile** (≥10 samples) and capture a **with-profile vs
  without-profile** difference on the same essay.
- **Clean demo data**: remove failed/duplicate artifacts; fix the "2685 hrs" turnaround (it's stale
  2025→2026 test data — use fresh submissions).
- Fix the **stale "Grading failed" over a valid grade** display.

**Demo script (the emotional arc — "bricks lifted"):**
1. Teacher drops a whole class of essays in (the bag of bricks).
2. aiTA grades the batch through the **visible agent pipeline** (the "AI workforce," not one API call).
3. A junk/off-topic submission is **caught and withheld** → "it won't rubber-stamp garbage" (trust).
4. A real essay: rubric-aligned scores + inline notes **in the teacher's voice** (profile injected) +
   per-criterion evidence citations.
5. Teacher **accepts most, edits one** → "AI originally suggested…" → system records the correction.
6. **Metrics**: time saved + **edit-rate trending down** = "it's learning *me*."
7. **Finalize + export** → teacher in control start to finish.

**Would embarrass on camera (kill before recording):** "Grading failed" over a grade · duplicate notes ·
generic Clarity/Accuracy/Depth · "2685 hrs" · pro 429 in the trace · OAuth 403 on sign-in.

## X-Prize Angle
**Lead with:** (a) **agentic AI workforce** — named, individually-traced agents; (b) **measurable,
falsifiable improvement** — eval harness numbers + edit-rate-over-time; (c) **trustworthy refusal** —
deterministic off-topic + injection gates (the "valid grade > impressive grade" thesis); (d) **human
amplification, not replacement** — mandatory HITL. **Gemini-specific:** structured `responseSchema`
output, thinking control, multi-model routing (pro→flash), implicit prompt caching.
**Underweight today:** a recorded **live eval run** with the metrics; the **style before/after**; **pro
on the happy path**. These three convert "we built it" into "watch it work."

## Beta Blockers (smallest real-teacher-ready set)
- Deploy fixes; pro billing (or framed); apply OAuth bootstrap migration; rotate exposed secrets;
  **FERPA-aware copy audit** (never "fully compliant"); **style loop working on the teacher's own
  samples**; the stale-status reliability fix; a real **host URL** (free subdomain is fine to start).

## Prioritized Punch List
**HIGH — agent/code-doable**
1. Deploy `grade-submission` (carries synth + dedup fixes) → re-grade to confirm assignment-specific
   criteria + no dup notes. *(blocked only by the `--no-verify-jwt` deploy permission — founder runs it
   or grants the rule.)*
2. Fix "stale grade shown under `grade_error`" (don't present a stale grade as valid).
3. Seed + verify the **style-profile loop end-to-end** (with vs without; capture the difference).
4. **Clean demo data** + fix the turnaround metric (cap/normalize or use fresh submissions).
5. Record a **live eval run** (`GEMINI_API_KEY=… node eval/run.mjs`) as the measurable-improvement artifact.

**HIGH — founder-config (cannot be agent-done)**
6. Enable **gemini-2.5-pro** billing on the Google project (kills the 429 fallback).
7. Apply the **OAuth profile-bootstrap** migration (`20260522000000_oauth_profile_bootstrap.sql`).
8. **Rotate** exposed secrets (DB password + `sk_live_` key).
9. **Host the frontend** on a free subdomain (the agreed launch path).

**MEDIUM**
10. Deploy remaining edge fns (grade-enqueue, stripe-*, build-style-profile). *(Single-grade sync path
    already works; Upstash+Cloud Run worker is bulk-only — optional for demo/beta.)*
11. FERPA-aware copy audit across the app.
12. Stripe live config — only if billing is in the demo/beta story (else defer).

**LOW**
13. Custom domain; PostHog key; advanced-class onboarding prompts; install Gemini CLI for real cross-AI review.

## Overall Risk: **MEDIUM**
The trust foundation that makes aiTA *defensible* is real and verified. The work between here and a
goal-true demo is mostly **prove the style-learning loop + deploy committed fixes + clean the demo
surface + four founder-config items** — not new architecture. Close the "looks like the teacher graded
it" gap and the system matches the goal.
