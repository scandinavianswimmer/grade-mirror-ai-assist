---
phase: 15
name: voice-convergence-proof
milestone: prove-the-wedge
requirements: [LEARN-04, LEARN-05, EVAL-02, EVAL-03, PROOF-01, PROOF-02, PROOF-03]
waves: 4
status: planned
created: 2026-06-03
---

# Phase 15 — Voice-Convergence Proof (PLAN)

**Goal (goal-backward anchor):** produce falsifiable evidence that aiTA learns an individual teacher's
feedback voice well enough that they say *"I barely had to edit this."* Everything in this plan exists
to make the convergence curve real, measured, and honest. If the curve is flat, the plan must surface
that, not hide it.

## must_haves
- [ ] **M1** — Every finalized submission records: per-annotation accept/edit/dismiss, AI-original vs teacher-final text, a normalized edit-distance, an ordered batch id, and a one-tap "how much did you edit?" self-rating.
- [ ] **M2** — A reinforce loop that, after each finalized batch, rebuilds a per-teacher store of binary-signal few-shot exemplars (accepted = positive, edited = correction pair, dismissed = negative) and injects top-K into the grading prompt — consent-gated, teacher-scoped.
- [ ] **M3** — A convergence report (CLI + minimal in-app view) plotting edit-rate and mean edit-distance per batch, plus a with-profile vs without-profile comparison on held-out essays.
- [ ] **M4** — The proof experiment run end-to-end with a real teacher across ≥4 batches, with the curve and the testimonial captured.
- [ ] **M5** — A written go/no-go verdict measured against the falsifiable bar in CONTEXT.md (including the kill criterion — disproof is a valid, honestly-reported outcome).

## threat_model (ASVS L1 + FERPA)
- Real student essays flow through the loop. Mitigations (all already built — must be preserved, not bypassed): send-time de-identification (`_shared/deid.ts`), owner-scoped storage, `privacy_settings.allow_training_on_content` consent gate, right-to-erasure (`delete-data`). New tables/columns inherit owner-scoped RLS (`auth.uid() = user_id`). The convergence metrics store NO student PII — only edit-distances, counts, ratings, and submission/batch ids.
- Block-on: any new table without RLS, any exemplar store that pools across teachers, any metric row containing essay text.

---

## Wave 1 — Instrumentation (measure before you optimize) · parallel

### Task 1A — Schema: batch grouping + edit-distance + self-rating  · autonomous: false (migration apply needs DB password)
<action>
Add migration `supabase/migrations_v2/0017_voice_convergence_instrumentation.sql` (additive, idempotent):
(1) `grading_batches` table (id, user_id, assignment_id nullable, label, seq int, created_at) owner-scoped RLS `auth.uid() = user_id`; (2) on `submissions` add nullable `batch_id uuid` + `edit_self_rating smallint` (1-5, null until finalized); (3) on `annotation_edits` add `edit_distance real` (normalized 0..1, null for accept/dismiss) and ensure AI-original + final text lineage exists (reuse `ai_comment`); (4) a read-only view or RLS-safe query path for per-batch aggregates. Force RLS, owner-scoped, no cross-teacher access. Document the apply command for the founder; do NOT include credentials.
</action>
<read_first>
- supabase/migrations_v2/0009_audit_trail_columns.sql (annotation_edits lineage / ai_comment)
- supabase/migrations_v2/0016_rls_force_and_comments.sql (RLS-force pattern to copy)
- supabase/functions/_shared/db.ts (client scoping)
</read_first>
<acceptance_criteria>
- File `supabase/migrations_v2/0017_voice_convergence_instrumentation.sql` exists and is idempotent (re-runnable; uses IF NOT EXISTS / ON CONFLICT).
- `grading_batches`, `submissions.batch_id`, `submissions.edit_self_rating`, `annotation_edits.edit_distance` are defined.
- Every new table has an owner-scoped RLS policy `auth.uid() = user_id` and RLS is forced.
- Plan/notes record the apply command (psql via session pooler) as a founder action.
</acceptance_criteria>

### Task 1B — Capture edit-distance + self-rating at finalize · autonomous: true
<action>
In the HITL flow, when a teacher edits an annotation, compute and persist a normalized edit-distance between `ai_comment` (AI-original) and the saved text onto `annotation_edits.edit_distance`. On Finalize, prompt the teacher with a one-tap 1-5 "How much did you change aiTA's feedback?" control and persist to `submissions.edit_self_rating`. Assign/propagate `batch_id` (group by assignment + finalize session). Keep all writes owner-scoped via the existing user client.
</action>
<read_first>
- src/pages/SubmissionDetail.tsx (accept/edit/dismiss handlers + finalize)
- src/lib/gradingApi.ts (grade/annotation persistence patterns)
- supabase/migrations_v2/0017_voice_convergence_instrumentation.sql (from 1A — column names)
</read_first>
<acceptance_criteria>
- Editing an annotation writes a numeric `edit_distance` in [0,1] to `annotation_edits`.
- Finalize surfaces the 1-5 self-rating control and persists `submissions.edit_self_rating`.
- A finalized submission has a non-null `batch_id`.
- `npm run build` green; no new ESLint findings vs main.
</acceptance_criteria>

### Task 1C — Convergence-metrics module · autonomous: true
<action>
Add `src/lib/convergenceMetrics.ts` (pure functions): given batches of {acceptCount, editCount, dismissCount, editDistances[], selfRatings[]}, compute per-batch edit-rate = (edit+dismiss)/total, mean normalized edit-distance, mean self-rating, and a batch-1→batch-N delta. Return a typed series. No I/O — pure + unit-testable.
</action>
<read_first>
- src/lib/metricsApi.ts (existing metric-computation style + median helper)
</read_first>
<acceptance_criteria>
- `convergenceMetrics.ts` exports pure functions returning a per-batch series + summary deltas.
- vitest unit tests cover: declining-edit-rate series, flat series (kill-criterion case), empty/one-batch edge cases.
- `npm test` passes.
</acceptance_criteria>

---

## Wave 2 — Binary-signal reinforce loop (the actual learning) · depends_on: Wave 1

### Task 2A — Exemplar store from accept/edit/dismiss signal · autonomous: true
<action>
Upgrade the reinforce path from a single prose blurb to a binary-signal exemplar store. Add/extend a `teacher_feedback_exemplars` store (or columns on `teacher_style_profiles`) holding, per teacher: positive exemplars (accepted feedback text + rubric criterion), correction pairs (AI-original → teacher-final, from edits), and negative markers (dismissed). Populate from `annotation_edits` + finalized submissions, de-identified, consent-gated, teacher-scoped. Rebuild after each finalized batch (extend `build-style-profile` or add `rebuild-exemplars`), keeping the prose summary as a fallback for cold start (LEARN-06).
</action>
<read_first>
- supabase/functions/build-style-profile/index.ts (current distiller to upgrade)
- supabase/functions/_shared/deid.ts (de-identification before model/storage)
- supabase/functions/record-feedback-usage/index.ts (post-finalize hook pattern)
</read_first>
<acceptance_criteria>
- After a finalized batch, the teacher's exemplar store contains positive + correction-pair + negative entries derived from that batch's edits.
- Population is consent-gated (`allow_training_on_content`) and owner-scoped; no cross-teacher rows.
- Cold start (no edits yet) still yields a usable prose-summary path (LEARN-06 preserved).
</acceptance_criteria>

### Task 2B — Inject top-K exemplars into the grading prompt · autonomous: true
<action>
In `engine.ts buildCachedSystem()`, when an exemplar store exists, select top-K (by rubric criterion match + recency; choose K, default ~4-6) and inject them as labeled few-shot examples ("this teacher accepted: …", "this teacher rewrote X→Y") into the cacheable prefix, ahead of/instead of leaning on the prose blurb. Keep the prefix stable for prompt-cache hits. Trace the count applied in the existing agent-trace `style` step.
</action>
<read_first>
- supabase/functions/_shared/grading/engine.ts (buildCachedSystem + style trace step ~148-162, 412-417)
- supabase/functions/_shared/ai/gemini.ts (cacheable systemText contract)
</read_first>
<acceptance_criteria>
- A graded submission for a teacher with exemplars shows the `style` agent step reporting injected exemplar count > 0.
- The same essay graded with vs without the exemplar store produces different feedback (LEARN-03/05 verifiable).
- Prompt prefix remains stable across submissions with the same rubric+store (no cache-busting per call).
</acceptance_criteria>

---

## Wave 3 — Reproducible measurement · depends_on: Wave 2

### Task 3A — Convergence eval mode · autonomous: true
<action>
Extend `eval/run.mjs` with a `--convergence` mode: given a teacher's ordered batches (from a fixture or a live export), replay grading with the exemplar store rebuilt between batches, compute the per-batch edit-rate/edit-distance curve, AND a with-profile vs without-profile run on a held-out batch. Print the curve + the batch-1→N delta + a PASS/FAIL against the ≥40%-decline bar; exit non-zero on FAIL so it is CI-gateable (EVAL-03/04).
</action>
<read_first>
- eval/run.mjs (engine replication + gate pattern)
- eval/README.md (why it mirrors the engine)
- src/lib/convergenceMetrics.ts (reuse the same metric definitions)
</read_first>
<acceptance_criteria>
- `node eval/run.mjs --convergence` prints a per-batch curve + delta + with/without comparison and exits non-zero when the decline bar is not met.
- The metric definitions match `convergenceMetrics.ts` (no divergent math).
- `EVAL_DRY_RUN=1` validates fixtures without calling Gemini.
</acceptance_criteria>

### Task 3B — Minimal in-app convergence view · autonomous: true
<action>
Add a small "Is aiTA learning you?" panel (reuse the Metrics page) that renders the per-batch edit-rate + self-rating trend for the signed-in teacher from `convergenceMetrics.ts`. Read-only, owner-scoped. This is the artifact a teacher/judge sees — keep it honest (show a flat line if flat).
</action>
<read_first>
- src/pages/Metrics.tsx (chart + card patterns)
- src/lib/convergenceMetrics.ts
</read_first>
<acceptance_criteria>
- Metrics page shows a per-batch edit-rate/self-rating trend for the teacher's real data.
- Renders correctly with 1 batch, N batches, and zero data (no crash).
- `npm run build` green.
</acceptance_criteria>

---

## Wave 4 — Run the proof + verdict · depends_on: Wave 3 · autonomous: false (needs a real teacher)

### Task 4A — Proof protocol + run · autonomous: false
<action>
Write `.planning/phase-15-voice-convergence-proof/PROTOCOL.md`: a real teacher grades ≥4 batches (~10-15 essays each, same assignment type + fixed rubric), reviewing/editing/finalizing each via the HITL flow, with the exemplar store rebuilding between batches and the self-rating captured each batch. Then execute the run (founder coordinates the teacher). Capture raw data + screenshots of the curve.
</action>
<read_first>
- .planning/phase-15-voice-convergence-proof/15-CONTEXT.md (success bar + kill criterion)
- docs/DEMO-SARAH-MARTINEZ.md (existing seeded teacher harness, if used as the test teacher)
</read_first>
<acceptance_criteria>
- PROTOCOL.md exists with batch sizes, rubric, teacher, and the metric capture steps.
- ≥4 finalized batches exist in the DB for the test teacher with self-ratings and edit-distances.
- Curve screenshots + raw export saved in the phase dir.
</acceptance_criteria>

### Task 4B — Verdict (go / no-go, honest) · autonomous: true (writes the finding from the data)
<action>
Write `.planning/phase-15-voice-convergence-proof/VERDICT.md`: run the convergence eval + read the captured data, compare against CONTEXT.md's PRIMARY bar and KILL criterion, and state plainly whether voice-convergence is PROVEN or DISPROVEN. If proven, quote the teacher's "barely edited" testimonial + the decline %. If disproven, say so and recommend KTO escalation or pivot — no ego-boosting (founder's explicit instruction).
</action>
<read_first>
- .planning/phase-15-voice-convergence-proof/15-CONTEXT.md (the falsifiable bar)
- eval/run.mjs --convergence output + the Wave 4A captured data
</read_first>
<acceptance_criteria>
- VERDICT.md states PROVEN or DISPROVEN against the numeric bar with the actual edit-rate decline % and self-ratings.
- Includes the with/without comparison result.
- If disproven, includes the recommended next step (escalate to KTO / pivot).
</acceptance_criteria>

---

## Verification (phase-level)
- **Goal-backward:** does the phase produce a falsifiable convergence curve + a teacher testimonial (or an honest disproof)? M4 + M5 are the gate.
- **Build/test:** `npm run build` green; `npm test` passes (1C + any new unit tests); `node eval/run.mjs --convergence` runs and gates.
- **Privacy:** new tables owner-scoped + RLS-forced; no student PII in metric rows; consent gate intact.
- **Honesty gate:** VERDICT.md must commit to PROVEN or DISPROVEN against the numeric bar — a hedged "looks promising" is a verification FAIL.

## Founder actions (cannot be agent-done)
- Apply migration `0017` (DB password); deploy changed edge functions (`build-style-profile`/`rebuild-exemplars`, `grade-submission`) — deploy is permission-gated.
- Recruit/coordinate the real teacher for the ≥4-batch run (Wave 4A).

## Notes
- Manual-driven GSD (no gsd-sdk). This plan was authored by hand to match `.planning/` conventions.
- New requirement IDs introduced (add to REQUIREMENTS.md): **PROOF-01** measure convergence, **PROOF-02** binary-signal reinforce loop, **PROOF-03** falsifiable go/no-go verdict.
