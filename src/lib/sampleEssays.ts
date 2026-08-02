// Sample-essay onboarding for the protected product.
//
// The canonical content lives in a pure, backend-neutral fixture. This adapter maps that original,
// synthetic content onto the existing authenticated insert shape. No account identifier is embedded;
// assignment ownership is supplied by the signed-in product path in sampleEssaysApi.ts.

import { SYNTHETIC_DEMO_FIXTURE } from '@/fixtures/syntheticDemo';

export const SAMPLE_ASSIGNMENT_TITLE = SYNTHETIC_DEMO_FIXTURE.assignment.title;

export const SAMPLE_ASSIGNMENT = {
  title: SAMPLE_ASSIGNMENT_TITLE,
  description: `${SYNTHETIC_DEMO_FIXTURE.marker}\n\n${SYNTHETIC_DEMO_FIXTURE.assignment.description}`,
  rubricText: SYNTHETIC_DEMO_FIXTURE.assignment.rubricText,
} as const;

export interface SampleSubmissionSeed {
  studentName: string;
  /** Short synthetic scenario note for tests and operator reference. Not stored. */
  demonstrates: string;
  essay: string;
}

export interface SampleSubmissionRow {
  assignment_id: string;
  student_name: string;
  essay: string;
  extracted_text: string;
  extraction_confidence: number;
  status: 'uploaded';
  processing_status: 'uploaded';
}

export const SAMPLE_SUBMISSIONS: SampleSubmissionSeed[] = SYNTHETIC_DEMO_FIXTURE.submissions.map(
  (submission) => ({
    studentName: submission.participantLabel,
    demonstrates: submission.demonstrates,
    essay: submission.text,
  }),
);

/**
 * Build gradeable rows for an assignment created through the authenticated product path. This pure
 * function performs no I/O. The caller supplies the backend-generated assignment identifier.
 */
export function buildSampleSubmissionRows(assignmentId: string): SampleSubmissionRow[] {
  return SAMPLE_SUBMISSIONS.map((submission) => ({
    assignment_id: assignmentId,
    student_name: submission.studentName,
    essay: submission.essay,
    extracted_text: submission.essay,
    extraction_confidence: 1.0,
    status: 'uploaded',
    processing_status: 'uploaded',
  }));
}

export interface LoadSampleResult {
  assignmentId: string;
  created: boolean;
  submissionsInserted: number;
}
