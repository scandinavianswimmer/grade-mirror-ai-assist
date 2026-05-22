// METRIC-01/02 — compute teacher-facing analytics from Supabase.
//
// All queries use the user-scoped anon client, so RLS already constrains every row to the
// signed-in teacher (user_id = auth.uid()). We never widen scope or use service_role here.
import { supabase } from './supabase';

// --- Tunable constants (documented assumptions) -----------------------------------------

// METRIC-01 "time saved": we assume grading + writing feedback for one submission by hand
// takes this many minutes on average. Source: commonly-cited 5–15 min/essay for written
// feedback; we use a conservative midpoint. Adjust as real teacher baselines are gathered.
export const BASELINE_MINUTES_PER_SUBMISSION = 10;

// We treat any submission that has an AI grade as "AI did the first pass", and credit the
// teacher the baseline minus a small review overhead per submission (review is still work).
export const AI_REVIEW_MINUTES_PER_SUBMISSION = 3;

export interface MetricsSummary {
  gradedCount: number;
  totalEdits: number;
  avgEditsPerSubmission: number;
  avgConfidencePct: number | null;       // METRIC-01 rubric-alignment confidence (0–100)
  avgTurnaroundHours: number | null;     // METRIC-01 feedback turnaround (graded_at - uploaded_at)
  estimatedMinutesSaved: number;         // METRIC-01 time saved
}

export interface EditRatePoint {
  weekStart: string;       // ISO date (Monday) bucket label
  gradedCount: number;
  editCount: number;
  editsPerSubmission: number; // METRIC-02 the continuous-improvement signal
}

// --- Helpers ----------------------------------------------------------------------------

// ISO week bucket: returns the Monday (UTC) of the week containing `iso`, as YYYY-MM-DD.
function weekStart(iso: string): string {
  const d = new Date(iso);
  const day = (d.getUTCDay() + 6) % 7; // 0 = Monday
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

interface GradeRow { submission_id: string; confidence: number | null; created_at: string }
interface SubRow { id: string; created_at: string | null }

// --- Summary metrics (METRIC-01) --------------------------------------------------------

export async function fetchMetricsSummary(): Promise<MetricsSummary> {
  // Graded submissions for this teacher (RLS-scoped).
  const { data: gradesData } = await supabase
    .from('submission_grades')
    .select('submission_id, confidence, created_at');
  const grades = (gradesData ?? []) as GradeRow[];

  // Unique submissions that have at least one grade (a submission may be re-graded).
  const gradedSubmissionIds = Array.from(new Set(grades.map((g) => g.submission_id)));
  const gradedCount = gradedSubmissionIds.length;

  // Teacher edits across all annotations (annotation_edits is RLS-scoped by user_id).
  const { count: editCount } = await supabase
    .from('annotation_edits')
    .select('id', { count: 'exact', head: true });
  const totalEdits = editCount ?? 0;

  // Avg overall confidence — rubric-alignment proxy. Use the latest grade per submission.
  const latestBySub = new Map<string, GradeRow>();
  for (const g of grades) {
    const prev = latestBySub.get(g.submission_id);
    if (!prev || new Date(g.created_at) > new Date(prev.created_at)) latestBySub.set(g.submission_id, g);
  }
  const confidences = Array.from(latestBySub.values())
    .map((g) => g.confidence)
    .filter((c): c is number => typeof c === 'number');
  const avgConfidencePct = confidences.length
    ? (confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100
    : null;

  // Turnaround: graded_at (submission_grades.created_at) - uploaded_at (submissions.created_at).
  let avgTurnaroundHours: number | null = null;
  if (gradedSubmissionIds.length) {
    const { data: subsData } = await supabase
      .from('submissions')
      .select('id, created_at')
      .in('id', gradedSubmissionIds);
    const subs = (subsData ?? []) as SubRow[];
    const uploadedAt = new Map(subs.map((s) => [s.id, s.created_at]));
    const deltas: number[] = [];
    for (const [subId, g] of latestBySub) {
      const up = uploadedAt.get(subId);
      if (up) {
        const hrs = (new Date(g.created_at).getTime() - new Date(up).getTime()) / 36e5;
        if (hrs >= 0) deltas.push(hrs);
      }
    }
    if (deltas.length) avgTurnaroundHours = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  }

  const estimatedMinutesSaved =
    gradedCount * (BASELINE_MINUTES_PER_SUBMISSION - AI_REVIEW_MINUTES_PER_SUBMISSION);

  return {
    gradedCount,
    totalEdits,
    avgEditsPerSubmission: gradedCount ? totalEdits / gradedCount : 0,
    avgConfidencePct,
    avgTurnaroundHours,
    estimatedMinutesSaved,
  };
}

// --- Edit-rate over time (METRIC-02) ----------------------------------------------------
// The continuous-improvement signal: edits-per-submission per week. A downward trend means
// the teacher is editing the AI less over successive batches.

export async function fetchEditRateOverTime(): Promise<EditRatePoint[]> {
  // Edits per week (by edit timestamp).
  const { data: editsData } = await supabase
    .from('annotation_edits')
    .select('created_at');
  const editWeeks = new Map<string, number>();
  for (const e of (editsData ?? []) as { created_at: string }[]) {
    const w = weekStart(e.created_at);
    editWeeks.set(w, (editWeeks.get(w) ?? 0) + 1);
  }

  // Graded submissions per week (by grade timestamp), unique per submission.
  const { data: gradesData } = await supabase
    .from('submission_grades')
    .select('submission_id, created_at');
  const seen = new Set<string>();
  const gradeWeeks = new Map<string, number>();
  for (const g of (gradesData ?? []) as GradeRow[]) {
    if (seen.has(g.submission_id)) continue;
    seen.add(g.submission_id);
    const w = weekStart(g.created_at);
    gradeWeeks.set(w, (gradeWeeks.get(w) ?? 0) + 1);
  }

  const allWeeks = Array.from(new Set([...editWeeks.keys(), ...gradeWeeks.keys()])).sort();
  return allWeeks.map((w) => {
    const gradedCount = gradeWeeks.get(w) ?? 0;
    const edits = editWeeks.get(w) ?? 0;
    return {
      weekStart: w,
      gradedCount,
      editCount: edits,
      editsPerSubmission: gradedCount ? edits / gradedCount : 0,
    };
  });
}
