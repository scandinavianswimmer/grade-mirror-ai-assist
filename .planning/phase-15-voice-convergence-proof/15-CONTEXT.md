# Phase 15: Voice-Convergence Proof — Context

**Gathered:** 2026-06-03
**Status:** Ready for planning
**Source:** Founder directive + `~/research/notes/final_report_ai-grading-competitor-whitespace-fc4570.md` (hyperresearch competitive verdict)
**Milestone:** prove-the-wedge (new — supersedes production-1 breadth as the active focus)

<domain>
## Phase Boundary

**The single goal:** prove, with falsifiable evidence, that aiTA can learn an individual teacher's
feedback *voice* well enough that the teacher says **"I barely had to edit this."** This is the one
defensible wedge the competitive research identified; everything else (speed, breadth, more rubrics,
detection) is commodity. For 30 days, **ignore almost everything else.**

**In scope:**
- Instrumenting the existing grade→review→edit loop to *measure* voice convergence (edit-rate and
  edit-distance per grading batch, plus a teacher-reported "barely edited" rating).
- Upgrading the reinforce mechanism from today's single prose style-blurb (Phase 9
  `build-style-profile`) to a **binary-signal few-shot loop**: the teacher's accepted feedback becomes
  positive exemplars, edited/dismissed feedback becomes correction signal, selected per-rubric and
  injected into the grading prompt, rebuilt after each batch.
- Running the proof experiment with a real teacher across ≥4 batches and capturing the curve + the
  testimonial.
- A reproducible convergence eval mode (replay batches, with-profile vs without-profile).
- Writing the honest go/no-go verdict against the falsifiable bar.

**Out of scope (explicitly deferred):**
- KTO / DPO / RLHF fine-tuning or any model-weight training. The report names binary-signal/KTO as the
  right *direction*; the 30-day proof uses **binary-signal few-shot retrieval into the prompt** as the
  pragmatic stand-in and documents KTO as the next step. Do NOT build a training pipeline this phase.
- New marketing surfaces, pricing, onboarding redesign, district features, multi-teacher network effects.
- Migrating the freemium Quick-Grade path (separate work).
</domain>

<decisions>
## Implementation Decisions (LOCKED)

### Technique
- **Binary-signal few-shot, NOT naive DPO, NOT model training.** Accepted annotations/feedback =
  positive exemplars; edited = paired (AI-original → teacher-final) correction exemplars; dismissed =
  negative signal. Select top-K most-relevant (by rubric criterion / recency) and inject into the
  grading prompt's cacheable prefix, alongside (then replacing reliance on) the prose style blurb.
- **Do NOT cite or rely on FSPO's 87% number** as evidence — it is synthetic/roleplay (real-user ~71%).
  The proof stands on aiTA's OWN measured curve, not borrowed benchmarks.
- **Preserve teacher authorship (HITL).** Every grade is still teacher-reviewed/edited/signed-off.
  The learning signal IS the teacher's edits — the loop and the authorship are the same mechanism.

### Measurement (the heart of the phase)
- **Edit-rate** = fraction of AI-suggested annotations/feedback the teacher changes or dismisses per
  submission, aggregated per batch.
- **Edit-distance** = normalized Levenshtein (or token) distance between AI-original feedback text and
  the teacher's final text, per accepted-but-edited item, averaged per batch.
- **"Barely edited" self-rating** = a one-tap post-finalize prompt ("How much did you change aiTA's
  feedback?" 1=rewrote it all … 5=barely touched it). Captured per submission/batch.
- A submission is grouped into a **batch** (ordered, per-teacher, per-assignment-or-session) so the
  curve is computable. The `annotation_edits` table already records accept/edit/dismiss + AI-original
  wording (HITL-04); extend it / add a batch grouping + an edit-distance column rather than rebuild.

### The reinforce trigger
- Profile/exemplar store rebuilds **after each finalized batch** (not just a manual button), consent-gated
  (`privacy_settings.allow_training_on_content`), scoped to the teacher (no cross-teacher pooling).

### Claude's Discretion
- Exact K for few-shot, edit-distance algorithm, batch-boundary heuristic, dashboard layout, exact
  schema column names — choose sensibly and document in the plan.
</decisions>

<canonical_refs>
## Canonical References — Downstream agents MUST read these before planning/implementing

### The verdict this phase operationalizes
- `~/research/notes/final_report_ai-grading-competitor-whitespace-fc4570.md` — §5 (honest verdict: real
  but a race), §6.A (ship demonstrable voice-convergence — binary-signal, behavioral logging, prove it
  fast), §6.B (authorship not mimicry).

### Existing build to EXTEND (not rebuild)
- `supabase/functions/_shared/grading/engine.ts` — the agent pipeline; `buildCachedSystem()` injects
  `styleProfile` into the cacheable prefix (lines ~148-162). This is where few-shot exemplars also go.
- `supabase/functions/build-style-profile/index.ts` — today's prose-blurb distiller (the thing being
  upgraded to binary-signal exemplars).
- `supabase/functions/grade-submission/index.ts` — server path that loads style + persists grade.
- `src/pages/SubmissionDetail.tsx` — the HITL accept/edit/dismiss UI (records `annotation_edits`).
- `eval/run.mjs` + `eval/dataset/` — Phase 10 harness to extend with a convergence mode.
- `supabase/migrations_v2/0009_audit_trail_columns.sql` — the `ai_comment` / audit-trail columns
  (`annotation_edits` lineage). New columns/tables for batch grouping + edit-distance go in a new migration.

### Requirements this phase closes
- `.planning/REQUIREMENTS.md` — **LEARN-04** (edits update profile/few-shot store), **LEARN-05**
  (measurably improves over batches, tracked by eval), **EVAL-02/03** (agreement/regression gating).
</canonical_refs>

<success_criteria>
## Success Criteria (FALSIFIABLE — this is the whole point)

**PRIMARY (the wedge is proven if ALL hold):**
1. With ≥1 real teacher across ≥4 batches (~10-15 essays each, same teacher, fixed rubric/assignment
   type), mean per-essay **edit-rate declines ≥40%** from batch 1 to batch 4.
2. The same teacher rates ≥1 late batch as **"barely had to edit"** (≥4/5 on the self-rating).
3. A held-out **with-profile vs without-profile** comparison on the same essays shows materially lower
   edit-distance / edit-rate with the learned profile (clear margin given small n).

**KILL CRITERION (the wedge is DISPROVEN — say so plainly, per the founder's instruction):**
- If edit-rate is **flat (<15% decline)** across batches OR no batch earns a "barely edited" rating,
  declare voice-convergence unproven for aiTA's current approach and recommend either (a) escalate to
  real KTO/DPO training, or (b) accept the market is commodity and pivot. No ego-boosting.

**REPRODUCIBILITY:**
- `eval/run.mjs --convergence` (or equivalent) replays a teacher's batches and prints the curve;
  runnable on demand; the without-profile baseline is computed the same way (EVAL-04).
</success_criteria>

<specifics>
## Privacy / FERPA note (real student essays in the loop)
The proof uses real student writing. Honor existing guardrails: de-identify before the model (`_shared/deid.ts`),
owner-scoped storage, consent gate, right-to-erasure. Do NOT widen data scope for the experiment.
If real students aren't available, the protocol permits a rigorous founder/teacher self-test on
held-out essays — but the testimonial must come from a genuine teacher edit session, not a synthetic one.
</specifics>

<deferred>
## Deferred Ideas
- Real KTO/DPO fine-tuning pipeline (documented as the next step if the few-shot proof succeeds).
- Cross-teacher transfer / network effects.
- Productionizing the convergence dashboard for all teachers (this phase = proof, not GA).
</deferred>

---
*Phase: 15-voice-convergence-proof · Context gathered 2026-06-03 (manual GSD — no gsd-sdk)*
