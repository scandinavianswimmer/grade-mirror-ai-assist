// Database I/O for sample-essay onboarding. Kept separate from the pure data module
// (./sampleEssays.ts) so that module stays unit-testable in the node env without pulling in the
// supabase client (which touches localStorage at import time).
import { supabase } from './supabase';
import {
  SAMPLE_ASSIGNMENT,
  SAMPLE_ASSIGNMENT_TITLE,
  buildSampleSubmissionRows,
  type LoadSampleResult,
} from './sampleEssays';

/** Returns the id of this teacher's existing sample assignment, or null. */
export async function findSampleAssignmentId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('assignments')
    .select('id')
    .eq('user_id', userId)
    .eq('title', SAMPLE_ASSIGNMENT_TITLE)
    .limit(1)
    .maybeSingle();
  return (data as { id?: string } | null)?.id ?? null;
}

/**
 * Load the sample assignment + essays into the teacher's account. Idempotent: if the sample
 * assignment already exists we return it without duplicating. The teacher then hits "Grade all"
 * and watches auto-finalize publish the strong essays while the weak/off-topic ones await review.
 */
export async function loadSampleEssays(userId: string): Promise<LoadSampleResult> {
  const existing = await findSampleAssignmentId(userId);
  if (existing) {
    return { assignmentId: existing, created: false, submissionsInserted: 0 };
  }

  const { data: assignment, error: aErr } = await supabase
    .from('assignments')
    .insert({
      user_id: userId,
      title: SAMPLE_ASSIGNMENT.title,
      description: SAMPLE_ASSIGNMENT.description,
      rubric_text: SAMPLE_ASSIGNMENT.rubricText,
      class_id: null,
      status: 'active',
    })
    .select('id')
    .single();
  if (aErr || !assignment) {
    throw new Error(`Could not create the sample assignment: ${aErr?.message ?? 'unknown error'}`);
  }
  const assignmentId = (assignment as { id: string }).id;

  const rows = buildSampleSubmissionRows(assignmentId);
  const { error: sErr } = await supabase.from('submissions').insert(rows);
  if (sErr) {
    throw new Error(`Sample assignment created, but essays failed to load: ${sErr.message}`);
  }

  return { assignmentId, created: true, submissionsInserted: rows.length };
}
