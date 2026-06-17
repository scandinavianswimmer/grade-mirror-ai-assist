---
milestone: 2-launch-prove-compete
doc: week-1-founder-runbook
created: 2026-06-15
owner: founder (Luke)
status: action-required
---

# Week 1 Founder Runbook — the gated steps the agent can't do

Everything in `XPRIZE-MASTER-PLAN.md` Week 1 that requires **your** login, the DB password, a
deploy, payment setup, or a legal signature. The agent has built all the *code* for these; this is
the exact sequence to make it live. Do them **in order** — later steps depend on earlier ones.

> ⚠️ Project-ref check first. `supabase/config.toml` has `project_id = "rwiqwuohbcvhuvtlxlvh"`, but
> the May STATE.md referenced cloud project `yhdobsmmhdvqswjpousc`. **Confirm which project is live**
> (`supabase projects list`) and link to it (`supabase link --project-ref <REF>`) before running any
> `supabase ...` command below. Using the wrong ref is the one mistake that's hard to undo.

---

## 0. Pre-flight (2 min)

```bash
cd ~/grade-mirror-ai-assist
gh auth status                         # GitHub authed
supabase projects list                 # confirm the live project ref
supabase link --project-ref <REF>      # link if not already
```

---

## 1. Merge PR #14 → main  *(durability; gates the deploy)*

The agent is blocked from self-merging to the default branch. You run:

```bash
gh pr view 14 --json state,mergeable,title   # sanity: OPEN + MERGEABLE
gh pr merge 14 --merge                        # or merge in the GitHub UI
git checkout main && git pull --ff-only
```

This kills the single-point-of-failure (the full launch build only lives on `aita-launch-prep`
until merged) and gives you a clean `main` to deploy from.

> The auto-finalize + trial work (commits after PR #14) is on `aita-launch-prep` too. If you want it
> in the same release, either land it in PR #14 before merging or open a follow-up PR from the
> current branch. Check: `git log --oneline main..aita-launch-prep`.

---

## 2. Apply pending migrations  *(needs the DB password)*

The canonical migration set is `supabase/migrations_v2/` (it replaces the legacy `migrations/`).
Per the May STATE.md, **0003–0014 are applied**; **0015–0021 are pending**. The two newest (0020,
0021) are the agent's Week-1 builds. All are additive + idempotent + fail-open, so order within the
batch is safe, but apply the whole set:

| Migration | What it does | Unblocks |
|---|---|---|
| `0015_grading_quota_rpc.sql` | the atomic quota RPC | usage gating |
| `0016_rls_force_and_comments.sql` | FORCE RLS hardening | security posture |
| `0017_voice_convergence_instrumentation.sql` | batch + edit-rate columns | proof cohort |
| `0018_teacher_feedback_exemplars.sql` | few-shot voice exemplars | voice loop |
| `0019_grading_quota_monthly_caps.sql` | Free=15 / Pro=500 **monthly** caps | real Free-vs-Pro gating |
| **`0020_auto_finalize.sql`** | auto-finalize settings + `submissions.finalized_by` | **unattended grading** |
| **`0021_full_access_trial.sql`** | `users.trial_*` + trial Pro-cap in the RPC | **14-day trial** |

If your migration history is clean (only 0003–0014 recorded), push the set:

```bash
supabase db push          # applies every unrecorded migrations_v2/*.sql in order
```

If `db push` balks on history drift, apply the pending files directly against the DB (psql with the
project connection string), oldest-first, 0015 → 0021. Each is idempotent, so a re-run is safe.

**Verify after:**
```sql
-- auto-finalize columns exist
select column_name from information_schema.columns
 where table_name='privacy_settings' and column_name like 'auto_finalize%';
-- trial columns exist + a new-style default
select column_default from information_schema.columns
 where table_name='users' and column_name='trial_ends_at';
-- the quota RPC knows about trials
select proname from pg_proc where proname='consume_grading_quota';
```

---

## 3. Deploy the edge functions  *(deploy-gated; makes the trust-fix + auto-finalize live)*

`grade-submission` carries the trust fix **and** the new auto-finalize logic. Deploy it (and any
other changed functions). `grade-submission` is intentionally JWT-optional for the worker path:

```bash
supabase functions deploy grade-submission --no-verify-jwt
# if other functions changed this cycle, deploy them too, e.g.:
supabase functions deploy grade-enqueue privacy-tasks stripe-webhook
```

**Smoke test:** grade one submission in the app. With 0020 applied and auto-finalize on (default),
a high-confidence, on-topic essay should land **Finalized · "Auto-finalized by aiTA"** without a
manual approve; an off-topic/low-confidence one should land **Needs review**.

---

## 4. Stripe live  *(payment setup — founder only)*

1. In the Stripe dashboard, create the **Pro** product with two prices: **$15/mo** and **~$150/yr**.
2. Set the live price ids in the frontend env (see `pricingPlans.ts` — `VITE_STRIPE_PRICE_PRO_MONTHLY`
   / `VITE_STRIPE_PRICE_PRO_ANNUAL`) and the checkout function's secret config.
3. Set the Stripe **secret key** + **webhook signing secret** as function secrets:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=whsec_...
   ```
4. Point a Stripe webhook at the `stripe-webhook` function URL (events: `customer.subscription.*`,
   `checkout.session.completed`).

The trial needs **no** Stripe config to start (it's app-managed via `users.trial_ends_at`) — Stripe
is only the conversion path. So trials work the moment §2 lands; §4 is what lets a trial *convert*.

---

## 5. Compliance posture  *(see `docs/COMPLIANCE-POSTURE.md`)*

- ✅ **De-identification already shipped** — the agent confirmed `grade-submission` masks the
  student's name (length-preserving) **before** any essay text reaches Gemini, when
  `privacy_settings.anonymize_student_names` is on (default ON). See the posture doc for the exact
  code path and the residual-risk note (names inside the body are masked; other in-text PII is not).
- ☐ **ToS attestation + "newly created" eligibility paragraph** — drafted for you in the posture
  doc; paste into your Terms / submission narrative.
- ☐ **SDPC NDPA** — sign via the Student Data Privacy Consortium for the proof-cohort districts.

---

## 6. Recruit the proof cohort  *(real-human outreach — founder only)*

4–6 grades 9–12 ELA teachers under a school DPA. Outreach email + DPA stub drafted in
`docs/recruiting/` (chunk 3 deliverable). Longest-lead item — start this first, in parallel with
everything above.

---

## Definition of done for Week 1
- [ ] PR #14 on `main`; auto-finalize + trial branch reconciled
- [ ] Migrations 0015–0021 applied + verified
- [ ] `grade-submission` deployed; auto-finalize smoke test passes
- [ ] Stripe live; a test checkout converts a trial
- [ ] Compliance posture published; ToS attestation + eligibility paragraph live
- [ ] 4–6 proof-cohort teachers contacted; DPA out for signature
