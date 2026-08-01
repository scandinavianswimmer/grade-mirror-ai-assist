import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Pencil, Target, Timer, TrendingDown } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import Navbar from '@/components/Navbar';
import ConvergencePanel from '@/components/ConvergencePanel';
import { useAuth } from '@/components/AuthProvider';
import {
  fetchMetricsSummary, fetchEditRateOverTime,
  BASELINE_MINUTES_PER_SUBMISSION, AI_REVIEW_MINUTES_PER_SUBMISSION,
  type MetricsSummary, type EditRatePoint,
} from '@/lib/metricsApi';

// METRIC-03 — teacher metrics dashboard surfacing METRIC-01 + METRIC-02.

function formatMinutes(min: number): string {
  if (min < 60) return `${Math.round(min)} min`;
  const hrs = min / 60;
  if (hrs < 24) return `${hrs.toFixed(1)} hrs`;
  return `${(hrs / 24).toFixed(1)} days`;
}

const Metrics = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [editRate, setEditRate] = useState<EditRatePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [s, e] = await Promise.all([fetchMetricsSummary(), fetchEditRateOverTime()]);
        if (!cancelled) { setSummary(s); setEditRate(e); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const cards = summary ? [
    {
      label: 'Estimated time saved',
      value: formatMinutes(summary.estimatedMinutesSaved),
      icon: Clock,
      hint: `${summary.gradedCount} graded × (${BASELINE_MINUTES_PER_SUBMISSION}−${AI_REVIEW_MINUTES_PER_SUBMISSION} min)`,
    },
    {
      label: 'Avg edits / submission',
      value: summary.avgEditsPerSubmission.toFixed(2),
      icon: Pencil,
      hint: `${summary.totalEdits} edits across ${summary.gradedCount} graded`,
    },
    {
      label: 'Rubric-alignment confidence',
      value: summary.avgConfidencePct != null ? `${summary.avgConfidencePct.toFixed(0)}%` : '—',
      icon: Target,
      hint: 'Avg overall AI confidence',
    },
    {
      label: 'Feedback turnaround',
      value: summary.medianTurnaroundHours != null ? formatMinutes(summary.medianTurnaroundHours * 60) : '—',
      icon: Timer,
      hint: 'Upload → graded (median)',
    },
  ] : [];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Metrics</h1>
          <p className="text-muted-foreground">Your grading impact and how aiTA is learning your style.</p>
        </div>

        {/* METRIC-01 summary cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
            : cards.map((c) => {
                const Icon = c.icon;
                return (
                  <Card key={c.label}>
                    <CardContent className="pt-6">
                      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                        <Icon className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">{c.label}</span>
                      </div>
                      <div className="metric text-3xl font-semibold text-primary">{c.value}</div>
                      <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
                    </CardContent>
                  </Card>
                );
              })}
        </div>

        {/* METRIC-02 edit-rate over time */}
        <Card>
          <CardHeader className="rule">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-praise" />
              <CardTitle className="font-display text-lg">Edit rate over time</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Edits per graded submission, by week. A downward trend means aiTA is matching your style more closely.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : editRate.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No graded submissions yet. Grade a batch to start tracking your improvement.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={editRate} margin={{ top: 8, right: 16, bottom: 8, left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis dataKey="weekStart" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals className="text-muted-foreground" />
                  <Tooltip
                    formatter={(v: number) => [v.toFixed(2), 'Edits / submission']}
                    labelFormatter={(l) => `Week of ${l}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="editsPerSubmission"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* PROOF-01 — "Is aiTA learning you?" per-batch convergence trend */}
        <ConvergencePanel />
      </main>
    </div>
  );
};

export default Metrics;
