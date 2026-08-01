# aiTA deployment recovery — founder runbook

Verified context: **August 1, 2026**

Use this runbook only after deciding to continue aiTA outside the competition or after receiving a written organizer eligibility ruling. The release candidate is draft PR [#30](https://github.com/scandinavianswimmer/grade-mirror-ai-assist/pull/30).

## Stop rules

- Do not deploy into the active Supabase project `zuazyrqrktlfgtncpeei`; it belongs to another application.
- Do not restore or migrate `rwiqwuohbcvhuvtlxlvh` merely because it appears in `supabase/config.toml`. That ref describes the older Grade Mirror architecture; later production records consistently identify `yhdobsmmhdvqswjpousc` as the live v1-plus-v2 environment.
- Do not run a migration until the remote migration list and schema have been compared with `supabase/migrations_v2/`. The later environment was evolved additively and must not receive the clean-room baseline.
- Do not put access tokens, database passwords, Gemini keys, service-role keys, or judge credentials in `.env`, shell history, this repository, a PR, or the Devpost entry.
- Do not call a release “live” until the exact deployed commit passes the checks in the final section.

## 1. Recover the correct account access

The current CLI account can list inactive `rwiqwuohbcvhuvtlxlvh` but cannot see `yhdobsmmhdvqswjpousc`. Sign in interactively with the Supabase account or organization that owns the later production project:

```sh
supabase login
supabase projects list
```

Continue only if the output includes `yhdobsmmhdvqswjpousc` and its ownership, name, and region match the founder's records. If it does not, stop and recover the owning account or obtain a team invitation.

Firebase is also unauthenticated on this machine. Recover access and verify the configured project before any deploy:

```sh
firebase login
firebase projects:list
firebase use aita-5aca5
```

Continue only if `aita-5aca5` is visible under the intended Google account. The currently configured public URL returns HTTP 404.

## 2. Inspect before changing remote state

Open the existing `grade-mirror-xprize-sprint` worktree, then run:

```sh
git pull --ff-only
git status --short
supabase functions list --project-ref yhdobsmmhdvqswjpousc
supabase link --project-ref yhdobsmmhdvqswjpousc
supabase migration list --linked
```

Require a clean worktree and save privacy-safe output with the date and commit SHA. Compare the remote migrations with the additive v2 history. In particular, do **not** apply `supabase/migrations_v2/0001_baseline.sql` to the historical production database.

Before a public release, rotate every server-side secret previously shared in chat or old handoff notes: database password, Supabase secret/service-role keys, Gemini keys, Stripe secret keys, cron secret, and any other provider credentials. Use the provider dashboards or secret stores; never commit the values.

## 3. Build against the confirmed backend

Create a gitignored `.env.local` containing only public browser configuration:

```text
VITE_SUPABASE_PROJECT_ID=yhdobsmmhdvqswjpousc
VITE_SUPABASE_URL=https://yhdobsmmhdvqswjpousc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<current publishable key>
```

Set server secrets directly on the confirmed Supabase project. Ensure `ALLOWED_ORIGINS` includes the final Firebase origin. Then run the full gate with Node 22:

```sh
nvm use
npm ci
npm run verify
npm run build
```

If the remote schema or functions differ from the reviewed migration history, stop and reconcile them before deployment. Do not make the frontend tolerant of an unknown production schema merely to get a demo running.

## 4. Deploy deliberately

Deploy only the functions whose source and required migrations were reviewed. The exact function set depends on the remote inventory from step 2; do not blindly redeploy every legacy function.

After the backend is verified, deploy the already-built `dist/` directory to the confirmed Firebase project:

```sh
firebase deploy --only hosting --project aita-5aca5
```

Record the deploy output, release time, public URL, and Git commit. A successful CLI exit is not release proof.

## 5. Exact-release acceptance gate

All of these must pass against the public URL in a private browser session:

- The release SHA shown in the evidence record matches the deployed branch head.
- `/`, `/pitch`, `/pricing`, `/auth`, and an unknown route load without console or network errors.
- A fresh judge account can sign in without access to any real student data.
- Upload or paste a privacy-safe fixture; the demonstrated grading path reaches Gemini through the deployed backend.
- An on-topic fixture returns rubric-grounded evidence and persists the grade and annotations.
- An off-topic fixture is withheld or routed for review rather than silently scored.
- Accept, edit, and dismiss persist after a reload; no grade is described as auto-finalized without explicit provenance.
- Production logs contain a timestamped Gemini request/trace for the exact release, with student content and credentials redacted.
- Security headers from `firebase.json` are present on the public response.
- The final public URL returns HTTP 200 from a clean network request.

Only after this gate passes should you create judge credentials, record the under-three-minute video, or convert draft claims into production claims.
