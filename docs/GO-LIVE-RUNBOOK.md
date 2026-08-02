# Mr Selby — protected-product go-live runbook

Verified context: **August 1, 2026**

The public site is already live at [mrselby.app](https://mrselby.app). Release commit `ded09a610998ae79bfdd5d9fd21d8a464d6b5ab2`, tag `mr-selby-public-queue-2026-08-01`, is deployed as Cloudflare Worker version `ab130f6c-4cc7-449f-bc8e-3f732b735e34`. [GitHub Actions run 30736141654](https://github.com/scandinavianswimmer/grade-mirror-ai-assist/actions/runs/30736141654) passed the exact-release gate with 295 tests, seven-route accessibility coverage, and the frozen Deno check of every Edge Function.

That deployment is intentionally a **public-only preview**. It contains no connected authentication, classroom data, billing, or production grading service. This runbook begins only after the owner approves an isolated backend and its exact cost.

## 0. Stop rules

- Do not reuse a Supabase project belonging to another application.
- Do not use a project reference, account, password, connection string, or migration assumption copied from historical aiTA or Grade Mirror notes.
- Do not create a paid resource until the intended organization, quoted cost, and resulting project have explicit owner approval.
- Do not run `supabase db push`, raw SQL, seed scripts, or function deployments until the target is verified twice and the fresh-project schema plan has passed review.
- Do not place access tokens, database passwords, service-role keys, Gemini keys, Stripe secrets, cron secrets, or judge credentials in the repository, `.env*`, command history, PR text, screenshots, or Devpost.
- Do not accept real student data during acceptance testing. Use an original, clearly synthetic fixture.
- Do not call the protected product live until every required check in section 7 passes against one recorded release.

## 1. Preserve the working public preview

Before backend work, record the current release and verify the safe fallback remains available:

```sh
git status --short
git rev-parse HEAD
gh run view 30736141654 --json status,conclusion,headSha,url
npx wrangler deployments list --name mr-selby --json

curl -I https://mrselby.app/
curl -I http://mrselby.app/privacy
curl -I https://www.mrselby.app/terms
```

Expected baseline:

- the evidence record maps public-preview commit `ded09a610998ae79bfdd5d9fd21d8a464d6b5ab2` and tag `mr-selby-public-queue-2026-08-01` to the Worker deployment below, even if the working branch has since advanced;
- Worker version `ab130f6c-4cc7-449f-bc8e-3f732b735e34` receives 100% of traffic;
- the apex HTTPS URL returns 200;
- plain HTTP and `www` return permanent redirects to the equivalent apex HTTPS URL; and
- the public site continues to show the guarded setup state rather than accepting account or classroom data.

Save privacy-safe command output in the private submission evidence bundle. Do not commit account identifiers from provider output.

## 2. Approve and identify the backend

Before creating anything, record privately:

| Field | Required value |
|---|---|
| Supabase organization | Owner-confirmed organization name and ID |
| Quoted project cost | Exact provider quote and billing cadence |
| Cost approval | Owner confirmation and timestamp |
| Project identity | New project name, reference, region, and creation timestamp |
| Data classification | Synthetic acceptance data only until launch approval |

After creation, verify the project explicitly on every remote command:

```sh
supabase projects list
supabase functions list --project-ref <APPROVED_PROJECT_REF>
supabase link --project-ref <APPROVED_PROJECT_REF>
supabase migration list --linked
```

Stop if the organization, project reference, region, or remote inventory differs from the private approval record. Never fall back to whichever project happens to be linked locally.

## 3. Review the fresh-project schema path

The repository contains both legacy migrations and a later `migrations_v2` history. Historical production notes described a restored v1 database with additive v2 changes; that state must **not** be assumed for a fresh project.

Before applying SQL:

1. inventory every migration and its dependencies;
2. identify which file creates each table, column, policy, bucket, function, trigger, and extension used by the current frontend and Edge Functions;
3. prove the proposed sequence against a disposable local or isolated test database;
4. run schema, RLS, storage-isolation, billing-quota, grading, reinforcement, erasure, and retention tests;
5. document the approved ordered file list and checksums; and
6. take a pre-change remote schema and migration snapshot.

Do not apply the historical “only these migrations are pending” instructions from older runbooks. Do not assume `0001_baseline.sql` is sufficient merely because it is named baseline. Use only the sequence proven for the actual empty project.

## 4. Configure auth, origins, and secrets

Add the exact allowed URLs in Supabase Auth:

```text
http://localhost:4173/auth/callback
http://localhost:4173/auth/reset-password
https://mrselby.app/auth/callback
https://mrselby.app/auth/reset-password
```

Configure server secrets in the provider's secret store, never in the frontend environment:

| Secret | Purpose |
|---|---|
| `GEMINI_API_KEY` | Gemini grading and style requests |
| `GEMINI_GRADING_MODEL` | Reviewed grading model name |
| `GEMINI_STYLE_MODEL` | Reviewed style model name, if overridden |
| `CRON_SECRET` | Authenticates the retention/privacy schedule |
| `ALLOWED_ORIGINS` | Must include `https://mrselby.app` and only approved local origins |
| `INTERNAL_GRADE_SECRET` | Required only if the reviewed Cloud Run queue worker is deployed |
| Upstash values | Required only if asynchronous queue grading is enabled |
| Stripe values | Required only if live billing is enabled and tested |

Supabase injects its own server-side platform values. Do not manually copy platform service credentials into client configuration.

## 5. Approve an explicit Edge Function manifest

The current frontend directly invokes functions that are not all present in the CI deployment loop. Inventory callers before deployment:

```sh
rg -n "functions\.invoke|/functions/v1/" src worker deploy
find supabase/functions -mindepth 1 -maxdepth 1 -type d -not -name _shared -exec basename {} \; | sort
```

The reviewed manifest must account for these current call sites and retained historical entry points:

- core grading and ingestion: `grade-submission`, `grade-enqueue`, `ingest-document`;
- style and learning: `build-style-profile`, `rebuild-exemplars`, `generate-style-summary`;
- account/data controls: `create-class`, `delete-data`;
- entitlements and billing: `increment-feedback-count`, `stripe-checkout`, `stripe-portal`, and `stripe-webhook` when billing is enabled;
- scheduled operations: `privacy-tasks` with its secret-gated schedule; and
- retired historical entry points: `generate-grading-feedback` and `test-ai-grading` remain in the repository for auditability, but have no active protected route and are explicitly excluded from the reviewed CI deployment manifest. Do not add either function back to the runtime manifest.

Also review `record-feedback-usage` and any worker-only internal route. Do not deploy every repository directory by default, and do not leave a live frontend caller pointing to an absent function.

The historical Canvas client is not part of the reviewed product boundary. `/lms` and
`/lms/callback` redirect to the canonical dashboard, and their legacy source remains only for
auditability. Do not restore those routes or claim LMS sync, grade return, or student delivery until
the integration has its own server-side credential design and production acceptance evidence.

For each approved function, record source commit, JWT policy, required migrations, secrets, caller, deployment version, and rollback command. Deploy by explicit project reference or a verified link, one reviewed function at a time.

## 6. Build the configured frontend

Create a gitignored `.env.local` containing only public browser values:

```text
VITE_SUPABASE_PROJECT_ID=<APPROVED_PROJECT_REF>
VITE_SUPABASE_URL=https://<APPROVED_PROJECT_REF>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<CURRENT_PUBLIC_PUBLISHABLE_KEY>
```

Optional public analytics or contact settings may be added only after their destinations are real and monitored. Then run the complete gate under Node 22:

```sh
nvm use
npm ci
npm run verify
npm run cloudflare:dry-run
```

Inspect the built output and confirm it is the configured protected build rather than the public-only fallback. Record the resulting commit and asset hashes before deployment.

Deploy only after sections 2–6 pass:

```sh
npm run deploy:cloudflare
```

Immediately record the new Worker version. A successful deploy command is not acceptance evidence.

## 7. Exact-release acceptance gate

Run every check in a clean private browser session against `https://mrselby.app` and the same recorded release:

### Identity and public surface

- [ ] Release SHA, CI run, Worker version, migration record, and function versions are captured together.
- [ ] `/`, `/privacy`, `/terms`, account routes, recovery routes, and an unknown route render without framework overlays or unexplained console errors.
- [ ] HTTP and `www` redirects, canonical metadata, sitemap, robots, social image, and security headers remain correct.
- [ ] The final public repository commit or tag matches the deployed source and has the chosen licensing path.

### Authentication and privacy

- [ ] A fresh judge account can sign up, verify, sign in, and sign out without seeing another account's data.
- [ ] Password recovery works through a real emailed link; expired, malformed, reused, and context-free links fail safely.
- [ ] Privacy and Terms remain labeled previews until their entity, effective date, contact, jurisdiction, and legal review are real.
- [ ] Delete all my data recursively removes and re-verifies nested owned Storage objects before deleting related records and the auth identity.
- [ ] Retention tasks are secret-gated, owner-safe, and proven on synthetic expired/non-expired fixtures.

### Grading and teacher control

- [ ] Create a class, assignment, and rubric using a clearly synthetic fixture.
- [ ] PDF, DOCX, and text extraction report the observed confidence and fail safely on malformed input.
- [ ] An on-topic response reaches Gemini through the deployed Google Cloud path and persists rubric-grounded scores, evidence anchors, and annotations.
- [ ] An off-topic or risky response is withheld or routed for review rather than silently scored.
- [ ] Prompt-injection text does not override the assignment or rubric.
- [ ] Accept, edit, dismiss, bulk actions, and finalization persist after reload with accurate provenance.
- [ ] Teacher-style behavior appears only with explicit consent and the actual profile used by the request.

### Operations and accessibility

- [ ] Redacted logs include timestamps, model path, request or trace IDs, failures, and release identity without credentials or student content.
- [ ] Quotas, trial state, billing interval, checkout, portal, and webhook behavior match the visible plan copy if billing is enabled.
- [ ] VoiceOver, keyboard-only operation, exact 200% Safari zoom, Increase Contrast, 320px reflow, dialog focus return, and route announcements pass on the protected release.
- [ ] No real student data, seed persona, modeled time saving, or founder-funded purchase is presented as independent production evidence.

Only after every applicable item passes should the owner issue judge credentials, record the final video, or convert draft claims into production claims.

## 8. Rollback and evidence

- Keep the prior public-only Worker version available as the safe frontend rollback.
- Record database backup and restore procedures before migrations; do not improvise destructive down-migrations during an incident.
- Roll back functions individually to recorded versions if a server path fails.
- If grading or isolation is uncertain, remove the protected frontend configuration and redeploy the public-only preview. The product must fail closed rather than accept data into an unverified service.
- Preserve privacy-safe acceptance output, screenshots, logs, release mappings, revenue/user evidence, and the organizer ruling in the private submission bundle.

## Historical note — archival only

Earlier runbooks assumed access to a specific restored v1-plus-additive-v2 backend and listed direct database commands, test accounts, and a fixed migration subset. That environment is not the approved current target, so those instructions were removed from this active runbook. Git history preserves them for provenance; they are not authorization or evidence for the new release.
