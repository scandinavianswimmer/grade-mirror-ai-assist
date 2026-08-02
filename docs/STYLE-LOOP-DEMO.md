# Style-profile application demo — Mr Selby

This demo answers one narrow question: **Does the grading path apply a supplied teacher-style profile to
the draft?** It does not, by itself, prove that Mr Selby learned a teacher's voice, improved over time,
or converged on a real teacher's feedback.

Status on August 1, 2026: verified in the release-candidate code, not in the protected production path.
Record only after the backend, schema, Gemini call, and exact release are live and traceable.

## What the code path implements

- `supabase/functions/grade-submission/index.ts` reads
  `teacher_style_profiles.style_summary` for the grading teacher.
- `supabase/functions/_shared/grading/engine.ts` injects the profile into the grading-system prompt.
- The grading trace records whether a profile or approved style exemplars were applied.
- A missing profile is intended to leave the style stage unapplied rather than invent one.

These are repository facts. They are not deployment evidence.

## Synthetic profile

The canonical fixture in [`src/fixtures/syntheticDemo.ts`](../src/fixtures/syntheticDemo.ts) describes
an original coaching style: begin with a precise strength, distinguish evidence from explanation, ask
one focused question, prioritize ideas over minor mechanics, and end with a labeled revision move.

The profile is deliberately distinctive so an A/B can reveal whether the prompt path applied it. It is
fabricated and is not the voice of a real teacher or of the teacher who inspired the Mr Selby name.

## Safety gate before recording

The retired administrative style seed was removed from the active tree and is available only through
Git history. Apply the canonical profile only through a reviewed, consent-aware product path in
a disposable synthetic workspace. If that path is not available on the exact release, omit the style
comparison from the recording.

Before capture:

- [ ] Canonical backend and migrations are verified.
- [ ] Exact release is deployed and produces a traceable privacy-safe Gemini request.
- [ ] Synthetic demo account is isolated from real teacher and student data.
- [ ] Consent state is explicit and limited to the synthetic account.
- [ ] A/B procedure preserves the same essay, rubric, model route, and release.
- [ ] Profile-present and profile-absent states are confirmed from the trace, not inferred from tone.

## Controlled A/B procedure

1. Grade one synthetic essay without a style profile and save the output, trace ID, model, commit, and
   timestamp as the **baseline**.
2. Apply the reviewed canonical synthetic profile through the product's consent-aware path.
3. Re-grade the same essay with the same rubric and release; save the equivalent evidence as the
   **profile condition**.
4. Verify the trace reports profile application and that annotation anchors remain valid.
5. Present both outputs side by side. Highlight concrete language differences without claiming the
   profile made the grade more accurate.
6. Restore or dispose of the synthetic workspace using the verified data-deletion procedure.

Do not delete or alter a real teacher's profile to create the baseline.

## Evidence-safe narration

> Same synthetic essay, same rubric, same release. The baseline used no style profile. In the second
> run, the trace confirms that Mr Selby applied this synthetic teaching-style profile. The wording
> changed in the ways shown here. This demonstrates profile application; it does not yet demonstrate
> learning or convergence from real teacher behavior.

## What would prove learning

A real learning claim requires the consented profile-generation or exemplar loop to run on approved
teacher decisions, followed by a held-out evaluation. The pre-registered primary evidence is the stated
blinded voice-fidelity judge plus aggregated embedding and within-teacher holdout analysis. Edit-rate
decline may be reported only as a corroborating signal with sample size and method; it is not the
verdict, because teachers may accept AI feedback without editing it.

Editing one annotation can demonstrate that the product records a teacher decision. A seeded profile
can demonstrate that the grader applies a profile. Neither event alone proves that the system learned
the teacher.

## Remaining gaps

- The safe backend-neutral fixture is complete; the consent-aware live profile application still
  requires verification on the configured backend.
- `build-style-profile` must be deployed, traced, and tested against the configured production model.
- The profile update path from consented teacher decisions requires live evidence.
- No measured teacher-voice result belongs in the submission until the held-out evaluation is complete.
