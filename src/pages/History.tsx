import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History as HistoryIcon } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/components/AuthProvider';
import { fetchGradingHistory, deriveFilterOptions, type HistoryRow } from '@/lib/historyApi';

// OBS-02 — queryable grading history per teacher / class / assignment.

const ALL = '__all__';

function fmtTokens(n: number | null): string {
  if (n == null) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const HistoryPage = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState<string>(ALL);
  const [assignmentFilter, setAssignmentFilter] = useState<string>(ALL);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchGradingHistory();
        if (!cancelled) setRows(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const options = useMemo(() => deriveFilterOptions(rows), [rows]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (classFilter !== ALL && r.classId !== classFilter) return false;
    if (assignmentFilter !== ALL && r.assignmentId !== assignmentFilter) return false;
    return true;
  }), [rows, classFilter, assignmentFilter]);

  // Assignments shown in the dropdown narrow to the selected class.
  const visibleAssignments = useMemo(
    () => options.assignments.filter((a) => classFilter === ALL || a.classId === classFilter),
    [options.assignments, classFilter],
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <HistoryIcon className="h-6 w-6 text-primary" />
              <h1 className="font-display text-3xl font-semibold tracking-tight">Grading history</h1>
            </div>
            <p className="text-muted-foreground">Every graded submission, with model, score, confidence, flags, and token usage.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={classFilter} onValueChange={(v) => { setClassFilter(v); setAssignmentFilter(ALL); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All classes</SelectItem>
                {options.classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
              <SelectTrigger className="w-52"><SelectValue placeholder="All assignments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All assignments</SelectItem>
                {visibleAssignments.map((a) => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader className="rule pb-3">
            <CardTitle className="font-display text-base">
              {loading ? 'Loading…' : `${filtered.length} graded submission${filtered.length === 1 ? '' : 's'}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-2 py-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No graded submissions match these filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Student</th>
                      <th className="py-2 pr-4 font-medium">Assignment</th>
                      <th className="py-2 pr-4 font-medium">Class</th>
                      <th className="py-2 pr-4 font-medium">Score</th>
                      <th className="py-2 pr-4 font-medium">Conf.</th>
                      <th className="py-2 pr-4 font-medium">Model</th>
                      <th className="py-2 pr-4 font-medium">Tokens (in/out)</th>
                      <th className="py-2 pr-4 font-medium">Flags</th>
                      <th className="py-2 pr-4 font-medium">Graded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.gradeId} className="border-b border-border/40 hover:bg-muted/40">
                        <td className="py-2 pr-4">
                          <Link to={`/submission/${r.submissionId}`} className="font-medium text-primary hover:underline">
                            {r.studentName || 'Submission'}
                          </Link>
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">{r.assignmentTitle || '—'}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{r.className || '—'}</td>
                        <td className="metric py-2 pr-4">{r.overallScore ?? '—'}{r.overallMax ? <span className="text-muted-foreground">/{r.overallMax}</span> : null}</td>
                        <td className="metric py-2 pr-4 text-muted-foreground">{r.confidence != null ? `${Math.round(r.confidence * 100)}%` : '—'}</td>
                        <td className="py-2 pr-4 text-xs text-muted-foreground">{r.modelId || '—'}</td>
                        <td className="metric py-2 pr-4 text-xs text-muted-foreground">{fmtTokens(r.inputTokens)} / {fmtTokens(r.outputTokens)}</td>
                        <td className="py-2 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {r.flags.length === 0 ? <span className="text-muted-foreground">—</span> :
                              r.flags.map((f) => <Badge key={f} variant="outline" className="border-suggestion/50 text-[10px] text-suggestion">{f.replace(/_/g, ' ')}</Badge>)}
                          </div>
                        </td>
                        <td className="py-2 pr-4 text-xs text-muted-foreground">{new Date(r.gradedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default HistoryPage;
