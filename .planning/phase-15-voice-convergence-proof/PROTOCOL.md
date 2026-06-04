# Phase 15 Wave 4A — Voice-Convergence Proof Protocol

**Status:** Ready to run · **Owner:** founder (coordinates a real teacher) · **Created:** 2026-06-04

This is the experiment that decides whether aiTA's wedge is real. It is designed to be **falsifiable**:
run exactly as written, then read the result against the pre-registered bar in
[`VERDICT.md`](./VERDICT.md). A flat curve is a valid, publishable outcome — **do not tune the
protocol to force a pass.**

> The single question: across ≥4 grading batches with one real teacher, does the teacher's per-essay
> **edit-rate decline ≥40%**, with at least one late batch rated **"barely had to edit" (≥4/5)**, and a
> **with-profile vs without-profile** gap on held-out essays? (Full bar: `15-CONTEXT.md` §Success Criteria.)

---

## 0. Prerequisites (founder, one-time)

These are the founder/cloud-gated actions the agent cannot perform. All must be true before Batch 1.

| # | Action | How | Why |
|---|---|---|---|
| P1 | Apply migration `0017` | `psql … -f supabase/migrations_v2/0017_voice_convergence_instrumentation.sql` (session pooler, DB pw) | batch grouping + edit-distance + self-rating columns |
| P2 | Apply migration `0018` | `psql … -f supabase/migrations_v2/0018_teacher_feedback_exemplars.sql` | the exemplar store the reinforce loop writes |
| P3 | Deploy edge functions | `supabase functions deploy rebuild-exemplars grade-submission --no-verify-jwt` | injection + rebuild paths live |
| P4 | Enable `gemini-2.5-pro` billing | Google Cloud console | grade on pro, not the flash fallback (better voice fidelity) |
| P5 | Teacher consent ON | teacher flips **Settings → allow training on content** (or `privacy_settings.allow_training_on_content = true` for that teacher) | reinforce loop is consent-gated; without it `rebuild-exemplars` 403s |

**Privacy guardrails (do not relax for the experiment):** real student essays flow through the loop.
Keep send-time de-identification (`_shared/deid.ts`), owner-scoped storage, and right-to-erasure intact.
Do **not** widen data scope. If real students aren't available, `15-CONTEXT.md` permits a rigorous
founder/teacher self-test on held-out essays — **but the testimonial must come from a genuine teacher
edit session, not a synthetic one.**

---

## 1. Participant + materials

- **Teacher:** one real teacher (ideally the ICP — a burned-out-but-high-integrity ELA teacher). The
  `docs/DEMO-SARAH-MARTINEZ.md` harness may seed the roster/essays for a clean account, **but the edits
  and the testimonial must be a real teacher's**, not seeded.
- **Assignment + rubric:** **ONE** assignment type with a **FIXED structured rubric**, held constant for
  all batches (changing the rubric changes the target voice and invalidates the curve). A literary-
  analysis assignment with a 3-criterion rubric (as in `eval/dataset/03-strong-essay-holes.json`) works.
- **Essays:** **≥4 batches × 10–15 essays** each, same assignment, comparable ability mix per batch
  (don't stack all the strong essays in batch 4 — that manufactures a decline). Randomize or
  block-balance ability across batches.
- **Held-out set:** reserve **~8–10 essays** that are graded **only** in the with/without comparison
  (Step 4), never used to build the store.

---

## 2. Per-batch procedure (repeat for batches 1…N, N ≥ 4)

For each batch, in order:

1. **Grade the batch.** Open the assignment → **Grade all ungraded**. Each submission runs the agent
   pipeline; the `style` step reports `exemplarCount` (0 for Batch 1 cold start, >0 thereafter).
2. **Review every submission via HITL** (`SubmissionDetail`): **accept / edit / dismiss** each inline
   annotation. Edit in your real voice — the edits *are* the learning signal. Editing writes
   `annotations.edit_distance`; accept/edit/dismiss writes `annotations.status`.
3. **Finalize** each submission and answer the one-tap **"How much did you change aiTA's feedback?"**
   (1 = rewrote it all … 5 = barely touched it). This writes `submissions.edit_self_rating` and assigns
   the `batch_id`.
4. **Rebuild fires.** Finalizing the batch triggers `rebuild-exemplars`, which repopulates the teacher's
   exemplar store (accept→positive, edit→correction, dismiss→negative; consent-gated, de-identified).
   The next batch's grading injects the top-K=6 newest exemplars.
5. **Record the batch** (the in-app panel does this automatically — see Step 3).

> Keep batches as separate finalize sessions so `grading_batches.seq` orders them. Do not re-grade a
> prior batch after finalizing it (it would reorder the curve).

---

## 3. Data capture (per batch + cumulative)

- **In-app:** open **Metrics → "Is aiTA learning you?"** after each batch. It renders the per-batch
  edit-rate trend + verdict directly from the teacher's real data (`convergenceApi.ts`). **Screenshot it
  after each batch** and again at the end. Save screenshots to
  `.planning/phase-15-voice-convergence-proof/artifacts/` (create the dir).
- **Raw export** (run as the teacher or via `psql`, owner-scoped). Save the output as
  `artifacts/convergence-raw-<date>.csv`:

  ```sql
  -- Per-batch edit-rate / mean edit-distance / mean self-rating for one teacher.
  with b as (select id, seq, label from public.grading_batches where user_id = :teacher),
       s as (select id, batch_id, edit_self_rating from public.submissions
             where batch_id in (select id from b) and status = 'finalized'),
       a as (select an.status, an.edit_distance, s.batch_id
             from public.annotations an join s on an.submission_id = s.id
             where an.status in ('accepted','edited','rejected'))
  select b.seq, b.label,
         count(a.*)                                            as annotations,
         round(avg((a.status in ('edited','rejected'))::int), 3) as edit_rate,
         round(avg(a.edit_distance) filter (where a.status='edited'), 3) as mean_edit_distance,
         round((select avg(edit_self_rating) from s s2 where s2.batch_id = b.id), 2) as mean_self_rating
  from b left join a on a.batch_id = b.id
  group by b.seq, b.label order by b.seq;
  ```

- **Testimonial:** capture the teacher's **verbatim** reaction to a late batch (the "I barely had to edit
  this" moment, or its honest absence). One real sentence, attributed, with the batch number.

---

## 4. Held-out with-profile vs without-profile comparison

Two ways, run **both** if possible:

- **Reproducible (CLI):** build a convergence fixture from the teacher's real batches (same shape as
  `eval/convergence/holes-voice.json` — essays + the teacher's final annotations as `reference`) and run:

  ```bash
  GEMINI_API_KEY=… node eval/run.mjs --convergence
  ```

  It prints the per-batch curve, the batch-1→N decline, and the **held-out with-profile vs
  without-profile** edit-rates, and exits non-zero if the ≥40% bar isn't met. This is the on-demand,
  re-runnable proof (EVAL-04). Save the full stdout to `artifacts/eval-convergence-<date>.txt`.

- **In-app (qualitative):** grade the held-out essays once with the learned store active and once for a
  teacher whose store is empty (or temporarily cleared), and compare edit-rates in the panel.

---

## 5. Analysis → hand to the verdict

Collect: the per-batch `edit_rate` series, the late-batch `mean_self_rating`, the held-out with/without
numbers, and the testimonial. Drop them into the pre-registered decision rule in
[`VERDICT.md`](./VERDICT.md) **without modifying the rule.** The verdict writes itself from the numbers:

- **≥40% edit-rate decline** batch-1→N **AND** a late batch **≥4/5** self-rating **AND** held-out
  with-profile materially better → **PROVEN.**
- **<15% decline** OR **no batch ≥4/5** → **DISPROVEN (KILL)** → recommend KTO/DPO escalation or pivot.
- **In between** → **INCONCLUSIVE** → report honestly; extend to more batches or call it.

---

## Artifacts checklist (saved in `artifacts/`)

- [ ] `convergence-raw-<date>.csv` — per-batch metrics export
- [ ] `eval-convergence-<date>.txt` — `eval/run.mjs --convergence` stdout (with/without comparison)
- [ ] Per-batch + final screenshots of the "Is aiTA learning you?" panel
- [ ] The verbatim teacher testimonial (with batch number + attribution)
- [ ] `VERDICT.md` filled in from the above (Wave 4B)
