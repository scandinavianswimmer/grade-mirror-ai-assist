# Mr Selby — paste-ready Devpost draft

> **Do not submit with brackets.** Every bracketed token is a factual stop gate. Replace it with
> dated primary evidence or an explicit verified zero. The public preview is live, but the contest
> entry still requires the protected Gemini/Google Cloud journey to be deployed and evidenced.

## Core fields

| Field | Paste-ready value |
|---|---|
| Project name | Mr Selby |
| Tagline | Thoughtful grading support, shaped by how you teach. |
| Category | Education & Human Potential |
| Public URL | https://mrselby.app |
| Repository | https://github.com/scandinavianswimmer/grade-mirror-ai-assist |
| Release tag | `mr-selby-public-preview-2026-08-01` |
| Video | `[PUBLIC_UNDER_3_MINUTE_VIDEO_URL]` |
| One-line summary | Mr Selby uses Gemini to draft rubric-aligned, evidence-backed essay feedback in a teacher's voice while keeping every final decision with the teacher. |

Suggested social copy:

> Meet Mr Selby: a teacher-controlled grading co-pilot that follows the assignment, grounds feedback
> in the rubric and student text, learns from explicit teacher edits, and routes uncertain work back
> for review.

## Project description — target 700–850 words

Teachers do not need another generic chatbot. They need help with a specific, repetitive, high-stakes
part of the job: returning useful feedback on student writing while staying consistent with the
assignment, the rubric, and their own standards. A fluent answer can still be wrong when it overlooks
the prompt, invents textual evidence, or speaks in a voice the teacher would never use. Mr Selby is
built around a narrower promise: reduce the mechanical work of grading without transferring the
teacher's authority to a model.

The workflow begins with the teacher's actual assignment and rubric. Student work is extracted from
PDF, DOCX, or text and moved through a structured grading pipeline. Mr Selby checks whether the work is
relevant and safe to score, interprets rubric criteria, drafts criterion-level scores and feedback,
verifies evidence against the response, recomputes totals server-side, and anchors suggested comments
to the text. When a response is off assignment, too incomplete, or unsupported by the available
evidence, the intended behavior is to withhold certainty and return it for teacher review instead of
fabricating a grade.

Gemini performs the central reasoning task: reading the assignment, rubric, synthetic or de-identified
student response, and permitted teacher-style context to produce structured grading output. The exact
submitted release uses **[GEMINI_MODEL_AND_API_PATH]** through **[GOOGLE_CLOUD_PRODUCT]**. During
**[PRODUCTION_EVIDENCE_WINDOW]**, the deployed path completed **[GEMINI_REQUEST_COUNT]** requests with
**[SUCCESS_AND_FAILURE_BREAKDOWN]**. The redacted evidence is identified by
**[TRACE_OR_REQUEST_IDS_AND_PRIVATE_EVIDENCE_PATH]**. Do not replace these tokens with code paths or
local dry runs: they require timestamped evidence from the deployed judge release.

Teacher control is the product interface, not a disclaimer. Each suggestion can be accepted, edited,
or dismissed, and the teacher decides when a result is final. Those decisions leave an audit trail.
With explicit consent, genuine exemplars and teacher edits can shape a style profile for later drafts.
Unattended publication is separate, opt-in, and must carry persisted provenance; unless the submitted
release proves otherwise, no unattended publication is claimed. The repository also includes
owner-isolated data policies, private storage, masking before model calls, retention controls,
right-to-erasure logic, rate limits, and fail-closed secret handling. These are implementation facts,
not a blanket compliance certification.

The competition demonstration uses an original synthetic fixture called “The Beacon Ledger.” It
contains no real teacher, learner, school, contact detail, or backend identifier. The demo includes a
strong response, a response with developing language, an insufficient response, and an off-topic
response so judges can see both useful output and the exception path. In the exact release, the live
journey processed **[QUALIFYING_SYNTHETIC_SUBMISSION_COUNT]** synthetic submissions; the observed
outcomes were **[OBSERVED_OUTCOME_BREAKDOWN]**. Teacher review actions persisted after reload as shown
in **[JUDGE_TRACE_OR_VIDEO_TIMESTAMP]**.

We separate measured impact from product intent. Between **[USER_EVIDENCE_START]** and
**[USER_EVIDENCE_END]**, Mr Selby had **[INDEPENDENT_USER_COUNT_OR_0]** independent users and
**[QUALIFYING_USAGE_COUNT_OR_0]** qualifying production grading sessions, excluding founder, seed,
demo, and synthetic accounts. **[TIME_SAVED_RESULT_OR_NO_MEASURED_RESULT]**.
**[VOICE_FIDELITY_RESULT_OR_NO_LIVE_RESULT]**. Small samples, null findings, and failures are included
in the evidence rather than removed from the denominator; no student-outcome claim is made.

Business evidence follows the same standard. From May through August 2026, arms-length revenue was
**[ARMS_LENGTH_REVENUE_BY_MONTH_OR_0]**, related-party revenue was
**[RELATED_PARTY_REVENUE_BY_MONTH_OR_0]**, operating expenses excluding marketing were
**[EXPENSES_BY_MONTH_OR_0]**, and marketing spend was **[MARKETING_SPEND_BY_MONTH_OR_0]**. That produces
**[CAC_OR_INSUFFICIENT_DATA]** and **[RETENTION_OR_INSUFFICIENT_WINDOW]**. Domain, hosting, AI, software,
and required labor costs are included according to the contest rules. Demo accounts and founder-funded
purchases are never presented as independent traction.

Mr Selby belongs in Education & Human Potential because timely, individualized feedback is constrained
by teacher time, yet professional judgment should not become invisible automation. The differentiator
is the combination of rubric grounding, visible evidence, explicit exception handling, and adaptation
from teacher decisions. The next measurable milestone is **[NEXT_MILESTONE]**, with a go/no-go threshold
of **[MEASURABLE_THRESHOLD]**. The model drafts; the teacher remains the final authority.

## Built with

- Google Gemini: structured rubric interpretation, grading, evidence verification, annotations, and
  permitted teacher-style adaptation
- `[VERIFIED_GOOGLE_CLOUD_PRODUCT]`: `[DEPLOYED_ROLE]`
- Supabase: Postgres, Auth, private Storage, and Edge Functions
- Cloudflare Workers Static Assets: public application delivery and canonical domain routing
- React, TypeScript, Vite, Tailwind, and shadcn/ui
- Optional operational components, only if actually deployed: Cloud Run worker, Upstash queue,
  Stripe billing, and PostHog analytics

## Judge instructions template

1. Open `https://mrselby.app` and confirm the footer identifies the release preview.
2. Use the private Devpost credentials for `[JUDGE_ACCOUNT]`; do not publish them in the repository or
   video description.
3. Open `[SYNTHETIC_WORKSPACE_NAME]` and the assignment “Synthetic demo — Responsibility in The Beacon
   Ledger.” Confirm the visible synthetic-data marker.
4. Grade Synthetic learner 01 and inspect the rubric evidence and trace `[TRACE_LOCATION]`.
5. Open Synthetic learner 05 and confirm the observed off-topic disposition shown in the submitted
   evidence.
6. Accept one comment, edit or dismiss another, finalize through the teacher control, reload, and
   confirm the decisions persist.
7. Use Settings to test `[DELETION_OR_RECOVERY_JOURNEY]` only if the disposable judge workspace and
   recovery inbox are configured for that test.

## Final paste gate

- [ ] No bracketed token remains.
- [ ] Narrative is between 500 and 1,000 words after tokens are replaced.
- [ ] Public video is under three minutes, captioned, and viewable while signed out.
- [ ] Repository license or private sharing with both judging addresses is complete.
- [ ] Every user, revenue, expense, and marketing value has dated source evidence or an explicit zero.
- [ ] The deployed Gemini call and Google Cloud product are evidenced from the exact protected release.
- [ ] Judge credentials work from a private browser and expose only original synthetic data.
- [ ] Organizer ruling and every condition are archived privately and followed.
