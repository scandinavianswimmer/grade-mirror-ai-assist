# Cohort B — Proof Teacher Recruiting Kit

> Operating playbook to land **4–6 grades 9–12 ELA teachers** who'll grade real essays across ≥4 batches
> under a signed school DPA, for the pre-registered voice-convergence proof. This is the **longest-lead
> Week-1 item** and the XPRIZE moat (Criterion C). Warm/related-party contacts ARE fine here — related-party
> only disqualifies *revenue*, not *proof*.
>
> Pieces: email bank → `teacher-outreach-email.md` · DPA → `school-dpa-stub.md` · pre-reg → `osf-prereg.md` ·
> sourcing channels → `../marketing/gtm/targets/cohort-b-teacher-sourcing.md`. Sendable via the outreach
> engine (`../../outreach/`) using the `cohort-b-warm` / `cohort-b-cold` templates.

## The math
Over-recruit to **net 4–6**: build a funnel of **15–20 candidates**, expect DPA friction to halve it.
Warm-first (Week 1), DPA-closing (Week 2).

## The DPA reality (sets the whole strategy)
A teacher almost never signs a data agreement solo — the DPA is an **institutional district↔vendor**
contract, typically via the **SDPC National Data Privacy Agreement (NDPA)** or a National Research DPA.
**The lever is aiTA's send-time de-identification:** because no education record reaches the model, the
FERPA requirement softens substantially — but you still recruit the teacher as the **internal sponsor** who
walks a pre-filled SDPC template through their district. So the screen isn't "will you grade?" — it's
**"can you get a one-page de-identified-pilot agreement signed?"** That's the hard gate; weight it heavily.

## Incentive (sourced norms)
- **Free full access** during and after the study (baseline).
- **Modest per-batch honorarium** tied to *batch completion* (fights dropout) — benchmark against the
  $13–20/hr educator-panel norm and ~$750/yr PD-stipend norm; e.g., $40–60/batch × 4.
- **Named acknowledgment / co-authorship** on the OSF write-up + any case study.
- **Optional PD credit** letter if their district accepts it.
- **Design-partner voice** — they shape an ELA tool. Lead emotionally with this for mission-driven teachers.

## Screening checklist (qualify before sending the DPA)
1. Teaches **grades 9–12 ELA** (AP Lang/Lit = best fit — heaviest rubric-grading load).
2. Grades **real essays against a rubric** (not multiple-choice/quizzes).
3. **≥~25 students/batch**, so each batch is a real signal.
4. Willing to do **≥4 batches over ~6 weeks**.
5. **Can plausibly get a de-identified-pilot DPA signed** (the hard gate — ask early).
6. OK with **de-identification** (names stripped before processing).
7. Will give **8–10 reference essays pre-enrollment** (the LUAR baseline corpus).
8. Consents to the study + a 1-tap per-batch rating.

## Outreach sequence (multi-touch — automate via the outreach engine)
Templates live in `../../outreach/templates/`; add candidate rows to a `prospects.cohort-b.json`
(`related_party:true` is fine here) and run `node outreach/personalize.mjs`.
- **T0 — invite** (`cohort-b-warm` for people you know / referrals; `cohort-b-cold` for sourced leads).
  Bodies already drafted in `teacher-outreach-email.md` (Email A / Email B).
- **T0 +4 days — bump:** "Totally get it's a busy time — the ask is genuinely light (you'd grade these
  anyway; aiTA just drafts the feedback). Still open?"
- **T0 +9 days — referral pivot (if no):** "No worries! Know one gr9–12 ELA colleague who might enjoy
  shaping this? A warm intro is gold." (Referral ask below.)
- **On 'yes':** send `school-dpa-stub.md` + a 10-min setup link + the reference-essay request.

### Referral-ask snippet
> "If it's not for you — totally fair. Do you know one 9–12 ELA teacher who'd enjoy being an early design
> partner for a tool that learns *their* grading voice? A one-line intro to them would mean a lot, and
> they'd get free access for the study. No pressure either way — thank you regardless."

## Where to recruit first (from the sourcing research — TOP 6)
1. **Warm network / direct referrals** — fastest DPA path (a teacher who trusts you will push it through).
2. **AP Lang/Lit Facebook communities** — sharpest rubric-grading pain, best ICP fit (recruit via admins,
   not self-posts).
3. **NCTE + state ELA councils** (CATE/TCTELA/NYSEC) — concentrated, credible.
4. **r/SampleSize** (allows study recruitment, no mod gate) + r/ELATeachers (check rules).
5. **University teacher-ed / field-placement offices** — student-teacher supervisors know cooperating teachers.
6. **Paid educator panels** (Prolific, edWeb) — last resort for speed; verify each allows study recruitment.

Full sourced channel list + rules: `../marketing/gtm/targets/cohort-b-teacher-sourcing.md`.

## 2-week sprint
- **Week 1:** finalize the 15–20 candidate list (warm + AP groups + state councils); send T0 to all;
  pre-fill the SDPC/NDPA template; draft OSF pre-reg (`osf-prereg.md`).
- **Week 2:** bumps + referral pivots; close DPAs (target ≥4 signed); collect 8–10 reference essays/teacher;
  schedule Batch 1. **Gate:** ≥4 teachers with signed (or in-flight) DPAs by end of Week 2, else widen sourcing.

## Founder-gated (cannot be agent-done)
Teacher relationships/calls, DPA signatures, OSF account + filing. **Agent-done:** the candidate research,
every personalized message, the sequence/tracking, the screening + DPA template prep, the OSF draft.
