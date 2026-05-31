# Continue — aiTA (Sarah Martinez demo, mid-build)

> Manual-driven GSD (no `gsd-sdk`; planning lives in `.planning/`, not `.gsd/`). Branch
> **`aita-production-build`** (PR **#2** → main). Cloud Supabase: **`yhdobsmmhdvqswjpousc`**.
> Working tree clean. Vite dev server running on **:8080** (intentional; user uses it for verify).

## Last action
Built the full **Sarah Martinez ICP demo account** live in cloud (browser REST as the
authenticated teacher) per the spec the user pasted: rebranded the existing test teacher
(id `b1a916bb-21fa-4cfd-9959-ce737a5cf465`, login `test.teacher@school.edu`) → name **Sarah
Martinez**, school **Westlake Ridge High School**, distinctive grading-voice profile + consent +
10 training samples + **6 classes** + **10 assignments** + **14 student essays** across ability
archetypes + edge cases (off-topic, ultra-short, AI-generated). One hero essay (**Sofia Reyes**,
Gatsby Symbolism) graded LIVE — **feedback came back in Sarah's voice** (verbatim phrases from her
profile: *"Consider integrating quotations more naturally into your sentences"*, *"your next step is
to expand…"*) — style-injection loop **proven live on deployed code**. Sofia = `graded`; the other 13
seeded essays = `uploaded` (ready to grade), zero `grade_error` badges.

The complete environment is also captured idempotently in `scripts/seed-demo-sarah-martinez.sql`
(parameterized by `:teacher`) + runbook in `docs/DEMO-SARAH-MARTINEZ.md`.

## Next action
**ONE founder action unblocks the demo — deploy.** (Pro billing is now optional, see below.)
1. **Deploy the changed functions.** config.toml now encodes per-function `verify_jwt`, so the
   `--no-verify-jwt` flag is no longer needed — plain deploy applies the right setting:
   `supabase functions deploy`  (deploys all; simplest + correct)
   …or at minimum: grade-submission, grade-enqueue, generate-podcast, privacy-tasks,
   **delete-data (NEW — first deploy)**, build-style-profile.
   Ships the demo grading fixes (synth miscalibration, no-dup annotations, key rotation) **plus the
   full security-hardening pass** (rate limiting, generate-podcast auth, de-identification,
   right-to-erasure). See `.planning/security/REMEDIATION.md`.
2. **Apply migrations** `migrations_v2/0015_grading_quota_rpc.sql` + `0016_rls_force_and_comments.sql`
   with the DB password (same path as 0002–0014). The quota gate fails open until 0015 lands, so the
   demo bulk-grade is NOT blocked if you deploy before applying.
3. **(Optional) Enable `gemini-2.5-pro` billing** on the Google project. No longer a hard blocker:
   two fresh free-tier flash keys are now in the rotation pool (`GEMINI_API_KEYS` secret, set
   2026-05-30), so grading works on flash without pro. Pro billing is now a *quality* upgrade
   (stronger rubric reasoning), not a prerequisite to record the demo.

**Key rotation (2026-05-30):** `_shared/ai/gemini.ts call()` rotates through a key pool on
429/RESOURCE_EXHAUSTED before the model-level pro→flash fallback. Pool = `GEMINI_API_KEY` (primary,
currently quota-exhausted) + comma-separated `GEMINI_API_KEYS` (two fresh keys, set this session).
A warm-instance cursor sticks to the last working key. The exhausted primary rejoins when its daily
quota resets. **Takes effect only after the deploy above.** The marquee billed key with X-Prize
gifted credits will replace these once Luke applies.

## Grading status (2026-05-30, post-deploy)
- **Deploy DONE.** All functions live (security pass + grading fixes). grade-submission validated
  end-to-end in-browser: calibration fixed (Marcus 28→23, not 100), off-topic withheld (Brandon
  10/100 + off_topic flag), key rotation working (runs on flash via fresh keys).
- **Rubric consistency bug FOUND + FIXED + DEPLOYED** (commit 6ef5eb6): live rubrics table is v1
  (title + rubric_json NOT NULL); grade-submission's insert omitted them → every persist failed →
  each grade re-synthesized a different rubric. Now persists correctly; verified **1 canonical
  rubric** for the Gatsby assignment (5 criteria: Thesis20/Symbol20/Evidence30/Structure20/Conv10).
- **Gatsby (a5519001) re-graded onto the canonical rubric: 4/6** — Marcus 23, Brandon 10(off-topic),
  Logan 43, Diego 29. **Pending: Tyler + Sofia** (re-grade onto canonical rubric).
- **Free-tier key rate limits** — the 2 fresh flash keys throttle (502 "All grading models failed")
  under burst grading. **Mitigated structurally (2026-05-30, commit b880894):** added an in-process
  dev-mode pacer in `_shared/ratelimit.ts` (`paceUpstreamCall`) wired into `gemini.ts` — serializes
  upstream calls to `GEMINI_MIN_CALL_INTERVAL_MS` (set to **4000ms** ≈ 15/min, under free RPM).
  DELAYS not rejects, so grading self-throttles and succeeds; no-op in prod (interval 0). The Upstash
  global ceiling (Layer B) still no-ops until Upstash is configured. The X-Prize gifted/pro key
  removes the limit entirely — then the pacer can be turned off (set interval 0) for full-speed bulk.
- **Dev-mode posture: do NOT burst-grade.** With pacing on, grading is slower but safe. Reserve heavy
  grading for when the billed key is in place.

## Remaining to recordable demo
Finish re-grading Tyler + Sofia (Gatsby), then grade the other hero assignments (MLK a5519005:4,
Necklace a5519003:2, social-media a5519002:2) — PACED or with the billed key. Then:
confirm **Brandon Davis** (jump-shot essay) is **withheld** (`needs_review`, score floored — the
trust moment), apply HITL accept/edit/dismiss on a few, **Finalize** one or two → Metrics populates →
demo is recordable. Walk `docs/DEMO-SARAH-MARTINEZ.md` for the script mapped to the 5 critical moments.

## Why
The marquee X-Prize claim — *"output looks like the teacher graded it"* — was the #1 goal-alignment
gap (`.planning/GOAL-ALIGNMENT-REVIEW.md`). It's now proven *in principle* (Sofia in Sarah's voice
on live code), but the demo needs (a) calibrated scoring (deploy fixes) and (b) reliable grading of
the full set (pro billing) before recording. Everything code-doable is done.

## Open threads (not blocking the demo recording)
- **Old test classes coexist** under this account (Luke / two "English" / "Unassigned" — incl. the
  verified oil-change off-topic + Stanley HITL artifacts). Sarah's 6 classes show alongside them.
  Ask the user before deleting — the oil-change/Stanley are durable trust-demo assets.
- `build-style-profile` edge fn targets `gemini-2.5-pro` (quota=0) and may be undeployed → add a flash
  fallback / `GEMINI_STYLE_MODEL` if you want to regenerate Sarah's voice from samples live later.
- **OAuth profile-bootstrap migration** (`supabase/migrations/20260522000000_oauth_profile_bootstrap.sql`)
  still unapplied — apply before relying on Google sign-in. `ensureUserProfile` 403s in console.
- Stale `Grading failed` over a valid grade (engine.ts behavior) — see goal-review punch list HIGH #2.

## Do not
- (OBSOLETE as of 2026-05-30) ~~Do NOT retry grading on flash — quota exhausted, wait for pro.~~
  Two fresh flash keys are now in rotation; flash grading works once the function is redeployed.
- Do NOT delete the old test classes / oil-change / Stanley artifacts without explicit user OK — they
  are verified trust-demo assets per memory + the May-22/23 verify session.
- Do NOT deploy `grade-submission` without `--no-verify-jwt` — the fn is live with that flag and the
  default would change its auth posture; permission-gated by the auto-mode classifier (intentional).
- Do NOT apply `supabase/migrations_v2/0001_baseline.sql` to cloud — it's a clean-room reference.
- Do NOT re-grade an essay before the dedup fix is deployed — it'll duplicate annotations.
- Do NOT commit secrets (DB password, Stripe key, Gemini key) — they go to `supabase secrets set` only.

## Key artifacts (cold-read order)
1. This file (`.planning/continue.md`)
2. `.planning/STATE.md`
3. `.planning/GOAL-ALIGNMENT-REVIEW.md` — full demo/X-Prize/beta punch list + verdict
4. `docs/DEMO-SARAH-MARTINEZ.md` — exact demo script + recording steps
5. `scripts/seed-demo-sarah-martinez.sql` — reproducible seed (idempotent + UNDO)
6. `~/.claude/projects/-Users-lukemladenoff/memory/project_grade_mirror.md` — cross-session memory

## Running process
- Vite dev server on `:8080` (background, intentional). Restart with `npm run dev`.
- Supabase CLI linked to `yhdobsmmhdvqswjpousc`; teacher logged in as `test.teacher@school.edu`
  (now displayed as Sarah Martinez).
