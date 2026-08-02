// Mr Selby Auto-Finalize Calibration — false-auto-finalize rate on a holdout (PURE, no I/O at module level).
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS EXISTS
// Auto-finalize publishes grades UNATTENDED on the model's self-reported confidence. That signal is
// weak and poorly calibrated, so "the AI operates the business" is only a safe claim if, on real
// held-out data, the grades Mr Selby WOULD HAVE auto-published rarely disagree with what the teacher
// finally decided. This tool measures exactly that: the FALSE-AUTO-FINALIZE RATE — the share of
// would-have-been-auto-published grades the teacher changed beyond a tolerance — at a given threshold.
//
// The bar: false-auto-finalize rate must be < 5% (FALSE_FINALIZE_BAR) before auto-finalize is safe
// to ship as a default-recommended setting. The CLI exits non-zero when the bar is exceeded so it can
// gate CI / a release check.
//
// PURE + MOCK-TESTED: no live model here (there is no Gemini key in this environment). The pure
// functions below take already-collected pairs of (auto-finalized grade, teacher-final grade). When a
// real holdout is available (graded submissions a teacher subsequently finalized/edited), feed those
// pairs in via a JSON file — see the CLI section and eval/README.md.
//
// Mirrors the decision logic in supabase/functions/_shared/grading/auto-finalize.ts: a pair is only
// COUNTED toward the rate if it WOULD have auto-finalized under that module's gate (opted-in, graded
// disposition, no blocking integrity flag, confidence ≥ clamped threshold). Everything else never
// reaches the unattended-publish path and therefore cannot be a false auto-finalize.

/** The ship bar: a false-auto-finalize rate at or above this is UNSAFE to default-recommend. */
export const FALSE_FINALIZE_BAR = 0.05;

/** Default points-difference tolerance: a teacher edit ≤ this (on a 0..100 scale) is "the same grade". */
export const DEFAULT_TOLERANCE = 2;

/** Confidence floor mirrored from auto-finalize.ts — never count a coin-flip as eligible. */
export const MIN_THRESHOLD = 0.6;

/** Integrity flags that ALWAYS defer to a human — mirrored from auto-finalize.ts BLOCKING_FLAGS. */
export const BLOCKING_FLAGS = [
  "off_topic",
  "grade_withheld",
  "relevance_check_unavailable",
  "possible_injection",
  "likely_ai_generated",
  "low_confidence",
];

/** Clamp a threshold into the safe band [MIN_THRESHOLD, 1]; NaN/out-of-range → 0.85. */
export function normalizeThreshold(threshold) {
  if (typeof threshold !== "number" || Number.isNaN(threshold)) return 0.85;
  if (threshold < MIN_THRESHOLD) return MIN_THRESHOLD;
  if (threshold > 1) return 1;
  return threshold;
}

/**
 * Would this graded pair have been auto-finalized under the auto-finalize gate at `threshold`?
 * Pure mirror of decideFinalization (the eligibility half): disposition graded, no blocking flag,
 * confidence ≥ clamped threshold. (The `enabled` opt-in is a per-teacher setting, not a property of
 * the holdout pair, so calibration assumes the teacher had opted in — that's the population we audit.)
 * @param {{disposition?: string, confidence: number, flags?: string[]}} pair
 * @param {number} threshold
 */
export function wouldAutoFinalize(pair, threshold) {
  const applied = normalizeThreshold(threshold);
  const disposition = pair.disposition ?? "graded";
  if (disposition !== "graded") return false;
  const flags = Array.isArray(pair.flags) ? pair.flags : [];
  if (flags.some((f) => BLOCKING_FLAGS.includes(f))) return false;
  return typeof pair.confidence === "number" && pair.confidence >= applied;
}

/** Validate one holdout pair (fail fast — never trust holdout data). */
function validatePair(p, i) {
  if (!p || typeof p !== "object") throw new Error(`pair[${i}]: not an object`);
  if (typeof p.autoGrade !== "number" || Number.isNaN(p.autoGrade))
    throw new Error(`pair[${i}]: autoGrade must be a number`);
  if (typeof p.teacherGrade !== "number" || Number.isNaN(p.teacherGrade))
    throw new Error(`pair[${i}]: teacherGrade must be a number`);
  if (typeof p.confidence !== "number" || Number.isNaN(p.confidence))
    throw new Error(`pair[${i}]: confidence must be a number`);
}

/**
 * Compute the false-auto-finalize rate over holdout pairs.
 *
 * A pair contributes to the denominator only when it WOULD have auto-finalized (eligible). It counts
 * as a false auto-finalize when the teacher's final grade differs from the auto grade by MORE than
 * `tolerance` points — i.e. Mr Selby published a grade the teacher would have changed.
 *
 * @param {Array<{autoGrade:number, teacherGrade:number, confidence:number, disposition?:string, flags?:string[], id?:string}>} pairs
 * @param {{threshold?: number, tolerance?: number}} [opts]
 * @returns {{
 *   threshold:number, tolerance:number,
 *   total:number, eligible:number, falseFinalizes:number,
 *   rate:number|null, withinBar:boolean|null, offenders:Array<object>
 * }}
 */
export function computeFalseFinalizeRate(pairs, opts = {}) {
  if (!Array.isArray(pairs)) throw new Error("pairs must be an array");
  const threshold = normalizeThreshold(opts.threshold ?? 0.85);
  const tolerance = typeof opts.tolerance === "number" && !Number.isNaN(opts.tolerance)
    ? Math.abs(opts.tolerance)
    : DEFAULT_TOLERANCE;

  let eligible = 0;
  let falseFinalizes = 0;
  const offenders = [];

  pairs.forEach((p, i) => {
    validatePair(p, i);
    if (!wouldAutoFinalize(p, threshold)) return;
    eligible += 1;
    const delta = Math.abs(p.teacherGrade - p.autoGrade);
    if (delta > tolerance) {
      falseFinalizes += 1;
      offenders.push({ id: p.id ?? `pair[${i}]`, autoGrade: p.autoGrade, teacherGrade: p.teacherGrade, delta, confidence: p.confidence });
    }
  });

  // rate is undefined (null) when nothing was eligible — you can't certify a bar with no evidence.
  const rate = eligible > 0 ? falseFinalizes / eligible : null;
  const withinBar = rate === null ? null : rate < FALSE_FINALIZE_BAR;

  return { threshold, tolerance, total: pairs.length, eligible, falseFinalizes, rate, withinBar, offenders };
}

/** Human-readable one-screen report for the CLI. */
export function formatReport(r) {
  const pct = r.rate === null ? "n/a (no eligible pairs)" : `${(r.rate * 100).toFixed(2)}%`;
  const lines = [
    "Auto-finalize calibration — false-auto-finalize rate on holdout",
    `  threshold (clamped):  ${r.threshold}`,
    `  tolerance (points):   ±${r.tolerance}`,
    `  pairs total:          ${r.total}`,
    `  eligible (would auto): ${r.eligible}`,
    `  false auto-finalizes:  ${r.falseFinalizes}`,
    `  rate:                  ${pct}  (bar: < ${(FALSE_FINALIZE_BAR * 100).toFixed(0)}%)`,
    `  verdict:               ${r.withinBar === null ? "INCONCLUSIVE" : r.withinBar ? "PASS" : "FAIL"}`,
  ];
  if (r.offenders.length) {
    lines.push("  offenders (teacher changed beyond tolerance):");
    for (const o of r.offenders.slice(0, 20)) {
      lines.push(`    - ${o.id}: ai=${o.autoGrade} teacher=${o.teacherGrade} Δ=${o.delta} conf=${o.confidence}`);
    }
  }
  return lines.join("\n");
}

// ── CLI ──────────────────────────────────────────────────────────────────────
// Usage: node eval/calibration/false-finalize.mjs <pairs.json> [--threshold 0.85] [--tolerance 2]
// <pairs.json> is an array of { autoGrade, teacherGrade, confidence, disposition?, flags?, id? } —
// real holdout pairs collected from graded submissions a teacher subsequently finalized/edited.
// Exits 1 when the bar is exceeded OR the result is inconclusive (no eligible pairs).
async function main(argv) {
  const args = argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("usage: false-finalize.mjs <pairs.json> [--threshold N] [--tolerance N]");
    process.exit(2);
    return;
  }
  const flagVal = (name, dflt) => {
    const idx = args.indexOf(name);
    return idx >= 0 && args[idx + 1] != null ? Number(args[idx + 1]) : dflt;
  };
  const threshold = flagVal("--threshold", 0.85);
  const tolerance = flagVal("--tolerance", DEFAULT_TOLERANCE);

  const { readFile } = await import("node:fs/promises");
  let pairs;
  try {
    pairs = JSON.parse(await readFile(file, "utf8"));
  } catch (e) {
    console.error(`failed to read/parse ${file}: ${e.message}`);
    process.exit(2);
    return;
  }

  let report;
  try {
    report = computeFalseFinalizeRate(pairs, { threshold, tolerance });
  } catch (e) {
    console.error(`calibration failed: ${e.message}`);
    process.exit(2);
    return;
  }

  console.log(formatReport(report));
  process.exit(report.withinBar === true ? 0 : 1);
}

// Only run the CLI when executed directly (not when imported by the vitest suite).
if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv);
}
