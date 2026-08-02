# Mr Selby privacy and compliance posture — launch preview

Status: code-reviewed August 1, 2026. This is an engineering posture, not legal advice or a final
privacy policy. The public preview is live, but the protected backend is not currently provisioned and
the repository does not prove any production database setting, provider contract, school agreement, or
regulatory certification. Do not claim FERPA, COPPA, GDPR, or district compliance from this document.

Public-facing summaries remain previews until the legal entity, effective date, monitored contact,
service-provider list, launch geography, and qualified review are complete.

## 1. Repository-implemented data minimization

The grading code contains an exact-match masking step before the configured model call. In
`supabase/functions/grade-submission/index.ts`, the release candidate reads the teacher's
`privacy_settings.anonymize_student_names` setting. When enabled, it passes known identifiers to
`maskNamesPreservingOffsets()` in `supabase/functions/_shared/deid.ts`.

The current call site supplies:

1. the submission's `student_name`, when it contains at least two characters; and
2. the teacher's stored full name and school, when available and at least two characters.

Matching is case-insensitive and length-preserving, so downstream annotation offsets can still map to
the original text. Course and class names are not supplied because generic values could over-mask the
essay. The schema and code fallback are intended to make known-name masking default-on, but the live
database default and every existing row must be verified after the canonical migrations are applied.
A teacher can also disable the setting.

This behavior is a data-minimization control, not complete de-identification. It does not establish that
no education record or personal information reaches a model.

### Send-time flow implemented in the repository

```text
essay text
  → exact-match, length-preserving masking of supplied known identifiers
    (only when anonymize_student_names is enabled)
  → optional model-based residual-PII pre-pass
    (only when DEID_PREPASS_ENABLED and the per-teacher deid_prepass setting are both enabled)
  → configured Gemini grading path
```

The optional pre-pass is off by default, probabilistic, and fail-open. If it errors or times out, the
grading path continues with only the exact-match masking. It may find additional person, location,
organization, or contact spans, but it can miss or over-redact them. Because it fails open, it must not
be described as a guaranteed privacy boundary.

## 2. Residual risk that must remain visible

- Names not supplied to the exact-match function can remain in the essay.
- Addresses, phone numbers, email addresses, health details, discipline records, and other free-text
  personal information can remain.
- Exact matching can miss variants, nicknames, misspellings, or references expressed another way.
- The optional pre-pass adds a model call and remains probabilistic even when enabled.
- Repository RLS policies, storage controls, encryption settings, retention jobs, and provider settings
  still require verification against the actual production environment.
- A user who disables known-name masking can send names to the configured model.

The trial and demo should start with synthetic sample essays. That reduces exposure only while the user
stays within the synthetic workflow; it does not make later uploads safe by default.

## 3. Two-lane launch posture

| Lane | Permitted data today | Required before broader use |
|---|---|---|
| Public preview and synthetic demo | Product pages and fabricated sample essays; no real student records | Verified backend, exact-release security test, monitored contact, final policies |
| Institutional proof cohort | **Not authorized by this repository** | Institutional approval, appropriate signed agreements, verified provider terms/configuration, data-flow review, retention/deletion procedure, incident and support contacts |

No signed DPA, NDPA, district approval, or provider agreement is proven by the repository. Do not enroll
a real-student proof cohort until the launch owner and qualified reviewer confirm the required documents
and exact deployment.

## 4. Counsel-review draft for AI-processing disclosure

The following is a factual starting point, not final Terms language:

> **AI processing and student data — preview.** Mr Selby uses configured Google Gemini models to draft
> rubric-aligned feedback and grades. When known-name masking is enabled, the service replaces exact
> matches for the student name and certain account-supplied identifiers before the grading request.
> This control does not identify or remove every piece of personal information that may appear in free
> text. Teachers should use only content they are authorized to provide and should follow their school
> or institution's requirements. Teacher review is the default. Eligible automatic finalization, if
> offered in the verified deployment, is a separate opt-in and does not remove the teacher's
> responsibility for configuration and results.

Before publication, counsel and the launch owner must reconcile this draft with the actual provider,
model route, database defaults, user controls, contracts, locations, retention behavior, and intended
audience.

## 5. Competition eligibility provenance

The founder reported organizer approval on August 1, 2026. The public repository and earlier AI grading
work predate the contest and used earlier working names, including Grade Mirror and aiTA. Preserve that
history. Archive the written ruling privately, follow any conditions in it, and do not replace the
historical record with a claim that the repository was first created during the contest window.

Any user, revenue, or unattended-operation claim remains separate from eligibility and still requires
dated primary evidence.

## 6. Outstanding launch actions

- [ ] Provision and identify the canonical backend; apply the reviewed migration sequence.
- [ ] Verify known-name masking defaults and existing `privacy_settings` rows in the live database.
- [ ] Decide whether the optional pre-pass will be disabled or enabled; test and document either state.
- [ ] Trace one privacy-safe production grading request through the exact model/provider path.
- [ ] Verify RLS, storage access, retention, export, deletion, account closure, and recovery against the live release.
- [ ] Identify the legal entity, effective date, launch geography, monitored privacy/support contact, and complete provider list.
- [ ] Obtain qualified review and any institution-specific agreements before real student data is used.
- [ ] Publish final Privacy and Terms text only after the items above match production.
- [ ] Archive the organizer ruling privately and retain its exact conditions.
