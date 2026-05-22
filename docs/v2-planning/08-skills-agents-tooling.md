# 08 — Skills, Subagents & Tooling to Install Before Coding

## Skills (already installed this session) → workstream mapping

All 8 are installed at `~/.claude/skills/` and active. Each maps to a V2 workstream:

| Skill | Used for | Sprints |
|-------|----------|---------|
| `repo-audit-skill` | This audit; ongoing dead-code/dep/secret sweeps as duplicates are removed | 1, ongoing |
| `supabase-rls-security-skill` | Migration squash, `WITH CHECK`, token encryption, RLS verification, identity-from-JWT | 0, 3 |
| `react-shadcn-ui-audit-skill` | Consolidating components, a11y pass, removing `dangerouslySetInnerHTML`, design-token consistency | 1, 4 |
| `document-parsing-pdf-docx-skill` | Server-side extraction + OCR + confidence scoring | 1 |
| `ai-grading-rubric-evaluation-skill` | Structured rubric, evidence-verified grading, teacher-agreement (QWK), bias checks | 0, 2 |
| `prompt-evaluation-test-harness-skill` | Golden-set eval harness + CI gate for every prompt/model change | 0, 2 |
| `privacy-ferpa-student-data-skill` | PII scrubbing, consent, retention/deletion, audit log, vendor terms | 3 |
| `product-requirements-prd-skill` | Turning this report into a crisp V2 PRD before each sprint | pre-build |

## Additional tooling to set up before coding

1. **Supabase CLI** — local Postgres, `supabase db reset` (proves the squashed baseline replays), typed client generation, function dev/deploy. *Essential for the Sprint-0 migration squash.*
2. **Eval framework** — `promptfoo` (or a thin custom harness per the eval skill). Datasets + prompts versioned in git; baseline committed; CI gate.
3. **Structured outputs** — use the **`claude-api` skill** for tool-use/JSON-mode grading output, prompt caching (cache the system prompt + rubric + style profile across a class's submissions to cut cost/latency), and model-version guidance. Default grading to a high-capability Claude model.
4. **Server-side OCR** — an OCR path for scanned PDFs (cloud OCR or `tesseract` in a worker), invoked from `ingest-document`.
5. **Testing** — **Vitest** (unit, esp. anchoring + verification logic) and **Playwright** (E2E core path). None exist today.
6. **CI** — GitHub Actions: lint + typecheck + unit + `supabase db reset` + eval gate on PR.
7. **Secret management** — Supabase function secrets / Vault; `.env` gitignored; rotate anything ever committed.

## Subagents / workflow recommendations

- **`general-purpose` subagents** for parallel subsystem work during consolidation (one per feature area) — as used to produce this audit — to keep the main context lean.
- **`Explore` agent** for "where is X / what references Y" during refactors (e.g. finding every importer before deleting a duplicate).
- **GSD workflow** for execution: `/gsd-plan-phase` to expand each sprint in [07](07-sprint-plan.md) into an executable plan, `/gsd-execute-phase` to run it, `/gsd-code-review` + `/security-review` before merge.
- **Built-in `code-review` / `security-review` / `verify`** skills as merge gates each sprint.

## Suggested order of operations (pre-build)

1. Run `product-requirements-prd-skill` → write `V2-PRD.md` from this report (lock scope for MVP-V2).
2. Set up Supabase CLI locally + dump live schema (input to the migration squash).
3. Stand up the eval harness skeleton + a first ~15-essay golden set (blocks Sprint 0 grading work — build it first).
4. Add Vitest + Playwright + CI scaffolding.
5. `/gsd-plan-phase` for Sprint 0, then execute.

> Note: the eval harness and the migration-squash baseline are **prerequisites**, not deliverables — build them before touching grading prompts or schema, so every subsequent change is measured and replayable.
