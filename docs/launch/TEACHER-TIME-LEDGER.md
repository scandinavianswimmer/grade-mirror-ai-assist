# Teacher Time Ledger — blank evidence protocol

**Current result:** Not captured for this release.

This protocol measures review work; it does not assume that Mr Selby saves time or improves quality.
Report null, negative, and failed sessions. Do not fill the ledger with founder activity, seed users,
fictional participants, or retrospective estimates.

## Research question

For an independent teacher reviewing a fixed, original synthetic essay set, what time and teacher
intervention are observed with Mr Selby, and what errors or additional work occur?

The current `The Beacon Ledger` fixture may be used for a product-usability session. A causal
manual-versus-assisted time-savings claim requires a second matched original assignment/stack and a
counterbalanced protocol; reviewing the same papers twice creates a learning-order bias.

## Required release and consent gates

- [ ] Exact release SHA, deployed version, and UTC test window are recorded.
- [ ] Protected product acceptance passed before the session.
- [ ] The participant is an adult teacher and gave informed consent.
- [ ] Independent/founder-network relationship is recorded honestly.
- [ ] Permission to share testimonial wording and contact details is separate and explicit.
- [ ] Only original synthetic work is used; no student, school, or classroom data is collected.
- [ ] The facilitator script and task completion rule are fixed before the first timed session.
- [ ] Pauses, interruptions, technical failures, retries, and excluded time are recorded rather than removed silently.

## Core task

1. Open the assigned synthetic essay stack.
2. Review each draft score, criterion rationale, margin note, and withholding state.
3. Accept, edit, or dismiss each note as the teacher normally would.
4. Approve only when the result meets the teacher's standard.
5. Stop the timer when the predefined stack is complete or the session is abandoned.

The facilitator must not coach the participant toward accepting a suggestion or toward a faster time.

## Blank session ledger

Use pseudonymous participant IDs in working files. Store consent forms and contact information
separately in the private evidence bundle.

| Field | Value |
|---|---|
| Participant ID | — |
| Independent / related-party relationship | — |
| Teaching role and broad grade/subject band | — |
| Consent captured (private evidence locator) | — |
| Session date/time and timezone | — |
| Release SHA | — |
| Deployed version | — |
| Fixture/version | — |
| Condition (`assisted`, `manual`, or counterbalanced arm) | — |
| Timer start | — |
| Timer stop | — |
| Gross elapsed minutes | — |
| Recorded interruptions/excluded minutes | — |
| Net active minutes | — |
| Submissions assigned | — |
| Submissions completed | — |
| Draft notes presented | — |
| Notes accepted unchanged | — |
| Notes edited | — |
| Notes dismissed | — |
| Scores changed by teacher | — |
| Responses correctly withheld, in teacher's judgment | — |
| Responses incorrectly scored or withheld | — |
| Retries / technical failures | — |
| Task completed (`yes` / `no`) | — |
| Participant confidence (optional, defined scale) | — |
| Consent-approved feedback excerpt | — |
| Observer notes and evidence locator | — |

## Optional counterbalanced comparison

Do not use this comparison until two matched, original synthetic stacks exist.

1. Randomly assign participants to sequence **AB** or **BA**.
2. Condition A is the predefined manual workflow; Condition B is the same review standard with Mr Selby.
3. Use different but matched stacks for A and B.
4. Keep rubric complexity, response count, response-length bands, and off-topic/insufficient cases comparable.
5. Record sequence, stack assignment, washout/break, and deviations.
6. Report each condition's complete denominator, medians, range, failures, and missing observations.

With a very small sample, show individual observations and avoid statistical significance language.

## Calculations

Compute only from recorded fields:

- `net_active_minutes = gross_elapsed_minutes - documented_interruption_minutes`
- `minutes_per_completed_submission = net_active_minutes / completed_submissions`
- `unchanged_accept_rate = accepted_unchanged / draft_notes_presented`
- `teacher_change_rate = (edited + dismissed) / draft_notes_presented`
- `completion_rate = completed_submissions / assigned_submissions`

Do not convert these into “hours saved” without a valid comparison condition. Do not interpret a low
edit rate as voice fidelity or correctness by itself.

## Results table — leave blank until primary evidence exists

| Participant | Relationship | Condition / sequence | Completed | Net minutes | Minutes/submission | Accepted | Edited | Dismissed | Score changes | Withholding errors | Failures |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| — | — | — | — | — | — | — | — | — | — | — | — |

## Reporting language

Allowed when supported:

> Between `[START]` and `[END]`, `[N]` consented independent teachers completed `[N]` qualifying
> synthetic review sessions on release `[SHA]`. Median active review time was `[VALUE]` with range
> `[VALUE–VALUE]`. `[N]` sessions failed or were incomplete and remain in the denominator.

If there is no valid comparison condition, say:

> This protocol measured assisted review time only. It did not establish time saved versus the
> teacher's normal workflow.

If no qualifying session exists, say exactly: **Not captured for this release.**
