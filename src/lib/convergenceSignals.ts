// Phase 15 Task 3B (PROOF-01) — PURE folding of raw teacher rows into per-batch convergence signals.
//
// Kept free of any Supabase/DOM import so it is unit-testable in a plain node env (the fetch wrapper
// that actually hits the RLS-scoped client lives in convergenceApi.ts). No student PII is touched —
// only statuses, edit-distances, ratings, and ids.
import { type BatchSignal } from './convergenceMetrics';

// Annotation review states (matches rebuild-exemplars kindFor): accepted=kept, edited=reworded,
// rejected=dismissed. Editing + dismissing are the "I had to change it" signal the edit-rate tracks.
type AnnotationStatus = 'accepted' | 'edited' | 'rejected';

export interface BatchRow {
  id: string;
  seq: number;
  label: string | null;
}
export interface SubmissionRow {
  id: string;
  batch_id: string | null;
  edit_self_rating: number | null;
  status: string | null;
}
export interface AnnotationRow {
  submission_id: string;
  status: string | null;
  edit_distance: number | null;
}

/**
 * Fold raw rows into per-batch signals. Only FINALIZED submissions with a batch_id count, and only
 * batches that actually have reviewed annotations (total > 0) become measurement points — an empty
 * batch is not evidence, so it must not dilute the edit-rate decline. Sorted by batch seq.
 */
export function buildBatchSignals(
  batches: BatchRow[],
  submissions: SubmissionRow[],
  annotations: AnnotationRow[],
): BatchSignal[] {
  // submission_id → batch_id, restricted to finalized, batch-assigned submissions.
  const subToBatch = new Map<string, string>();
  const ratingsByBatch = new Map<string, number[]>();
  for (const s of submissions) {
    if (!s.batch_id || s.status !== 'finalized') continue;
    subToBatch.set(s.id, s.batch_id);
    if (typeof s.edit_self_rating === 'number') {
      const arr = ratingsByBatch.get(s.batch_id) ?? [];
      arr.push(s.edit_self_rating);
      ratingsByBatch.set(s.batch_id, arr);
    }
  }

  // Tally accept/edit/dismiss + edit-distances per batch from the annotations on those submissions.
  interface Tally { accept: number; edit: number; dismiss: number; distances: number[] }
  const tally = new Map<string, Tally>();
  const ensure = (batchId: string): Tally => {
    let t = tally.get(batchId);
    if (!t) { t = { accept: 0, edit: 0, dismiss: 0, distances: [] }; tally.set(batchId, t); }
    return t;
  };
  for (const a of annotations) {
    const batchId = subToBatch.get(a.submission_id);
    if (!batchId) continue;
    const status = a.status as AnnotationStatus;
    const t = ensure(batchId);
    if (status === 'accepted') t.accept += 1;
    else if (status === 'edited') {
      t.edit += 1;
      if (typeof a.edit_distance === 'number') t.distances.push(a.edit_distance);
    } else if (status === 'rejected') t.dismiss += 1;
  }

  return batches
    .map((b): BatchSignal | null => {
      const t = tally.get(b.id);
      const total = t ? t.accept + t.edit + t.dismiss : 0;
      if (!t || total === 0) return null; // batches without review signal aren't measurement points
      return {
        batchSeq: b.seq,
        label: b.label ?? `Batch ${b.seq}`,
        acceptCount: t.accept,
        editCount: t.edit,
        dismissCount: t.dismiss,
        editDistances: t.distances,
        selfRatings: ratingsByBatch.get(b.id) ?? [],
      };
    })
    .filter((s): s is BatchSignal => s !== null)
    .sort((a, b) => a.batchSeq - b.batchSeq);
}
