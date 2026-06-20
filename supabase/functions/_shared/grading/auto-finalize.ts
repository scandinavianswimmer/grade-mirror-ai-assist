// Auto-finalize decision — the "On-the-Loop" gate that lets aiTA publish high-confidence,
// on-topic, rubric-aligned grades UNATTENDED, routing only exceptions to the teacher.
//
// The agent grades every submission and produces an "AI draft ready" by default; a teacher who has
// EXPLICITLY opted in can additionally let aiTA publish the clearest grades without manual approval,
// while still monitoring the exception queue (needs_review). Keep this module PURE TypeScript (no
// Deno/Supabase imports) so the same logic the edge function runs is unit-tested by vitest under
// src/ — mirrors plan-limits.ts.
//
// NON-NEGOTIABLES this gate enforces (GOAL #1 human-in-the-loop, #5 trust > speed):
//   - Unattended publishing is DEFAULT OFF and opt-in per teacher (AUTO_FINALIZE_DEFAULT_ENABLED).
//   - Any signal-bearing case (off-topic / injection / likely-AI / withheld / low-confidence) is
//     ALWAYS routed to the human, even when the teacher has opted in (BLOCKING_FLAGS).
//   - A hard confidence floor applies regardless of the teacher's configured threshold.
// The self-reported model confidence is a weak, poorly-calibrated signal; before claiming "the AI
// operates the business," the holdout calibration tool (eval/calibration/false-finalize.mjs) must
// show a false-auto-finalize rate < 5% at the configured threshold.
//
// Lifecycle context: the grading engine already routes off-topic and confidence<0.5 grades to
// disposition "needs_review". This gate is a SECOND, stricter bar on top of the "graded" outcome:
// only grades that clear the teacher's auto-finalize threshold AND carry no integrity flags are
// published without review. Everything else stays an "AI draft ready" the teacher finalizes by hand.

/** Default confidence floor for unattended finalize. Conservative: a grade must be clearly settled. */
export const AUTO_FINALIZE_DEFAULT_THRESHOLD = 0.85;

/** Auto-finalize is OPT-IN (default OFF). Human-in-the-loop is the product's #1 non-negotiable:
 *  aiTA always produces an "AI draft ready" the teacher reviews. Only a teacher who has explicitly
 *  enabled this setting lets the clearest grades publish unattended ("On-the-Loop"). The toggle is
 *  per-teacher and never silently flips on. */
export const AUTO_FINALIZE_DEFAULT_ENABLED = false;

/** Hard floor regardless of a teacher's configured threshold — never auto-publish a coin-flip grade. */
export const AUTO_FINALIZE_MIN_THRESHOLD = 0.6;

/** Flags that ALWAYS force teacher review even on a high-confidence grade. An integrity concern
 *  (prompt injection, AI-generated, off-topic withholding) is never something to publish silently. */
export const BLOCKING_FLAGS = [
  "off_topic",
  "grade_withheld",
  "possible_injection",
  "likely_ai_generated",
  "low_confidence",
] as const;

export type FinalizationReason =
  | "auto_finalized"
  | "disabled"
  | "needs_review_disposition"
  | "below_threshold"
  | "blocking_flag";

export interface FinalizationDecision {
  /** When true, the grade is published unattended (status → finalized, finalized_by → ai). */
  autoFinalize: boolean;
  reason: FinalizationReason;
  /** The threshold actually applied (after clamping to the hard floor). */
  appliedThreshold: number;
  /** Present when reason === "blocking_flag": the first flag that forced review. */
  blockingFlag?: string;
}

export interface FinalizationInput {
  /** Engine disposition: "graded" is eligible; "needs_review" is already an exception. */
  disposition: "graded" | "needs_review";
  /** Overall grade confidence, 0..1. */
  confidence: number;
  /** Grade integrity/risk flags from the engine. */
  flags: readonly string[];
  /** Teacher's per-account toggle. Defaults applied by caller when the column/row is absent. */
  enabled: boolean;
  /** Teacher's configured threshold; clamped to [AUTO_FINALIZE_MIN_THRESHOLD, 1]. */
  threshold: number;
}

/** Clamp a teacher-configured threshold into the safe range. Out-of-range / NaN → the default. */
export function normalizeThreshold(threshold: number | null | undefined): number {
  if (typeof threshold !== "number" || Number.isNaN(threshold)) return AUTO_FINALIZE_DEFAULT_THRESHOLD;
  if (threshold < AUTO_FINALIZE_MIN_THRESHOLD) return AUTO_FINALIZE_MIN_THRESHOLD;
  if (threshold > 1) return 1;
  return threshold;
}

/**
 * Decide whether a freshly-computed grade may be finalized without teacher review.
 *
 * Order matters — the most specific "why not" wins so the agent log explains itself:
 *   1. disabled by the teacher
 *   2. already an exception (needs_review) — off-topic / very-low-confidence
 *   3. carries a blocking integrity flag
 *   4. below the (clamped) confidence threshold
 *   5. otherwise → auto-finalize
 */
export function decideFinalization(input: FinalizationInput): FinalizationDecision {
  const appliedThreshold = normalizeThreshold(input.threshold);

  if (!input.enabled) {
    return { autoFinalize: false, reason: "disabled", appliedThreshold };
  }
  if (input.disposition !== "graded") {
    return { autoFinalize: false, reason: "needs_review_disposition", appliedThreshold };
  }
  const blockingFlag = input.flags.find((f) => (BLOCKING_FLAGS as readonly string[]).includes(f));
  if (blockingFlag) {
    return { autoFinalize: false, reason: "blocking_flag", appliedThreshold, blockingFlag };
  }
  if (!(input.confidence >= appliedThreshold)) {
    return { autoFinalize: false, reason: "below_threshold", appliedThreshold };
  }
  return { autoFinalize: true, reason: "auto_finalized", appliedThreshold };
}
