# XPRIZE video and judge narrative — evidence-gated draft

> **Do not submit or record yet.** The existing aiTA project predates the contest cutoff and needs a written organizer eligibility ruling or a genuinely new eligible-project pivot. The configured production app is also not live. The canonical gate and checklist are in [`../../launch/XPRIZE-SUBMISSION.md`](../../launch/XPRIZE-SUBMISSION.md).

## Video production brief

Target **2:40**; hard cap **3:00**. Use the timed plan in the canonical submission document. Record in one continuous judge flow from a private browser window against the exact release commit. Burn in captions and show the public URL, a real Gemini request/trace identifier, a refusal path, teacher controls, and only metrics backed by dated exports.

Required capture list:

- [ ] Live login and judge account with synthetic, privacy-safe content
- [ ] Real assignment and rubric creation/open flow
- [ ] On-topic grading output with evidence anchors
- [ ] Off-topic or risky work routed for review/withheld
- [ ] Accept, edit, dismiss, and teacher finalize controls
- [ ] Gemini plus Google Cloud production trace from the same release
- [ ] Real user/revenue panel, with sample size and related-party revenue labeled
- [ ] Closing URL and category

Do not show a seed persona as a real customer. Do not describe high-confidence rows as auto-finalized unless persisted `finalized_by` or `auto_finalized_at` provenance proves unattended publication. If that feature is not live and opt-in, omit it.

## Judge narrative draft (replace every bracket before use)

### aiTA: grading support in the teacher's own standards and voice

Teachers need to return specific, useful feedback while managing workloads that can turn a stack of essays into an evening of repetitive work. Generic AI output does not solve that problem when it ignores the teacher's rubric, invents evidence, or speaks in a voice the teacher would never use. aiTA is designed around a narrower promise: help a teacher evaluate written work consistently, show the evidence behind each suggestion, and keep the teacher in control of what becomes final.

The workflow starts with the teacher's assignment and rubric. A student response moves through a structured Gemini pipeline for rubric interpretation, relevance and risk checks, criterion-level grading, evidence verification, anchored annotations, summary feedback, and optional teacher-style adaptation. The system recomputes totals server-side and exposes the resulting evidence instead of asking the teacher to trust a single opaque answer. When work is off assignment or the pipeline cannot support a grade, aiTA routes it for review rather than silently fabricating certainty. In the live evaluation period from **[START_DATE]** to **[END_DATE]**, this path processed **[REAL_SUBMISSION_COUNT]** privacy-safe submissions for **[REAL_TEACHER_COUNT]** independent teachers; the linked production export contains the exact denominators and failure cases.

Teacher control is part of the product, not a disclaimer. A teacher can accept, edit, or dismiss an annotation and can finalize the grade. Those decisions create an audit trail and, with explicit consent, improve the style profile used for later feedback. Unattended publication remains opt-in. If enabled, aiTA counts a grade as auto-finalized only when the database records explicit AI-finalization provenance; model confidence by itself is never reported as completed work. During **[MEASUREMENT_WINDOW]**, **[PROVEN_AUTO_FINALIZED_COUNT]** of **[ELIGIBLE_GRADED_COUNT]** eligible grades were proven auto-finalized, while **[ROUTED_COUNT]** were routed to a teacher. If no verified unattended publications occurred, this sentence will instead state that the teacher finalized every grade.

The deployed system uses **[GOOGLE_CLOUD_PRODUCT]** and calls the Gemini API through **[GEMINI_INTEGRATION_PATH]**. The demo links a visible grading event to **[TRACE_OR_REQUEST_ID]**, and the attached logs show **[PRODUCTION_REQUEST_COUNT]** production Gemini requests from release **[COMMIT_OR_TAG]**. This matters because the AI is doing the central unit of product work: interpreting a rubric and drafting evidence-backed feedback. The surrounding controls—refusal, provenance, rate limits, de-identification, and teacher approval—make that AI operation inspectable. We describe only services proven in the deployed architecture; code-only adapters are labeled as planned rather than live.

Impact is measured at the teacher-workflow level. Across **[SAMPLE_SIZE]** completed sessions, teachers spent a median **[BASELINE_MINUTES]** minutes on the baseline workflow and **[AITA_MINUTES]** minutes with aiTA, measured by **[METHOD]**. The approval/edit results were **[RESULT_WITH_INTERVAL]**, and the teacher-voice evaluation was **[VOICE_RESULT_WITH_METHOD]**. These are early operational results, not student-outcome claims. We report small samples, null findings, and excluded sessions directly. The goal is to return time for instruction without hiding uncertainty or removing professional judgment.

Business viability is reported with the same discipline. From **[MONTH_RANGE]**, aiTA generated **[$ARMS_LENGTH_REVENUE]** in arms-length revenue and **[$RELATED_PARTY_REVENUE]** in separately labeled related-party revenue from **[PAID_ACCOUNT_COUNT]** paid accounts. Operating costs excluding marketing were **[$OPERATING_COST]**, marketing spend was **[$MARKETING_SPEND]**, and measured customer acquisition cost was **[$CAC_OR_NOT_ENOUGH_DATA]**. **[RETENTION_RESULT]** describes retention using the stated cohort and window. Stripe and analytics exports accompany these figures; trials, seed accounts, and founder-funded purchases are not counted as independent traction.

aiTA belongs in Education & Human Potential because it targets a practical constraint on timely, individualized feedback while preserving the teacher's authority. Its differentiator is not that an AI can produce a grade. It is that the product grounds suggestions in the teacher's rubric, shows its evidence, refuses work it should not grade, and learns from explicit teacher decisions. The next milestone is **[NEXT_MEASURABLE_MILESTONE]**, evaluated against **[GO_NO_GO_THRESHOLD]**. That makes the submission falsifiable: judges can reproduce the demo, inspect the logs and code, and see where the evidence is strong, early, or still missing.

## Final claim audit

- [ ] Narrative is 500–1,000 words after replacing placeholders.
- [ ] Every number links to a dated primary export.
- [ ] Every deployment statement matches the live architecture.
- [ ] Every user is real and every seed persona is labeled synthetic.
- [ ] Auto-finalize numbers derive only from persisted provenance.
- [ ] No student-outcome, compliance, bias, uniqueness, or competitor-superiority claim lacks evidence.
- [ ] Eligibility ruling or eligible-project evidence is attached.
