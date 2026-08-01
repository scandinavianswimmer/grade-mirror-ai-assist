import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, TrendingDown, Minus } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/components/AuthProvider';
import { fetchConvergenceSeries } from '@/lib/convergenceApi';
import { CONVERGENCE_DECLINE_PCT, type ConvergenceSeries } from '@/lib/convergenceMetrics';

// Phase 15 Task 3B (PROOF-01) — "Is aiTA learning you?" The honest per-batch edit-rate trend a
// teacher sees. If the line is flat, it shows flat — disproof is visible, not hidden.
//
// ⚠️ This panel is an edit-rate CORROBORATOR, NOT the pre-registered primary verdict. The pre-registered
// proof is the blinded GPT-judge voice-fidelity study (+ aggregated LUAR cosine + within-teacher
// holdout) in docs/recruiting/osf-prereg.md — which needs a live judge model the app can't run client-
// side. Edit-rate is uninterpretable as proof on its own (Borchers AIED 2026: 51.3% of teachers never
// edit AI feedback). So this UI never claims "PROVEN" — it presents an edit-rate signal only.

interface Verdict {
  tone: 'good' | 'flat' | 'neutral' | 'empty';
  headline: string;
  sub: string;
}

function verdictFor(series: ConvergenceSeries): Verdict {
  const { batchCount, converged, flat, editRateDeltaPct } = series;
  if (batchCount === 0) {
    return {
      tone: 'empty',
      headline: 'No finalized batches yet',
      sub: 'Grade and finalize a batch of submissions to start tracking whether aiTA is matching your voice.',
    };
  }
  if (batchCount === 1) {
    return {
      tone: 'neutral',
      headline: 'One batch in',
      sub: 'Grade and finalize another batch to see whether your edit rate is falling — convergence needs at least two.',
    };
  }
  if (editRateDeltaPct === null) {
    return {
      tone: 'neutral',
      headline: 'Not enough signal yet',
      sub: 'Your first batch had no edits to measure against. Keep grading to build the trend.',
    };
  }
  const delta = Math.round(editRateDeltaPct);
  if (converged) {
    return {
      tone: 'good',
      headline: `Edit-rate signal: down ${delta}% — looks like aiTA is matching your voice`,
      sub: `Across ${batchCount} batches you're editing aiTA's feedback ${delta}% less (corroborator threshold: ≥${CONVERGENCE_DECLINE_PCT}%). Corroborator only — the pre-registered verdict is the GPT-judge voice-fidelity proof.`,
    };
  }
  if (flat) {
    return {
      tone: 'flat',
      headline: `Edit-rate signal: down only ${delta}% — holding steady`,
      sub: `Across ${batchCount} batches your edit rate hasn't really moved. That alone doesn't disprove convergence (many teachers rarely edit) — the pre-registered verdict is the GPT-judge proof.`,
    };
  }
  return {
    tone: 'neutral',
    headline: `Edit-rate signal: trending down ${delta}%`,
    sub: `Edit rate is falling but hasn't reached the ≥${CONVERGENCE_DECLINE_PCT}% corroborator threshold across ${batchCount} batches. Corroborator only — the pre-registered verdict is the GPT-judge proof.`,
  };
}

const ConvergencePanel = () => {
  const { user } = useAuth();
  const [series, setSeries] = useState<ConvergenceSeries | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const s = await fetchConvergenceSeries();
        if (!cancelled) setSeries(s);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const verdict = series ? verdictFor(series) : null;
  const chartData = (series?.batches ?? []).map((b) => ({
    label: b.label ?? `Batch ${b.batchSeq}`,
    editRatePct: Math.round(b.editRate * 100),
    selfRating: b.meanSelfRating,
  }));

  const Icon = verdict?.tone === 'good' ? TrendingDown : verdict?.tone === 'flat' ? Minus : Sparkles;
  const accent =
    verdict?.tone === 'good' ? 'text-praise' : verdict?.tone === 'flat' ? 'text-muted-foreground' : 'text-primary';

  return (
    <Card className="mt-8">
      <CardHeader className="rule">
        <div className="flex items-center gap-2">
          <Sparkles aria-hidden="true" className="h-4 w-4 text-primary" />
          <CardTitle className="font-display text-lg">Is aiTA learning you?</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          How often you edit or dismiss aiTA's notes, batch over batch. A downward line is a
          corroborating signal that aiTA is starting to write in your voice — it is <em>not</em> the
          pre-registered proof, which is a blinded GPT-judge voice-fidelity study.
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            {verdict && (
              <div className="mb-6 flex items-start gap-3">
                <Icon aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${accent}`} />
                <div>
                  <p className={`font-display text-base font-semibold ${accent}`}>{verdict.headline}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{verdict.sub}</p>
                </div>
              </div>
            )}

            {chartData.length >= 1 ? (
              <figure aria-labelledby="convergence-chart-title" aria-describedby="convergence-chart-description">
                <h3 id="convergence-chart-title" className="sr-only">Edit rate by finalized grading batch</h3>
                <p id="convergence-chart-description" className="sr-only">
                  The line shows the percentage of aiTA notes edited or dismissed in each finalized batch.
                  Lower percentages mean fewer teacher edits. Exact values follow in a data table.
                </p>
                <div aria-hidden="true">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: -8 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        domain={[0, 100]}
                        unit="%"
                        className="text-muted-foreground"
                      />
                      <Tooltip
                        formatter={(v: number, name) =>
                          name === 'editRatePct'
                            ? [`${v}%`, 'Edited / dismissed']
                            : [v == null ? '—' : Number(v).toFixed(1), 'Mean self-rating (1–5)']
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="editRatePct"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="editRatePct"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="sr-only">
                  <table>
                    <caption>Exact edit-rate values by finalized grading batch</caption>
                    <thead>
                      <tr>
                        <th scope="col">Batch</th>
                        <th scope="col">Notes edited or dismissed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((batch) => (
                        <tr key={batch.label}>
                          <th scope="row">{batch.label}</th>
                          <td>{batch.editRatePct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </figure>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No finalized batches yet. Grade a batch to start tracking your improvement.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ConvergencePanel;
