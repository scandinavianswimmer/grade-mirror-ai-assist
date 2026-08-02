# Mr Selby — Product Hunt launch kit

> **Do not publish yet.** `https://mrselby.app` is a live public preview, but account creation,
> grading, checkout, analytics, and support must be verified against the exact production release
> before this copy becomes a public listing.

Planned funnel: Product Hunt visit → privacy-safe sample workflow → free plan or Pro trial → paid
conversion. Product Hunt activity becomes submission evidence only after it is exported with dates,
definitions, and exclusions.

## 1. Tagline options (60 characters or fewer)

1. **Thoughtful grading support, shaped by how you teach** (51)
2. **Rubric-aligned feedback in your teaching voice** (46)
3. **Grade essays to your rubric. Stay the final word.** (49)
4. **A grading co-pilot that learns from your edits** (46)
5. **Feedback in your voice, with you in control** (43)

**Recommended: #1.** It matches the product positioning without claiming a measured speedup or
presenting AI as the final grader.

## 2. Short description

> Mr Selby is a teacher-controlled grading co-pilot for middle- and high-school English teachers.
> Add an assignment and rubric, then submit privacy-safe student writing. Mr Selby drafts
> rubric-aligned scores, evidence-linked margin notes, and summary feedback shaped by the teacher's
> approved examples and edits. Off-topic or risky work is designed to return to review instead of
> being silently scored. Teacher review is the default; any eligible automatic finalization is a
> separate opt-in.

Short version:

> Mr Selby drafts rubric-aligned essay feedback shaped by how you teach, routes uncertain work to
> review, and keeps you the final authority.

Use this copy only after the protected workflow has been verified live. Until then, describe the
site as a public preview rather than an available grading service.

## 3. Topics

Primary:

- Education
- Artificial Intelligence
- Productivity

Secondary, subject to Product Hunt's live category list:

- Teacher Tools or EdTech
- SaaS
- Writing

Lead with the teacher's feedback problem, not with a generic AI-tool label.

## 4. Gallery capture plan

Every frame must come from the exact release being launched. A synthetic persona or seeded essay
must be labeled **synthetic demo data** in the asset or caption.

| # | Frame | Evidence-safe caption |
|---|---|---|
| 1 | Same essay and rubric, generic baseline beside teacher-style output | **Same work, different feedback.** Mr Selby can apply an approved teaching-style profile instead of relying on a generic default. |
| 2 | Synthetic off-topic essay routed to review or withheld | **It does not have to force a score.** This synthetic off-topic response was routed for teacher review. |
| 3 | Visible grading pipeline | **See the work behind the draft.** The release shows rubric, relevance/risk, grading, annotation, summary, and style stages. |
| 4 | Accept, edit, dismiss, and finalize controls | **Mr Selby drafts; the teacher decides.** Teacher review is the default, and edits remain visible in the audit trail. |
| 5 | Operational dashboard | **Show the denominator.** Label graded count, edits, and turnaround from the captured dataset. Label time saved as an estimate unless a dated baseline study supports it. |

Optional motion asset: a short capture of the pipeline running on the synthetic Gatsby batch and
ending on the review screen. Do not present the seeded teacher, students, essays, class size, or
dashboard totals as customer activity.

## 5. Maker's first comment

> Hi Product Hunt — I built Mr Selby because thoughtful essay feedback can consume the part of a
> teacher's day that should belong to planning, students, or life outside school.
>
> I named it after one of my favorite teachers. The care he brought to teaching, assignments, and
> grading set the standard behind the product. The name is a personal tribute, not an affiliation or
> endorsement.
>
> Mr Selby is designed to draft feedback to the teacher's rubric and style while keeping the teacher
> in control. It can route off-topic or uncertain work back for review instead of forcing a confident
> score. Teachers can accept, edit, or dismiss suggestions, and consented examples can shape later
> drafts.
>
> I would value candid feedback from teachers: Does the workflow respect your judgment? What evidence
> would you need before trusting it with a real stack of essays?

Add plan and trial details only after signup, limits, and checkout have passed production acceptance.

## 6. Maker story

Grading is where teaching integrity and teaching workload meet. The useful part is not only the number
at the top; it is the specific note that helps a student revise. Generic AI output can add work when it
misses the rubric, invents support, or uses language the teacher would not choose.

Mr Selby is built around a narrower standard: ground each draft in the assignment and rubric, expose
the supporting evidence, route unsupported cases to review, and let approved teacher examples shape
the feedback style. It is intended to assist professional judgment, not impersonate or replace it.

The goal is thoughtful grading support shaped by how the teacher teaches. Any claim about time saved,
voice convergence, users, or outcomes must come from dated evidence rather than from the synthetic
demo account.

## 7. Launch-day gate

### Before scheduling

- [x] Public overview and legal-preview routes respond over HTTPS at `https://mrselby.app`.
- [ ] Exact production release supports fresh signup and sign-in in a private browser session.
- [ ] Password recovery succeeds through a real emailed link on the production allowlist.
- [ ] Privacy-safe sample assignment reaches a real Gemini-backed result with a retained trace ID.
- [ ] Off-topic and low-confidence synthetic cases route as described.
- [ ] Teacher accept, edit, dismiss, and finalize actions persist after reload.
- [ ] Free limit and 14-day Pro trial match the UI and backend; no card is requested when promised.
- [ ] Paid checkout succeeds with the production configuration, then is safely refunded during testing.
- [ ] A monitored support or school-contact channel is published; do not invent an address.
- [ ] Analytics capture signup → first grade → paywall → checkout with privacy-safe identifiers.
- [ ] Production secrets are rotated and the release contains no revoked, demo, or shared credentials.
- [ ] Gallery, motion asset, listing copy, and maker comment use the verified release and label synthetic data.
- [ ] Confirm Product Hunt's current scheduling, category, and promotion rules immediately before launch.

### Outreach

- [ ] Share the launch from founder-owned accounts with a clear affiliation disclosure.
- [ ] Participate only in teacher communities whose current rules permit the post; do not solicit votes or disguise promotion as a user recommendation.
- [ ] Ask for product feedback, not testimonials. Quote a response later only with explicit permission and context.

### Evidence-safe FAQ

- **Is this just a single prompt?** The release candidate uses distinct rubric, relevance/risk,
  grading, annotation, summary, and style stages. Show the live trace rather than relying on the claim.
- **Does the AI make the final decision?** Teacher review is the default. Eligible automatic
  finalization, if it is enabled in the verified release, is a separate teacher-controlled opt-in.
- **What about student privacy or FERPA?** Do not claim compliance. The code includes account-scoped
  controls and default-on exact-match masking for known names, but it does not remove every piece of
  free-text personal information. Start with synthetic or appropriately de-identified work and follow
  institutional requirements. Link to the published Privacy preview and current compliance posture.
- **Will it always catch bad input?** No safeguard is perfect. The product is designed to route
  off-topic, risky, or insufficiently supported work to review; demonstrate the exact release's behavior.
- **Pricing?** The configured plans are approximately 15 gradings per month on Free, Pro at $15/month
  or $144/year, and a 14-day Pro trial. Publish this only after the live entitlement and checkout paths
  match it. Do not advertise school contact until a monitored channel exists.
- **Which subjects?** The current examples and workflow focus on middle- and high-school English and
  humanities writing. Broader subject support is a roadmap item, not a launch claim.

### After launch

- [ ] Respond to questions with the limitations above intact.
- [ ] Export dated funnel counts with definitions and failed-event coverage.
- [ ] Record user quotes only with permission; keep seed and founder accounts out of independent-user totals.
- [ ] Report arms-length and related-party revenue separately.
