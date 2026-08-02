# Synthetic demo account — Sarah Martinez

> **Synthetic-data-only runbook.** Sarah Martinez, the students, essays, school, classes, assignments,
> style profile, and training examples are fabricated demonstration data. Never present them as a real
> teacher, real users, a real school, customer activity, or production traction.

Status on August 1, 2026: the public Mr Selby preview is live, but the protected backend and production
Gemini path are not verified. Do not seed, grade, or record this demo until the canonical backend is
provisioned and the exact release passes the live gate in `docs/launch/XPRIZE-SUBMISSION.md`.

## Design constraints

1. **Generate annotations through the grader.** Annotation rendering depends on offsets into the essay
   text, and the grading path validates evidence anchors. Do not hand-author output and call it a model
   result.
2. **Keep the demo isolated.** Use a dedicated synthetic account and database. Never run a seed script
   against a real teacher or production classroom account.
3. **Label scaffolding on screen.** Class counts and roster volume are illustrative metadata. The queue
   contains a small curated set of complete synthetic essays, not a real grading week.
4. **Do not use the seed as learning evidence.** The seed writes the style summary directly. It can
   demonstrate application of a profile, not that Mr Selby learned or converged on a real teacher's
   voice.

## Step 1 — Provision a controlled demo account

- Use an inbox the launch owner controls and monitors. Keep the address and credentials in the private
  evidence folder or secret manager, not in this repository.
- Do not invent or publish an `@mrselby.app` address until mail delivery is configured and monitored.
- Confirm the account is disposable, contains no real student data, and belongs to the canonical
  backend.
- Record the user UUID privately and verify it twice before any administrative seed operation.

The old `sarah.martinez.demo@aitaedu.ai` address and hard-coded Supabase host in the seed script are stale
and must not be used as launch instructions.

## Step 2 — Review the seed before running it

`scripts/seed-demo-sarah-martinez.sql` currently contains a hard-coded teacher UUID, a stale backend
reference, fabricated profile data, and a consent-setting write. **Do not run it as written.** Before a
separate implementation task updates it:

- remove the default UUID and require an explicit demo-account UUID;
- remove stale host and email instructions;
- add an unmistakable synthetic-data marker visible in the product;
- confirm every row is scoped to the disposable account;
- inspect the transaction and undo path; and
- take a recoverable backup of the isolated demo data.

Administrative SQL bypasses normal row-level access controls. That is a reason for extra review, not a
shortcut around the product's live acceptance gate.

## Step 3 — Verify the exact grading release

Before generating any capture:

- [ ] Canonical Supabase project and migration state are confirmed.
- [ ] Exact release commit is deployed and linked to production logs.
- [ ] Privacy-safe Gemini call succeeds through the configured Google Cloud path.
- [ ] Assignment context, rubric synthesis, evidence anchoring, and duplicate prevention pass live smoke tests.
- [ ] Teacher review is the default; any automatic finalization shown is explicitly enabled and persists provenance.
- [ ] Style-profile application and agent-event display are verified in the deployed schema.

Do not rely on an assumed model tier, quota, or fallback. Capture the model and request identifier that
the production trace actually reports.

## Step 4 — Generate capture candidates

After the gates pass, use the synthetic Gatsby and MLK assignments to produce candidate outputs. Verify
each result before including it:

- The on-topic essays receive rubric-grounded drafts with valid evidence anchors.
- The synthetic basketball response is routed to review or withheld as expected.
- The extremely short response is routed according to the live policy.
- Any integrity or risk indicator shown is supported by the exact trace; do not predict or stage one.
- Accept, edit, dismiss, and finalize actions persist after reload.
- The style stage reports profile application only when the seeded profile was actually used.

If any result differs, update the script or narration to the observed behavior. Do not hide the failure
or replace it with a fabricated screenshot.

## Step 5 — Evidence-safe demo flow

1. **Open the dashboard.** Say: “This is a synthetic teacher workspace with six illustrative classes
   and 14 sample essays.” Do not call the class counts real students.
2. **Open the synthetic Gatsby batch.** Show the visible rubric, relevance/risk, grading, annotation,
   summary, and style stages from the exact release.
3. **Show exception handling.** Open the synthetic off-topic response and narrate only its observed
   disposition.
4. **Show style-profile application.** Compare a generic baseline with output produced using the seeded
   profile. Say “the profile changed the draft,” not “the system learned Sarah.”
5. **Show teacher controls.** Accept, edit, dismiss, and finalize; show the saved edit trail after reload.
6. **Show operational metrics carefully.** Graded count, edits, and turnaround come from the synthetic
   run. The dashboard's time-saved value is a model based on fixed per-submission assumptions, not a
   measured before/after result.

## What the recording may claim

- **Demonstrated after live capture:** the exact release produced the shown grades, annotations,
  evidence anchors, disposition, pipeline trace, style-profile application, and persisted teacher edits.
- **Synthetic:** every identity, essay, class, assignment, training example, count, and dashboard row in
  this account.
- **Modeled:** estimated time saved.
- **Not demonstrated by this seed:** real users, real student use, revenue, student outcomes, voice
  learning, voice convergence, or unattended operation beyond rows with explicit provenance.

## Remaining gaps

- The current seed script is unsafe as a launch command because it embeds stale connection/account
  instructions and a default UUID.
- The style summary is inserted directly, so the demo bypasses `build-style-profile`.
- `build-style-profile` and the consented edit-to-profile loop require live testing before they appear in
  narration.
- The demo must be re-recorded if the release commit, backend, schema, model path, or policy changes.
