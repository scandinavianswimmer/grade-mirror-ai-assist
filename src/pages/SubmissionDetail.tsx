import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, PenLine, Loader2, Check, X, Pencil, ShieldCheck, AlertTriangle, ChevronLeft, ChevronRight, Save, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { analytics } from '@/lib/analytics';
import { UpgradePaywall } from '@/components/pricing/UpgradePaywall';
import { useGradingGate } from '@/hooks/useGradingGate';
import { isApprovedStatus, isAutoFinalized, isExportedStatus, statusMetaWithProvenance, effectiveStatus, hasStaleGradingError } from '@/lib/submissionStatus';
import { normalizedEditDistance } from '@/lib/convergenceMetrics';
import { buildTeacherFeedbackExport, teacherFeedbackFilename } from '@/lib/teacherFeedbackExport';

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
  // 'ai' when Mr Selby auto-finalized this grade; 'teacher' when approved by hand. Optional/absent
  // until migration 0020 (migrations_v2) lands — fetched best-effort so a missing column never blocks load.
  finalized_by?: string | null;
}
interface Criterion {
  name: string; weight: number; maxScore: number; score: number;
  level?: string; rationale: string; verified: boolean; confidence: number;
}
interface GradeRow {
  id: string; overall_score: number | null; overall_max: number | null; letter: string | null;
  confidence: number | null; criteria: Criterion[]; summary_feedback: string | null; flags: string[];
}
interface AnnotationRow {
  id: string; start_index: number | null; end_index: number | null; quote: string;
  comment: string; ai_comment: string | null; type: AnnoType; matched: boolean; status: string;
}

interface AssignmentContext {
  title: string;
  courseName: string | null;
  className: string | null;
}

interface StackSubmission {
  id: string;
  studentName: string | null;
  status: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object'
);

const hasJsonMethod = (value: unknown): value is { json: () => Promise<unknown> } => (
  isRecord(value) && typeof value.json === 'function'
);

const readFunctionErrorMessage = async (error: unknown, fallback: string): Promise<string> => {
  try {
    const context = isRecord(error) ? error.context : null;
    if (hasJsonMethod(context)) {
      const body = await context.json();
      if (isRecord(body) && typeof body.error === 'string') {
        const stage = typeof body.stage === 'string' && body.stage ? ` (${body.stage})` : '';
        return `${body.error}${stage}`;
      }
    }
  } catch {
    // Non-JSON / network error — keep the fallback.
  }
  return fallback;
};

const errorMessage = (error: unknown, fallback: string): string => (
  error instanceof Error
    ? error.message
    : isRecord(error) && typeof error.message === 'string'
      ? error.message
      : fallback
);

const SubmissionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [submission, setSubmission] = useState<SubmissionRow | null>(null);
  const [assignmentContext, setAssignmentContext] = useState<AssignmentContext | null>(null);
  const [submissionStack, setSubmissionStack] = useState<StackSubmission[]>([]);
  const [grade, setGrade] = useState<GradeRow | null>(null);
  const [annotations, setAnnotations] = useState<AnnotationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  // Phase 15: capture the teacher's "how much did you change it?" rating at finalize.
  const [pendingFinalize, setPendingFinalize] = useState(false);
  // Free-plan grading cap gate (fail-open). When a capped Free teacher tries to grade we surface
  // the upgrade paywall instead of starting a run.
  const { atCap: gradingAtCap } = useGradingGate();
  const [showPaywall, setShowPaywall] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const { data: sub } = await supabase
      .from('submissions')
      .select('id, assignment_id, student_name, essay, extracted_text, status')
      .eq('id', id)
      .single();
    // Best-effort provenance: read finalized_by in a separate query so a missing column (pre-migration)
    // never blocks the page. Merge it onto the submission when present.
    let finalizedBy: string | null | undefined;
    {
      const { data: prov } = await supabase
        .from('submissions')
        .select('finalized_by')
        .eq('id', id)
        .maybeSingle();
      finalizedBy = (prov as { finalized_by?: string | null } | null)?.finalized_by ?? undefined;
    }
    const submissionRow = sub ? ({ ...(sub as SubmissionRow), finalized_by: finalizedBy } as SubmissionRow) : null;
    setSubmission(submissionRow);

    if (submissionRow?.assignment_id) {
      const { data: assignment } = await supabase
        .from('assignments')
        .select('title, course_name, class_id')
        .eq('id', submissionRow.assignment_id)
        .maybeSingle();
      let className: string | null = null;
      if (assignment?.class_id) {
        const { data: classRow } = await supabase
          .from('classes')
          .select('class_name')
          .eq('id', assignment.class_id)
          .maybeSingle();
        className = classRow?.class_name ?? null;
      }
      setAssignmentContext({
        title: assignment?.title ?? 'Assignment',
        courseName: assignment?.course_name ?? null,
        className,
      });

      const { data: stack } = await supabase
        .from('submissions')
        .select('id, student_name, status')
        .eq('assignment_id', submissionRow.assignment_id)
        .order('created_at', { ascending: true });
      setSubmissionStack(((stack ?? []) as Array<{ id: string; student_name: string | null; status: string | null }>).map((item) => ({
        id: item.id,
        studentName: item.student_name,
        status: item.status,
      })));
    } else {
      setAssignmentContext(null);
      setSubmissionStack([]);
    }

    const { data: g } = await supabase
      .from('submission_grades')
      .select('id, overall_score, overall_max, letter, confidence, criteria, summary_feedback, flags')
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
    setSaveState('saved');
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const runGrading = async () => {
    if (!id) return;
    // Free teacher at/over their monthly cap: show the paywall instead of grading (fail-open —
    // within-limit and Pro/Enterprise teachers fall straight through to grading).
    if (gradingAtCap) {
      setShowPaywall(true);
      return;
    }
    setGrading(true);
    const startedAt = Date.now();
    analytics.capture('grade_started', { submission_id: id, is_regrade: Boolean(grade) });
    try {
      const { data, error } = await supabase.functions.invoke('grade-submission', { body: { submissionId: id } });
      if (error) {
        const msg = await readFunctionErrorMessage(error, 'The feedback draft did not finish');
        analytics.capture('grade_completed', { submission_id: id, ok: false, duration_ms: Date.now() - startedAt });
        toast({ title: 'Draft did not finish', description: msg, variant: 'destructive' });
      } else {
        const autoFinalized = Boolean((data as { autoFinalized?: boolean } | null)?.autoFinalized);
        analytics.capture('grade_completed', { submission_id: id, ok: true, duration_ms: Date.now() - startedAt, auto_finalized: autoFinalized });
        toast(autoFinalized
          ? { title: 'Approved automatically', description: 'You turned this on. The work is approved, but it has not been exported unless the status says Exported.' }
          : { title: 'Draft ready', description: 'Review Mr Selby’s notes, revise anything you need, and approve when it feels right.' });
        await load();
      }
    } catch (e: unknown) {
      analytics.capture('grade_completed', { submission_id: id, ok: false, duration_ms: Date.now() - startedAt });
      toast({ title: 'Draft did not finish', description: errorMessage(e, 'Unexpected error'), variant: 'destructive' });
    } finally {
      setGrading(false);
    }
  };

  const setStatus = async (ann: AnnotationRow, status: 'accepted' | 'rejected') => {
    const previousStatus = ann.status;
    setSaveState('saving');
    setAnnotations((prev) => prev.map((a) => (a.id === ann.id ? { ...a, status } : a)));
    const { error } = await supabase.from('annotations').update({ status }).eq('id', ann.id);
    if (error) {
      setAnnotations((prev) => prev.map((a) => (a.id === ann.id ? { ...a, status: previousStatus } : a)));
      setSaveState('error');
      toast({ title: 'Could not save that decision', description: 'Your previous note state is still intact. Try again.', variant: 'destructive' });
      return;
    }
    if (user) await supabase.from('annotation_edits').insert({ user_id: user.id, annotation_id: ann.id, action: status === 'accepted' ? 'accept' : 'reject' });
    analytics.capture(status === 'accepted' ? 'annotation_accepted' : 'annotation_dismissed', { submission_id: id, annotation_id: ann.id, annotation_type: ann.type });
    setSaveState('saved');
  };

  const saveEdit = async (ann: AnnotationRow) => {
    const revised = draft.trim();
    // Phase 15: score how far the teacher's final wording is from Mr Selby's original (ai_comment).
    // This per-annotation edit-distance is the raw signal the convergence curve aggregates.
    const aiOriginal = ann.ai_comment ?? ann.comment;
    const editDistance = normalizedEditDistance(aiOriginal, revised);
    setSaveState('saving');
    setAnnotations((prev) => prev.map((a) => (a.id === ann.id ? { ...a, comment: revised, status: 'edited' } : a)));
    setEditing(null);
    const { error } = await supabase.from('annotations').update({ comment: revised, status: 'edited', edit_distance: editDistance }).eq('id', ann.id);
    if (error) {
      setAnnotations((prev) => prev.map((a) => (a.id === ann.id ? ann : a)));
      setSaveState('error');
      toast({ title: 'Could not save that edit', description: 'The previous wording is still intact. Try again.', variant: 'destructive' });
      return;
    }
    if (user) await supabase.from('annotation_edits').insert({ user_id: user.id, annotation_id: ann.id, action: 'edit', original: { comment: ann.comment }, revised: { comment: revised } });
    analytics.capture('annotation_edited', { submission_id: id, annotation_id: ann.id, annotation_type: ann.type, edit_distance: editDistance });
    setSaveState('saved');
  };

  // Bulk review actions — persisted server-side so they survive reload (H12).
  const bulkSetStatus = async (status: 'accepted' | 'rejected') => {
    const targets = annotations.filter((a) => a.status !== status);
    if (targets.length === 0) return;
    const previous = annotations;
    setSaveState('saving');
    setAnnotations((prev) => prev.map((a) => ({ ...a, status })));
    const ids = targets.map((a) => a.id);
    const { error } = await supabase.from('annotations').update({ status }).in('id', ids);
    if (error) {
      setAnnotations(previous);
      setSaveState('error');
      toast({ title: 'Could not save those decisions', description: 'The previous note states are still intact. Try again.', variant: 'destructive' });
      return;
    }
    if (user) {
      await supabase.from('annotation_edits').insert(
        targets.map((a) => ({ user_id: user.id, annotation_id: a.id, action: status === 'accepted' ? 'accept' : 'reject' })),
      );
    }
    analytics.capture(status === 'accepted' ? 'annotation_accepted' : 'annotation_dismissed', { submission_id: id, bulk: true, count: targets.length });
    toast({ title: status === 'accepted' ? 'Accepted all notes' : 'Dismissed all notes' });
    setSaveState('saved');
  };

  // LEARN-04/05: turn the teacher's reviewed feedback into a reinforcement example + refresh the
  // style profile so future grading adapts toward how THIS teacher grades. Consent-gated (SEC-05),
  // best-effort (never blocks finalize).
  const learnFromFinalized = async () => {
    try {
      if (!user || !grade) return;
      const { data: consent } = await supabase
        .from('privacy_settings').select('allow_training_on_content').eq('user_id', user.id).maybeSingle();
      if (!consent?.allow_training_on_content) return;
      const reviewed = annotations
        .filter((a) => a.status === 'accepted' || a.status === 'edited')
        .map((a) => `- ${a.comment}`);
      const feedback = [grade.summary_feedback, ...reviewed].filter(Boolean).join('\n');
      const text = submission?.extracted_text || submission?.essay || '';
      if (!text || !feedback) return;
      await supabase.from('training_examples').insert({
        user_id: user.id, essay: text, feedback, grade: String(grade.overall_score ?? ''), source: 'reinforcement',
      });
      await supabase.functions.invoke('build-style-profile', { body: {} });
      // Phase 15 Wave 2 (PROOF-02): rebuild the binary-signal exemplar store from this teacher's
      // accept/edit/dismiss decisions so the next batch grades against their actual edits, not just
      // the prose blurb. Best-effort and consent-gated server-side; the prose summary stays the
      // cold-start fallback (LEARN-06).
      await supabase.functions.invoke('rebuild-exemplars', { body: {} });
    } catch {
      /* learning is best-effort; never block the teacher */
    }
  };

  // Phase 15: a grading "batch" = one assignment for this teacher. Find-or-create the batch row so
  // successive assignments form an ordered series the convergence curve plots edit-rate across.
  const resolveBatchId = async (): Promise<string | null> => {
    if (!user || !submission?.assignment_id) return null;
    const { data: existing } = await supabase
      .from('grading_batches')
      .select('id')
      .eq('user_id', user.id)
      .eq('assignment_id', submission.assignment_id)
      .maybeSingle();
    if (existing?.id) return existing.id;
    // seq = next ordinal for this teacher's batches (drives the x-axis of the curve).
    const { count } = await supabase
      .from('grading_batches')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    const { data: created } = await supabase
      .from('grading_batches')
      .insert({ user_id: user.id, assignment_id: submission.assignment_id, seq: (count ?? 0) + 1 })
      .select('id')
      .maybeSingle();
    return created?.id ?? null;
  };

  // Teacher approves the grade. The stored `finalized` state stays unchanged for compatibility,
  // while the interface uses the teacher-facing Approved language.
  // one-tap "how much did you change it?" rating before locking, so the convergence proof has the
  // teacher-reported "barely edited" signal alongside the measured edit-distance.
  const finalize = () => setPendingFinalize(true);

  const confirmFinalize = async (selfRating: number) => {
    if (!id) return;
    setPendingFinalize(false);
    setSaveState('saving');
    const batchId = await resolveBatchId();
    const update = {
      status: 'finalized',
      finalized_by: 'teacher' as const,
      auto_finalized_at: null,
      edit_self_rating: selfRating,
      ...(batchId ? { batch_id: batchId } : {}),
    };
    let { error } = await supabase
      .from('submissions')
      .update(update)
      .eq('id', id);

    // Keep approval usable against a preview database that has not received provenance columns yet.
    if (error && /finalized_by|auto_finalized_at|column|schema cache/i.test(error.message)) {
      ({ error } = await supabase
        .from('submissions')
        .update({ status: 'finalized', edit_self_rating: selfRating, ...(batchId ? { batch_id: batchId } : {}) })
        .eq('id', id));
    }
    if (error) {
      setSaveState('error');
      toast({ title: 'Could not approve this work', description: 'Your draft feedback is still intact. Try again.', variant: 'destructive' });
      return;
    }

    setSubmission((prev) => (prev ? { ...prev, status: 'finalized', finalized_by: 'teacher' } : prev));
    analytics.capture('grade_finalized', { submission_id: id, edit_self_rating: selfRating });
    toast({ title: 'Approved', description: 'Review is complete. This work has not been exported.' });
    setSaveState('saved');
    void learnFromFinalized();
  };

  const exportFeedback = async () => {
    if (!id || !submission || !grade || !isApprovedStatus(submission.status)) return;

    const content = buildTeacherFeedbackExport({
      studentName: submission.student_name,
      assignmentTitle: assignmentContext?.title,
      overallScore: grade.overall_score,
      overallMax: grade.overall_max,
      letter: grade.letter,
      criteria: grade.criteria,
      summaryFeedback: grade.summary_feedback,
      notes: annotations,
    });
    const blobUrl = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const download = document.createElement('a');
    download.href = blobUrl;
    download.download = teacherFeedbackFilename(submission.student_name, assignmentContext?.title);
    document.body.appendChild(download);
    download.click();
    download.remove();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 0);

    if (isExportedStatus(submission.status)) {
      toast({ title: 'Feedback exported again', description: 'A new copy was downloaded to this device.' });
      return;
    }

    setSaveState('saving');
    const { error } = await supabase.from('submissions').update({ status: 'exported' }).eq('id', id);
    if (error) {
      setSaveState('error');
      toast({
        title: 'Feedback downloaded',
        description: 'The file is on this device, but Mr Selby could not update Activity. Try exporting again.',
        variant: 'destructive',
      });
      return;
    }

    setSubmission((previous) => (previous ? { ...previous, status: 'exported' } : previous));
    setSaveState('saved');
    toast({ title: 'Feedback exported', description: 'A teacher-readable copy was downloaded to this device.' });
  };

  const essay = submission?.extracted_text || submission?.essay || '';
  const placed = annotations
    .filter((a) => a.matched && a.start_index != null && a.end_index != null && a.end_index > a.start_index && a.status !== 'rejected')
    .sort((a, b) => (a.start_index! - b.start_index!));
  const unplaced = annotations.filter((a) => (!a.matched || a.start_index == null) && a.status !== 'rejected');
  const pendingDecisionCount = annotations.filter((annotation) => !['accepted', 'edited', 'rejected'].includes(annotation.status)).length;
  const stackIndex = submission ? submissionStack.findIndex((item) => item.id === submission.id) : -1;
  const previousSubmission = stackIndex > 0 ? submissionStack[stackIndex - 1] : null;
  const nextSubmission = stackIndex >= 0 && stackIndex < submissionStack.length - 1 ? submissionStack[stackIndex + 1] : null;

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
        <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-20 text-center text-muted-foreground animate-pulse">Loading submission…</main>
      </div>
    );
  }
  if (!submission) {
    return (
      <div className="min-h-screen"><Navbar />
        <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Submission not found.</p>
          <Link to="/"><Button variant="outline" className="mt-4">Back to dashboard</Button></Link>
        </main>
      </div>
    );
  }

  const currentStatus = effectiveStatus(submission.status, Boolean(grade));
  const currentMeta = statusMetaWithProvenance(currentStatus, submission.finalized_by);
  const approved = isApprovedStatus(currentStatus);
  const exported = isExportedStatus(currentStatus);
  const approvedAutomatically = approved && isAutoFinalized(submission.finalized_by);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-8">
        <header className="mx-auto mb-6 max-w-[1500px]">
          <Link to={`/assignment/${submission.assignment_id}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {assignmentContext?.title || 'Back to assignment'}
          </Link>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                {assignmentContext?.className || assignmentContext?.courseName || 'Submission review'}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-semibold tracking-tight">{submission.student_name || 'Student submission'}</h1>
                <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${currentMeta.badgeClass}`} title={currentMeta.description}>{currentMeta.label}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {stackIndex >= 0 && <span>Submission {stackIndex + 1} of {submissionStack.length}</span>}
                <span className={`inline-flex items-center gap-1.5 ${saveState === 'error' ? 'text-critique' : ''}`} aria-live="polite">
                  {saveState === 'saving' ? <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : <Save aria-hidden="true" className="h-3.5 w-3.5" />}
                  {saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Couldn’t save' : 'Saved'}
                </span>
                {pendingDecisionCount > 0 && <span>{pendingDecisionCount} {pendingDecisionCount === 1 ? 'note needs' : 'notes need'} a decision</span>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center" aria-label="Move through submission stack">
                {previousSubmission ? (
                  <Link to={`/submission/${previousSubmission.id}`}><Button variant="outline" size="icon" className="h-11 w-11 rounded-r-none" aria-label={`Previous submission: ${previousSubmission.studentName || 'student'}`}><ChevronLeft className="h-4 w-4" /></Button></Link>
                ) : <Button variant="outline" size="icon" className="h-11 w-11 rounded-r-none" disabled aria-label="No previous submission"><ChevronLeft className="h-4 w-4" /></Button>}
                {nextSubmission ? (
                  <Link to={`/submission/${nextSubmission.id}`}><Button variant="outline" size="icon" className="h-11 w-11 rounded-l-none border-l-0" aria-label={`Next submission: ${nextSubmission.studentName || 'student'}`}><ChevronRight className="h-4 w-4" /></Button></Link>
                ) : <Button variant="outline" size="icon" className="h-11 w-11 rounded-l-none border-l-0" disabled aria-label="No next submission"><ChevronRight className="h-4 w-4" /></Button>}
              </div>
              {grade && !approved && (
                <Button size="lg" variant="outline" className="gap-2" onClick={finalize}>
                  <ShieldCheck aria-hidden="true" className="h-4 w-4" /> Approve feedback
                </Button>
              )}
              {grade && approved && (
                <Button size="lg" variant="outline" className="gap-2" onClick={exportFeedback}>
                  <Download aria-hidden="true" className="h-4 w-4" /> {exported ? 'Export again' : 'Export feedback'}
                </Button>
              )}
              <Button size="lg" className="gap-2" onClick={runGrading} disabled={grading || !essay}>
                {grading ? <><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> Drafting…</> : <><PenLine aria-hidden="true" className="h-4 w-4" /> {grade ? 'Draft feedback again' : 'Draft feedback'}</>}
              </Button>
            </div>
          </div>
        </header>

        {approvedAutomatically && (
          <Card className="mx-auto mb-6 max-w-[1500px] border-praise/40 bg-praise-soft/40 p-4 text-sm">
            <p className="flex items-start gap-2 font-medium text-praise"><ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /> Approved automatically · You turned this on.</p>
            <p className="mt-1 pl-6 text-muted-foreground">{exported ? 'This approved result was also exported.' : 'This result is approved, but it has not been exported.'}</p>
          </Card>
        )}

        {!essay && (
          <Card className="mx-auto mb-6 max-w-[1500px] border-critique/40 bg-critique-soft/40 p-4 text-sm">
            <p className="flex items-start gap-2 text-foreground/80"><AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-critique" /> Mr Selby could not find readable text in this submission. Check the original file before trying again.</p>
          </Card>
        )}

        <div className="mx-auto grid max-w-[1500px] gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <Card className="overflow-hidden">
            <CardHeader className="rule">
              <CardTitle className="font-display text-xl">Student manuscript</CardTitle>
              <p className="text-sm text-muted-foreground">Select a marked passage to connect it with its draft margin note.</p>
            </CardHeader>
            <CardContent className="pt-6">
              {essay ? <div className="manuscript whitespace-pre-wrap">{renderEssay()}</div> : <p className="text-muted-foreground">No readable text to display.</p>}
            </CardContent>
          </Card>

          <aside aria-label="Rubric and feedback" className="space-y-4">
            {showPaywall && gradingAtCap && <UpgradePaywall source="submission_detail" />}

            {pendingFinalize && (
              <Card className="border-primary/40 bg-primary/5 p-4" role="dialog" aria-label="Approve feedback">
                <p className="text-sm font-semibold">Before you approve</p>
                {pendingDecisionCount > 0 && <p className="mt-1 text-xs text-critique">{pendingDecisionCount} {pendingDecisionCount === 1 ? 'margin note still needs' : 'margin notes still need'} a decision. Approving now keeps the undecided wording as drafted.</p>}
                <p className="mt-2 text-xs text-muted-foreground">How much did you change Mr Selby's feedback?</p>
                <div className="mt-3 grid gap-2">
                  {[
                    { v: 1, label: 'Rewrote it all' },
                    { v: 2, label: 'Changed a lot' },
                    { v: 3, label: 'Changed some' },
                    { v: 4, label: 'Changed a little' },
                    { v: 5, label: 'Barely touched it' },
                  ].map((option) => <Button key={option.v} variant="outline" className="min-h-11 justify-start text-sm" onClick={() => confirmFinalize(option.v)}>{option.label}</Button>)}
                </div>
                <Button className="mt-2 min-h-11 w-full" variant="ghost" onClick={() => setPendingFinalize(false)}>Keep reviewing</Button>
              </Card>
            )}

            {hasStaleGradingError(submission.status, Boolean(grade)) && (
              <Card className="border-suggestion/40 bg-suggestion-soft/40 p-3 text-sm">
                <p className="flex items-start gap-2 text-foreground/80"><AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-suggestion" /> The last feedback draft didn’t finish. Your previous score and notes are still intact.</p>
              </Card>
            )}

            {grade && (
              <Card className="lg:sticky lg:top-24 lg:z-10">
                <CardHeader className="rule pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="font-display text-lg">Rubric &amp; draft feedback</CardTitle>
                    <span className={`rounded-md px-2 py-1 text-xs font-medium ${currentMeta.badgeClass}`}>{currentMeta.label}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Proposed total</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-4xl font-semibold text-primary">{grade.overall_score ?? '—'}</span>
                      <span className="text-lg text-muted-foreground">/ {grade.overall_max ?? 100}</span>
                      {grade.letter && <Badge variant="secondary" className="ml-1">{grade.letter}</Badge>}
                    </div>
                  </div>
                  {Array.isArray(grade.flags) && grade.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5" aria-label="Items to check">
                      {grade.flags.map((flag) => <Badge key={flag} variant="outline" className="border-suggestion/50 text-xs text-suggestion">Check: {flag.replace(/_/g, ' ')}</Badge>)}
                    </div>
                  )}
                  {Array.isArray(grade.criteria) && grade.criteria.length > 0 && (
                    <div className="space-y-3 border-t border-border/70 pt-3">
                      {grade.criteria.map((criterion, index) => (
                        <div key={index} className="text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-medium">{criterion.name}</span>
                            <span className="shrink-0 text-muted-foreground">{criterion.score}/{criterion.maxScore}</span>
                          </div>
                          {!criterion.verified && <p className="mt-1 text-xs font-medium text-critique">Evidence needs a closer look.</p>}
                          {criterion.rationale && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{criterion.rationale}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {grade.summary_feedback && (
                    <div className="border-t border-border/70 pt-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Overall feedback</p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/90">{grade.summary_feedback}</p>
                    </div>
                  )}
                  {approved && <p className="border-t border-border/70 pt-3 text-xs text-muted-foreground">{exported ? 'Approved and exported.' : 'Approved. Not exported.'}</p>}
                </CardContent>
              </Card>
            )}

            {(placed.length > 0 || unplaced.length > 0) && (
              <Card>
                <CardHeader className="rule pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="font-display text-lg">Margin notes</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">{pendingDecisionCount === 0 ? 'Every note has a decision.' : `${pendingDecisionCount} ${pendingDecisionCount === 1 ? 'note needs' : 'notes need'} a decision.`}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <Button size="sm" variant="ghost" className="min-h-11 gap-1 px-2 text-xs" onClick={() => bulkSetStatus('accepted')}><Check className="h-3.5 w-3.5" /> Accept all</Button>
                      <Button size="sm" variant="ghost" className="min-h-11 gap-1 px-2 text-xs text-muted-foreground" onClick={() => bulkSetStatus('rejected')}><X className="h-3.5 w-3.5" /> Dismiss all</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {[...placed, ...unplaced].map((annotation, index) => (
                    <div key={annotation.id} className={`rounded-md border p-3 text-sm ${active === annotation.id ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`inline-block h-2 w-2 rounded-full ${DOT[annotation.type]}`} aria-hidden="true" />
                        <span className="text-xs font-medium capitalize text-muted-foreground">{annotation.type} note {index + 1}</span>
                        {!annotation.matched && <Badge variant="outline" className="ml-auto text-[10px]">Couldn’t place in paper</Badge>}
                        {annotation.status === 'accepted' && <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-praise"><ShieldCheck className="h-3.5 w-3.5" /> Accepted</span>}
                        {annotation.status === 'edited' && <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-suggestion"><Pencil className="h-3.5 w-3.5" /> Edited</span>}
                      </div>
                      <p className="border-l-2 border-accent/60 pl-2 text-xs italic text-muted-foreground">“{annotation.quote}”</p>
                      {annotation.matched && <Button size="sm" variant="link" className="mt-1 min-h-11 px-0 text-xs" onClick={() => setActive(annotation.id)}>Show in paper</Button>}
                      {editing === annotation.id ? (
                        <div className="mt-2 space-y-2">
                          <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} className="min-h-[90px] text-sm" aria-label={`Edit ${annotation.type} note`} />
                          <div className="flex gap-2"><Button className="min-h-11" onClick={() => saveEdit(annotation)}>Save edit</Button><Button className="min-h-11" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button></div>
                        </div>
                      ) : (
                        <>
                          <p className="mt-2 leading-relaxed text-foreground/90">{annotation.comment}</p>
                          {annotation.status === 'edited' && annotation.ai_comment && annotation.ai_comment !== annotation.comment && (
                            <p className="mt-2 text-xs text-muted-foreground"><span className="font-medium">Mr Selby's first draft:</span> <span className="line-through">{annotation.ai_comment}</span></p>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-1">
                            <Button size="sm" variant={annotation.status === 'accepted' ? 'default' : 'outline'} className="min-h-11 gap-1 px-3 text-xs" onClick={() => setStatus(annotation, 'accepted')}><Check className="h-3.5 w-3.5" /> Accept</Button>
                            <Button size="sm" variant="ghost" className="min-h-11 gap-1 px-3 text-xs" onClick={() => { setEditing(annotation.id); setDraft(annotation.comment); }}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                            <Button size="sm" variant="ghost" className="min-h-11 gap-1 px-3 text-xs text-muted-foreground" onClick={() => setStatus(annotation, 'rejected')}><X className="h-3.5 w-3.5" /> Dismiss</Button>
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
                <PenLine aria-hidden="true" className="mx-auto mb-2 h-6 w-6 text-primary/70" />
                No draft feedback yet. Ask Mr Selby for a first pass, then review every consequential result.
              </Card>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
};

export default SubmissionDetail;
