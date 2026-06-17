// aiTA Voice-Convergence Proof — GPT-Judge harness (Phase 15 v2, PROOF-redesign)
// ─────────────────────────────────────────────────────────────────────────────
// PURE module. No network, no fs, no process exits. Everything that needs an LLM is
// injected as an async `scorer` function so the decision logic is fully unit-testable
// and the live Gemini path can be swapped in without changing this file.
//
// WHY THIS EXISTS (read first):
//   The ORIGINAL proof metric was edit-rate decline (see src/lib/convergenceMetrics.ts +
//   eval/run.mjs --convergence). Deep research KILLED it as a PRIMARY metric: Borchers et al.
//   (AIED 2026, n=117) found 51.3% of teachers NEVER edit AI feedback, so an edit-rate
//   "decline" is uninterpretable. The pre-registration (docs/recruiting/osf-prereg.md) replaces
//   it with:
//     • PRIMARY  : a blinded GPT-style judge scoring voice-FIDELITY against the LOCKED
//                  5-dimension rubric in eval/convergence/judge-rubric.md (v1.0).
//     • CORROBORATORS: aggregated LUAR-MUD authorship-embedding cosine (≥4–8 samples/teacher,
//                  in-domain calibrated) + an LZ77 / compression-distance signal.
//     • DESIGN   : within-teacher holdout — with-profile vs without-profile on held-out essays.
//   Edit-rate is retained ONLY as a DEPRECATED corroborator; it must never gate alone.
//
// This file implements the frozen judge CONTRACT and the pre-registered KILL CRITERION exactly.
// It does NOT redesign the rubric — the rubric is authoritative (judge-rubric.md v1.0).

// ── Frozen rubric contract (judge-rubric.md v1.0 — LOCKED) ───────────────────────────────────
// SINGLE SOURCE OF TRUTH for the rubric is eval/convergence/judge-rubric.md. These constants MUST
// stay in lockstep with that file; any change there bumps the version and invalidates pre-reg data.
export const JUDGE_RUBRIC_VERSION = "1.0";

// The five voice dimensions, in the exact order + key names the frozen output schema fixes.
export const JUDGE_DIMENSIONS = /** @type {const} */ ([
  "lexical_register",
  "sentence_structure",
  "hedging_directness",
  "praise_critique_tone",
  "formatting_habits",
]);

export const DIM_MAX = 20; // each dimension scored 0–20
export const TOTAL_MAX = JUDGE_DIMENSIONS.length * DIM_MAX; // 100

// Number of scoring runs per sample, averaged (rubric: "Scoring runs per sample: 3 (averaged)").
export const JUDGE_RUNS_PER_SAMPLE = 3;

// The frozen judge model id + the verbatim frozen system prompt (judge-rubric.md). Provider is
// Gemini, not OpenAI — the rubric calls it a "GPT-judge" generically. The model id is marked
// [CONFIRM] in the rubric (founder must confirm/freeze before Batch 1).
export const JUDGE_MODEL = "gemini-2.5-pro"; // [CONFIRM] — frozen at filing per judge-rubric.md
export const JUDGE_TEMPERATURE = 0;

export const JUDGE_SYSTEM_PROMPT =
  "You are a blinded forensic stylometry judge. You will see a REFERENCE set of writing samples by one " +
  "author and one CANDIDATE passage. Judge ONLY whether the CANDIDATE reads as if written by the same " +
  "author as the REFERENCE — voice, not correctness. Do not reward or penalize the candidate for being a " +
  '"better" or "worse" grade; ignore factual accuracy. Score the five dimensions strictly on their 0–20 ' +
  "anchors, sum to a 0–100 total, and return only the specified JSON. Be calibrated: reserve 18–20 for a " +
  "match a careful human couldn't distinguish, and 0–4 for an obviously different writer.";

// Gemini-shaped responseSchema for the frozen judge output (matches the JSON block in the rubric).
// Used by the LIVE scorer; the mock scorer doesn't need it.
export const JUDGE_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    dimensions: {
      type: "object",
      additionalProperties: false,
      properties: Object.fromEntries(
        JUDGE_DIMENSIONS.map((d) => [d, { type: "integer", description: `${d} score 0-20` }]),
      ),
      required: [...JUDGE_DIMENSIONS],
    },
    total: { type: "integer", description: "Sum of the five dimensions, 0-100" },
    rationale: { type: "string", description: "1-2 sentences citing concrete textual evidence." },
  },
  required: ["dimensions", "total", "rationale"],
};

// ── Prompt assembly (the verbatim user content the judge sees) ───────────────────────────────
// The judge sees a REFERENCE corpus (8–10 de-identified teacher samples) and ONE CANDIDATE. It
// NEVER sees condition (with-profile vs holdout), batch index, or teacher id — blinding is enforced
// by only ever passing these three fields.
export function buildJudgeUserContent(referenceSamples, candidate) {
  if (!Array.isArray(referenceSamples) || referenceSamples.length === 0) {
    throw new Error("buildJudgeUserContent: referenceSamples must be a non-empty array");
  }
  if (typeof candidate !== "string" || !candidate.trim()) {
    throw new Error("buildJudgeUserContent: candidate must be a non-empty string");
  }
  const refBlock = referenceSamples
    .map((s, i) => `--- REFERENCE SAMPLE ${i + 1} ---\n${String(s).trim()}`)
    .join("\n\n");
  return (
    `REFERENCE — writing samples by ONE author (the teacher's true voice):\n\n${refBlock}\n\n` +
    `CANDIDATE — one passage; judge only whether it reads as the same author:\n\n${candidate.trim()}\n\n` +
    `Return only the JSON object specified by the schema.`
  );
}

// ── Scoring (validation + aggregation of judge output) ───────────────────────────────────────
function clampDim(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(DIM_MAX, n));
}

// Validate + normalize ONE raw judge result into a canonical { dimensions, total, rationale }.
// We always recompute `total` from the dimensions (the rubric defines total = sum), so a judge that
// returns an inconsistent total can't corrupt the measurement.
export function normalizeJudgeResult(raw) {
  if (!raw || typeof raw !== "object" || !raw.dimensions || typeof raw.dimensions !== "object") {
    throw new Error("normalizeJudgeResult: missing dimensions object");
  }
  const dimensions = {};
  for (const d of JUDGE_DIMENSIONS) {
    if (!(d in raw.dimensions)) throw new Error(`normalizeJudgeResult: missing dimension "${d}"`);
    dimensions[d] = clampDim(Number(raw.dimensions[d]));
  }
  const total = JUDGE_DIMENSIONS.reduce((s, d) => s + dimensions[d], 0);
  return {
    dimensions,
    total, // 0–100, recomputed (single source of truth = the dimensions)
    rationale: typeof raw.rationale === "string" ? raw.rationale : "",
  };
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
function stdev(xs) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1)); // sample SD
}

/**
 * Score ONE candidate against a reference corpus, averaging `runs` judge calls (rubric default 3).
 * The `scorer` is an injected async fn: ({ systemPrompt, userContent, model, temperature, schema, run })
 *   → raw judge result ({ dimensions, total?, rationale? }). This is the ONLY seam to the LLM.
 * Returns the averaged dimension scores, averaged total, and inter-run SD (reliability, per rubric).
 */
export async function scoreCandidate(scorer, referenceSamples, candidate, runs = JUDGE_RUNS_PER_SAMPLE) {
  if (typeof scorer !== "function") throw new Error("scoreCandidate: scorer must be a function");
  const userContent = buildJudgeUserContent(referenceSamples, candidate);
  const results = [];
  for (let run = 0; run < runs; run++) {
    const raw = await scorer({
      systemPrompt: JUDGE_SYSTEM_PROMPT,
      userContent,
      model: JUDGE_MODEL,
      temperature: JUDGE_TEMPERATURE,
      schema: JUDGE_RESPONSE_SCHEMA,
      run,
    });
    results.push(normalizeJudgeResult(raw));
  }
  const avgDimensions = {};
  for (const d of JUDGE_DIMENSIONS) avgDimensions[d] = mean(results.map((r) => r.dimensions[d]));
  const totals = results.map((r) => r.total);
  return {
    dimensions: avgDimensions,
    total: mean(totals), // 0–100
    interRunSD: stdev(totals), // reliability (rubric: "report inter-run SD per sample")
    runs: results.length,
  };
}

/** Aggregate fidelity over MANY candidates (a batch/condition) → mean total + per-dimension means. */
export function aggregateFidelity(scored) {
  const totals = scored.map((s) => s.total).filter((t) => Number.isFinite(t));
  const dims = {};
  for (const d of JUDGE_DIMENSIONS) {
    dims[d] = mean(scored.map((s) => s.dimensions?.[d]).filter((v) => Number.isFinite(v)));
  }
  return { meanTotal: mean(totals), dimensions: dims, n: totals.length };
}

// ── Holdout comparison (within-teacher: with-profile vs without-profile) ─────────────────────
// The pre-reg specificity control. Higher fidelity total = closer to the teacher's voice.
// `delta` = withProfile − withoutProfile. The pre-reg primary test wants this POSITIVE
// (with-profile fidelity EXCEEDS holdout) and increasing across batches.
export function holdoutComparison(withProfileScored, withoutProfileScored) {
  const withAgg = aggregateFidelity(withProfileScored);
  const withoutAgg = aggregateFidelity(withoutProfileScored);
  const wp = withAgg.meanTotal;
  const np = withoutAgg.meanTotal;
  const delta = wp != null && np != null ? wp - np : null;
  return {
    withProfile: withAgg,
    withoutProfile: withoutAgg,
    delta, // points on the 0–100 fidelity scale; positive = profile helps
    // Relative gain over the holdout baseline (guards against a zero/near-zero baseline).
    relativeGainPct: delta != null && np > 0 ? (delta / np) * 100 : null,
  };
}

// ── Cross-batch fidelity trajectory (does with-profile fidelity INCREASE across batches?) ─────
// Pre-reg hypothesis: fast-then-plateau increase, with with-profile exceeding holdout. We summarize
// the trajectory as the batch-1→batch-N gain on the with-profile arm and whether it's monotone-ish.
export function fidelityTrajectory(perBatchWithProfileMeans) {
  const xs = perBatchWithProfileMeans.filter((v) => Number.isFinite(v));
  if (xs.length < 2) {
    return { batchCount: xs.length, firstToLastGain: null, relativeGainPct: null, increasing: false };
  }
  const first = xs[0];
  const last = xs[xs.length - 1];
  const firstToLastGain = last - first;
  return {
    batchCount: xs.length,
    firstToLastGain, // points (0–100 scale)
    relativeGainPct: first > 0 ? (firstToLastGain / first) * 100 : null,
    increasing: firstToLastGain > 0,
  };
}

// ── Pre-registered KILL CRITERION (docs/recruiting/osf-prereg.md — LOCKED) ────────────────────
// Verbatim from the pre-reg:
//   "The wedge is DISPROVEN if, across the study, with-profile feedback shows NO statistically
//    significant gain in primary GPT-judge fidelity over the holdout AND the aggregated LUAR
//    similarity trend is flat ({< X%} relative gain by Batch 4)."
// Two clauses joined by AND ⇒ a DISPROOF requires BOTH the judge AND the LUAR corroborator to be flat.
//   PROVEN  : with-profile fidelity gain over holdout is significant (judge primary passes).
//   DISPROVEN(KILL): judge shows no significant gain over holdout AND LUAR trend is flat (< X%).
//   INCONCLUSIVE: anything else (e.g. judge passes but LUAR flat, or judge flat but LUAR rising,
//                 or significance can't be determined) → report honestly, do NOT round up.
//
// `X` is the pre-registered LUAR relative-gain threshold (the {< X%} brace the founder must fill
// before filing). It MUST be supplied explicitly — there is no silent default, because guessing it
// would fabricate the kill threshold.
export const VERDICT = Object.freeze({
  PROVEN: "PROVEN",
  DISPROVEN: "DISPROVEN",
  INCONCLUSIVE: "INCONCLUSIVE",
});

/**
 * Apply the pre-registered decision rule.
 * @param {object} inputs
 * @param {boolean|null} inputs.judgeSignificantGainOverHoldout
 *        TRUE iff the mixed-effects test finds a significant with-profile fidelity gain over holdout
 *        (pre-reg α). NULL/undefined = significance not yet determinable (forces INCONCLUSIVE, never a
 *        silent PROVEN/DISPROVEN — honesty gate).
 * @param {number|null} inputs.luarRelativeGainPct
 *        Aggregated LUAR-MUD cosine relative gain by Batch 4 (%). NULL = LUAR not yet wired/measured.
 * @param {number} inputs.luarFlatThresholdPct
 *        The pre-registered {X} threshold: LUAR is "flat" iff its relative gain is BELOW this. REQUIRED.
 * @returns {{ verdict: string, reasons: string[], judgePass: boolean|null, luarFlat: boolean|null }}
 */
export function evaluateKillCriterion(inputs) {
  const { judgeSignificantGainOverHoldout, luarRelativeGainPct, luarFlatThresholdPct } = inputs ?? {};
  if (!Number.isFinite(luarFlatThresholdPct)) {
    throw new Error(
      "evaluateKillCriterion: luarFlatThresholdPct is REQUIRED (the pre-registered {X} kill threshold). " +
        "Refusing to guess it — that would fabricate the criterion.",
    );
  }
  const reasons = [];

  // Judge clause: significant gain over holdout?
  const judgePass = typeof judgeSignificantGainOverHoldout === "boolean"
    ? judgeSignificantGainOverHoldout
    : null;

  // LUAR clause: flat iff relative gain is below the pre-registered threshold.
  const luarFlat = Number.isFinite(luarRelativeGainPct)
    ? luarRelativeGainPct < luarFlatThresholdPct
    : null;

  // Honesty gate: if the judge significance is unknown, we cannot reach a confirmatory verdict.
  if (judgePass === null) {
    reasons.push("Judge significance not determined (no live judge run / no model fit) → INCONCLUSIVE.");
    return { verdict: VERDICT.INCONCLUSIVE, reasons, judgePass, luarFlat };
  }

  if (judgePass === true) {
    reasons.push("Primary GPT-judge fidelity shows a significant with-profile gain over holdout.");
    return { verdict: VERDICT.PROVEN, reasons, judgePass, luarFlat };
  }

  // judgePass === false from here. KILL requires BOTH clauses (judge flat AND LUAR flat).
  reasons.push("Primary GPT-judge fidelity shows NO significant with-profile gain over holdout.");
  if (luarFlat === null) {
    reasons.push("LUAR corroborator not measured (model not wired) → cannot confirm KILL → INCONCLUSIVE.");
    return { verdict: VERDICT.INCONCLUSIVE, reasons, judgePass, luarFlat };
  }
  if (luarFlat === true) {
    reasons.push(
      `Aggregated LUAR trend is flat (relative gain ${luarRelativeGainPct.toFixed(1)}% < ${luarFlatThresholdPct}%). ` +
        "Both pre-registered clauses hold → wedge DISPROVEN (KILL). Pivot Criterion-C to time-savings.",
    );
    return { verdict: VERDICT.DISPROVEN, reasons, judgePass, luarFlat };
  }
  // Judge flat but LUAR rising → mixed → not a pre-registered KILL.
  reasons.push(
    `LUAR trend is NOT flat (relative gain ${luarRelativeGainPct.toFixed(1)}% ≥ ${luarFlatThresholdPct}%). ` +
      "Only one clause holds → does not meet the KILL bar → INCONCLUSIVE (report honestly).",
  );
  return { verdict: VERDICT.INCONCLUSIVE, reasons, judgePass, luarFlat };
}

// ── Deterministic MOCK scorer (tests + dry-run) ──────────────────────────────────────────────
// HONEST: this is NOT the judge. It is a deterministic stylometric proxy that lets us exercise the
// plumbing + decision logic without a Gemini key. It scores voice similarity from cheap surface
// features (lexical overlap, mean sentence length, punctuation/hedge habits) so that a candidate
// closer to the reference voice scores higher — enough to drive the harness, NOT a real fidelity
// number. The LIVE judge (Gemini) replaces it via the same `scorer` seam. Do not ship mock numbers
// as evidence.
const HEDGE_WORDS = ["might", "consider", "perhaps", "could", "maybe", "try", "notice", "push"];
function tokenize(s) {
  return String(s).toLowerCase().match(/[a-z']+/g) ?? [];
}
function featurize(text) {
  const toks = tokenize(text);
  const vocab = new Set(toks);
  const sentences = String(text).split(/[.!?]+/).map((x) => x.trim()).filter(Boolean);
  const meanSentLen = sentences.length ? toks.length / sentences.length : 0;
  const hedges = toks.filter((t) => HEDGE_WORDS.includes(t)).length;
  const hedgeRate = toks.length ? hedges / toks.length : 0;
  const exclaimRate = (String(text).match(/!/g)?.length ?? 0) / Math.max(1, sentences.length);
  return { vocab, toks, meanSentLen, hedgeRate, exclaimRate };
}
function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter || 1);
}
function similarityToScore(sim) {
  // Map a [0,1] similarity to the rubric's 0–20 dimension anchors.
  return Math.round(Math.max(0, Math.min(1, sim)) * DIM_MAX);
}

/**
 * Build a deterministic mock scorer over a reference corpus. Same inputs → same scores (no RNG),
 * so tests and the dry-run are reproducible. Returns the frozen judge output shape.
 */
export function makeMockScorer() {
  return async function mockScorer({ userContent }) {
    // Recover the reference + candidate blocks from the assembled prompt (the mock is the "judge").
    const refSamples = [...userContent.matchAll(/--- REFERENCE SAMPLE \d+ ---\n([\s\S]*?)(?=\n\n--- REFERENCE|\n\nCANDIDATE)/g)]
      .map((m) => m[1].trim());
    const candMatch = userContent.match(/CANDIDATE[^\n]*\n\n([\s\S]*?)\n\nReturn only the JSON/);
    const candidate = candMatch ? candMatch[1].trim() : "";
    const refText = refSamples.join("\n");
    const rf = featurize(refText);
    const cf = featurize(candidate);

    const lexical = jaccard(rf.vocab, cf.vocab);
    const sentence = 1 - Math.min(1, Math.abs(rf.meanSentLen - cf.meanSentLen) / 20);
    const hedging = 1 - Math.min(1, Math.abs(rf.hedgeRate - cf.hedgeRate) * 10);
    const tone = 1 - Math.min(1, Math.abs(rf.exclaimRate - cf.exclaimRate));
    // Formatting proxy: do both use the teacher's characteristic openers ("Notice"/"Push")?
    const opener = (t) => /\b(notice|push)\b/i.test(t);
    const formatting = opener(refText) === opener(candidate) ? 0.9 : 0.4;

    const dimensions = {
      lexical_register: similarityToScore(lexical),
      sentence_structure: similarityToScore(sentence),
      hedging_directness: similarityToScore(hedging),
      praise_critique_tone: similarityToScore(tone),
      formatting_habits: similarityToScore(formatting),
    };
    const total = JUDGE_DIMENSIONS.reduce((s, d) => s + dimensions[d], 0);
    return { dimensions, total, rationale: "MOCK deterministic stylometric proxy — not the real judge." };
  };
}

// ── LUAR-MUD + LZ77 corroborators (PLUGGABLE STUBS — real models NOT wired) ───────────────────
// HONEST STATUS: neither the real LUAR-MUD authorship-embedding model nor a production LZ77 pipeline
// is reachable in this environment. The structures below are the documented seams the production
// harness fills. The stubs return deterministic, clearly-labelled proxy numbers so the plumbing is
// exercised — they are NOT calibrated similarity and MUST NOT be reported as evidence.

/**
 * Compute aggregated LUAR-MUD cosine similarity for a teacher.
 * Pre-reg: aggregate over ≥4–8 feedback samples (NOT single comments — LUAR degrades on short text),
 * compare against the pre-enrollment reference corpus, and CALIBRATE an in-domain floor/ceiling on
 * held-out teacher pairs (do NOT reuse Reddit defaults).
 *
 * @param {(texts: string[]) => Promise<number[]>} embedFn  Injected LUAR embedder. NOT PROVIDED here —
 *        wire the real LUAR-MUD model (founder-gated). Until then callers pass the stub below.
 */
export async function luarAggregateCosine(embedFn, candidateSamples, referenceSamples, opts = {}) {
  const minSamples = opts.minSamples ?? 4; // pre-reg floor (≥4–8 samples)
  if (!Array.isArray(candidateSamples) || candidateSamples.length < minSamples) {
    return { cosine: null, reason: `need ≥${minSamples} samples (LUAR degrades on short text)`, calibrated: false };
  }
  if (typeof embedFn !== "function") {
    throw new Error("luarAggregateCosine: embedFn (the LUAR-MUD embedder) is required — none is wired in this env");
  }
  // Aggregate (mean-pool) embeddings per side, then cosine. The real embedder returns model vectors;
  // the stub returns surface-feature vectors so this stays runnable but clearly NOT calibrated.
  const candVec = meanPool(await embedFn(candidateSamples));
  const refVec = meanPool(await embedFn(referenceSamples));
  return { cosine: cosineSim(candVec, refVec), calibrated: false, note: "NOT in-domain calibrated — wire real LUAR" };
}

function meanPool(vectors) {
  if (!vectors.length) return [];
  const dim = vectors[0].length;
  const out = new Array(dim).fill(0);
  for (const v of vectors) for (let i = 0; i < dim; i++) out[i] += v[i];
  return out.map((x) => x / vectors.length);
}
function cosineSim(a, b) {
  if (!a.length || a.length !== b.length) return null;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : null;
}

// Deterministic STUB embedder — surface-feature vector, NOT a real authorship embedding.
// Wire the real LUAR-MUD model here (founder-gated). Labelled so it can't masquerade as calibrated.
export function makeStubLuarEmbedder() {
  return async function stubEmbed(texts) {
    return texts.map((t) => {
      const f = featurize(t);
      return [f.toks.length, f.vocab.size, f.meanSentLen, f.hedgeRate * 100, f.exclaimRate * 100];
    });
  };
}

/**
 * LZ77 / compression edit-distance corroborator (Borchers-robust). Normalized Compression Distance
 * via a length-based LZ77-style proxy: NCD = (C(ab) − min(C(a),C(b))) / max(C(a),C(b)).
 * This uses a SIMPLE LZ77 token-window compressor — adequate as a deterministic corroborator signal,
 * NOT the production compressor. Real pipeline may swap in gzip/zstd; the contract (NCD in [0,1]) holds.
 * Lower NCD = more similar (less extra information to encode b given a).
 */
export function lz77NormalizedDistance(a, b) {
  const ca = lz77CompressedLength(a ?? "");
  const cb = lz77CompressedLength(b ?? "");
  const cab = lz77CompressedLength((a ?? "") + (b ?? ""));
  const denom = Math.max(ca, cb);
  if (denom === 0) return 0;
  return Math.max(0, Math.min(1, (cab - Math.min(ca, cb)) / denom));
}

// Minimal LZ77 compressed-length estimate: count of output tokens (literal or back-reference) using a
// sliding window. Deterministic; serves as the compressibility proxy C(·).
function lz77CompressedLength(input, windowSize = 256, minMatch = 3) {
  const s = String(input);
  let i = 0;
  let tokens = 0;
  while (i < s.length) {
    const start = Math.max(0, i - windowSize);
    let bestLen = 0;
    for (let j = start; j < i; j++) {
      let len = 0;
      while (i + len < s.length && s[j + len] === s[i + len] && len < windowSize) len++;
      if (len > bestLen) bestLen = len;
    }
    if (bestLen >= minMatch) {
      tokens++; // one back-reference token
      i += bestLen;
    } else {
      tokens++; // one literal token
      i += 1;
    }
  }
  return tokens;
}
