# 04 — Recommended V2 Architecture

## Guiding principles

1. **Trust is the product.** A grading tool that sometimes shows fake or non-reproducible grades is worse than no tool. Reliability, verifiability, and human-in-the-loop come before features.
2. **Evolve, don't greenfield.** Keep the entities, the annotation system, the design system, and the response shape. Rebuild the engine and consolidate the duplicates.
3. **One of each.** One onboarding, one upload, one dashboard, one annotation renderer, one grading service.
4. **Server owns trust boundaries.** Identity from JWT, file parsing server-side, privileged columns server-only, secrets never client-side, eval-gated prompts.
5. **Measured, not vibes.** No prompt/model change ships without passing the eval harness.

## Target stack (keep the good Lovable defaults)

- **Frontend:** Vite + React 18 + TypeScript + shadcn/ui + Tailwind (keep). Add **TanStack Query** as the real data layer (it's already a dependency). Forms stay on react-hook-form + zod.
- **Backend:** Supabase Postgres + Edge Functions (keep). Add **Supabase Vault/`pgsodium`** for secret-at-rest, **`pg_cron`** for scheduled privacy tasks, **Storage** for files.
- **AI:** a single **model-router abstraction** with valid model IDs and health-based fallback; default to the latest Claude models for grading quality, with structured outputs (tool use / JSON mode). See [05](05-ai-grading-pipeline.md).
- **Parsing:** **server-side** document extraction (Edge Function or a small worker) with OCR fallback for scanned PDFs.
- **Testing:** Vitest (unit), Playwright (E2E), promptfoo-style **eval harness** (grading quality).

## Module boundaries (frontend)

```
src/
  app/            router + providers + auth/onboarding gating IN the router
  features/
    auth/         AuthProvider, guards, sign-in
    onboarding/   ONE flow (style capture wired to grader)
    classes/      dashboard, class & assignment CRUD (TanStack Query)
    submissions/  upload (one component), submission detail (decomposed)
    grading/      grading client + types + annotation review system (ported)
    training/     ONE training/examples model + style management
    lms/          Canvas (server-side OAuth) — post-MVP
    billing/      plans/upgrade — post-MVP
  lib/            supabase client, query hooks, shared utils
  components/ui/  shadcn (keep)
```

Decompose `SubmissionDetail` into: `useSubmission`, `useGrading`, `useAnnotations` hooks + presentational components. No business logic in components.

## Module boundaries (backend / Edge Functions)

```
supabase/functions/
  _shared/
    ai-router.ts        single model abstraction (valid IDs, health, logging)
    auth.ts             getUserFromJWT() helper (used by EVERY function)
    extract.ts          server-side DOCX/PDF/text extraction + OCR
    schema.ts           zod schemas for grading I/O
  grade-submission      THE grader (structured output, evidence-verified)
  ingest-document       upload → server-side extract → store text + confidence
  build-style-profile   distil teacher style (consumed by grader)
  privacy-tasks         anonymize (incl. body PII) + retention (pg_cron)
  canvas-oauth          server-side token exchange (encrypted storage)  [post-MVP]
```

Every function calls `getUserFromJWT()` and derives identity server-side; service-role functions are cron/secret-gated only.

## Data flow (V2 happy path)

```
Teacher uploads file
  → ingest-document (server): extract text + OCR fallback + confidence score
  → store file in Storage, text in submissions.extracted_text (+ confidence)
  → if confidence low → flag for manual review, DO NOT auto-grade
  → grade-submission (server):
      build prompt = system + structured rubric + teacher style profile
                   + retrieved few-shot examples + DELIMITED student text
      call model router (temp 0, structured output / tool use)
      verify: every evidenceQuote exists in text; scores within rubric max
      anchor: char offsets from model + fuzzy fallback; unmatched → surfaced
      persist: submission_grades + annotations (first-class table) + llm_sessions
  → client renders annotation review (ported Grammarly system) via TanStack Query
  → teacher accept/reject/edit → annotation_edits (reinforcement signal)
```

## What carries over vs what's new

| Concern | V1 | V2 |
|---------|----|----|
| Annotation review UI | ✅ keep (port) | same span model, single renderer |
| Design system | ✅ keep | shadcn/ui as-is |
| Grading response shape | ✅ keep as target | enforced via zod + structured output |
| Document extraction | client-side, partial | **server-side + OCR + confidence** |
| Grading engine | fragile, silent fallback | **structured, verified, eval-gated** |
| Teacher style | captured, unused | **injected into grader** |
| Data fetching | manual useEffect | **TanStack Query** |
| Identity | client-supplied userId | **JWT-derived** |
| Secrets | plaintext tokens, committed .env | **Vault + gitignored env** |
| Migrations | non-replayable | **single clean baseline** |
| Canvas | broken client-side | server-side (post-MVP) |
| Tests/evals | none | **Vitest + Playwright + eval harness** |

## Deployment readiness gaps to close

- Add `.gitignore` for `.env`; move all real secrets to Supabase function secrets / Vault.
- Add `[functions]` config + `pg_cron` schedules in `config.toml`.
- Add CI (lint + typecheck + unit + eval gate) before merge.
- Document a reproducible local setup (Supabase CLI, seed data) and a prod runbook.
