# XPRIZE video and judge narrative — evidence-gated draft

> **Do not record the final video yet.** The founder reported organizer approval on August 1, 2026;
> archive the written ruling and follow its exact conditions. The repository predates the contest under
> earlier working names, including Grade Mirror and aiTA, so do not rewrite that history. The public
> preview is live at `https://mrselby.app`, but the protected backend, Google Cloud path, and production
> Gemini call remain unverified. The canonical gate is
> [`../../launch/XPRIZE-SUBMISSION.md`](../../launch/XPRIZE-SUBMISSION.md).

## Video production brief

Target **2:40**; hard cap **3:00**. Record one continuous judge flow from a private browser window
against the exact release commit. Burn in captions and show the public URL, a production Gemini
request or trace identifier, a refusal path, teacher controls, and only metrics backed by dated exports.

Required capture list:

- [ ] Live login with a judge account and synthetic, privacy-safe content
- [ ] Assignment and rubric creation or open flow
- [ ] On-topic grading output with evidence anchors
- [ ] Off-topic or risky work routed for review or withheld
- [ ] Accept, edit, dismiss, and teacher-finalize controls
- [ ] Gemini and Google Cloud production evidence from the same release
- [ ] Verified user and business panel, including zero or unavailable values where that is the truth
- [ ] Closing URL, category, commit or tag, and evidence cutoff date

Do not show a seed persona as a real customer. Do not describe a row as auto-finalized unless persisted
`finalized_by` or `auto_finalized_at` provenance proves unattended publication. If that feature is not
live, verified, and opt-in, omit it.

## Judge narrative draft

**Do not submit bracketed text.** Replace each token with dated primary evidence or use the explicit
no-evidence fallback. The draft intentionally says **release candidate** until the protected product is
verified live.

### Mr Selby: thoughtful grading support, shaped by how teachers teach

Teachers need to return specific, useful feedback while managing workloads that can turn a stack of
essays into an evening of repetitive work. Generic AI output does not solve that problem when it misses
the rubric, invents evidence, or uses language the teacher would not choose. Mr Selby is designed around
a narrower promise: help a teacher evaluate written work consistently, show the evidence behind each
suggestion, and keep the teacher in control of what becomes final.

The release candidate starts with the teacher's assignment and rubric. A response moves through a
structured Gemini pipeline for rubric interpretation, relevance and risk checks, criterion-level
grading, evidence verification, anchored annotations, summary feedback, and optional teacher-style
adaptation. The system recomputes totals server-side and exposes evidence instead of asking the teacher
to trust one opaque answer. When work is off assignment or the pipeline cannot support a grade, it is
designed to return the work for review rather than fabricate certainty. After live verification, report:
**[EVIDENCE_WINDOW]**, **[REAL_PRIVACY_SAFE_SUBMISSION_COUNT]**, **[INDEPENDENT_TEACHER_COUNT]**, and a
link to the export containing denominators, exclusions, and failures. If no qualifying production window
exists, say that no production usage result is being claimed.

Teacher control is part of the workflow. A teacher can accept, edit, or dismiss an annotation and can
finalize a grade. Those decisions create an audit trail and, with explicit consent, can inform the style
profile used for later feedback. Eligible unattended publication is a separate opt-in. Report an
auto-finalized count only when the database proves the provenance: **[PROVEN_AUTO_FINALIZED_COUNT]** of
**[ELIGIBLE_GRADED_COUNT]**, with **[ROUTED_COUNT]** returned to a teacher during
**[AUTO_FINALIZE_EVIDENCE_WINDOW]**. If none are verified, say that no unattended publication is being
claimed.

The deployed-evidence paragraph must name only services proven by the exact release:
**[GOOGLE_CLOUD_PRODUCT]**, **[GEMINI_INTEGRATION_PATH]**, **[TRACE_OR_REQUEST_ID]**,
**[PRODUCTION_REQUEST_COUNT]**, and **[COMMIT_OR_TAG]**. Until those values exist, the accurate statement
is that Gemini and Google Cloud integrations are implemented in the repository but not yet proven in
the protected production path. The AI performs the central product task—interpreting a rubric and
drafting evidence-backed feedback—while refusal, provenance, rate limits, name masking, and teacher
controls make the operation more inspectable. Code-only adapters remain labeled as code-only.

Report impact at the teacher-workflow level without converting product assumptions into measurements.
Across **[MEASURED_SESSION_COUNT]** qualifying sessions, report **[BASELINE_METHOD_AND_RESULT]**,
**[ASSISTED_METHOD_AND_RESULT]**, **[APPROVAL_EDIT_RESULT_WITH_INTERVAL]**, and
**[VOICE_RESULT_WITH_METHOD]**. The in-product time-saved card uses a modeled baseline and review-time
assumption; it is not a measured study result. Edit-rate decline is, at most, a corroborating signal and
is not proof of voice convergence. If no qualifying study exists, say so and omit the result paragraph.
Do not make student-outcome claims.

Business viability follows the same rule. For **[BUSINESS_EVIDENCE_WINDOW]**, report
**[ARMS_LENGTH_REVENUE]**, **[RELATED_PARTY_REVENUE]**, **[VERIFIED_PAID_ACCOUNT_COUNT]**,
**[OPERATING_COST_EXCLUDING_MARKETING]**, **[MARKETING_SPEND]**, **[CAC_OR_INSUFFICIENT_DATA]**, and
**[RETENTION_RESULT_OR_INSUFFICIENT_WINDOW]** from dated exports. Trials, seeds, demo accounts, and
founder-funded purchases are not independent traction. A verified zero is acceptable; an invented user,
sale, or denominator is not.

Mr Selby belongs in Education & Human Potential because it addresses a practical constraint on timely,
individualized feedback while preserving professional judgment. The differentiator to demonstrate is
not that AI can produce a number; it is the combination of rubric grounding, visible evidence,
exception handling, and adaptation from explicit teacher decisions. Close with
**[NEXT_MEASURABLE_MILESTONE]** and **[GO_NO_GO_THRESHOLD]** so judges can see what is proven, early, or
still missing.

## Final claim audit

- [ ] Narrative is 500–1,000 words after all bracketed tokens are removed.
- [ ] Every number links to a dated primary export with denominator and exclusions.
- [ ] Every deployment statement matches the exact release and production logs.
- [ ] Every real user is independent; every seed or demo persona is labeled synthetic.
- [ ] Auto-finalize numbers derive only from persisted provenance.
- [ ] Modeled time savings are labeled estimates, not observations.
- [ ] Voice claims use the stated blinded-judge or embedding method; edit rate is not the verdict.
- [ ] No student-outcome, compliance, bias, uniqueness, or superiority claim lacks evidence.
- [ ] The organizer ruling is archived privately and the submission follows its conditions.
