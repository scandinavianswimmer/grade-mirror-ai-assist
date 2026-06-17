# aiTA Compliance Posture (launch)

> Status: agent-drafted 2026-06-15 for the XPRIZE launch. Sections marked **[FOUNDER VERIFY]**
> assert facts the agent cannot confirm from the repo (official contest rules, signed agreements) —
> verify against the source before publishing externally.

## 1. The FERPA keystone: de-identification before any LLM call

aiTA's compliance story rests on a single architectural fact: **no student education record reaches
Google Gemini.** Standard Vertex AI / Gemini is *not* a FERPA-covered service (only Google
Workspace for Education is), so the answer is not "trust the vendor" — it is "never send the record."

**Confirmed in code.** In `supabase/functions/grade-submission/index.ts`, immediately before the
essay is sent to the model, the grader calls `maskNamesPreservingOffsets()`
(`supabase/functions/_shared/deid.ts`) when the teacher's `privacy_settings.anonymize_student_names`
is on — which **defaults to ON** (set at signup; least-permissive default). The student's name is
replaced with an opaque, length-preserving token so the text that leaves for Gemini carries no
student name, while the teacher still sees the real name locally (annotation offsets still anchor
because length is preserved). The retention cron uses the sibling `scrubNames()` to scrub stored
text + annotations together.

**De-identification flow (send-time):**
```
essay text  →  maskNamesPreservingOffsets(text, [studentName])  →  Gemini
              (only when anonymize_student_names = true, default true)
```

**Residual risk — state it honestly:**
- De-id masks the **student's own name** (and, via the retention cron, stored copies). It does **not**
  guarantee removal of *other* in-body identifiers a student might write (a classmate's name, a
  school, an address). For Cohort A (revenue) this is mitigated by grading **sample essays with no
  real student PII**. For Cohort B (proof, real essays) it is mitigated by **signed school DPAs** +
  de-id, not de-id alone.
- A teacher who explicitly disables anonymization sends names. The default-on posture + UI copy keep
  this an informed opt-out, not a silent default.

## 2. Two-cohort data strategy (why there are two engines)

| | Cohort A — Revenue | Cohort B — Proof |
|---|---|---|
| Data | Pre-loaded **sample essays**, no real student PII | **Real** student essays |
| Legal basis | De-identification + ToS | **Signed school DPA / SDPC NDPA** + de-id |
| Speed | 5–7 day launch posture | DPA clock (longest pole) |

Keeping them separate is the compliance decision: the revenue engine never touches student PII, so
it ships fast; the proof engine takes on real essays only under a signed agreement.

## 3. ToS attestation language (paste into Terms / submission narrative)

> **AI processing & student data.** aiTA uses Google's Gemini models to draft rubric-aligned grades
> and feedback. Before any submission text is transmitted to the model, aiTA removes the student's
> name from the text (de-identification is enabled by default). aiTA does not use the standard
> Gemini API as a FERPA-covered service; instead, it is engineered so that personally identifying
> student information is not transmitted to the model. Teachers grading real student work in a
> district context do so under a signed data-protection agreement (DPA/NDPA). Teachers remain the
> authoring authority for every grade: aiTA may auto-finalize high-confidence, on-topic grades, and
> the teacher may review or change any grade at any time.

## 4. "Newly created" eligibility paragraph  **[FOUNDER VERIFY against official rules]**

> Eligibility — newly created. aiTA was created to operate as an AI-native grading business for the
> Build with Gemini competition. The product, its grading agents, billing, and go-to-market were
> built within the competition's stated build window (May 19 – Aug 17, 2026). Revenue reported as the
> headline figure is **arms-length** (paid by teachers with no prior relationship to the founder);
> any founder-network revenue is reported **separately as related-party** and is excluded from the
> headline number. The business is operated by AI agents end-to-end: aiTA grades and finalizes
> high-confidence student work unattended, routing only low-confidence or off-topic submissions to a
> human reviewer ("on-the-loop").

> **[FOUNDER VERIFY]** Confirm the exact "newly created" / build-window wording in the official
> Devpost rules and the precise related-party definition before submitting. The agent cannot read the
> live rules; the dates and phrasing above are from `XPRIZE-MASTER-PLAN.md` and must be reconciled.

## 5. Outstanding founder actions
- [ ] Sign SDPC **NDPA** for each proof-cohort district.
- [ ] Publish the ToS attestation (§3) on the marketing site / in-app.
- [ ] Verify and finalize the eligibility paragraph (§4) against the official rules.
- [ ] Confirm de-id default-on in the live DB after migrations apply
      (`select bool_and(anonymize_student_names) from privacy_settings;` should trend true).
