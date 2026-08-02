# Mr Selby AI capability truth map

Status: code-reviewed 1 August 2026. No protected production backend is connected to the public
`mrselby.app` build, so every item marked **Implemented in source** still needs a signed-in production
round trip before it can be presented as production proof.

Model lifecycle check: Google currently documents `gemini-2.5-pro` and `gemini-2.5-flash` as stable
and has extended their Vertex AI retirement date to 16 October 2026. They are valid for this release,
but the protected launch plan must include a calibrated migration before that date.

This document is the release boundary between what the product says and what the grading system,
teacher workspace, and current deployment can actually demonstrate.

| Capability | Source behavior | Teacher-facing behavior | Release status |
| --- | --- | --- | --- |
| Gemini drafts a structured grade | `grade-submission` calls the shared Gemini router and requires schema-valid JSON. The router uses Gemini 2.5 Pro with Gemini 2.5 Flash fallback. | A completed run appears as a draft rubric result and margin notes. A model failure produces an explicit error rather than a canned grade. | **Implemented in source; production round trip unproven.** |
| The assignment and rubric ground the draft | The grading endpoint loads the assignment prompt, rubric, and class context before calling the grading engine. Missing grading context fails closed. | The protected review page shows the rubric scores beside the student manuscript. | **Implemented in source.** Do not claim that each individual note is linked to a rubric criterion; the annotation contract does not store that relationship. |
| Evidence is checked against the paper | The server verifies model-supplied evidence quotes against normalized essay text, caps unsupported criterion credit, recomputes totals, and anchors note ranges. | Matched notes highlight the exact passage. Unverified criterion evidence is labeled as needing a closer look. | **Implemented in source; production round trip unproven.** |
| Off-topic work is not graded | The relevance gate returns `off_topic` and `grade_withheld`, with no annotations and a review explanation. Auto-approval blocks on either flag. | The protected workspace says **Score withheld** and **No score proposed**. A teacher-readable export omits numeric totals and rubric pseudo-scores for withheld work. | **Implemented and regression-tested in source; production round trip unproven.** |
| Teachers control margin notes | Accept, edit, dismiss, and bulk decisions persist to Supabase; edit history is written to `annotation_edits`. | Teachers can inspect the passage, accept the wording, rewrite it, or dismiss it before approval. | **Implemented in source.** |
| Teachers control approval | Manual approval persists a distinct finalized state. Automatic approval is disabled by default and becomes eligible only when the teacher opts in and the result is high-confidence and flag-free. | The workspace distinguishes **Approved**, **Approved automatically · You turned this on**, and **Exported**. | **Implemented and unit-tested in source; migration and production proof pending.** |
| Approved feedback can be exported | The protected workspace generates a teacher-readable text file only after approval, then records a separate exported state. | Approval and export are two distinct actions. | **Implemented in source.** Do not claim LMS return, publishing, or student delivery. |
| Drafts can adapt to a teacher's feedback style | With explicit training consent, reviewed feedback can become a reinforcement example; the style profile and exemplar store are rebuilt for later prompts. The grading endpoint rechecks current consent on every run and omits both stores immediately after opt-out. | Teachers can add examples and control whether saved personalization is used in future drafts. Opt-out stops future prompt use; it does not itself erase stored rows. | **Implemented in source; longitudinal quality and production behavior unproven.** Do not claim a measured time-saving or convergence result without production evidence. |
| Student identity is minimized before Gemini | Simple student-name masking is on by default; an optional de-identification pre-pass exists. | Privacy copy must describe this as risk reduction, not guaranteed anonymization. | **Implemented in source; deployment configuration and production evidence unproven.** |
| Teachers can change rubric scores directly | The current protected page displays criterion and total scores but does not provide a persisted, audited score editor. | No direct score-edit control is shown. Teachers can redraft feedback or decide whether to approve it. | **Not implemented. Do not claim “adjust every score” or “change every consequential result.”** |
| Each margin note names its rubric criterion | The annotation schema stores the passage, offsets, comment, note type, matching state, and review state, but no criterion identifier. | Notes point to passages; rubric scores remain visible beside the paper. | **Not implemented. Do not claim a per-note rubric link.** |
| Protected teacher accounts work on `mrselby.app` | The public build omits the authenticated bundle when Supabase configuration is absent. | Authentication routes say teacher workspaces are closed. | **Not deployed.** The public sample is fictional and must stay labeled as such. |

## Release wording rules

Public copy may say:

- “draft rubric scores and margin notes”;
- “inspect proposed rubric scores and the passages behind each margin note”;
- “accept, edit, or dismiss each margin note before approval”;
- “automatic approval is optional and off by default”; and
- “approved feedback can be exported” only when the protected source behavior is clearly separated
  from the fictional public preview.

Public copy must not say:

- that teachers can directly adjust every score;
- that every note is linked to a named rubric criterion;
- that feedback is sent to an LMS or student;
- that production Gemini, persistence, identity masking, or protected accounts have been proven; or
- that Mr Selby saves a measured amount of time or already learns a teacher's style in production.

## Production proof still required

Before reopening teacher accounts, capture one privacy-safe signed-in journey against the canonical
backend: create an assignment and rubric, upload fictional work, complete a Gemini draft, verify the
grade and annotations persisted, review a note, approve, export, reload, and confirm every state. Run
the off-topic fixture in the same environment and verify that no numeric score can leak into the review
or export surfaces. Record the exact frontend commit, migration inventory, function versions, model ID,
and release timestamp without exposing student content or secrets.
