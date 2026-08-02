# Mr Selby — judge map

Mr Selby makes the first pass through an essay stack without taking the teacher's judgment out of
the work. It uses the assignment, rubric, and student paper to draft scores and margin notes. The
teacher reviews, revises, and approves the result.

This file is the judge-facing source of truth for the submitted release. Roadmaps, marketing drafts,
historical product names, and seed plans elsewhere in the repository are not production evidence.

## Start here: The Teacher's Test

Public route: `https://mrselby.app/judge`

The 90-second path asks four questions:

1. **Does the draft follow the assignment and rubric?** Compare the fictional strong response with
   the claim, evidence, and reasoning requirements.
2. **Can it point to evidence in the paper?** Inspect the exact passages and the illustrative margin
   note attached to the response.
3. **Does it stop when the work should not be graded?** Inspect the deliberately off-topic response.
   The safe state proposes no score and asks the teacher to look more closely.
4. **Can the teacher revise every margin note before approval?** Accept, edit, or dismiss the fictional
   draft note. This public interaction is local-only; production persistence is reported separately.

The entire public walkthrough uses the repository's original `The Beacon Ledger` fixture. It contains
no real student, teacher, school, customer, account, contact detail, or backend identifier.

## Evidence report card

Replace a row only with evidence from the exact final release. Until then, the required wording is
**Not captured for this release**.

| Claim | Public status | Primary evidence |
|---|---|---|
| Final release SHA | **Not captured for this release** | Final Git commit and release manifest |
| Cloudflare Worker/deployed version | **Not captured for this release** | Cloudflare deployment export |
| Final CI run | **Not captured for this release** | GitHub Actions run for the same SHA |
| Protected judge account | **Not captured for this release** | Private Devpost testing instructions |
| Gemini model in the deployed path | **Not captured for this release** | Privacy-safe request record plus private log |
| Google Cloud product serving the deployed path | **Not captured for this release** | Google Cloud dashboard/log export |
| Day-to-day business workflow operated by AI | **Not captured for this release** | Continuous execution window with key decisions, human escalation, failures, and skips |
| Trace or job ID | **Not captured for this release** | Redacted production trace |
| Teacher decision persisted after reload | **Not captured for this release** | Video timestamp and database/log evidence |
| Independent and paying users, role breakdown, and consented feedback | **Not captured for this release** | Dated source export plus private consent/contact records |
| Arms-length revenue and monthly breakdown | **Not captured for this release** | Payment/bank export and P&L |
| Total expenses including marketing | **Not captured for this release** | P&L plus source receipts/ledger |
| Teacher Time Ledger result | **Not captured for this release** | Completed protocol and signed-off ledger |

An explicit, source-verified zero is valid evidence. A fixture, local test, seed account, founder
payment, planned integration, or code path is not a production result.

## AI and teacher boundary

The intended deployed grading workflow is:

1. extract the submission text;
2. check relevance, sufficiency, and risk;
3. interpret the rubric and draft criterion-level results;
4. verify and anchor evidence in the paper;
5. draft margin notes and a feedback summary; and
6. present the work for teacher accept, edit, dismiss, and approval decisions.

The AI may propose rubric results and decide that a response must be withheld for review. The teacher
can accept, rewrite, or dismiss each margin note and determines when review is complete. The current
workspace does not offer a direct, audited score editor, so this release does not claim one. `Approved` does not
mean delivered to a student. Any eligible automatic approval must be explicitly enabled by the
teacher and recorded with provenance; it is not claimed unless the final release proves it.

For this competition, the grading pipeline must also be evidenced as a real day-to-day business
operation: which agent executes which key decision, when a person takes over, how often it ran, and
what failed or skipped. A one-time fixture run proves a product path, not continuous AI-native
operations. Support, marketing, or other AI workflows are named only if they actually ran in the
submitted business and have the same production receipts.

## Architecture boundary

- **Public delivery:** React, TypeScript, Vite, and Cloudflare Workers Static Assets.
- **Protected application:** Supabase Auth, Postgres, private Storage, and Edge Functions when a final
  approved project is connected.
- **AI path:** Google Gemini and the named Google Cloud service only when the exact deployed release is
  backed by timestamped production evidence.
- **Evidence:** public release metadata acts only as a locator. Private logs, credentials, customer
  records, and financial documents remain outside the browser and public repository.

## Protected testing instructions

Do not place judge credentials in this repository. Provide them only through Devpost's private testing
instructions after the following path passes in a clean browser against the final release:

1. sign in with the disposable judge account;
2. open the clearly marked synthetic workspace and `The Beacon Ledger` assignment;
3. run one on-topic response and inspect rubric and evidence anchors;
4. open the off-topic response and confirm that no score is proposed;
5. accept one note, edit or dismiss another, approve the result, and reload; and
6. reconcile the visible trace locator with the private production evidence.

## Known limits

- Judge Mode is a fictional, public interface demonstration. It is not a protected product session.
- Missing release, model, Google Cloud, trace, persistence, user, revenue, or study evidence is shown
  as **Not captured for this release**.
- Privacy and Terms remain launch previews until their visible placeholders are replaced and reviewed.
- Accessibility work targets WCAG 2.2 Level AA but is not represented as independent certification.
- Historical planning files may describe targets that changed. This file and
  [`docs/launch/XPRIZE-SUBMISSION.md`](docs/launch/XPRIZE-SUBMISSION.md) govern submission claims.

## Submission artifacts

- [`docs/launch/DEVPOST-DRAFT.md`](docs/launch/DEVPOST-DRAFT.md) — evidence-gated narrative
- [`docs/launch/PROOF-NOT-PITCH-VIDEO.md`](docs/launch/PROOF-NOT-PITCH-VIDEO.md) — sub-three-minute script
- [`docs/launch/TEACHER-TIME-LEDGER.md`](docs/launch/TEACHER-TIME-LEDGER.md) — blank study protocol
- [`docs/launch/DEVPOST-GALLERY-BRIEF.md`](docs/launch/DEVPOST-GALLERY-BRIEF.md) — three-criterion gallery
- [`docs/launch/XPRIZE-SUBMISSION.md`](docs/launch/XPRIZE-SUBMISSION.md) — final gate and evidence boundary
- [`docs/launch/AI-CAPABILITY-TRUTH-MAP.md`](docs/launch/AI-CAPABILITY-TRUTH-MAP.md) — claim-to-code and deployment boundary

## Local verification

```sh
nvm use
npm ci
npm run verify
```

The public-preview build intentionally excludes the authenticated app and its Supabase/PostHog
dependencies when the service configuration is absent.
