# Mr Selby deployment recovery — founder runbook

Verified context: **August 1, 2026**

Organizer approval to proceed was confirmed by the founder on August 1, 2026. Use this runbook to restore the production path without weakening the release gates. The verified public-preview release was merged through PR [#30](https://github.com/scandinavianswimmer/grade-mirror-ai-assist/pull/30).

## Stop rules

- Do not deploy into `zuazyrqrktlfgtncpeei`; it belongs to another application.
- Do not restore or migrate either historical project `rwiqwuohbcvhuvtlxlvh` or `yhdobsmmhdvqswjpousc`. Both are unavailable, their current ownership and state are unverified, and neither is an approved Mr Selby production target.
- At the start of this audit, ignored CLI state linked the sprint worktree to unrelated active project `zuazyrqrktlfgtncpeei`. That link was removed on August 1; bare remote commands now fail closed. Do not recreate a default link until the intended production account and ref are confirmed.
- Do not run a migration until the remote migration list and schema have been compared with `supabase/migrations_v2/`. The later environment was evolved additively and must not receive the clean-room baseline.
- Do not put access tokens, database passwords, Gemini keys, service-role keys, or judge credentials in `.env`, shell history, this repository, a PR, or the Devpost entry.
- Do not call a release “live” until the exact deployed commit passes the checks in the final section.

## 1. Select the organization and approve cost

The current Supabase account exposes only an existing organization used for another project. The founder must first confirm whether that organization may host Mr Selby. Then follow the provider's cost-confirmation sequence: retrieve the exact project cost, report it, obtain explicit approval for that amount, and only then create a fresh isolated project.

```sh
supabase login
supabase orgs list
```

Do not interpret organizer approval, domain purchase, or a general request to launch as approval to spend money or to use an unrelated organization. Record the chosen organization, quoted cost, explicit approval, new project reference, and region in private release evidence.

Firebase is also unauthenticated on this machine. Recover access only if Firebase remains the chosen
fallback host:

```sh
firebase login
firebase projects:list
firebase use aita-5aca5
```

Continue only if `aita-5aca5` is visible under the intended Google account. The currently configured
public URL returns HTTP 404. The preferred frontend path is now Cloudflare Workers Static Assets at
`mrselby.app`; the Firebase identifiers remain unchanged only as historical infrastructure IDs.

## 2. Link the newly approved project

Open the existing `grade-mirror-xprize-sprint` worktree, then run:

```sh
git pull --ff-only
git status --short
supabase functions list --project-ref <new-project-ref>
supabase link --project-ref <new-project-ref>
supabase migration list --linked
```

Require a clean worktree and save privacy-safe output with the date and commit SHA. A fresh empty project should receive the reviewed clean-room schema path; do not mix the historical additive and clean-room histories. Review the remote migration inventory before every push.

Before a public release, rotate every server-side secret previously shared in chat or old handoff notes: database password, Supabase secret/service-role keys, Gemini keys, Stripe secret keys, cron secret, and any other provider credentials. Use the provider dashboards or secret stores; never commit the values.

## 3. Build against the confirmed backend

Create a gitignored `.env.local` containing only public browser configuration:

```text
VITE_SUPABASE_PROJECT_ID=<new-project-ref>
VITE_SUPABASE_URL=https://<new-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<current publishable key>
```

`mrselby.app` was purchased, delegated to Cloudflare, and attached to the `mr-selby` Worker on
August 1, 2026. The public-preview deployment created the apex DNS record and serves the marketing,
Privacy, Terms, and guarded setup routes over HTTPS. Do not add a competing A, AAAA, or CNAME
record. The protected product remains unavailable until the production backend is provisioned and
verified.

In Supabase Auth, add the exact recovery redirect URL for every origin that will be tested:

```text
http://localhost:4173/auth/reset-password
https://mrselby.app/auth/callback
https://mrselby.app/auth/reset-password
```

The app derives authentication redirects from `window.location.origin`. Set server secrets directly
on the confirmed Supabase project. Ensure `ALLOWED_ORIGINS` includes `https://mrselby.app`. Then run
the full gate with Node 22:

```sh
nvm use
npm ci
npm run verify
npm run build
```

If the remote schema or functions differ from the reviewed migration history, stop and reconcile them before deployment. Do not make the frontend tolerant of an unknown production schema merely to get a demo running. Confirm that additive migration `0022_training_examples_reinforcement.sql` is present before testing the learning loop; it reconciles the legacy required `rubric` field with the v2 `rubric_text`/`source` shape used by consented reinforcement writes.

## 4. Deploy deliberately

Deploy only the functions whose source and required migrations were reviewed. The exact function set depends on the remote inventory from step 2; do not blindly redeploy every legacy function.

CI now keeps an explicit reviewed manifest of all 16 top-level Edge Function entrypoints and fails if repository discovery differs from that manifest. Deployment remains disabled unless the repository variable `SUPABASE_DEPLOY_ENABLED` is exactly `true`; enabling it with incomplete credentials fails closed. Keep the switch off until the fresh project, schema path, function inventory, secrets, and redirect URLs have been reviewed.

After the backend is verified and the exact browser configuration is present, validate the staged
Cloudflare deployment without changing remote state:

```sh
npm run cloudflare:dry-run
```

Then deploy through an authenticated Cloudflare account. `wrangler.jsonc` binds the Worker directly
to `mrselby.app` with `custom_domain: true`, so Cloudflare creates the required DNS record:

```sh
npm run deploy:cloudflare
```

A backend-less build now intentionally serves only the public preview and a guarded setup page; it
does not accept accounts or classroom data. The first public-preview Worker version was
`5fa596e9-a8d5-40ab-84ef-1b01054890cf`, deployed August 1, 2026 from the release-candidate working
tree. Record a new Worker version after the changes are committed and redeployed. A successful CLI
exit is not proof that the protected product works. The first committed hardened preview was SHA
`55d6fe8a392ec4b35569ec84c52b9418ca2821c2`, Worker version
`672ba5d7-5ba9-4f49-ab49-a559866de3de`; it added canonical HTTP/`www` redirects, HSTS, the corrected
Cloudflare analytics CSP, route-aware canonical metadata, and the lean public-only build.

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
- Security headers from `public/_headers` are present on the public response.
- Plain HTTP and `www.mrselby.app` return permanent redirects to the equivalent canonical HTTPS apex URL.
- The final public URL returns HTTP 200 from a clean network request.

Only after this gate passes should you create judge credentials, record the under-three-minute video, or convert draft claims into production claims.
