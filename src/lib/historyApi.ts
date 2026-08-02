// OBS-02 — queryable grading history per teacher / class / assignment.
//
// Joins submission_grades → submissions → assignments → classes (all RLS-scoped to the
// signed-in teacher) and enriches each row with token/model usage from llm_sessions.
//
// NOTE on the llm_sessions join: the live schema has no foreign key from llm_sessions to a
// submission/grade, and tokens/model live inside the input_data/output_data JSON columns.
// So we associate the nearest llm_session (same teacher) whose timestamp is closest to the
// grade's created_at. This is a best-effort correlation; once Phase 3/4 add a shared
// trace/job id, swap this for an exact join (see PHASE-11-NOTES.md → OBS-02 follow-up).
import { supabase } from './supabase';

export interface HistoryRow {
  gradeId: string;
  submissionId: string;
  studentName: string | null;
  assignmentId: string | null;
  assignmentTitle: string | null;
  classId: string | null;
  className: string | null;
  modelId: string | null;
  overallScore: number | null;
  overallMax: number | null;
  confidence: number | null;
  flags: string[];
  gradedAt: string;
  inputTokens: number | null;
  outputTokens: number | null;
  cacheReadTokens: number | null;
}

export interface HistoryFilterOptions {
  classes: { id: string; name: string }[];
  assignments: { id: string; title: string; classId: string | null }[];
}

// Pull a number out of an llm_sessions JSON blob, tolerating several common key spellings.
function num(obj: unknown, keys: string[]): number | null {
  if (!obj || typeof obj !== 'object') return null;
  const rec = obj as Record<string, unknown>;
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === 'number') return v;
  }
  // Some payloads nest usage under `usage` / `usageMetadata`.
  for (const wrap of ['usage', 'usageMetadata', 'tokens']) {
    const inner = rec[wrap];
    if (inner && typeof inner === 'object') {
      const got = num(inner, keys);
      if (got != null) return got;
    }
  }
  return null;
}

function str(obj: unknown, keys: string[]): string | null {
  if (!obj || typeof obj !== 'object') return null;
  const rec = obj as Record<string, unknown>;
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === 'string') return v;
  }
  return null;
}

interface LlmSessionRow {
  id: string;
  input_data: unknown;
  output_data: unknown;
  timestamp: string | null;
}

interface GradeHistoryQueryRow {
  id: string;
  submission_id: string;
  model_id: string | null;
  overall_score: number | null;
  overall_max: number | null;
  confidence: number | null;
  flags: unknown;
  created_at: string;
  submissions: {
    student_name: string | null;
    assignments: {
      id: string;
      title: string;
      classes: { id: string; class_name: string } | null;
    } | null;
  } | null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object'
    ? value as Record<string, unknown>
    : {};
}

// Window (ms) within which an llm_session is considered to belong to a grade.
const SESSION_MATCH_WINDOW_MS = 5 * 60 * 1000;

export async function fetchGradingHistory(): Promise<HistoryRow[]> {
  // Grades (RLS-scoped). Nested selects pull the parent submission + assignment + class.
  const { data, error } = await supabase
    .from('submission_grades')
    .select(`
      id, submission_id, model_id, overall_score, overall_max, confidence, flags, created_at,
      submissions:submission_id (
        id, student_name, assignment_id,
        assignments:assignment_id ( id, title, class_id, classes:class_id ( id, class_name ) )
      )
    `)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  // Fetch this teacher's llm_sessions once and correlate by nearest timestamp.
  const { data: sessData } = await supabase
    .from('llm_sessions')
    .select('id, input_data, output_data, timestamp')
    .order('timestamp', { ascending: false })
    .limit(1000);
  const sessions = (sessData ?? []) as LlmSessionRow[];

  const matchSession = (gradedAt: string): LlmSessionRow | null => {
    const t = new Date(gradedAt).getTime();
    let best: LlmSessionRow | null = null;
    let bestDelta = Infinity;
    for (const s of sessions) {
      if (!s.timestamp) continue;
      const delta = Math.abs(new Date(s.timestamp).getTime() - t);
      if (delta < bestDelta && delta <= SESSION_MATCH_WINDOW_MS) {
        best = s;
        bestDelta = delta;
      }
    }
    return best;
  };

  return (data as unknown as GradeHistoryQueryRow[]).map((g) => {
    const sub = g.submissions;
    const asg = sub?.assignments;
    const cls = asg?.classes;
    const sess = matchSession(g.created_at);
    const usage = sess ? { ...asRecord(sess.input_data), ...asRecord(sess.output_data) } : null;

    return {
      gradeId: g.id,
      submissionId: g.submission_id,
      studentName: sub?.student_name ?? null,
      assignmentId: asg?.id ?? null,
      assignmentTitle: asg?.title ?? null,
      classId: cls?.id ?? null,
      className: cls?.class_name ?? null,
      modelId: g.model_id ?? str(usage, ['model', 'model_id', 'modelId']),
      overallScore: g.overall_score,
      overallMax: g.overall_max,
      confidence: g.confidence,
      flags: Array.isArray(g.flags)
        ? g.flags.filter((flag): flag is string => typeof flag === 'string')
        : [],
      gradedAt: g.created_at,
      inputTokens: num(usage, ['input_tokens', 'inputTokens', 'promptTokenCount', 'prompt_tokens']),
      outputTokens: num(usage, ['output_tokens', 'outputTokens', 'candidatesTokenCount', 'completion_tokens']),
      cacheReadTokens: num(usage, ['cache_read_tokens', 'cacheReadTokens', 'cachedContentTokenCount']),
    } as HistoryRow;
  });
}

// Derive filter options (classes / assignments) from the history rows themselves so the
// dropdowns only ever show things the teacher actually graded.
export function deriveFilterOptions(rows: HistoryRow[]): HistoryFilterOptions {
  const classes = new Map<string, string>();
  const assignments = new Map<string, { title: string; classId: string | null }>();
  for (const r of rows) {
    if (r.classId && r.className) classes.set(r.classId, r.className);
    if (r.assignmentId && r.assignmentTitle) {
      assignments.set(r.assignmentId, { title: r.assignmentTitle, classId: r.classId });
    }
  }
  return {
    classes: Array.from(classes, ([id, name]) => ({ id, name })),
    assignments: Array.from(assignments, ([id, v]) => ({ id, title: v.title, classId: v.classId })),
  };
}
