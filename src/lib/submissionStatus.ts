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
  uploaded: { label: 'Uploaded', badgeClass: 'bg-blue-100 text-blue-800', description: 'Text extracted and ready to grade.' },
  grading: { label: 'Grading…', badgeClass: 'bg-blue-100 text-blue-800', description: 'aiTA is drafting rubric-aligned notes.' },
  graded: { label: 'AI draft ready', badgeClass: 'bg-amber-100 text-amber-800', description: 'AI draft is ready for your review.' },
  needs_review: { label: 'Needs review', badgeClass: 'bg-red-100 text-red-800', description: 'Low-confidence extraction — review before grading.' },
  grade_error: { label: 'Grading failed', badgeClass: 'bg-red-100 text-red-800', description: 'Grading errored. Try again.' },
  finalized: { label: 'Finalized', badgeClass: 'bg-green-100 text-green-800', description: 'You approved this grade.' },
  exported: { label: 'Exported', badgeClass: 'bg-green-100 text-green-800', description: 'Finalized and exported/shared.' },
  // legacy
  pending: { label: 'Pending', badgeClass: 'bg-yellow-100 text-yellow-800', description: 'Awaiting processing.' },
  ai_graded: { label: 'AI draft ready', badgeClass: 'bg-amber-100 text-amber-800', description: 'AI draft is ready for your review.' },
};

const FALLBACK: StatusMeta = { label: 'Unknown', badgeClass: 'bg-gray-100 text-gray-800', description: '' };

export const statusMeta = (status: string | null | undefined): StatusMeta =>
  (status && META[status]) || FALLBACK;

export const statusLabel = (status: string | null | undefined): string => statusMeta(status).label;
export const statusBadgeClass = (status: string | null | undefined): string => statusMeta(status).badgeClass;
export const statusDescription = (status: string | null | undefined): string => statusMeta(status).description;

// A teacher has finished review when the grade is approved.
export const isFinalized = (status: string | null | undefined): boolean =>
  status === 'finalized' || status === 'exported';

// True when aiTA published this grade unattended (auto-finalize / On-the-Loop), vs. a teacher
// approving it by hand. Drives provenance labels and the AI-native evidence count.
export const isAutoFinalized = (finalizedBy: string | null | undefined): boolean =>
  finalizedBy === 'ai';

// Status metadata that reflects WHO finalized the grade. A green "Auto-finalized" badge makes the
// unattended-grading claim legible in the list/detail/dashboard and on the demo video. Falls back
// to the plain status meta for teacher-approved or non-finalized submissions.
export const statusMetaWithProvenance = (
  status: string | null | undefined,
  finalizedBy: string | null | undefined,
): StatusMeta => {
  if ((status === 'finalized' || status === 'exported') && isAutoFinalized(finalizedBy)) {
    return {
      label: 'Auto-finalized',
      badgeClass: 'bg-green-100 text-green-800',
      description: 'aiTA published this high-confidence grade for you. Open it to review or adjust.',
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
