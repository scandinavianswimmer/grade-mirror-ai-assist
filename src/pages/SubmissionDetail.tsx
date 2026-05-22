import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Loader2, Check, X, Pencil, RotateCcw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { statusBadgeClass, statusLabel, isFinalized } from '@/lib/submissionStatus';

type AnnoType = 'praise' | 'suggestion' | 'error' | 'question';
const PEN: Record<AnnoType, string> = { praise: 'praise', suggestion: 'suggestion', error: 'critique', question: 'question' };
// Static class strings so Tailwind's JIT generates them (no dynamic class names).
const DOT: Record<AnnoType, string> = { praise: 'bg-praise', suggestion: 'bg-suggestion', error: 'bg-critique', question: 'bg-question' };

interface SubmissionRow {
  id: string;
  assignment_id: string;
  student_name: string | null;
  essay: string | null;
  extracted_text: string | null;
  status: string;
}
interface Criterion {
  name: string; weight: number; maxScore: number; score: number;
  level?: string; rationale: string; verified: boolean; confidence: number;
}
interface GradeRow {
  id: string; overall_score: number | null; overall_max: number | null; letter: string | null;
  confidence: number | null; criteria: Criterion[]; summary_feedback: string | null; flags: string[]; model_id: string | null;
}
interface AnnotationRow {
  id: string; start_index: number | null; end_index: number | null; quote: string;
  comment: string; ai_comment: string | null; type: AnnoType; matched: boolean; status: string;
}

const SubmissionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [submission, setSubmission] = useState<SubmissionRow | null>(null);
  const [grade, setGrade] = useState<GradeRow | null>(null);
  const [annotations, setAnnotations] = useState<AnnotationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const { data: sub } = await supabase
      .from('submissions')
      .select('id, assignment_id, student_name, essay, extracted_text, status')
      .eq('id', id)
      .single();
    setSubmission(sub as SubmissionRow | null);

    const { data: g } = await supabase
      .from('submission_grades')
      .select('id, overall_score, overall_max, letter, confidence, criteria, summary_feedback, flags, model_id')
      .eq('submission_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setGrade(g as unknown as GradeRow | null);

    const { data: anns } = await supabase
      .from('annotations')
      .select('id, start_index, end_index, quote, comment, ai_comment, type, matched, status')
      .eq('submission_id', id)
      .order('start_index', { ascending: true });
    setAnnotations((anns as unknown as AnnotationRow[]) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const runGrading = async () => {
    if (!id) return;
    setGrading(true);
    try {
      const { error } = await supabase.functions.invoke('grade-submission', { body: { submissionId: id } });
      if (error) {
        let msg = 'Grading failed';
        try { const body = await (error as any).context?.json?.(); if (body?.error) msg = `${body.error}${body.stage ? ` (${body.stage})` : ''}`; } catch { /* ignore */ }
        toast({ title: 'Could not grade', description: msg, variant: 'destructive' });
      } else {
        toast({ title: 'Graded', description: 'Review the AI’s notes — you have the final say.' });
        await load();
      }
    } catch (e: any) {
      toast({ title: 'Could not grade', description: e?.message ?? 'Unexpected error', variant: 'destructive' });
    } finally {
      setGrading(false);
    }
  };

  const setStatus = async (ann: AnnotationRow, status: 'accepted' | 'rejected') => {
    setAnnotations((prev) => prev.map((a) => (a.id === ann.id ? { ...a, status } : a)));
    await supabase.from('annotations').update({ status }).eq('id', ann.id);
    if (user) await supabase.from('annotation_edits').insert({ user_id: user.id, annotation_id: ann.id, action: status === 'accepted' ? 'accept' : 'reject' });
  };

  const saveEdit = async (ann: AnnotationRow) => {
    const revised = draft.trim();
    setAnnotations((prev) => prev.map((a) => (a.id === ann.id ? { ...a, comment: revised, status: 'edited' } : a)));
    setEditing(null);
    await supabase.from('annotations').update({ comment: revised, status: 'edited' }).eq('id', ann.id);
    if (user) await supabase.from('annotation_edits').insert({ user_id: user.id, annotation_id: ann.id, action: 'edit', original: { comment: ann.comment }, revised: { comment: revised } });
  };

  // Bulk review actions — persisted server-side so they survive reload (H12).
  const bulkSetStatus = async (status: 'accepted' | 'rejected') => {
    const targets = annotations.filter((a) => a.status !== status);
    if (targets.length === 0) return;
    setAnnotations((prev) => prev.map((a) => ({ ...a, status })));
    const ids = targets.map((a) => a.id);
    await supabase.from('annotations').update({ status }).in('id', ids);
    if (user) {
      await supabase.from('annotation_edits').insert(
        targets.map((a) => ({ user_id: user.id, annotation_id: a.id, action: status === 'accepted' ? 'accept' : 'reject' })),
      );
    }
    toast({ title: status === 'accepted' ? 'Accepted all notes' : 'Dismissed all notes' });
  };

  // Teacher approves the grade — the human-in-the-loop finalize step (M48).
  const finalize = async () => {
    if (!id) return;
    await supabase.from('submissions').update({ status: 'finalized' }).eq('id', id);
    setSubmission((prev) => (prev ? { ...prev, status: 'finalized' } : prev));
    toast({ title: 'Grade finalized', description: 'Marked as approved by you.' });
  };

  const essay = submission?.extracted_text || submission?.essay || '';
  const placed = annotations
    .filter((a) => a.matched && a.start_index != null && a.end_index != null && a.end_index > a.start_index && a.status !== 'rejected')
    .sort((a, b) => (a.start_index! - b.start_index!));
  const unplaced = annotations.filter((a) => (!a.matched || a.start_index == null) && a.status !== 'rejected');

  // Render essay with non-overlapping highlighted spans.
  const renderEssay = () => {
    const nodes: React.ReactNode[] = [];
    let cursor = 0;
    let n = 0;
    placed.forEach((a) => {
      const s = a.start_index!, e = a.end_index!;
      if (s < cursor) return;
      if (s > cursor) nodes.push(essay.slice(cursor, s));
      n += 1;
      nodes.push(
        <mark
          key={a.id}
          data-id={a.id}
          role="button"
          tabIndex={0}
          aria-label={`${a.type} note ${n}: ${a.comment}`}
          onClick={() => setActive(a.id)}
          onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setActive(a.id); } }}
          className={`anno anno-${PEN[a.type]} ${active === a.id ? 'anno-active' : ''}`}
        >
          {essay.slice(s, e)}
          <sup className="metric ml-0.5 text-[0.6em] text-muted-foreground">{n}</sup>
        </mark>,
      );
      cursor = e;
    });
    if (cursor < essay.length) nodes.push(essay.slice(cursor));
    return nodes;
  };

  if (loading) {
    return (
      <div className="min-h-screen"><Navbar />
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground animate-pulse">Loading submission…</div>
      </div>
    );
  }
  if (!submission) {
    return (
      <div className="min-h-screen"><Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Submission not found.</p>
          <Link to="/"><Button variant="outline" className="mt-4">Back to dashboard</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link to={`/assignment/${submission.assignment_id}`} className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to assignment
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-semibold tracking-tight">{submission.student_name || 'Student submission'}</h1>
              <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(submission.status)}`}>{statusLabel(submission.status)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {grade && !isFinalized(submission.status) && (
              <Button size="lg" variant="outline" className="gap-2" onClick={finalize}>
                <ShieldCheck className="h-4 w-4" /> Finalize
              </Button>
            )}
            <Button size="lg" className="gap-2" onClick={runGrading} disabled={grading || !essay}>
              {grading ? <><Loader2 className="h-4 w-4 animate-spin" /> Grading…</> : <><Sparkles className="h-4 w-4" /> {grade ? 'Re-grade with aiTA' : 'Grade with aiTA'}</>}
            </Button>
          </div>
        </div>

        {!essay && (
          <Card className="mb-6 border-suggestion/40 bg-suggestion-soft/40 p-4 text-sm">
            <span className="flex items-center gap-2 text-foreground/80"><AlertTriangle className="h-4 w-4 text-suggestion" /> No extracted text on this submission yet — upload or ingest the document before grading.</span>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Manuscript */}
          <Card className="overflow-hidden">
            <CardHeader className="rule"><CardTitle className="font-display text-lg">Submission</CardTitle></CardHeader>
            <CardContent className="pt-6">
              {essay ? (
                <div className="manuscript whitespace-pre-wrap">{renderEssay()}</div>
              ) : (
                <p className="text-muted-foreground">No text to display.</p>
              )}
            </CardContent>
          </Card>

          {/* Review rail */}
          <div className="space-y-4">
            {grade && (
              <Card>
                <CardHeader className="rule pb-3">
                  <div className="flex items-end justify-between">
                    <CardTitle className="font-display text-base">Grade</CardTitle>
                    {grade.model_id && <span className="metric text-xs text-muted-foreground">{grade.model_id}</span>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="metric text-4xl font-semibold text-primary">{grade.overall_score ?? '—'}</span>
                    <span className="metric text-lg text-muted-foreground">/ {grade.overall_max ?? 100}</span>
                    {grade.letter && <Badge variant="secondary" className="ml-1">{grade.letter}</Badge>}
                  </div>
                  {typeof grade.confidence === 'number' && (
                    <p className="text-xs text-muted-foreground" title="How complete the AI draft is — not a guarantee of correctness. Your review decides the grade.">
                      AI completeness {(grade.confidence * 100).toFixed(0)}% · review required
                    </p>
                  )}
                  {Array.isArray(grade.flags) && grade.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {grade.flags.map((f) => <Badge key={f} variant="outline" className="border-suggestion/50 text-xs text-suggestion">{f.replace(/_/g, ' ')}</Badge>)}
                    </div>
                  )}
                  {Array.isArray(grade.criteria) && grade.criteria.length > 0 && (
                    <div className="space-y-2 border-t border-border/70 pt-3">
                      {grade.criteria.map((c, i) => (
                        <div key={i} className="text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{c.name}</span>
                            <span className="metric text-muted-foreground">{c.score}/{c.maxScore}{c.verified ? '' : ' ⚠'}</span>
                          </div>
                          {c.rationale && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{c.rationale}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {grade.summary_feedback && (
                    <div className="border-t border-border/70 pt-3 text-sm leading-relaxed text-foreground/90">{grade.summary_feedback}</div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Margin notes — human-in-the-loop */}
            {(placed.length > 0 || unplaced.length > 0) && (
              <Card>
                <CardHeader className="rule pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display text-base">Margin notes</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => bulkSetStatus('accepted')}>
                        <Check className="h-3.5 w-3.5" /> Accept all
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs text-muted-foreground" onClick={() => bulkSetStatus('rejected')}>
                        <X className="h-3.5 w-3.5" /> Dismiss all
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {[...placed, ...unplaced].map((a, i) => (
                    <div
                      key={a.id}
                      onClick={() => setActive(a.id)}
                      className={`rounded-lg border p-3 text-sm transition-colors ${active === a.id ? 'border-primary bg-primary/5' : 'border-border bg-card'} ${a.status === 'accepted' ? 'opacity-100' : a.status === 'edited' ? '' : ''}`}
                    >
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className={`inline-block h-2 w-2 rounded-full ${DOT[a.type]}`} />
                        <span className="text-xs font-medium capitalize text-muted-foreground">{a.type}</span>
                        {!a.matched && <Badge variant="outline" className="ml-auto text-[10px]">couldn’t place</Badge>}
                        {a.status === 'accepted' && <ShieldCheck className="ml-auto h-3.5 w-3.5 text-praise" />}
                        {a.status === 'edited' && <Pencil className="ml-auto h-3.5 w-3.5 text-suggestion" />}
                      </div>
                      <p className="mb-1 border-l-2 border-accent/60 pl-2 text-xs italic text-muted-foreground line-clamp-2">“{a.quote}”</p>
                      {editing === a.id ? (
                        <div className="mt-2 space-y-2">
                          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-[70px] text-sm" />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEdit(a)}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="leading-relaxed text-foreground/90">{a.comment}</p>
                          {a.status === 'edited' && a.ai_comment && a.ai_comment !== a.comment && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              <span className="font-medium">AI originally suggested:</span> <span className="line-through">{a.ai_comment}</span>
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-1">
                            <Button size="sm" variant={a.status === 'accepted' ? 'default' : 'outline'} className="h-7 gap-1 px-2 text-xs" onClick={(e) => { e.stopPropagation(); setStatus(a, 'accepted'); }}>
                              <Check className="h-3.5 w-3.5" /> Accept
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={(e) => { e.stopPropagation(); setEditing(a.id); setDraft(a.comment); }}>
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs text-muted-foreground" onClick={(e) => { e.stopPropagation(); setStatus(a, 'rejected'); }}>
                              <X className="h-3.5 w-3.5" /> Dismiss
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {!grade && essay && (
              <Card className="border-dashed p-6 text-center text-sm text-muted-foreground">
                <Sparkles className="mx-auto mb-2 h-6 w-6 text-primary/60" />
                Not graded yet. Run aiTA to get rubric-aligned notes you can accept, edit, or dismiss.
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;
