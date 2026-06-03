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
