# 09 — Goal Alignment: aiTA Non-Negotiables vs. Current State vs. V2 Plan

This doc reconciles the [aiTA product goal](GOAL.md) with the audit findings ([01](01-current-state-architecture.md)–[06](06-supabase-security-review.md)) and the [sprint plan](07-sprint-plan.md). It answers one question: **does the rebuild plan actually deliver the vision?**

## Headline

The product's whole thesis is to be the opposite of a "generic auto-grader" — **teacher-aligned, trustworthy, and memory-driven.** The audit shows the current implementation **violates the three non-negotiables that constitute exactly that differentiation:**

- **#4 Outputs must align with teacher voice** — the distilled teacher style is *never fed to the production grader*.
- **#5 Teacher trust > automation speed** — the grader injects `Math.random()` mock scores and silently substitutes a fake "B" on failure.
- **#7 Context accumulation & memory are core** — teacher edits are logged but never fed back; there is no persistent pedagogical memory.

So today aiTA is, mechanically, the generic auto-grader the goal explicitly rejects. **Fixing these three is the rebuild.** The good news: the human-in-the-loop review surface (#1, #2) — the hardest UX to get right — already exists and is excellent.

## Non-negotiable scorecard

| # | Non-negotiable | Current state | Verdict | V2 work (sprint) |
|---|----------------|---------------|:------:|------------------|
| 1 | **Human-in-the-loop approval mandatory** | Accept/reject/edit + bulk actions + teacher comments exist and are the standout asset. But teachers may be approving *fabricated* content (mock scores, silent "B"), which corrupts the very act of approval. | 🟡 **Present but undermined** | Keep & port the review system; remove what makes approval untrustworthy (Sprint 0). |
| 2 | **AI suggestions remain editable** | Sidebar edit + inline edit work. | ✅ **Met** | Preserve; single renderer (Sprint 1). |
| 3 | **Feedback must be rubric-aware** | Rubric is free-text; model invents unbounded 0-10 scores with no weights/max; no per-criterion verification. | 🟡 **Weak** | Structured rubric (criteria/weights/max/descriptors) + evidence-verified, bounded, server-recomputed scores (Sprint 2). |
| 4 | **Outputs align with teacher voice** | `generate-style-summary` produces a style profile that is consumed **only by the onboarding demo, not the real grader**; training examples truncated to 200 chars; primary training UI writes rows the grader can't read. | 🟥 **Broken — core differentiator non-functional** | Inject style profile + full retrieved few-shot into the production grader; unify training schema; prove lift via eval with/without style (Sprint 2). |
| 5 | **Teacher trust > automation speed** | `Math.random()` mock scores layered on real output; silent canned "B"/0.8 on parse failure; annotations silently dropped on anchor miss; non-deterministic grades. | 🟥 **Violated — the opposite of the principle** | Sprint 0 is literally "Trust the grade": remove mocks, structured+verified output, robust anchoring, no silent fallback, temp 0, evals. |
| 6 | **Educational quality > aggressive automation** | Generic fallback feedback; no measurement of feedback quality/tone; "92% accuracy" is hardcoded fiction. | 🟡 **Unmeasured** | Eval harness scores feedback quality/tone + teacher-agreement (QWK); quality gate in CI (Sprint 0/2). |
| 7 | **Context accumulation & memory are core** | `teacher_edits` logs accept/decline but is **never fed back**; no retrieval, no persistent pedagogical memory; style not accumulated over time. | 🟥 **Largely missing** | Reinforcement loop: fold accepted/edited annotations into the few-shot pool + evolving style profile; this *is* the "persistent pedagogical memory" (Sprint 2, deepened over time). |

**Met: 1 · Present-but-undermined/weak/unmeasured: 3 · Broken/missing: 3.**

## "Should feel like" vs. "must not feel like"

| Goal says it must NOT feel like | Current risk | Goal says it SHOULD feel like | Current strength |
|---|---|---|---|
| Generic chatbot | — (no chatbot) | Professional grading workspace | ✅ Dashboard + submission workspace + annotation sidebar |
| **Automated grading spam / AI slop** | 🟥 Mock + generic fallback + unverified output = slop today | Intelligent instructional co-pilot | 🟡 Review UX yes; intelligence undermined |
| Teacher-replacement system | ✅ HITL is structurally enforced | Pedagogically-aware assistant | 🟥 Not yet — style/memory not wired |

The single biggest gap between aspiration and reality is **"AI slop" → "pedagogically-aware."** It closes exactly when #4, #5, #7 are fixed.

## Scope the goal adds beyond the current build

The goal is broader than the essay-centric V1. Fold into the roadmap (mostly post-Sprint-2):

- **Multiple submission types:** essays, short answers, **discussion responses**, writing assignments, **revisions**, **projects** — V1 is essay-only. The structured-rubric + annotation model generalizes, but ingestion/UX per type needs design.
- **Assignment-instruction parsing:** the goal has teachers upload *assignment instructions + rubric*, and the system extracts requirements/criteria. V1 only has free-text rubric on the assignment. Add instruction ingestion → structured criteria extraction.
- **Persistent pedagogical memory as a product surface:** not just an internal few-shot pool — the goal frames memory as a *core feature*. Consider a teacher-visible "your grading style" profile they can inspect/adjust (reinforces trust + explainability).

## How the existing plan already serves the goal

No re-sequencing needed — the audit-driven sprint plan happens to be the right order for the vision:

- **Sprint 0 (Trust the grade)** → satisfies #5, props up #1, starts #6. *This is the prerequisite for aiTA being aiTA at all.*
- **Sprint 1 (ingestion + consolidation)** → enables #3/#4 (clean rubric+text in) and the "professional workspace" feel.
- **Sprint 2 (personalization)** → satisfies #4, #7, hardens #3, #6. *This is where aiTA stops being a generic grader and becomes the co-pilot.*
- **Sprint 3 (privacy)** → underpins #5 (trust includes data trust).
- **Sprint 4+ + roadmap** → the broader submission types, assignment-instruction parsing, and teacher-visible memory surface.

## One-line takeaway

> Keep the human-in-the-loop review surface (it's the goal's hardest part, already built); spend the rebuild making the *content* teachers approve **trustworthy (Sprint 0), rubric-grounded (Sprint 2), in their voice (Sprint 2), and accumulating into memory (Sprint 2+).** That is the difference between "AI slop" and "a digital extension of the teacher."
