
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Download, Pencil, Check, X, AlertTriangle, ClipboardCheck, Hourglass, CheckCircle2, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { createSubmissionWithFile } from '@/lib/submissionApi';
import { analytics } from '@/lib/analytics';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import FileUpload from '@/components/FileUpload';
import { UpgradePaywall } from '@/components/pricing/UpgradePaywall';
import { useGradingGate } from '@/hooks/useGradingGate';
import { effectiveStatus, isApprovedStatus, isAutoFinalized, statusMetaWithProvenance } from '@/lib/submissionStatus';

interface Assignment {
  id: string;
  title: string;
  description: string;
  rubric_url?: string;
  created_at: string;
}

interface Submission {
  id: string;
  student_name: string;
  file_url: string;
  status: string;
  created_at: string;
  hasGrade?: boolean;
  confidence?: number | null;
  finalized_by?: string | null; // 'ai' = auto-finalized by Mr Selby; absent pre-migration
  auto_finalized_at?: string | null;
}

const AssignmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [enqueuing, setEnqueuing] = useState(false);
  // Free-plan grading cap gate (fail-open). A capped Free teacher sees the upgrade paywall
  // instead of enqueuing a bulk grade run.
  const { atCap: gradingAtCap } = useGradingGate();
  const [showPaywall, setShowPaywall] = useState(false);

  // Draft first-pass feedback for every eligible submission while preserving review/approval state.
  const gradeAll = async () => {
    // Free teacher at/over their monthly cap: surface the paywall instead of grading (fail-open —
    // within-limit and Pro/Enterprise teachers fall straight through).
    if (gradingAtCap) {
      setShowPaywall(true);
      return;
    }
    const targets = submissions
      .filter((submission) => {
        const status = effectiveStatus(submission.status, Boolean(submission.hasGrade));
        return !['grading', 'graded', 'ai_graded', 'needs_review', 'finalized', 'exported'].includes(status);
      })
      .map((submission) => submission.id);
    if (targets.length === 0) {
      toast({ title: 'Nothing to draft', description: 'Every eligible submission is already drafting, ready for review, or approved.' });
      return;
    }
    setEnqueuing(true);
    try {
      const { data, error } = await supabase.functions.invoke('grade-enqueue', { body: { submissionIds: targets } });
      if (error) {
        let msg = 'Could not queue grading';
        try {
          const b = await (error as { context?: { json?: () => Promise<{ error?: string; stage?: string }> } }).context?.json?.();
          if (b?.error) msg = `${b.error}${b.stage ? ` (${b.stage})` : ''}`;
        } catch { /* ignore */ }
        toast({ title: 'Could not start the drafts', description: msg, variant: 'destructive' });
      } else {
        const queued = (data as { queued?: number } | null)?.queued ?? targets.length;
        setSubmissions((prev) => prev.map((s) => (targets.includes(s.id) ? { ...s, status: 'grading' } : s)));
        toast({ title: 'Feedback drafts started', description: `${queued} ${queued === 1 ? 'submission is' : 'submissions are'} in progress. Drafts will appear here when ready.` });
      }
    } catch (e) {
      toast({ title: 'Could not start the drafts', description: e instanceof Error ? e.message : 'Unexpected error', variant: 'destructive' });
    } finally {
      setEnqueuing(false);
    }
  };
  // Student name is derived from the filename on upload; the teacher confirms/corrects it (M46).
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  const saveStudentName = async (id: string) => {
    const name = draftName.trim();
    if (!name) { setRenamingId(null); return; }
    await supabase.from('submissions').update({ student_name: name }).eq('id', id);
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, student_name: name } : s)));
    setRenamingId(null);
  };

  const fetchAssignmentData = useCallback(async () => {
    try {
      // Fetch assignment details
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (assignmentError) throw assignmentError;
      setAssignment(assignmentData);

      // Fetch submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', id)
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      // Mark which submissions actually have a grade so the status badge can reconcile a stale
      // value (e.g. a failed re-grade left `grade_error` while a valid grade still stands), and
      // carry the latest grade's confidence so we can show Mr Selby's auto-finalize disposition.
      const subs = (submissionsData || []) as Submission[];
      const subIds = subs.map((s) => s.id);
      const gradedIds = new Set<string>();
      const latestConfidence = new Map<string, number | null>();
      const latestAt = new Map<string, number>();
      if (subIds.length) {
        const { data: gradeRows } = await supabase
          .from('submission_grades')
          .select('submission_id, confidence, created_at')
          .in('submission_id', subIds);
        for (const g of (gradeRows ?? []) as { submission_id: string; confidence: number | null; created_at: string }[]) {
          gradedIds.add(g.submission_id);
          const t = new Date(g.created_at).getTime();
          if (!latestAt.has(g.submission_id) || t > latestAt.get(g.submission_id)!) {
            latestAt.set(g.submission_id, t);
            latestConfidence.set(g.submission_id, g.confidence);
          }
        }
      }
      setSubmissions(
        subs.map((s) => ({
          ...s,
          hasGrade: gradedIds.has(s.id),
          confidence: latestConfidence.has(s.id) ? latestConfidence.get(s.id) : null,
        })),
      );
    } catch (error) {
      console.error('Error fetching assignment data:', error);
      toast({
        title: "Error loading assignment",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast, user]);

  useEffect(() => {
    if (id && user) {
      fetchAssignmentData();
    }
  }, [fetchAssignmentData, id, user]);

  const handleFileSelect = async (file: File, content: string) => {
    if (!assignment || !user) return;

    setUploading(true);
    try {
      // Extract student name from filename (remove extension)
      const studentName = file.name.replace(/\.[^/.]+$/, "");

      // Create submission + run server-side extraction (ingest-document).
      const { ingest, ingestError } = await createSubmissionWithFile({
        assignmentId: assignment.id,
        studentName,
        file
      });

      analytics.capture('submission_uploaded', {
        assignment_id: assignment.id,
        extraction_status: ingest?.status ?? (ingestError ? 'failed' : 'ok'),
      });

      if (ingestError) {
        toast({
          title: "Added, but needs a closer look",
          description: `${file.name} was saved, but Mr Selby could not read it clearly enough to draft feedback.`,
          variant: "destructive"
        });
      } else if (ingest?.status === 'needs_review') {
        toast({
          title: "Added — needs a closer look",
          description: 'The document may be a scan or image. Check the text before asking Mr Selby to draft feedback.'
        });
      } else {
        toast({
          title: "Student work added",
          description: `${file.name} is ready for a first-pass feedback draft.`
        });
      }

      // Refresh submissions
      fetchAssignmentData();
    } catch (error) {
      console.error('Error uploading essay:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-lg font-medium text-muted-foreground">Opening assignment…</div>
          </div>
        </main>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-lg font-medium text-critique">Assignment not found</div>
            <Link to="/">
              <Button className="mt-4">Back to Today</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const withEffectiveStatus = submissions.map((submission) => ({
    submission,
    status: effectiveStatus(submission.status, Boolean(submission.hasGrade)),
  }));
  const closerLookCount = withEffectiveStatus.filter(({ status }) => status === 'needs_review' || status === 'grade_error').length;
  const draftsReadyCount = withEffectiveStatus.filter(({ status }) => status === 'graded' || status === 'ai_graded').length;
  const draftingCount = withEffectiveStatus.filter(({ status }) => status === 'grading').length;
  const approvedCount = withEffectiveStatus.filter(({ status }) => isApprovedStatus(status)).length;
  const exportedCount = withEffectiveStatus.filter(({ status }) => status === 'exported').length;
  const automaticallyApprovedCount = withEffectiveStatus.filter(({ status, submission }) => (
    isApprovedStatus(status) && (isAutoFinalized(submission.finalized_by) || Boolean(submission.auto_finalized_at))
  )).length;
  const rank: Record<string, number> = {
    needs_review: 0,
    grade_error: 0,
    graded: 1,
    ai_graded: 1,
    uploaded: 2,
    pending: 2,
    grading: 3,
    finalized: 4,
    exported: 5,
  };
  const orderedSubmissions = [...submissions].sort((a, b) => (
    (rank[effectiveStatus(a.status, Boolean(a.hasGrade))] ?? 6)
    - (rank[effectiveStatus(b.status, Boolean(b.hasGrade))] ?? 6)
  ));

  return (
    <div className="min-h-screen">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8">
            <Link to="/" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to Today
            </Link>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Assignment</p>
                <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">{assignment.title}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'} in this stack</p>
              </div>
              {submissions.length > 0 && (
                <Button size="lg" onClick={gradeAll} disabled={enqueuing} className="gap-2">
                  <ClipboardCheck aria-hidden="true" className="h-4 w-4" />
                  {enqueuing ? 'Starting drafts…' : 'Draft eligible feedback'}
                </Button>
              )}
            </div>
          </header>

          <section aria-label="Assignment progress" className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle aria-hidden="true" className="h-5 w-5 text-critique" />
                <div><p className="text-2xl font-semibold">{closerLookCount}</p><p className="text-xs text-muted-foreground">Need a closer look</p></div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <ClipboardCheck aria-hidden="true" className="h-5 w-5 text-suggestion" />
                <div><p className="text-2xl font-semibold">{draftsReadyCount}</p><p className="text-xs text-muted-foreground">Drafts ready</p></div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Hourglass aria-hidden="true" className="h-5 w-5 text-primary" />
                <div><p className="text-2xl font-semibold">{draftingCount}</p><p className="text-xs text-muted-foreground">Drafting now</p></div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 aria-hidden="true" className="mt-1 h-5 w-5 text-praise" />
                <div>
                  <p className="text-2xl font-semibold">{approvedCount}</p>
                  <p className="text-xs text-muted-foreground">Approved{exportedCount > 0 ? ` · ${exportedCount} exported` : ''}</p>
                </div>
              </div>
            </Card>
          </section>

          {automaticallyApprovedCount > 0 && (
            <Card className="mb-8 border-praise/40 bg-praise-soft/40 p-4 text-sm">
              <p className="font-medium text-praise">{automaticallyApprovedCount} approved automatically · You turned this on.</p>
              <p className="mt-1 text-muted-foreground">Automatic approval is not the same as export. Exported work is labeled separately.</p>
            </Card>
          )}

          {showPaywall && gradingAtCap && (
            <div className="mb-8"><UpgradePaywall source="assignment_detail" /></div>
          )}

          <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            <Card>
              <CardHeader className="rule"><CardTitle className="font-display text-xl">Assignment prompt</CardTitle></CardHeader>
              <CardContent className="pt-5">
                <p className="whitespace-pre-wrap leading-relaxed text-foreground/85">{assignment.description || 'No assignment prompt was saved.'}</p>
              </CardContent>
            </Card>
            <div className="space-y-6">
              <Card>
                <CardHeader className="rule"><CardTitle className="font-display text-xl">Rubric</CardTitle></CardHeader>
                <CardContent className="pt-5">
                  {assignment.rubric_url ? (
                    <a href={assignment.rubric_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 font-medium text-primary hover:underline">
                      <Download aria-hidden="true" className="h-4 w-4" /> Open rubric
                    </a>
                  ) : <p className="text-sm text-muted-foreground">No rubric file is attached.</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="rule"><CardTitle className="font-display text-xl">Add student work</CardTitle></CardHeader>
                <CardContent className="pt-5">
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    acceptedTypes={['.pdf', '.docx', '.txt']}
                    multiple
                    maxSize={10}
                    placeholder="Add PDF, DOCX, or TXT files"
                    showTextExtraction={false}
                  />
                  {uploading && <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Upload aria-hidden="true" className="h-4 w-4" /> Adding student work…</p>}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader className="rule">
              <CardTitle className="font-display text-2xl">Submissions</CardTitle>
              <p className="text-sm text-muted-foreground">Exceptions and ready drafts appear first, so the next decision is easy to find.</p>
            </CardHeader>
            <CardContent className="p-0">
              {submissions.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">No student work yet. Add files above when the stack is ready.</div>
              ) : (
                <div className="divide-y divide-border">
                  {orderedSubmissions.map((submission) => {
                    const status = effectiveStatus(submission.status, Boolean(submission.hasGrade));
                    const meta = statusMetaWithProvenance(status, submission.finalized_by);
                    const needsAttention = status === 'needs_review' || status === 'grade_error';
                    const readyForReview = status === 'graded' || status === 'ai_graded';
                    const automaticallyApproved = isApprovedStatus(status) && (isAutoFinalized(submission.finalized_by) || Boolean(submission.auto_finalized_at));
                    const action = needsAttention ? 'Review now' : readyForReview ? 'Review draft' : status === 'exported' ? 'View export' : isApprovedStatus(status) ? 'View approved' : 'Open submission';
                    return (
                      <div key={submission.id} className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between ${needsAttention ? 'bg-critique-soft/30' : ''}`} data-status={status}>
                        <div className="flex min-w-0 items-start gap-3">
                          <FileText aria-hidden="true" className={`mt-1 h-5 w-5 shrink-0 ${needsAttention ? 'text-critique' : 'text-muted-foreground'}`} />
                          <div className="min-w-0">
                            {renamingId === submission.id ? (
                              <div className="flex flex-wrap items-center gap-1">
                                <Input value={draftName} onChange={(event) => setDraftName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') saveStudentName(submission.id); if (event.key === 'Escape') setRenamingId(null); }} className="h-10 w-56" autoFocus aria-label="Student name" />
                                <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => saveStudentName(submission.id)} aria-label="Save name"><Check className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => setRenamingId(null)} aria-label="Cancel rename"><X className="h-4 w-4" /></Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="truncate font-medium">{submission.student_name || 'Student submission'}</span>
                                <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground" onClick={() => { setRenamingId(submission.id); setDraftName(submission.student_name || ''); }} aria-label={`Edit name for ${submission.student_name || 'student submission'}`}>
                                  <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">Added {new Date(submission.created_at).toLocaleDateString()}</p>
                            {automaticallyApproved && <p className="mt-1 text-xs font-medium text-praise">You turned automatic approval on.</p>}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                          <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${meta.badgeClass}`} title={meta.description}>{meta.label}</span>
                          <Link to={`/submission/${submission.id}`}><Button variant={needsAttention || readyForReview ? 'default' : 'outline'}>{action}</Button></Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AssignmentDetail;
