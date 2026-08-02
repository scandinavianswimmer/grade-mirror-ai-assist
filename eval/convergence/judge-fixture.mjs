// Mr Selby Voice-Convergence Proof — judge fixture parsing (PURE, no I/O).
// ─────────────────────────────────────────────────────────────────────────────
// Parses the convergence fixture format (eval/convergence/holes-voice.json) into the inputs the
// GPT-judge harness needs:
//   • referenceCorpus : the teacher's TRUE-voice samples (pre-reg wants 8–10 de-identified samples).
//                       Derived from every `reference[].comment` across batches + held-out — these ARE
//                       the teacher's own annotation prose, which is exactly their feedback voice.
//   • candidates      : per (batch × condition) the Mr Selby-drafted feedback to be judged. In a LIVE run
//                       these come from the grading engine (with-profile vs holdout). The fixture has
//                       no AI drafts of its own, so loadJudgeFixture only supplies the reference corpus
//                       + the held-out reference text; the live harness fills candidates from Gemini.
//
// This module is the boundary validator: it fails fast on malformed fixtures (KISS — trust nothing).

const MIN_REFERENCE_SAMPLES = 4; // pre-reg/LUAR floor (≥4–8); judge prefers 8–10 but 4 is the hard floor.

/**
 * Validate + parse a parsed-JSON fixture object into judge-harness inputs.
 * @param {object} fx   parsed fixture (already JSON.parse'd)
 * @param {string} file fixture filename (for error messages)
 */
export function parseJudgeFixture(fx, file = "<fixture>") {
  const need = (cond, msg) => {
    if (!cond) throw new Error(`Judge fixture ${file}: ${msg}`);
  };
  need(fx && typeof fx === "object", "not an object");
  need(typeof fx.teacher === "string" && fx.teacher, "missing teacher");
  need(typeof fx.assignmentPrompt === "string" && fx.assignmentPrompt, "missing assignmentPrompt");
  need(fx.rubric && typeof fx.rubric.totalPoints === "number", "missing rubric.totalPoints");
  need(Array.isArray(fx.batches) && fx.batches.length >= 1, "needs ≥1 batch");
  need(fx.heldOut && Array.isArray(fx.heldOut.essays) && fx.heldOut.essays.length > 0, "missing heldOut.essays");

  // Collect the teacher's reference-voice corpus from every reference annotation comment.
  const referenceCorpus = [];
  const collect = (essays, where) => {
    need(Array.isArray(essays), `${where}: essays must be an array`);
    for (const e of essays) {
      need(typeof e.text === "string" && e.text, `${where}: essay missing text`);
      need(Array.isArray(e.reference), `${where}: essay ${e.id ?? "?"} missing reference[]`);
      for (const r of e.reference) {
        if (typeof r.comment === "string" && r.comment.trim()) referenceCorpus.push(r.comment.trim());
      }
    }
  };
  for (const b of fx.batches) {
    need(Number.isInteger(b.seq), "batch missing integer seq");
    collect(b.essays, `batch ${b.seq}`);
  }
  collect(fx.heldOut.essays, "heldOut");

  need(
    referenceCorpus.length >= MIN_REFERENCE_SAMPLES,
    `reference corpus has ${referenceCorpus.length} samples; need ≥${MIN_REFERENCE_SAMPLES} (LUAR/judge floor)`,
  );

  // Held-out reference text per essay — the canonical teacher voice for the held-out essays the
  // with/without comparison is judged on.
  const heldOutReferences = fx.heldOut.essays.map((e) => ({
    id: e.id ?? null,
    text: e.text,
    referenceComments: (e.reference ?? []).map((r) => r.comment).filter(Boolean),
  }));

  return {
    teacher: fx.teacher,
    assignmentPrompt: fx.assignmentPrompt,
    rubric: fx.rubric,
    batchCount: fx.batches.length,
    referenceCorpus, // the teacher's true-voice samples (what the judge compares against)
    heldOut: heldOutReferences,
  };
}
