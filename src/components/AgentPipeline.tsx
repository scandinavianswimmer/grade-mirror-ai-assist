// AGENT-03: renders the grading run as a visible AI-agent workflow ("AI workforce"), reading the
// per-step records the orchestrator wrote to agent_events. Degrades to nothing if the table is
// absent (migration 0013 not yet applied) so it never breaks the page.
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

interface AgentEvent {
  agent: string;
  status: string;
  model_id: string | null;
  latency_ms: number | null;
  job_id: string;
  created_at: string;
}

const AGENT_ORDER = ['rubric', 'relevance_risk', 'grading', 'annotation', 'feedback_summary', 'style'];
const AGENT_LABEL: Record<string, string> = {
  rubric: 'Rubric',
  relevance_risk: 'Relevance / Risk',
  grading: 'Grading',
  annotation: 'Annotation',
  feedback_summary: 'Feedback Summary',
  style: 'Style',
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'ok') return <CheckCircle2 className="h-3.5 w-3.5 text-praise" />;
  if (status === 'error') return <XCircle className="h-3.5 w-3.5 text-error" />;
  return <MinusCircle className="h-3.5 w-3.5 text-muted-foreground" />;
};

// `refreshKey` (e.g. the current grade id) changes after a re-grade so the pipeline refetches the
// newly-written agent_events instead of showing the prior run.
export default function AgentPipeline({ submissionId, refreshKey }: { submissionId: string; refreshKey?: string | number }) {
  const [steps, setSteps] = useState<AgentEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('agent_events')
        .select('agent, status, model_id, latency_ms, job_id, created_at')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error || !data || data.length === 0) { setSteps([]); return; } // table absent or no run yet → render nothing
      const latestJob = (data as AgentEvent[])[0].job_id;
      const run = (data as AgentEvent[]).filter((e) => e.job_id === latestJob);
      run.sort((a, b) => AGENT_ORDER.indexOf(a.agent) - AGENT_ORDER.indexOf(b.agent));
      setSteps(run);
    })();
    return () => {
      cancelled = true;
    };
  }, [submissionId, refreshKey]);

  if (steps.length === 0) return null;

  return (
    <Card>
      <CardHeader className="rule pb-3">
        <CardTitle className="font-display text-base">AI workflow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <StatusIcon status={s.status} />
            <span className="font-medium">{AGENT_LABEL[s.agent] ?? s.agent}</span>
            {s.status === 'skipped' && <Badge variant="outline" className="text-[10px]">skipped</Badge>}
            <span className="ml-auto metric text-xs text-muted-foreground">
              {s.model_id ? `${s.model_id} · ` : ''}{s.latency_ms ? `${s.latency_ms}ms` : ''}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
