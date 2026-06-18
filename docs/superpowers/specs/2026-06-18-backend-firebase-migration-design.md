# Backend → Firebase Migration — Design

**Date:** 2026-06-18
**Status:** Design (approved shape; pending spec review)
**Scope of this spec:** Phase 1 (Functions) in full detail; Phases 2–3 sketched so Phase 1 doesn't foreclose them.

## Context

aiTA's frontend already runs on **Firebase Hosting** (project `aita-5aca5`). The backend is still entirely **Supabase**:

- **Auth:** Supabase Auth (9 files use `supabase.auth`; RLS keys off `auth.uid()`; a `handle_new_user` trigger seeds the `users` row).
- **Database:** Postgres — 23 relational tables, RLS, 21 migrations.
- **Functions:** 16 Deno edge functions (grading engine, Stripe, ingest, privacy, style-profile, etc.).
- **Storage:** 5 usages. **Realtime:** none.

This migration moves the backend onto Firebase/Google Cloud incrementally. It is a **non-blocking strangler**: each subsystem is cut over behind stable interfaces while the app keeps running, and the work never blocks the launch path (the pending Supabase prod deploy + migrations are an independent track).

## Goals

- Move Auth → Firebase Auth and the 16 functions → Cloud Functions for Firebase (Node/TS), without downtime or a big-bang cutover.
- Keep every decision reversible until it must be committed; defer the hardest/most-irreversible decision (the database model) until Auth + Functions are done.

## Non-Goals (for this spec)

- The database migration (Firestore vs Cloud SQL) — explicitly deferred to Phase 3, its own brainstorm. Postgres stays untouched through Phases 1–2.
- Any change that blocks the launch-critical `grade-submission` Supabase deploy or migrations 0015–0021.
- Realtime/offline features (none exist today).

## Locked Decisions

1. **Strangler, non-blocking** — incremental, app never breaks, independent of the launch track.
2. **Order: Functions first → Auth right after → DB later.** Defer the most-irreversible call (DB model).
3. **Auth = clean cutover.** There are **no real users yet** (only test teachers + the Sarah demo), so no password-hash import and no dual-auth — recreate the handful of accounts in Firebase Auth.
4. **Functions runtime = Cloud Functions for Firebase (2nd gen, Node/TS)** — the Firebase-native target, not Cloud Run/Deno.
5. **Proof-first porting** — prove the pattern on a simple function before the crown jewel.

## Architecture — Phases

Each phase ships independently; the app runs throughout.

### Phase 1 — Functions (this effort)
Port the 16 Deno edge functions → Node Cloud Functions, **one at a time**. Auth, RLS, and Postgres stay exactly as-is. Each ported function still **verifies the Supabase JWT** and reads/writes **Supabase Postgres via the service-role key**. The only frontend change is *how a function is called* (`supabase.functions.invoke` → Firebase `httpsCallable`), swapped per-function behind a thin invoker shim so Supabase and Firebase functions coexist mid-migration.

### Phase 2 — Auth (right after Phase 1)
Flip the frontend to Firebase Auth (clean cutover — recreate test/demo accounts). Ported functions switch from verifying the Supabase JWT → the **Firebase ID token**. **This phase owns resolving the 21 direct `supabase-js` frontend reads** (route them through the now-Firebase functions), since the auth flip is exactly what breaks RLS-based direct reads. Postgres still the DB, now accessed only via functions (service-role) — which also sets up Phase 3.

### Phase 3 — Database (later; separate brainstorm)
Firestore (NoSQL remodel) vs Cloud SQL for Postgres (lift-and-shift). Not decided here. By the end of Phase 2 all data access flows through functions, so swapping the store behind them is contained.

## Phase 1 — Detailed Design

### Layout
- New top-level **`functions/`** (Firebase 2nd-gen, TypeScript) with its own `package.json` + `tsconfig`.
- Port the **~12 `_shared/` modules once** into a shared lib under `functions/src/shared/`:
  `ai/gemini`, `ai/google-auth`, `ai/router`, `db`, `env`, `cors`, `http`, `auth`, `deid`, `grading/*` (engine, anchor, assignment-context, auto-finalize, exemplars, rubric-synth, grading-schema), `stripe`, `quota`, `plan-limits`, `ratelimit`, `queue`.
- Porting rules: `Deno.serve` → `onCall`/`onRequest` (2nd gen); `Deno.env.get` → `process.env` + Firebase Secret Manager; `esm.sh`/`npm:`/`https://` imports → `package.json` deps; Deno std → Node equivalents (most code already uses `fetch`, `crypto.randomUUID`, `Set`, etc., which are native in Node 20+).

### Client invoker shim
One frontend module (e.g. `src/lib/fnInvoke.ts`) wraps function calls so each function flips Supabase→Firebase **in one place**, and both backends coexist during the migration. Per-function flag/registry decides which backend serves each name.

### Secrets
Move to Firebase function config / Secret Manager: `GEMINI_API_KEY` + the key pool (`GEMINI_API_KEYS`), `INTERNAL_GRADE_SECRET`, Stripe `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`, `ALLOWED_ORIGINS`.

### Auth bridging during Phase 1
Ported functions continue to verify the **Supabase JWT** (the frontend is still on Supabase Auth in Phase 1) and use the Supabase **service-role** key to reach Postgres. No RLS or frontend-auth change in Phase 1 — that is Phase 2.

### Proof-first porting order
1. **`create-class`** — simple: auth-verify + one Postgres insert, no AI. Proves the entire plumbing (Node Cloud Function + Firebase deploy + Supabase-from-Node + JWT verify + `httpsCallable` wiring + the invoker shim).
2. **`generate-style-summary`** — proves the Gemini path (key pool + `google-auth`).
3. Remaining functions incrementally (Stripe trio, ingest, privacy, style-profile, exemplars, quota/feedback counters, enqueue).
4. **`grade-submission` last** — biggest + most critical; port once the pattern is proven, carrying the same trust-fix/auto-finalize/relevance behavior.

> Note on `test-ai-grading` + `ai-router.ts`: the held-back repoint (see PR #20 notes) should be folded into this port — `test-ai-grading` lands on the live `ai/router.ts` + `ai/gemini.ts` as part of its Phase-1 port, and the dead `ai-router.ts` is dropped then (no separate Supabase edge-fn deploy needed).

### Testing & verification per function
- Unit-test the ported pure logic (the `_shared/grading/*` already have vitest coverage to carry over).
- Each ported function gets an integration smoke test: call via `httpsCallable` against the Firebase emulator (or deployed), assert the same response shape + a real Postgres round-trip.
- A function is "done" only when the frontend invoker is flipped to it and the old Supabase edge function is left dormant (deleted at end of phase, not mid-port).

## Risks & Coupling

- **Auth ↔ direct reads (deferred to Phase 2):** 21 frontend files do direct `supabase-js` reads gated by RLS/`auth.uid()`. Flipping auth breaks them, so Phase 2 must route them through functions. Phase 1 deliberately does **not** touch auth, keeping the first cut clean.
- **Deno→Node porting friction:** runtime API + import differences across ~12 shared modules. Mitigated by porting the shared lib once and proving with `create-class` before fanning out.
- **Two backends live mid-migration:** the invoker shim + per-function registry keep this controlled; functions are flipped one at a time.
- **Secrets handling:** must land in Firebase Secret Manager before deploying any function that needs them; never commit keys.

## Open Questions

- **Firebase project for functions:** reuse `aita-5aca5` (same as Hosting) or a dedicated one? (Default: reuse `aita-5aca5`.)
- **`onCall` vs `onRequest`:** prefer `onCall` (typed client SDK + built-in auth context) for app-invoked functions; `onRequest` for webhooks (Stripe) and cron (privacy-tasks). Confirm.
- **Cron functions** (`privacy-tasks`): move to Cloud Scheduler + an `onRequest`/scheduled function — confirm scheduling approach.
- **Phase 3 DB target** — out of scope here; revisit after Phase 2.
