// Canonical submission grading state machine — single source of truth for status labels,
// badge styling, and ordering so the list, detail, and dashboard never disagree (H11, M48, M65).
//
// Flow: uploaded → grading → graded → finalized → exported
//       (needs_review / grade_error are off-ramps that require teacher attention)

export type SubmissionStatus =
  | 'uploaded'
  | 'grading'
  | 'graded'
  | 'needs_review'
  | 'grade_error'
  | 'finalized'
  | 'exported'
  // legacy v1 values still present in restored data:
  | 'pending'
  | 'ai_graded';

interface StatusMeta {
  label: string;
  badgeClass: string;
  description: string;
}

const META: Record<string, StatusMeta> = {
  uploaded: { label: 'Ready to draft', badgeClass: 'bg-primary/10 text-primary', description: 'Student work is present and ready for a first pass.' },
  grading: { label: 'Drafting feedback…', badgeClass: 'bg-question-soft text-question', description: 'Mr Selby is drafting rubric-aligned feedback.' },
  graded: { label: 'Ready for review', badgeClass: 'bg-suggestion-soft text-suggestion', description: 'Draft feedback is ready. Nothing has been released.' },
  needs_review: { label: 'Needs a closer look', badgeClass: 'bg-critique-soft text-critique', description: 'The document or grading decision needs your attention.' },
  grade_error: { label: 'Draft did not finish', badgeClass: 'bg-critique-soft text-critique', description: 'The latest draft did not finish. Try again without losing earlier work.' },
  finalized: { label: 'Approved', badgeClass: 'bg-praise-soft text-praise', description: 'Review is complete. This has not necessarily been exported.' },
  exported: { label: 'Exported', badgeClass: 'bg-praise-soft text-praise', description: 'The approved result was exported or shared.' },
  // legacy
  pending: { label: 'Ready to draft', badgeClass: 'bg-primary/10 text-primary', description: 'Student work is waiting for a first pass.' },
  ai_graded: { label: 'Ready for review', badgeClass: 'bg-suggestion-soft text-suggestion', description: 'Draft feedback is ready. Nothing has been released.' },
};

const FALLBACK: StatusMeta = { label: 'Status unavailable', badgeClass: 'bg-muted text-muted-foreground', description: 'Open the submission for details.' };

export const statusMeta = (status: string | null | undefined): StatusMeta =>
  (status && META[status]) || FALLBACK;

export const statusLabel = (status: string | null | undefined): string => statusMeta(status).label;
export const statusBadgeClass = (status: string | null | undefined): string => statusMeta(status).badgeClass;
export const statusDescription = (status: string | null | undefined): string => statusMeta(status).description;

// A teacher has finished review when the grade is approved.
export const isFinalized = (status: string | null | undefined): boolean =>
  status === 'finalized' || status === 'exported';

// Teacher-facing aliases keep stored database terminology out of presentation code while
// preserving the existing isFinalized export for grading and persistence callers.
export const isApprovedStatus = isFinalized;
export const isExportedStatus = (status: string | null | undefined): boolean => status === 'exported';

// True when Mr Selby approved this grade automatically (auto-finalize / On-the-Loop), vs. a teacher
// approving it by hand. Drives provenance labels and the AI-native evidence count.
export const isAutoFinalized = (finalizedBy: string | null | undefined): boolean =>
  finalizedBy === 'ai';

// Status metadata that reflects who approved the grade without obscuring whether it was exported.
// Automatic approval only exists after the teacher opts in, so that attribution stays explicit.
export const statusMetaWithProvenance = (
  status: string | null | undefined,
  finalizedBy: string | null | undefined,
): StatusMeta => {
  if (status === 'finalized' && isAutoFinalized(finalizedBy)) {
    return {
      label: 'Approved automatically',
      badgeClass: 'bg-praise-soft text-praise',
      description: 'You turned this on. Review is complete, but this has not been exported.',
    };
  }
  if (status === 'exported' && isAutoFinalized(finalizedBy)) {
    return {
      label: 'Exported',
      badgeClass: 'bg-praise-soft text-praise',
      description: 'Approved automatically. You turned this on. The result was then exported or shared.',
    };
  }
  return statusMeta(status);
};

// "No usable grade yet" states. If a grade row actually exists the submission has progressed
// past these regardless of a stale persisted value — most notably a failed *re-grade* leaves
// `grade_error` while the previous valid grade still stands, which otherwise renders a real
// grade under a red "Grading failed" badge. `needs_review` is deliberately NOT in this set: an
// off-topic / low-confidence withholding keeps `needs_review` even with a grade present, because
// the disposition is the point (the teacher must look). Finalized/exported are likewise preserved.
const PRE_GRADE_STATES = new Set(['uploaded', 'grading', 'pending', 'grade_error']);

// Reconcile the persisted status against ground truth (does a grade row exist?). Use this for
// any badge/label so the list, detail, and dashboard never show "Grading failed" / "Uploaded"
// over a submission that actually has a grade.
export const effectiveStatus = (
  status: string | null | undefined,
  hasGrade: boolean,
): string => (hasGrade && PRE_GRADE_STATES.has(status ?? '') ? 'graded' : (status ?? 'uploaded'));

// True when the latest grading attempt errored but a previous grade is still on record. The page
// should show that prior grade plus a calm "last attempt didn't finish" note — not a bare red
// "Grading failed" badge over a real grade. (When there is no grade, `grade_error` is accurate and
// the badge stands.)
export const hasStaleGradingError = (
  status: string | null | undefined,
  hasGrade: boolean,
): boolean => status === 'grade_error' && hasGrade;
