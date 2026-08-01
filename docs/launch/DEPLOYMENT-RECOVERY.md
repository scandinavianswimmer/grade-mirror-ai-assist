# aiTA deployment recovery — founder runbook

Verified context: **August 1, 2026**

Organizer approval to proceed was confirmed by the founder on August 1, 2026. Use this runbook to restore the production path without weakening the release gates. The release candidate is draft PR [#30](https://github.com/scandinavianswimmer/grade-mirror-ai-assist/pull/30).

## Stop rules

- Do not deploy into the active Supabase project `zuazyrqrktlfgtncpeei`; it belongs to another application.
- Do not restore or migrate `rwiqwuohbcvhuvtlxlvh` merely because it appears in `supabase/config.toml`. That ref describes the older Grade Mirror architecture; later production records consistently identify `yhdobsmmhdvqswjpousc` as the live v1-plus-v2 environment.
- At the start of this audit, ignored CLI state linked the sprint worktree to unrelated active project `zuazyrqrktlfgtncpeei`. That link was removed on August 1; bare remote commands now fail closed. Do not recreate a default link until the intended production account and ref are confirmed.
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

No custom domain has been purchased. Use `https://aita-5aca5.web.app` as the launch origin only after the Firebase project is confirmed and the deployed site passes the acceptance gate. Keep custom-domain fields visibly marked as pending; do not configure or advertise `aita.app` unless it is later purchased and ownership is verified.

In Supabase Auth, add the exact recovery redirect URL for every origin that will be tested:

```text
http://localhost:4173/auth/reset-password
https://aita-5aca5.web.app/auth/reset-password
https://<purchased-and-verified-domain>/auth/reset-password   # later, not tonight
```

The app derives the recovery redirect from `window.location.origin`; it does not hard-code an unowned domain. Set server secrets directly on the confirmed Supabase project. Ensure `ALLOWED_ORIGINS` includes the final Firebase origin. Then run the full gate with Node 22:

```sh
nvm use
npm ci
npm run verify
npm run build
```

If the remote schema or functions differ from the reviewed migration history, stop and reconcile them before deployment. Do not make the frontend tolerant of an unknown production schema merely to get a demo running. Confirm that additive migration `0022_training_examples_reinforcement.sql` is present before testing the learning loop; it reconciles the legacy required `rubric` field with the v2 `rubric_text`/`source` shape used by consented reinforcement writes.

## 4. Deploy deliberately

Deploy only the functions whose source and required migrations were reviewed. The exact function set depends on the remote inventory from step 2; do not blindly redeploy every legacy function.

The current CI deploy loop ships 9 of the repository's 16 edge entrypoints. The frontend also invokes omitted functions including `create-class` and `rebuild-exemplars`, alongside older grading/count functions that should not automatically be revived. Before release, create an explicit modern runtime manifest: either review and add each required function to CI, or remove/replace its caller. A green frontend build is not evidence that these server calls exist in production.

After the backend is verified, deploy the already-built `dist/` directory to the confirmed Firebase project:

```sh
firebase deploy --only hosting --project aita-5aca5
```

Record the deploy output, release time, public URL, and Git commit. A successful CLI exit is not release proof.

## 5. Exact-release acceptance gate

All of these must pass against the public URL in a private browser session:

- The release SHA shown in the evidence record matches the deployed branch head.
- `/`, `/pitch`, `/pricing`, `/privacy`, `/terms`, `/auth`, `/auth/forgot-password`, and an unknown route load without console or network errors.
- A password-reset request returns the account-enumeration-safe confirmation, its emailed link opens `/auth/reset-password`, an expired link fails safely, and a valid link can update the password once without exposing credentials in logs or screenshots.
- VoiceOver exposes the same named landmarks, headings, form controls, links, route announcements, and dialog behavior verified locally; keyboard focus returns to every dialog trigger.
- Safari at exactly 200% zoom and macOS Increase Contrast preserve navigation, control boundaries, readable content, and operability without horizontal clipping. Restore both host settings after the check.
- Privacy and Terms remain visibly labeled previews until the effective date, legal entity, privacy/support contact, final counsel review, and any purchased domain are real and verified.
- A fresh judge account can sign in without access to any real student data.
- Upload or paste a privacy-safe fixture; the demonstrated grading path reaches Gemini through the deployed backend.
- An on-topic fixture returns rubric-grounded evidence and persists the grade and annotations.
- An off-topic fixture is withheld or routed for review rather than silently scored.
- Accept, edit, and dismiss persist after a reload; no grade is described as auto-finalized without explicit provenance.
- Production logs contain a timestamped Gemini request/trace for the exact release, with student content and credentials redacted.
- Security headers from `firebase.json` are present on the public response.
- The final public URL returns HTTP 200 from a clean network request.

Only after this gate passes should you create judge credentials, record the under-three-minute video, or convert draft claims into production claims.
