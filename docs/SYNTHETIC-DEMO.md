# Synthetic competition demo — safe fixture and capture runbook

> **Synthetic-data-only.** Every passage, response, role label, rubric, style instruction, and
> feedback exemplar in this demo was written for Mr Selby. Nothing represents a real educator,
> learner, school, classroom, customer, or production result.

Status on August 1, 2026: the public site is live. The protected backend and production Gemini path
still require live verification. Prepare the fixture now; record model output only after the exact
release passes the production gate in [`docs/launch/XPRIZE-SUBMISSION.md`](launch/XPRIZE-SUBMISSION.md).

## Canonical fixture

[`src/fixtures/syntheticDemo.ts`](../src/fixtures/syntheticDemo.ts) is the single source of truth. It
contains:

- an explicit synthetic-data marker;
- the original passage **“The Beacon Ledger”** and its assignment rubric;
- five role-labeled responses spanning strong, partial, developing-language, insufficient-evidence,
  and off-topic scenarios; and
- an original coaching profile with two original feedback exemplars.

The fixture has no account identifier, contact detail, database key, backend field, network client, or
side effect. [`src/lib/sampleEssays.ts`](../src/lib/sampleEssays.ts) is a small adapter for the existing
product row shape. The authenticated product path supplies ownership at runtime. A future backend
should replace only that adapter, not the fixture.

Never add credentials or fixed account identifiers to the fixture. Keep the controlled demo account's
address, credentials, and generated identifiers in the approved secret manager or private evidence
folder—not in this repository.

## Safe preparation gate

Before loading or grading anything:

- [ ] The canonical protected backend and migration state are confirmed.
- [ ] The exact frontend and grading release are deployed and linked to logs.
- [ ] The demo uses a disposable workspace containing no real educator or learner data.
- [ ] The visible assignment title and body show the synthetic-data marker.
- [ ] The configured Gemini request succeeds through the intended production path.
- [ ] Evidence anchors, rubric totals, exception routing, and persisted review actions pass a live smoke test.
- [ ] Any style-profile claim is supported by the exact trace for the recorded run.

Do not use administrative SQL to bypass these gates. The retired seeds were removed from the active
tree; repository history is the only place to recover them if an audit ever requires it.

## Backend-neutral loading procedure

1. Sign in to the disposable demo workspace through the same protected product build judges will use.
2. On the empty dashboard, choose **Try the synthetic demo**. This invokes the normal authenticated
   application path and loads the canonical fixture once; it is idempotent by assignment title.
3. Open the assignment and confirm the marker, original source passage, rubric, and five `Synthetic
   learner` labels are visible. Stop if a person-like name or unrelated historical assignment appears.
4. Choose **Grade all** only after production logging is open. Save the release commit, timestamp,
   model route, and request/trace identifiers in the private evidence folder.
5. Inspect every output. Narrate observed behavior only. A scenario label is an input expectation, not
   proof of the model's disposition.
6. Exercise one accept, one edit or dismissal, and one teacher finalization. Reload and verify the
   decisions persist before recording.

There is no repository command that writes this fixture to an external service. The only supported
load is the explicit, signed-in product action above.

## Sub-three-minute capture

Use this sequence after the preparation gate passes. Rehearse with a local or disposable environment;
record only the verified production path.

| Time | Screen | Evidence-safe narration |
|---|---|---|
| 0:00–0:15 | Dashboard and synthetic marker | “This is an original synthetic fixture; no real learner or customer data is shown.” |
| 0:15–0:35 | Assignment, source, and rubric | “The same passage, instructions, and rubric travel with every response.” |
| 0:35–1:15 | Grade all and pipeline status | “Mr Selby drafts against the rubric. The trace shows which stages actually ran on this release.” |
| 1:15–1:45 | Strong response and evidence | Show one criterion, its exact source span, recomputed total, and confidence. Do not narrate a result not visible on screen. |
| 1:45–2:10 | Off-topic or insufficient response | “This response was handled as shown.” Use the observed disposition; do not promise a policy outcome in advance. |
| 2:10–2:40 | Teacher review | Edit or dismiss one annotation, finalize one result, reload, and show the persisted decision trail. |
| 2:40–2:55 | Style stage, only if traced | “This run applied the synthetic coaching profile.” Omit this shot unless the trace confirms it. |
| 2:55–3:00 | Close | “The model drafts; the teacher remains the final authority.” |

If grading latency makes the sequence exceed three minutes, pre-grade the exact synthetic set on the
exact release, then state that the results were generated immediately before capture. Do not splice in
outputs from another backend, model, schema, or commit.

## Claims boundary

After a successful live capture, the recording may demonstrate only what is visible and traceable:
rubric-grounded drafts, verified evidence anchors, the observed exception disposition, the recorded
pipeline stages, and persisted teacher decisions.

Always label the fixture and dashboard counts synthetic. Time-saved values are modeled unless backed
by a documented measurement. This fixture does **not** demonstrate real users, revenue, classroom use,
student outcomes, voice learning, voice convergence, or unattended reliability.

## Reset and rerun

Use the product's verified data-deletion flow or dispose of the entire synthetic workspace. Do not
publish credentials, export raw logs containing tokens, or add generated backend identifiers to the
fixture. Re-record if the release commit, backend, schema, model route, or review policy changes.
