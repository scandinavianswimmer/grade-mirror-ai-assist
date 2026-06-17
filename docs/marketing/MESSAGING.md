# aiTA — Message House (canonical)

> The single source of truth for *what we say and to whom*. Every GTM asset (landing copy, DMs,
> Reddit/FB posts, PH listing, emails, the XPRIZE narrative) pulls its language from here so the
> story stays consistent.
> Sources: `XPRIZE-MASTER-PLAN.md` (strategy), `ICP-RESEARCH-AND-POSITIONING.md` (ICP),
> `product-marketing-context.md` (foundation). Last updated 2026-06-15.

---

## 0. The one rule: two audiences, two stories — never blend them

| | **Teachers** (the buyers) | **XPRIZE judges** (Criterion C) |
|---|---|---|
| Lead with | **Time saved + your voice/authority** | The **documented AI-grading bias** problem |
| Then | "you stay in command" (HITL) | aiTA's structural fix → **measured, pre-registered proof** |
| Never say | "bias" (spooks the AI-skeptical majority) | student-outcome claims (not credible in 9 wks) |
| Proof shape | "reads like *you* wrote it" + "it refuses garbage" | GPT-judge rubric + LUAR-MUD cosine + holdout + kill-criterion |

If a single asset is trying to talk to both at once, split it.

---

## 1. Positioning statement (internal north star)

> For the **individual high-school ELA/humanities teacher** drowning in essay grading and burned by
> robotic AI tools, **aiTA** is the grading co-pilot that **learns your feedback voice and grades to
> your rubric** — and **refuses to score work it shouldn't** — so the comments read like *you* wrote
> them and you stay the final grader. Unlike EssayGrader, CoGrader, or Brisk, aiTA doesn't ship a
> static prompt that "sounds like you"; it runs a closed edit→reinforce loop and is the **only tool
> with a pre-registered, measured proof that it converges on your voice.**

**Category we're creating:** *captured teaching expertise* — not "fast auto-grader."

---

## 2. Teacher-facing message (the buyer story)

### One-liners (pick by surface)
- **Primary:** *"aiTA grades like you would — to your rubric, in your voice — and gets more like you every week. You stay the teacher."*
- **Short / social bio:** *"The AI grading co-pilot that learns your voice. You stay in command."*
- **Relief angle:** *"Give every student real feedback — without giving up your weekend."*
- **Trust angle:** *"A grade you can trust, because aiTA knows when *not* to give one."*

### The three territories (use together; never lead with speed)
- **A — In your voice, and it proves it.** Learns your feedback voice through every edit you make;
  the comments read like you, not a bot. Switching cost grows with every essay — your aiTA isn't
  portable to a competitor. *Proof surface: side-by-side "generic draft vs your voice" toggle.*
- **B — It won't rubber-stamp garbage.** Withholds a grade on off-topic/off-assignment work, stays
  inside *your* rubric, shows confidence + evidence per criterion. Directly answers the #1 fear
  ("it'll grade wrong and I'll redo everything"). *Proof surface: the "I withheld this grade because…" card.*
- **C — On your side, not policing your students.** No punitive AI-detection. Counter-position vs.
  Turnitin/GPTZero/EssayGrader's detection bundle. *Values wedge: pro-teacher AND pro-student.*

### Speed is the byproduct, never the headline
Speed is table-stakes (everyone claims "hours → minutes") AND it triggers the replacement fear. Say it
*after* fidelity: *"…and yes, you get your weekend back (≈5.9 hrs/week)."*

### Value props → proof points
| Promise | Why believe it (proof point) |
|---|---|
| "Reads like I wrote it" | Closed edit→reinforce loop + persistent pedagogical memory; with/without-voice toggle |
| "Grades to MY rubric" | Deterministic rubric + relevance gate; rubric synthesized from your prompt if you don't have one |
| "I can trust the score" | Off-topic withholding; per-criterion confidence + evidence citations; server-side recompute |
| "I stay the teacher" | Mandatory human-in-the-loop: approve / edit / dismiss every grade; auto-finalize is opt-in & confidence-gated |
| "My students' data is safe" | De-identification before the model; owner-scoped data; right-to-erasure (honest, not "fully compliant") |
| "Setup isn't a chore" | Rubric synthesis from the assignment prompt; sample-essay trial; one-tap inline review |

### Objection → reframe (teacher)
| They fear… | We say… |
|---|---|
| "It won't sound like me." | "It learns *your* voice from your edits — and you can see the difference side-by-side. Don't take our word for it; we measured it." |
| "It'll grade inaccurately → net-zero time." | "It refuses to score off-topic work and shows its evidence per criterion. You approve every grade — nothing publishes you didn't see (unless you turn on auto-finalize for the easy ones)." |
| "Am I cheating my students out of real feedback?" | "You're still the author. aiTA drafts in your voice; you approve, edit, or reject. Outsource the typing, not the thinking." |
| "Is this how I get replaced?" | "It's a co-pilot you supervise, not an autopilot. The teacher is the final grader, by design." |
| "Where does student data go?" | "Names are stripped before anything is processed; your data is yours and erasable. We tell you exactly what we do — we never claim 'fully compliant.'" |
| "Setup will be fiddly." | "Paste your prompt; aiTA builds the rubric. Or try it right now on 5 sample essays — no class setup, no student data." |

### Words we use / avoid
- **Use:** your voice · you stay the teacher · co-pilot · refuses · withholds · evidence · relief ·
  your rubric · learns you · supervise · craft.
- **Avoid:** replace · fully automated · 10x faster (as a headline) · detector · catch cheaters ·
  fully compliant · enterprise-grade (to individual teachers) · "AI-powered" as the whole pitch.

---

## 3. Judge-facing message (XPRIZE Criterion-C narrative)

> **Lead with the problem, not the product.** Order: *bias → structural fix → measured proof → evidence.*

1. **The problem (documented):** AI essay grading carries measurable bias — Stanford LAK26 findings;
   ETS data showing a ~1.1-point penalty against Asian-American writers. Generic LLM graders are
   unreliable and unfair, and teachers know it (that's why 51% never trust-and-edit the output).
2. **The structural fix (aiTA's architecture):** rubric-grounded scoring + mandatory human-in-the-loop +
   trust-through-refusal (withholds off-topic) + teacher-voice learning. Bias is constrained by
   construction, not by a disclaimer.
3. **The measured proof (the moat):** a **pre-registered** (OSF, by Jul 7) voice-convergence study —
   GPT-judge rubric on voice-trait fidelity (primary), aggregated **LUAR-MUD cosine** over ≥4–8
   samples/teacher (corroborator, in-domain calibrated), **with/without-profile holdout**, and an
   **honest kill criterion.** A proof that *could have failed and didn't* beats a glossy demo.
4. **AI-native operations (Criterion B):** confidence-thresholded **auto-finalize** publishes
   high-confidence/on-topic grades unattended and routes exceptions to the teacher (On-the-Loop). The
   named multi-agent pipeline (Rubric, Relevance/Risk, Grading, Annotation, Feedback, Style) is a
   traced agent workforce, not a black-box call.
5. **Viability (Criterion A):** arms-length, growing, documented revenue (related-party quarantined);
   lead with **trajectory + arms-length % + unit economics**, not the absolute dollar figure.

**Prize target:** $50K runner-up (balanced 3-criteria score) — not the gross-revenue category race.

---

## 4. Competitive one-liners (for comparison pages / objections)
- **vs EssayGrader:** "EssayGrader gives you 500 rubrics. aiTA learns *yours* — and your voice — and proves it. No AI-detection that turns you against your students."
- **vs CoGrader:** "CoGrader's 'sounds like you' is a prompt setting. aiTA's is a learning loop that measurably converges on your style."
- **vs GPTZero / Turnitin:** "Detection-first tools police students and produce false accusations. aiTA is on the teacher's side — no punitive detection."
- **vs Brisk:** "Brisk gives formative comments but can't score to a rubric. aiTA does both — and in your voice."
- **vs Google Classroom AI (Feb 2026):** "Generic, one-size feedback. aiTA grades to your rubric, in your voice, and refuses what it shouldn't touch."

---

## 5. Proof assets to capture (marketing collateral TODO)
- [ ] **The voice toggle:** one graded essay, "generic draft" vs "in Sarah's voice," side by side (hero asset).
- [ ] **The refusal card:** screenshot of aiTA withholding a grade on off-topic work + the reason.
- [ ] **The convergence chart:** the measured with/without-profile result (post-proof, Wk7–8).
- [ ] **The unattended-grading clip:** auto-finalize publishing a batch while exceptions route to review (the <3-min video centerpiece).
- [ ] **3–5 teacher testimonials** ("I barely had to edit this") — arms-length where possible.
