# Sprint 0 — "Trust the Grade" (executable plan)

GSD-format plan for Sprint 0 from [../07-sprint-plan.md](../07-sprint-plan.md). Produced via `/gsd-plan-phase` intent (the repo is not yet a GSD project, so these PLAN.md files were written directly using the `gsd-planner` output contract — frontmatter + XML tasks with `read_first`/`acceptance_criteria`/`action`, verification, must_haves). If/when aiTA is bootstrapped as a GSD project, move these into `.planning/phases/01-trust-the-grade/`.

## Phase goal / Definition of Done

A single teacher uploads one real essay and receives a **trustworthy, correctly-anchored, rubric-grounded grade with ZERO mock data**, and the result is **gated by a regression eval harness**. (Teacher-*voice* personalization is Sprint 2 — out of scope here; Sprint 0 makes the grade trustworthy and the pipeline safe to demo.)

## Requirement IDs (every plan covers ≥1)

| ID | Requirement |
|----|-------------|
| S0-1 | Remove `Math.random()` mock injection; render only verified AI output |
| S0-2 | Structured grading output (tool-use/JSON mode) + zod validation; delete silent "B" fallback; one structured repair then explicit error |
| S0-3 | Robust annotation anchoring (model char offsets + fuzzy fallback; never silent-drop) |
| S0-4 | Pin temperature 0; delimit/encode student text against prompt injection |
| S0-5 | Eval harness (~15 golden essays, deterministic scorers + QWK, committed baseline, CI gate) |
| S0-6 | Safety hardening: squash migrations to replayable baseline; `WITH CHECK` + lock privileged `users` columns; encrypt LMS tokens; untrack `.env` + gitignore; identity from JWT |

## Plans & wave order

| Plan | Title | Wave | Depends on | Reqs |
|------|-------|:----:|------------|------|
| [01-01](01-01-PLAN.md) | Grading contract & shared zod schema | 1 | — | S0-2, S0-3 |
| [01-02](01-02-PLAN.md) | Security & migration hardening + JWT auth helper | 1 | — | S0-6 |
| [01-03](01-03-PLAN.md) | Reliable structured grading engine (edge fn) | 2 | 01-01, 01-02 | S0-2, S0-4 |
| [01-04](01-04-PLAN.md) | Robust annotation anchoring (client) | 3 | 01-01, 01-03 | S0-3 |
| [01-06](01-06-PLAN.md) | Eval harness + golden set + CI gate | 3 | 01-03 | S0-5 |
| [01-05](01-05-PLAN.md) | Remove mock injection; render verified output | 4 | 01-03, 01-04 | S0-1 |

```
Wave 1: 01-01 ║ 01-02      (parallel — foundation + independent hardening)
Wave 2: 01-03               (grading engine, needs contract + auth helper)
Wave 3: 01-04 ║ 01-06       (parallel — anchoring + evals, both need engine)
Wave 4: 01-05               (client render, needs engine + anchoring)
```

## Phase-level must_haves (goal-backward verification)

- [ ] No `Math.random(` anywhere in the grading/render path; `git grep -n "Math.random" src/pages/SubmissionDetail.tsx` returns nothing.
- [ ] `generate-grading-feedback` returns schema-valid structured output or an explicit error — **never** a canned grade.
- [ ] Every displayed annotation is anchored to verified essay text; unmatched annotations are surfaced, never silently dropped.
- [ ] Grading runs at temperature 0 and student text is delimited as data.
- [ ] `supabase db reset` replays all migrations from scratch with no errors.
- [ ] Eval harness runs, produces a committed baseline, and a CI job fails the build on regression.
- [ ] `.env` is untracked and gitignored; no client-supplied `userId` is trusted server-side.

## How to execute (without GSD runtime)

Work the waves in order; within a wave, the plans touch disjoint files and can be done in parallel. Each task's `acceptance_criteria` is the done-check. Run the eval harness (01-06) as the final gate before declaring the phase complete.
