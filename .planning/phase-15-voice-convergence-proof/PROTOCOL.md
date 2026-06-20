# Phase 15 — Voice-Convergence Proof Protocol (pre-registered pilot)

**Status:** Ready to run · **Owner:** founder (coordinates the teacher cohort) · **Created:** 2026-06-04 ·
**Reconciled to judge+LUAR+holdout:** 2026-06-17

This is the experiment that decides whether aiTA's wedge is real. It is designed to be **falsifiable**:
run exactly as written, then read the result against the pre-registered bar in
[`VERDICT.md`](./VERDICT.md) §1 (which mirrors [`docs/recruiting/osf-prereg.md`](../../docs/recruiting/osf-prereg.md)).
A null result is a valid, publishable outcome — **do not tune the protocol to force a pass.** This is a
**PILOT** (n = 4–6 teachers, within-teacher / each-teacher-their-own-control via holdout); it makes no
population-level claim and states its n/power limits honestly.

> The single question: across ≥4 grading batches per teacher (cohort of 4–6 real teachers), does the
> **blinded GPT-judge voice-fidelity** of aiTA's *with-profile* feedback rise across batches (H1) and
> **exceed the matched no-profile holdout** (H2), corroborated by a positive **aggregated LUAR-MUD
> cosine** trend? (Full bar: `VERDICT.md` §1 / `osf-prereg.md`.) Edit-rate decline and the self-rating
> are **DEPRECATED corroborators / context only** — uninterpretable as proof (Borchers AIED 2026: 51.3%
> of teachers never edit).

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

## 1. Participants + materials

- **Cohort:** **4–6 real teachers** (ideally the ICP — burned-out-but-high-integrity grades 9–12 ELA
  teachers). The pilot is **within-teacher**: each teacher is their own control via the no-profile
  holdout arm. The `docs/DEMO-SARAH-MARTINEZ.md` harness may seed a clean account's roster/essays, **but
  the edits, reference corpus, and testimonials must be real teachers'**, not seeded.
- **Reference voice corpus (per teacher, collected BEFORE any analysis):** each teacher contributes
  **10 of their own prior feedback samples** (minimum 8 to qualify), de-identified. This is the baseline
  the GPT-judge scores candidates against. Freeze it before Batch 1.
- **Assignment + rubric:** **ONE** assignment type with a **FIXED structured rubric** per teacher, held
  constant for all that teacher's batches (changing the rubric changes the target voice). A literary-
  analysis assignment with a 3-criterion rubric (as in `eval/dataset/03-strong-essay-holes.json`) works.
- **Essays:** **≥4 batches × ~20 essays** each, same assignment, comparable ability mix per batch
  (don't stack all the strong essays late — confounds the trend). Randomize or block-balance ability.
- **Holdout arm (within each batch):** a fixed **20% of essays (≥3/batch)**, randomly assigned via a
  **seeded RNG (seed logged per teacher per batch)**, are graded with the profile + exemplars
  **suppressed** (identical model/rubric/temperature). This yields matched with/without pairs inside each
  batch — the H2 specificity contrast. (Batches with < 15 essays are excluded from the confirmatory test.)

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

**PRIMARY — GPT-judge voice-fidelity (the pre-registered proof).** For each batch, collect every piece of
aiTA-drafted feedback (with-profile and holdout, condition/batch labels stripped) plus the teacher's
frozen reference corpus, and score with the blinded judge:

```bash
GEMINI_API_KEY=… node eval/run.mjs --judge      # blinded GPT-judge, LOCKED rubric v1.0, 3× per sample
```

Save the full stdout to `artifacts/eval-judge-<date>.txt` and the per-sample scores to
`artifacts/judge-scores-<date>.csv`. The judge is blinded to condition, batch, and teacher (samples
shuffled). This is what `VERDICT.md` §1 decides on. Also compute the **aggregated LUAR-MUD cosine**
(8-sample windows) and **LZ77** corroborators over the same samples, calibrating the LUAR floor/ceiling
in-domain on reference-corpus pairs (record thresholds).

**CORROBORATOR / CONTEXT — edit-rate (DEPRECATED, not a verdict input):**

- **In-app:** open **Metrics → "Is aiTA learning you?"** after each batch. It renders the per-batch
  edit-rate **corroborator** trend directly from the teacher's real data (`convergenceApi.ts`) — the
  panel itself labels this a corroborator, not the verdict. **Screenshot it after each batch** and again
  at the end. Save screenshots to `.planning/phase-15-voice-convergence-proof/artifacts/` (create the dir).
- **Raw export** (run as the teacher or via `psql`, owner-scoped). Save the output as
  `artifacts/convergence-raw-<date>.csv` (corroborator + context only):

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

## 4. Held-out with-profile vs without-profile (the H2 specificity contrast)

The holdout arm is built **into each batch** (Step 1: 20%, seeded RNG) — every batch already produces
matched with/without pairs on the same essays, same model/rubric/temperature. Score both arms with the
**blinded GPT-judge** (Step 3, `--judge`) so the primary contrast is judge fidelity, with-profile vs
holdout, on matched essays. The aggregated LUAR cosine is computed the same way (corroborator).

- **DEPRECATED corroborator (CLI):** `eval/run.mjs --convergence` still replays a teacher's batches and
  prints the per-batch edit-rate plus a held-out with/without edit-rate, exiting non-zero on a flat
  curve. It is now a **CI-gateable corroborator only** — its banner and gate explicitly say so. The
  pre-registered proof is `--judge`, not this. Save its stdout to `artifacts/eval-convergence-<date>.txt`
  if you want the corroborator on record.

---

## 5. Analysis → hand to the verdict

Collect: the **per-batch with-profile vs holdout GPT-judge fidelity series** (primary), the **mixed-model
fit** (`fidelity ~ batch * condition + (batch | teacher)`), the **aggregated LUAR cosine + LZ77 trends**
(corroborators), per-teacher trajectories, and the testimonials. Edit-rate decline + self-rating are
**context only**. Drop them into the pre-registered decision rule in [`VERDICT.md`](./VERDICT.md) §1
**without modifying the rule.** The verdict writes itself from the numbers:

- **H1 significant positive with-profile batch slope (α=0.05) AND H2 (with-profile > holdout, late
  batches) AND a positive aggregated-LUAR trend** → **PROVEN.**
- **H1 fails (no significant positive slope)** OR **(H2 fails AND LUAR flat, < 10% rel. gain
  batch1→4)** → **DISPROVEN (KILL)** → recommend the honest time-savings pivot or KTO/DPO escalation.
- **In between (directional but not significant at pilot n, or mixed judge/LUAR)** → **INCONCLUSIVE** →
  report honestly; extend the cohort/batches or call it. State pilot n/power limits either way.

---

## Artifacts checklist (saved in `artifacts/`)

- [ ] `judge-scores-<date>.csv` — per-sample blinded GPT-judge fidelity (PRIMARY), with-profile vs holdout
- [ ] `eval-judge-<date>.txt` — `eval/run.mjs --judge` stdout (PRIMARY proof)
- [ ] Mixed-model fit output + per-teacher trajectories; LUAR calibration thresholds + aggregated trend
- [ ] `convergence-raw-<date>.csv` / `eval-convergence-<date>.txt` — edit-rate **corroborator** (context only)
- [ ] Per-batch + final screenshots of the "Is aiTA learning you?" corroborator panel
- [ ] The verbatim teacher testimonials (with batch number + attribution)
- [ ] `VERDICT.md` filled in from the above
