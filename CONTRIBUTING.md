# Contributing to aiTA

Thanks for your interest in aiTA. This guide covers local setup and the conventions we follow.

## Local development

Requires Node.js and npm.

```sh
npm install
npm run dev        # → http://localhost:8080
npm test           # vitest
npm run build      # production build
npm run lint       # eslint
```

Copy `.env.example` → `.env` and fill in the public values. **Never commit secrets** — server secrets live in Supabase function secrets (and, post-migration, Google Cloud Secret Manager). See `SECURITY.md`.

## Branching & commits

- Branch off `main` for your work (e.g. `feat/voice-feedback`, `fix/rubric-totals`).
- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- Keep changes small and focused; run `npm test` and `npm run lint` before opening a PR.

## Where things live

```
src/                         React app (pages, components, lib)
supabase/functions/          Edge functions (grading, ingest, billing, privacy)
supabase/functions/_shared/  Grading engine, AI router, auth, rate-limiting
supabase/migrations*/        Database schema
worker/                      Async grading worker (Cloud Run)
docs/                        Concepts, guides, references
.planning/                   Roadmap, state, and launch plan
```

Planning and roadmap context lives in `.planning/` — start with `.planning/LAUNCH-PLAN.md`.
