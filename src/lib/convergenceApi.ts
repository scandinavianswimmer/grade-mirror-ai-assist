// Phase 15 Task 3B (PROOF-01) — fetch the signed-in teacher's convergence series (RLS-scoped) for the
// in-app "Is Mr Selby learning you?" trend. Reads grading batches, finalized submissions, and reviewed
// annotations (all user_id = auth.uid()), folds them via the pure buildBatchSignals, and runs them
// through computeConvergence so the in-app trend and the eval harness share ONE definition of the
// curve. No student PII is read — only statuses, edit-distances, ratings, and ids.
import { supabase } from './supabase';
import { computeConvergence, type ConvergenceSeries } from './convergenceMetrics';
import {
  buildBatchSignals,
  type BatchRow,
  type SubmissionRow,
  type AnnotationRow,
} from './convergenceSignals';

/** Fetch + compute the signed-in teacher's convergence series (RLS-scoped). */
export async function fetchConvergenceSeries(): Promise<ConvergenceSeries> {
  const [{ data: batchData }, { data: subData }, { data: annData }] = await Promise.all([
    supabase.from('grading_batches').select('id, seq, label').order('seq', { ascending: true }),
    supabase.from('submissions').select('id, batch_id, edit_self_rating, status'),
    supabase
      .from('annotations')
      .select('submission_id, status, edit_distance')
      .in('status', ['accepted', 'edited', 'rejected']),
  ]);

  const signals = buildBatchSignals(
    (batchData ?? []) as BatchRow[],
    (subData ?? []) as SubmissionRow[],
    (annData ?? []) as AnnotationRow[],
  );
  return computeConvergence(signals);
}
