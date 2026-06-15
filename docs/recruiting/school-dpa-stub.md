# School Data Protection Agreement — DRAFT STUB

> **[FOUNDER / LEGAL VERIFY]** This is a plain-language starting draft, NOT legal advice. For US K-12
> the fastest path is usually the **SDPC National Data Privacy Agreement (NDPA)** via your state's
> Student Data Privacy Consortium alliance — many districts will only sign their standard NDPA. Use
> this stub for districts without one, and have counsel review before signature.

---

## Data Protection Agreement between {School/District} ("School") and {aiTA legal entity} ("Provider")

**1. Purpose.** Provider supplies an AI-assisted essay-grading service ("Service"). School authorizes
teachers to submit student work to the Service to obtain rubric-aligned draft grades and feedback,
which the teacher reviews and may modify.

**2. Roles (FERPA).** The Service operates as a "school official" with a legitimate educational
interest under FERPA 34 CFR §99.31(a)(1). Provider processes student data solely to provide the
Service and under the School's direction. Provider does not re-disclose student data except as
permitted by this Agreement and applicable law.

**3. Data minimization & de-identification.** Before any student submission text is transmitted to
Provider's third-party AI model, the student's name is removed (de-identification is enabled by
default). Provider will not transmit personally identifying student information to the AI model.
School acknowledges teachers control whether additional fields are entered.

**4. Use limitation.** Provider will not (a) sell student data, (b) use student data for targeted
advertising, or (c) use student data to train third-party models. {If Provider uses de-identified
content to improve its own service, state it here and make it opt-in.}

**5. Sub-processors.** Provider uses {Supabase (hosting/database)} and {Google Gemini API
(AI inference)} as sub-processors, bound to equivalent obligations. Student names are de-identified
before data reaches the AI sub-processor.

**6. Security.** Row-level isolation per teacher account, encrypted transport, access logging, and
least-privilege service credentials. Provider will notify School of a confirmed data breach without
undue delay and within {72 hours / per state law}.

**7. Retention & deletion.** Student data is retained for {the configured retention period, default
365 days} and deleted on request or at termination. Provider supports per-record erasure.

**8. Term & termination.** Effective on signature; terminable by either party on {30} days' notice.
On termination Provider deletes or returns student data within {30} days.

**9. Parental rights.** School remains responsible for parental notice/consent as required by FERPA,
COPPA (for students under 13), and state law. Provider supports access/correction/deletion requests
routed through School.

**Signatures.**
School: __________________________  Date: ________
Provider: ________________________  Date: ________

---

### Fields to fill before sending
- [ ] aiTA legal entity name + address
- [ ] Confirm sub-processor list matches production (Supabase project + Gemini/Vertex)
- [ ] Breach-notice window per the district's state law
- [ ] Training-on-content clause: match the live `privacy_settings.allow_training_on_content` default (currently OFF)
- [ ] Retention period: match the live default (365 days)
