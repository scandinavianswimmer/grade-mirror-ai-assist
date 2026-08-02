# aiTA Backend V2 (Supabase Edge Functions + Postgres)

A clean rewrite of the aiTA backend in TypeScript (Deno) on Supabase. Same platform (Postgres + Auth + RLS + Storage — the React frontend depends on it), but the logic is rebuilt around a shared core instead of v1's copy-pasted, fragmented functions. Grounded in `docs/v2-planning/` (architecture, AI grading pipeline, security review) and the `supabase-rls-security`, `document-parsing-pdf-docx`, `ai-grading-rubric-evaluation`, and `privacy-ferpa-student-data` skills.

**LLM provider: Google Gemini.** Grading uses `gemini-2.5-pro` (primary) → `gemini-2.5-flash` (fallback) via the REST `generateContent` API with `responseMimeType=application/json` + `responseSchema` for schema-shaped JSON, `temperature: 0` for determinism. Override the primary with the `GEMINI_GRADING_MODEL` secret only after the replacement passes the grading, relevance, calibration, and structured-output gates. Gemini 2.5+ supports implicit prompt caching, so the stable system+rubric prefix can be reused across a class's submissions.

## Layout

```
supabase/
  migrations_v2/0001_baseline.sql      ← squashed, replayable schema (replaces migrations/)
  config.toml                          ← function verify_jwt + cron reference
  functions/
    _shared/
      env.ts        fail-fast secret access
      cors.ts       origin allowlist (no wildcard)
      http.ts       AppError + JSON responses + withErrors wrapper
      db.ts         userClient (RLS) + adminClient (service role)
      auth.ts       getUserFromJWT (identity from token) + requireCronSecret
      grading-schema.ts   zod contract + JSON schema (source of truth)
      ai/router.ts        Gemini model registry + health/fallback
      ai/gemini.ts        Gemini generateContent client (responseSchema JSON, temp 0)
      grading/anchor.ts   normalization + robust offset/fuzzy anchoring (never drops)
      grading/engine.ts   assemble → call → validate → verify → recompute → fail-loud
      extract/index.ts    server-side PDF/DOCX/text extraction + confidence + OCR hook
    grade-submission/      core grader (replaces generate-grading-feedback)
    ingest-document/       server-side extraction (replaces client-side parsing)
    build-style-profile/   distills teacher style (replaces generate-style-summary), consent-gated
    record-feedback-usage/ usage counter w/ weekly reset (replaces increment-feedback-count)
    privacy-tasks/         anonymize (incl. body PII) + retention (cron/secret-gated)
```

## What replaces what (v1 → v2)

| v1 | v2 | Why |
|----|----|-----|
| `generate-grading-feedback` (silent "B" fallback, fence-stripped JSON, temp unset, Lovable AI gateway) | `grade-submission` + `_shared/grading/engine.ts` | Gemini `responseSchema` JSON, schema-validated, evidence-verified, server-recomputed totals, temp 0, fail-loud |
| `_shared/ai-router.ts` (v1 multi-provider, invalid model IDs) | `_shared/ai/router.ts` + `_shared/ai/gemini.ts` | Gemini-only, valid GA model IDs, health/fallback. **Delete the v1 file at cutover.** |
| client-side `mammoth`/`pdfjs` in `src/lib/fileUpload.ts` | `ingest-document` + `_shared/extract` | Server-side, confidence-scored, blocks grading on empty/scanned text |
| `generate-style-summary` (output unused by grader) | `build-style-profile` (consent-gated; Sprint 2 wires into grader) | Personalization actually reaches the engine |
| `increment-feedback-count` (trusts body `userId`) | `record-feedback-usage` (JWT identity, service-role write) | Closes identity-spoofing + privilege gap |
| `anonymize-student-data` (name field only) | `privacy-tasks` | Scrubs names in essay/feedback/annotation bodies + retention; cron-gated |
| `test-ai-grading`, `generate-podcast`, `cleanup-training-data`, `scheduled-privacy-tasks` | removed / folded in | podcast was vestigial; test path replaced by eval harness; cleanup folded into privacy-tasks |
| 14 drifted migrations | `migrations_v2/0001_baseline.sql` | One replayable baseline; conflicting/duplicate DDL gone |
| `create-class` | kept (already correct) — should import `_shared/auth.ts` for consistency | minor |

## Required secrets

```
supabase secrets set GEMINI_API_KEY=...           # grading + style (Google Generative Language API)
supabase secrets set GEMINI_GRADING_MODEL=gemini-2.5-pro   # optional: override the primary model
supabase secrets set CRON_SECRET=...              # gates privacy-tasks
supabase secrets set ALLOWED_ORIGINS="https://app.aita.example,http://localhost:5173"
# SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected by the platform.
```
Never put server secrets in `.env` (that file is client `VITE_*` only and must be gitignored).

## Cutover

1. **Schema:** archive `supabase/migrations/` and promote the baseline:
   `mkdir -p supabase/_archive && git mv supabase/migrations supabase/_archive/migrations-v1 && git mv supabase/migrations_v2 supabase/migrations`
   Then `supabase db reset` (local) must replay cleanly. Generate fresh client types: `supabase gen types typescript`.
2. **LMS tokens:** enable Supabase Vault and store Canvas tokens as vault secrets referenced by `lms_credentials.vault_secret_id` (the table denies all client access by default).
3. **Cron:** create the `pg_cron` schedule in `config.toml` for `privacy-tasks`.
4. **Frontend:** point the client at the new function names (`grade-submission`, `ingest-document`, `record-feedback-usage`) and the v2 `GradingResult` contract; remove the v1 `Math.random()` mock path (Sprint 0 plan 01-05). Mirror `_shared/grading-schema.ts` in `src/lib/grading/`.
5. **Remove v1 functions** once the frontend is migrated.

## Trust guarantees (Sprint 0 "Trust the grade")

- No fabricated grades: parse/validation failure → one repair attempt → explicit `422 grading_unparseable`, never a canned grade.
- Temperature 0 (Gemini) for determinism; `responseSchema` guarantees JSON shape; student text delimited as data against prompt injection.
- Evidence quotes verified against the essay (`verified` flag); weighted total recomputed server-side.
- Annotations anchored on offsets + fuzzy fallback; unmatched are surfaced (`matched:false`), never dropped.
- Identity from JWT everywhere; privileged columns server-only; LMS creds client-inaccessible.

## Not yet (follow-ups)

- Wire `teacher_style_profiles.style_summary` + retrieved few-shot into `engine.ts` (Sprint 2 personalization).
- OCR provider for scanned PDFs (hook in `extract/index.ts`).
- Canvas server-side OAuth function (post-MVP).
- Eval harness (`docs/v2-planning/sprint-0/01-06-PLAN.md`) — gates prompt/model changes.
