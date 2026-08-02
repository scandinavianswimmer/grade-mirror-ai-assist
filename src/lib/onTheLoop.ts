// On-the-Loop throughput — Mr Selby's headline differentiator: confidence-thresholded
// auto-finalize. High-confidence, clean grades are approved automatically ("auto-finalized");
// low-confidence or off-ramp ones route to the teacher's exception queue ("needs review").
//
// This module is PURE: it takes already-fetched rows and partitions them. The data layer
// (metricsApi.fetchOnTheLoopSummary) reads the existing submissions + submission_grades
// tables and feeds them here. No new backend calls are required. Automatic approval is
// counted only when persisted provenance proves it happened; a lagging schema must fail closed
// instead of manufacturing an XPRIZE-facing metric from model confidence.

import { isFinalized } from './submissionStatus';

// Statuses that ALWAYS demand a human regardless of confidence — the exception off-ramps.
const EXCEPTION_STATUSES = new Set(['needs_review', 'grade_error']);

// Minimal row shapes — only the fields we actually read, all optional-tolerant.
export interface OnTheLoopSubmission {
  id: string;
  status: string | null | undefined;
  // Optional provenance (cloud schema may lag migrations). finalized_by === 'ai'
  // (or a truthy auto_finalized_at) is the only authority for "auto-finalized".
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
  autoFinalized: number; // persisted provenance proves Mr Selby approved the result automatically
  needsReview: number; // off-ramp or non-finalized grade awaiting a teacher
  pending: number; // teacher-finalized grade, complete but not AI throughput
  autoFinalizedPct: number | null; // share of graded that Mr Selby handled unattended (0–100)
}

// True when explicit provenance says Mr Selby approved this automatically.
const hasAutoFinalizeProvenance = (s: OnTheLoopSubmission): boolean =>
  !!s.auto_finalized_at || s.finalized_by === 'ai';

// Classify one graded submission. Confidence alone never proves automatic approval.
export const dispositionFor = (submission: OnTheLoopSubmission): Disposition => {
  // Off-ramp statuses are exceptions no matter how confident the model was.
  if (EXCEPTION_STATUSES.has(submission.status ?? '')) return 'needs_review';

  // Explicit provenance wins when the migration is present.
  if (hasAutoFinalizeProvenance(submission)) return 'auto_finalized';

  // A teacher-finalized grade is complete but is not AI throughput.
  if (isFinalized(submission.status)) return 'pending';

  // Any other graded row without AI provenance still requires teacher review. This includes
  // high-confidence grades when auto-finalize is disabled (the safe product default).
  return 'needs_review';
};

// Build the dashboard/assignment On-the-Loop summary from already-fetched rows.
// Only submissions that have a grade are counted (a grade is what Mr Selby can finalize).
export const computeOnTheLoopSummary = (
  submissions: OnTheLoopSubmission[],
  grades: OnTheLoopGrade[],
): OnTheLoopSummary => {
  const gradedIds = new Set<string>();
  for (const g of grades) {
    gradedIds.add(g.submission_id);
  }

  let autoFinalized = 0;
  let needsReview = 0;
  let pending = 0;

  for (const s of submissions) {
    // A submission with no grade can't be auto-finalized; only exception off-ramps still count
    // it as "needs review" (e.g. extraction failed before grading).
    const isGraded = gradedIds.has(s.id);
    if (!isGraded) {
      if (EXCEPTION_STATUSES.has(s.status ?? '')) needsReview += 1;
      continue;
    }

    const d = dispositionFor(s);
    if (d === 'auto_finalized') autoFinalized += 1;
    else if (d === 'needs_review') needsReview += 1;
    else pending += 1;
  }

  const graded = gradedIds.size;
  const autoFinalizedPct = graded > 0 ? (autoFinalized / graded) * 100 : null;

  return { graded, autoFinalized, needsReview, pending, autoFinalizedPct };
};

// Whether a single submission read as auto-finalized by Mr Selby — used by badges/provenance.
// Mirrors dispositionFor but takes the same loose row shape the list rows carry.
export const isAutoFinalized = (
  status: string | null | undefined,
  finalizedBy?: string | null,
  autoFinalizedAt?: string | null,
): boolean =>
  dispositionFor(
    { id: '', status, finalized_by: finalizedBy, auto_finalized_at: autoFinalizedAt },
  ) === 'auto_finalized';

// Re-exported so callers can keep the "teacher approved" notion alongside the auto-path.
export { isFinalized };
