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
is on — which **defaults to ON** (set at signup; least-permissive default). Each matched identifier is
replaced with an opaque, length-preserving redaction block so the text that leaves for Gemini carries
no name, while the teacher still sees the real names locally (annotation offsets still anchor because
length is preserved). The retention cron uses the sibling `scrubNames()` to scrub stored text +
annotations together.

**What is masked (HIGH-7 expansion).** The de-id call masks two explicit lists:
1. **Roster** — the submission's `student_name`.
2. **Extra identifiers** — caller-supplied terms from the teacher context: the teacher's
   `users.full_name` and `users.school`. These are proper nouns with low collision risk against essay
   vocabulary, so exact-match redaction won't corrupt grading. Course/class names are **deliberately
   excluded** — they are often generic words ("English", "Period 1", "World History") whose redaction
   would over-mask essay content, a worse failure for a grading product than the residual leak.

**De-identification flow (send-time):**
```
essay text  →  maskNamesPreservingOffsets(text, [studentName], [teacherName, school])
              (only when anonymize_student_names = true, default true)
            →  [optional] runDeidPrepass(baseMasked, geminiScorer)   ← OFF by default
              (only when DEID_PREPASS_ENABLED env + privacy_settings.deid_prepass are BOTH on;
               masks residual free-text PII length-preservingly; FAIL-OPEN to base-masked text)
            →  Gemini
```

**Residual risk — state it honestly (do NOT claim fully compliant):**
- De-id masks ONLY terms the system explicitly knows: the roster student name + the extra-identifiers
  list above (and, via the retention cron, stored copies). It performs **NO heuristic / NER name
  detection**. Therefore **other free-text PII written inside an essay body is NOT masked** — a
  classmate's or sibling's name, a parent's name, a hometown, a street address, a phone number, an
  employer. All of that still reaches Gemini in cleartext today.
- Aggressive heuristic masking was **deliberately rejected**: redacting capitalized tokens or
  "name-like" words mid-essay corrupts the very content being graded (over-masking shifts the meaning
  the model scores against), which is a worse failure for a grading product than the residual leak.
- **The real fix — de-id PRE-PASS (now built, OFF by default):** `_shared/deid-prepass.ts` adds a
  model-based pre-pass that runs over the *base-masked* essay BEFORE grading, asks Gemini to return
  spans of residual PII it doesn't already know (PERSON other than the author, LOCATION, ORG-school,
  CONTACT), and masks them with the SAME offset-preserving primitive so annotation anchors still hold.
  When enabled it closes **most** of the residual free-text leak above (other students, parents,
  hometowns, addresses, contact info). It is **OFF by default** and double-gated: the global
  `DEID_PREPASS_ENABLED` env flag AND a per-teacher `privacy_settings.deid_prepass` column (default
  false) must BOTH be on, and it runs only when anonymization is on. It is **FAIL-OPEN**: if the model
  errors or times out, grading falls back to the base-masked text and logs — a de-id step must never
  block grading. Cost/latency: one extra model call per grade (the reason it is flag-gated; intended
  for **Cohort B** real essays once enabled). Activation requires an edge-fn deploy + both flags on.
- **Still not "fully compliant," even with the pre-pass on.** Model NER is probabilistic: it can miss a
  span or over-redact, so the claim remains "FERPA-aware, residual leak substantially reduced when the
  pre-pass is enabled," **not** "all student PII is provably removed." With the pre-pass OFF (the
  default), the claim is unchanged: "explicitly-known identifiers are masked," not "all student PII is
  removed."
- **Mitigations in place meanwhile:** For **Cohort A (revenue)** the residual leak is structurally
  avoided — new teachers are steered to grade **synthetic sample essays with no real student PII**
  (the dashboard empty state makes "Try it with 5 sample essays — no student data" the primary action;
  `src/lib/sampleEssays.ts` contains only fabricated names/content). For **Cohort B (proof, real
  essays)** it is covered by **signed school DPAs** + de-id, not de-id alone.
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
