// OBS-01 — Request tracing across the grading pipeline.
//
// IMPORTANT (Phase 3/4 boundary): the agentic grading pipeline (Rubric / Relevance /
// Grading / Annotation / Summary / Style agents) is built in Phases 3 & 4. Per the
// Phase 11 brief we must NOT edit grading files here, so this module provides:
//   1. A stable trace/span DATA MODEL the UI + future pipeline both agree on.
//   2. A typed `recordTraceSpan` integration HOOK the grading edge functions can call
//      once they exist, persisting one trace per grading job with per-agent spans.
//   3. A read helper (`fetchTrace`) the History/Metrics UI uses to render traces.
//
// Until Phase 3/4 wire the hook, no `grading_traces` rows are written and the UI simply
// shows "no trace recorded yet" — nothing breaks. See PHASE-11-NOTES.md → OBS-01.

import { supabase } from './supabase';

// The named agents the pipeline will emit spans for (mirrors ROADMAP Phase 3).
export type TraceAgent =
  | 'rubric'
  | 'relevance_risk'
  | 'grading'
  | 'annotation'
  | 'feedback_summary'
  | 'style'
  | 'orchestrator';

export interface TraceSpan {
  agent: TraceAgent;
  startedAt: string;       // ISO timestamp
  endedAt: string;         // ISO timestamp
  durationMs: number;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  ok: boolean;
  error?: string | null;
}

export interface GradingTrace {
  traceId: string;         // one per grading job
  submissionId: string;
  userId: string;
  createdAt: string;
  spans: TraceSpan[];
}

/**
 * INTEGRATION HOOK for Phase 3/4 — persist one span of a grading trace.
 *
 * The grading orchestrator should call this per agent step. It writes to an additive
 * `grading_traces` table (trace_id, submission_id, user_id, span jsonb, created_at) that
 * Phase 4 owns the migration for. We attempt the insert defensively: if the table does
 * not exist yet (pre-Phase-4), we swallow the error so grading is never blocked by
 * observability. Returns true on success.
 *
 * NOTE: this is intentionally not yet called from any grading file (those are off-limits
 * this phase). Wire it from the orchestrator in Phase 3/4.
 */
export async function recordTraceSpan(
  traceId: string,
  submissionId: string,
  span: TraceSpan,
): Promise<boolean> {
  try {
    const { error } = await supabase
      // @ts-expect-error grading_traces table is added by Phase 4's migration.
      .from('grading_traces')
      .insert({ trace_id: traceId, submission_id: submissionId, span });
    if (error) {
      console.warn('[tracing] recordTraceSpan skipped (table not ready?)', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[tracing] recordTraceSpan failed', err);
    return false;
  }
}

/**
 * Read all spans for a submission's most recent grading trace, grouped into one
 * GradingTrace. Returns null when no trace rows exist yet (the common case until
 * Phase 3/4 ships). Safe to call from the UI.
 */
export async function fetchTrace(submissionId: string): Promise<GradingTrace | null> {
  try {
    const { data, error } = await supabase
      // @ts-expect-error grading_traces table is added by Phase 4's migration.
      .from('grading_traces')
      .select('trace_id, submission_id, user_id, span, created_at')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) return null;

    const rows = data as Array<{ trace_id: string; submission_id: string; user_id: string; span: TraceSpan; created_at: string }>;
    const traceId = rows[0].trace_id;
    return {
      traceId,
      submissionId,
      userId: rows[0].user_id,
      createdAt: rows[0].created_at,
      spans: rows.filter((r) => r.trace_id === traceId).map((r) => r.span),
    };
  } catch {
    return null;
  }
}
