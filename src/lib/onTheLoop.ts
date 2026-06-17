// On-the-Loop throughput — aiTA's headline differentiator: confidence-thresholded
// auto-finalize. High-confidence, clean grades publish unattended ("auto-finalized");
// low-confidence or off-ramp ones route to the teacher's exception queue ("needs review").
//
// This module is PURE: it takes already-fetched rows and partitions them. The data layer
// (metricsApi.fetchOnTheLoopSummary) reads the existing submissions + submission_grades
// tables and feeds them here. No new backend calls, no new columns required — it degrades
// gracefully when optional provenance fields (auto_finalized_at, finalized_by) are absent
// by inferring disposition from status + confidence, the columns we know exist.

import { isFinalized } from './submissionStatus';

// Confidence at/above this is "aiTA is sure enough to publish unattended". Stored confidence
// is 0–1 (see metricsApi / geminiApi). 0.85 is a deliberately conservative bar for a demo:
// it keeps the auto-finalize claim defensible (only genuinely high-confidence work publishes).
export const AUTO_FINALIZE_CONFIDENCE = 0.85;

// Statuses that ALWAYS demand a human regardless of confidence — the exception off-ramps.
const EXCEPTION_STATUSES = new Set(['needs_review', 'grade_error']);

// Minimal row shapes — only the fields we actually read, all optional-tolerant.
export interface OnTheLoopSubmission {
  id: string;
  status: string | null | undefined;
  // Optional provenance (cloud schema may lag migrations). When present, finalized_by === 'aiTA'
  // (or a truthy auto_finalized_at) is authoritative for "auto-finalized"; when absent we infer.
  finalized_by?: string | null;
  auto_finalized_at?: string | null;
}

export interface OnTheLoopGrade {
  submission_id: string;
  confidence: number | null | undefined;
}

export type Disposition = 'auto_finalized' | 'needs_review' | 'pending';

export interface OnTheLoopSummary {
  graded: number; // submissions with at least one grade
  autoFinalized: number; // high-confidence, clean → aiTA published unattended
  needsReview: number; // off-ramp or low-confidence → routed to teacher
  pending: number; // graded but neither auto-finalized nor flagged (awaiting threshold/teacher)
  autoFinalizedPct: number | null; // share of graded that aiTA handled unattended (0–100)
}

// True when explicit provenance says aiTA published this unattended.
const hasAutoFinalizeProvenance = (s: OnTheLoopSubmission): boolean =>
  !!s.auto_finalized_at || (typeof s.finalized_by === 'string' && s.finalized_by.toLowerCase() === 'aita');

// Classify one graded submission. `confidence` is the latest grade's confidence (0–1) or null.
export const dispositionFor = (
  submission: OnTheLoopSubmission,
  confidence: number | null,
  threshold: number = AUTO_FINALIZE_CONFIDENCE,
): Disposition => {
  // Off-ramp statuses are exceptions no matter how confident the model was.
  if (EXCEPTION_STATUSES.has(submission.status ?? '')) return 'needs_review';

  // Explicit provenance wins when the migration is present.
  if (hasAutoFinalizeProvenance(submission)) return 'auto_finalized';

  // A teacher-finalized grade is "done" — count it as auto-finalized-equivalent throughput
  // only when confidence cleared the bar; otherwise the teacher actively reviewed it.
  const cleared = typeof confidence === 'number' && confidence >= threshold;
  if (cleared) return 'auto_finalized';

  // Graded but below the confidence bar and not explicitly finalized: needs a look.
  if (typeof confidence === 'number') return 'needs_review';

  // No confidence recorded yet (legacy/in-flight) — neither claim is safe.
  return 'pending';
};

// Build the dashboard/assignment On-the-Loop summary from already-fetched rows.
// Only submissions that have a grade are counted (a grade is what aiTA can finalize).
export const computeOnTheLoopSummary = (
  submissions: OnTheLoopSubmission[],
  grades: OnTheLoopGrade[],
  threshold: number = AUTO_FINALIZE_CONFIDENCE,
): OnTheLoopSummary => {
  // Latest-confidence-per-submission is unknowable here without timestamps, so take the max
  // confidence on record for each submission (a re-grade that raised confidence shouldn't be
  // punished). The data layer already de-dupes to the latest when timestamps are available.
  const bestConfidence = new Map<string, number>();
  const gradedIds = new Set<string>();
  for (const g of grades) {
    gradedIds.add(g.submission_id);
    if (typeof g.confidence === 'number') {
      const prev = bestConfidence.get(g.submission_id);
      if (prev === undefined || g.confidence > prev) bestConfidence.set(g.submission_id, g.confidence);
    }
  }

  let autoFinalized = 0;
  let needsReview = 0;
  let pending = 0;

  for (const s of submissions) {
    // A submission with no grade can't be auto-finalized; only exception off-ramps still count
    // it as "needs review" (e.g. extraction failed before grading).
    const isGraded = gradedIds.has(s.id);
    const conf = bestConfidence.has(s.id) ? bestConfidence.get(s.id)! : null;

    if (!isGraded) {
      if (EXCEPTION_STATUSES.has(s.status ?? '')) needsReview += 1;
      continue;
    }

    const d = dispositionFor(s, conf, threshold);
    if (d === 'auto_finalized') autoFinalized += 1;
    else if (d === 'needs_review') needsReview += 1;
    else pending += 1;
  }

  const graded = gradedIds.size;
  const autoFinalizedPct = graded > 0 ? (autoFinalized / graded) * 100 : null;

  return { graded, autoFinalized, needsReview, pending, autoFinalizedPct };
};

// Whether a single submission read as auto-finalized by aiTA — used by badges/provenance.
// Mirrors dispositionFor but takes the same loose row shape the list rows carry.
export const isAutoFinalized = (
  status: string | null | undefined,
  confidence: number | null | undefined,
  finalizedBy?: string | null,
  autoFinalizedAt?: string | null,
  threshold: number = AUTO_FINALIZE_CONFIDENCE,
): boolean =>
  dispositionFor(
    { id: '', status, finalized_by: finalizedBy, auto_finalized_at: autoFinalizedAt },
    typeof confidence === 'number' ? confidence : null,
    threshold,
  ) === 'auto_finalized';

// Re-exported so callers can keep the "teacher approved" notion alongside the auto-path.
export { isFinalized };
