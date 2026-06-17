# aiTA — Build with Gemini XPRIZE Submission Skeleton

> Track: **Education & Human Potential**. Judged on **three equally-weighted criteria**: Business viability · AI-native operations · Category impact.
> Submission closes **Aug 17, 2026 · 1:00pm PT**. Finals **Sept 25, 2026**.
> Source plan: `.planning/LAUNCH-PLAN.md` §5. Proof moments: `docs/DEMO-SARAH-MARTINEZ.md` §5.
> This is a skeleton — fill the **TO COLLECT** items as the May 19–Aug 17 build accrues evidence.

---

## 1. The three criteria (each = 1/3 of the score)

### A. Business viability — *real revenue + sustainability*

**Evidence aiTA has / will have:**
- Live freemium + per-teacher subscription on **Stripe live mode** — Free ($0, no card, ~15 gradings/mo), Pro ($15/mo or $144/yr), School/Dept (lead-capture). Pricing rationale: teachers expense ~$15/mo comfortably; annual improves cash + retention. (`LAUNCH-PLAN.md` §3.)
- Product Hunt launch as the top-of-funnel engine: PH signups → freemium → paid conversion.
- A built-out billing surface already exists in-repo: `stripe-checkout`, `stripe-portal`, `stripe-webhook`, `_shared/stripe.ts`, `_shared/quota.ts`, `Billing.tsx`, `FreemiumDashboard.tsx`, quota RPC migration.

**TO COLLECT:**
- [ ] Revenue **by month** (May, Jun, Jul, Aug) pulled from Stripe — required field.
- [ ] Costs excluding marketing + CAC spend — required fields.
- [ ] **Related-party revenue reported separately** (founder/friend accounts flagged — rules require it).
- [ ] Conversion funnel numbers from PostHog (signup → first-grade → paywall → checkout).
- [ ] Retention / active-subscriber count at submission.

### B. AI-native operations — *AI live in production making the key business decision*

**Evidence aiTA has / will have:**
- **The grade *is* the AI executing the core business decision.** The product's central act of value — assigning a rubric-aligned grade and writing the feedback — is performed by the AI pipeline: `grade-submission` → grading engine → evidence-verify → text-anchor → human-in-the-loop. This is not AI bolted onto a SaaS; AI *is* the operation.
- **Trustworthy by construction:** rubric-mandatory, relevance-gated, evidence-anchored, recomputes totals, fails loud. Off-topic work is withheld, not scored (verified live: Brandon 10/100 + off_topic flag; oil-change essay 0/100 + off_topic).
- **Vertex AI in production** (migration M1) — Gemini via Vertex with service-account auth, removing free-tier caps.
- **The voice-convergence learning loop (Phase 15)** — AI that measurably improves from teacher edits. This is the differentiator and the most "AI-native" proof point: the system gets better at the teacher's voice batch over batch.

**TO COLLECT:**
- [ ] **Agent execution logs** as production proof (pipeline traces from real gradings).
- [ ] **Vertex AI / API usage records** (request volume, model, token/cost dashboards).
- [ ] Metrics-dashboard screenshots (time saved, approval rate, turnaround) from real grading.
- [ ] Phase-15 instrumentation output: edit-rate / edit-distance per batch.

### C. Category impact — Education & Human Potential

**Evidence aiTA has / will have:**
- Directly returns scarce teacher time to teaching: *"Five hours of grading became ninety minutes — and the feedback still sounds like her."*
- Preserves feedback **quality and the teacher's voice** rather than flattening it to generic AI prose — the feedback that teaches (the margin note) is retained, not lost.
- Protects assessment integrity: refuses to grade off-topic/adversarial work, keeping a human as final authority on every comment.

**TO COLLECT (the centerpiece):**
- [ ] **Finish Phase 15 voice-convergence proof with a real teacher** — falsifiable edit-rate decline over ≥4 batches ("I barely had to edit this"). Kill criterion: <15% edit-rate decline → wedge disproven. Report the honest go/no-go verdict either way.
- [ ] **Teacher testimonials** (required user evidence) — gather from PH users + the Phase-15 teacher.
- [ ] User **demographics** (grade levels, subjects, school types, geography where collectible).

---

## 2. Required deliverables checklist

- [ ] **Public code repo URL** — with a real, non-template README (already replaced; `README.md`).
- [ ] **<3-minute demo video** on **YouTube** — script in §3, leads with the Brandon trust-moment then Sarah's-voice convergence.
- [ ] **Text description / writeup** — category fit + the eligibility framing (§4).
- [ ] **Financial evidence** — revenue by month (May–Aug), costs ex-marketing, CAC, related-party revenue flagged separately.
- [ ] **User evidence** — user counts, demographics, testimonials.
- [ ] **Production proof** — agent execution logs, Vertex AI / API usage records, metrics-dashboard screenshots.

---

## 3. Demo video script (<3 min) — shot list + voiceover beats

**Constraint: under 3:00. Lead with trust, then voice — those are the two moments competitors can't copy.** Everything shown is real output from the live grader (`docs/DEMO-SARAH-MARTINEZ.md` "what's real").

| Time | Shot | Voiceover beat |
|------|------|----------------|
| **0:00–0:15** | Sarah Martinez dashboard — 6 classes, a real grading queue, 14 essays in. | "This is Sarah's Tuesday. 165 students across six periods, a stack of essays due back. Grading them well used to cost her an evening." |
| **0:15–0:35** | Open the Gatsby assignment → **Grade all ungraded** → the visible agent pipeline (Rubric → Relevance/Risk → Grading → Annotation → Feedback Summary → Style) chews through the batch. | "aiTA isn't one black-box call. It's a pipeline that validates the rubric, verifies every quote, and anchors each comment to the text." |
| **0:35–1:05** | **THE TRUST MOMENT.** Open **Brandon Davis** — the jump-shot essay shown **withheld / needs-review**, score floored, off_topic flag. Pan across confidence + per-criterion evidence citations. | "Brandon wrote about basketball, not Gatsby. A grade-bot would score it 95%. aiTA refuses — it flags and withholds off-topic work. That refusal is the whole point: you can trust the grades it *does* give." |
| **1:05–1:45** | **THE VOICE MOMENT (the moat).** Open **Sofia Reyes** — feedback in Sarah's voice (names the strength, "push your analysis one step further," flags summary-heavy, coaches quote integration). Optional split-screen vs. a generic no-profile baseline. Style step = `ok (applied)`. | "And when it does grade — it sounds like Sarah. It learned her voice from her own past feedback, with her consent. These aren't generic AI comments. They're hers." |
| **1:45–2:15** | Human-in-the-loop: **accept** a note, **edit** one (→ "AI originally suggested…"), **dismiss** one, **Finalize**. | "aiTA drafts; Sarah decides. Accept, edit, dismiss — and every edit teaches it her voice for the next batch. Nothing is final without her." |
| **2:15–2:45** | **Metrics** dashboard — time saved, approval rate, turnaround. | "Five hours of grading became ninety minutes — and the feedback still sounds like her. That's the time we hand back to teaching." |
| **2:45–3:00** | aiTA logo + URL + the line: built on Google Cloud + Vertex AI. | "aiTA. A grading co-pilot that grades in your voice — and never fakes a grade. Built on Google Cloud and Vertex AI." |

Production notes: record at the Sarah Martinez seed account; have the pacer / billed key set so grading doesn't stall on camera; keep the pipeline animation visible (it's the AI-native proof). If over 3:00, trim 0:15–0:35 (pipeline) before trimming either proof moment.

---

## 4. Eligibility framing draft — "newly created after May 19, 2026"

> **Honest framing (founder to finalize).** aiTA's earliest prototype predates the eligibility window. The XPRIZE rules permit pre-existing code accompanied by **a written explanation of how it was enhanced** during the window — so this submission is transparent about origin and leads with the in-window build.
>
> **What was built in the May 19 – Aug 17, 2026 window is the production system itself:**
> - **Full Google Cloud re-platform** off Supabase — Firebase Hosting, Vertex AI (Gemini), Cloud Run for the serverless API + async grading worker, Cloud Tasks/Scheduler, Cloud Storage, Secret Manager, and (DB/Auth dependent) Cloud SQL + Firebase Auth. Migrated incrementally via a strangler-fig so the app stayed working throughout.
> - **AI moved to Vertex AI in production**, removing free-tier caps and putting the core grading decision on Google Cloud infrastructure.
> - **Live billing and real revenue** — Stripe live mode, freemium + per-teacher subscription, real paying users acquired post-launch (revenue tracked by month, May–Aug).
> - **Security hardening** — multi-layer rate limiting, auth-hole closure, send-time de-identification before model calls, right-to-erasure, retention cleanup, owner-isolation verification.
> - **The voice-convergence proof (Phase 15)** — the falsifiable, instrumented experiment showing aiTA learns a real teacher's feedback voice (edit-rate decline batch over batch), run with a real teacher inside the window.
>
> In short: the prototype was a sketch; **the business, the production AI operation, the revenue, and the defensible proof were all created inside the window.** The writeup leads with that in-window build, not the prototype origin — and reports related-party revenue separately, per the rules.

Drafting reminders:
- Do not overstate. The voice-convergence claim must be backed by the Phase-15 data, including an honest go/no-go verdict if the kill criterion triggers.
- Keep the eligibility paragraph factual and verifiable against the repo's commit history and Stripe/Vertex records.

---

## 5. Key dates

| Date | Milestone |
|------|-----------|
| **May 19, 2026** | Eligibility window opens ("newly created after" boundary). |
| **Aug 17, 2026 · 1:00pm PT** | **Submission closes.** All deliverables (§2) due. |
| **Sept 25, 2026** | Finals. |

Internal cadence to hit Aug 17 (`LAUNCH-PLAN.md` §6):
- **Jun 8–14:** PH launch + Stripe live + Vertex AI start.
- **Jun 15–Jul 6:** M1–M3 done → **eligibility locked**; begin user acquisition; recruit Phase-15 teacher.
- **Jul 6–Aug 3:** M4–M5; accumulate revenue + testimonials + production proof; run Phase-15 (≥4 batches).
- **Aug 3–17:** stabilize; record demo video; write submission; compile evidence; **submit before Aug 17 1pm PT.**
