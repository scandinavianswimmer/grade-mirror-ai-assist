
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Download, Pencil, Check, X } from 'lucide-react';
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
import { statusBadgeClass, statusLabel, effectiveStatus } from '@/lib/submissionStatus';
import { Bot, Inbox, CheckCircle2 } from 'lucide-react';
import { dispositionFor, computeOnTheLoopSummary, type Disposition } from '@/lib/onTheLoop';

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
  finalized_by?: string | null; // 'ai' = auto-finalized by aiTA; absent pre-migration
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

  // Phase 4: bulk-enqueue every not-yet-graded submission for async grading by the Cloud Run worker.
  const gradeAll = async () => {
    // Free teacher at/over their monthly cap: surface the paywall instead of grading (fail-open —
    // within-limit and Pro/Enterprise teachers fall straight through).
    if (gradingAtCap) {
      setShowPaywall(true);
      return;
    }
    const targets = submissions.filter((s) => s.status !== 'graded' && s.status !== 'finalized').map((s) => s.id);
    if (targets.length === 0) {
      toast({ title: 'Nothing to grade', description: 'Every submission is already graded or finalized.' });
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
        toast({ title: 'Bulk grading unavailable', description: msg, variant: 'destructive' });
      } else {
        const queued = (data as { queued?: number } | null)?.queued ?? targets.length;
        setSubmissions((prev) => prev.map((s) => (targets.includes(s.id) ? { ...s, status: 'grading' } : s)));
        toast({ title: 'Queued for grading', description: `${queued} submission(s) queued — results appear as the worker grades them.` });
      }
    } catch (e) {
      toast({ title: 'Bulk grading unavailable', description: e instanceof Error ? e.message : 'Unexpected error', variant: 'destructive' });
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
      // carry the latest grade's confidence so we can show aiTA's auto-finalize disposition.
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
          title: "Uploaded, but extraction failed",
          description: `${file.name} was saved, but text extraction failed (${ingestError}). It needs manual review before grading.`,
          variant: "destructive"
        });
      } else if (ingest?.status === 'needs_review') {
        toast({
          title: "Uploaded — needs review",
          description: `Low-confidence extraction (${Math.round((ingest.confidence ?? 0) * 100)}%). Likely a scanned PDF; review before grading.`
        });
      } else {
        const pct = ingest ? Math.round((ingest.confidence ?? 0) * 100) : null;
        toast({
          title: "Uploaded & ready to grade",
          description: pct != null
            ? `${file.name} extracted (${pct}% confidence). Open it to grade with aiTA.`
            : `${file.name} uploaded and ready for grading.`
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-lg font-medium">Loading assignment...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-lg font-medium text-red-600">Assignment not found</div>
            <Link to="/dashboard">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // On-the-Loop disposition per submission — what aiTA published unattended vs. what it routed
  // to the teacher. Column-tolerant (reads optional provenance off the row if present).
  const dispositions = new Map<string, Disposition>();
  for (const s of submissions) {
    if (!s.hasGrade) {
      dispositions.set(s.id, s.status === 'needs_review' || s.status === 'grade_error' ? 'needs_review' : 'pending');
    } else {
      dispositions.set(
        s.id,
        dispositionFor(
          { id: s.id, status: s.status, finalized_by: s.finalized_by, auto_finalized_at: s.auto_finalized_at },
        ),
      );
    }
  }

  const loopSummary = computeOnTheLoopSummary(
    submissions.map((s) => ({ id: s.id, status: s.status, finalized_by: s.finalized_by, auto_finalized_at: s.auto_finalized_at })),
    submissions.filter((s) => s.hasGrade).map((s) => ({ submission_id: s.id, confidence: s.confidence ?? null })),
  );

  // Exceptions first so the teacher's eye lands on what needs a human; then auto-finalized; then the rest.
  const dispositionRank: Record<Disposition, number> = { needs_review: 0, pending: 1, auto_finalized: 2 };
  const orderedSubmissions = [...submissions].sort(
    (a, b) => dispositionRank[dispositions.get(a.id) ?? 'pending'] - dispositionRank[dispositions.get(b.id) ?? 'pending'],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
          </div>

          {/* Assignment Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Assignment Prompt & Rubric</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Assignment Prompt:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
              </div>
              
              {assignment.rubric_url && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Grading Rubric:</h3>
                  <a 
                    href={assignment.rubric_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <Download className="w-4 h-4" />
                    View Rubric
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Essay Upload Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upload Student Essays for Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={handleFileSelect}
                acceptedTypes={['.pdf', '.docx', '.txt']}
                multiple
                maxSize={10}
                placeholder="Upload student essays (PDF, DOCX, or TXT files)"
                showTextExtraction={false}
              />
              {uploading && (
                <div className="mt-4 text-center">
                  <div className="text-sm text-gray-600">Processing file...</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submissions List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Student Submissions ({submissions.length})</CardTitle>
                {submissions.length > 0 && (
                  <Button size="sm" onClick={gradeAll} disabled={enqueuing}>
                    {enqueuing ? 'Queuing…' : 'Grade all ungraded'}
                  </Button>
                )}
              </div>
              {loopSummary.graded > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <CheckCircle2 className="h-4 w-4" /> {loopSummary.graded} graded
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                    <Bot className="h-4 w-4" /> {loopSummary.autoFinalized} auto-finalized by aiTA
                  </span>
                  <span className={`flex items-center gap-1.5 font-medium ${loopSummary.needsReview > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                    <Inbox className="h-4 w-4" /> {loopSummary.needsReview} need your review
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {showPaywall && gradingAtCap && (
                <div className="mb-4">
                  <UpgradePaywall source="assignment_detail" />
                </div>
              )}
              {submissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No student submissions yet. Upload essays above to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {orderedSubmissions.map((submission) => {
                  const disposition = dispositions.get(submission.id) ?? 'pending';
                  const isException = disposition === 'needs_review';
                  const isAuto = disposition === 'auto_finalized';
                  const rowClass = isException
                    ? 'border-amber-300 bg-amber-50/60 hover:bg-amber-50'
                    : 'hover:bg-gray-50';
                  return (
                    <div
                      key={submission.id}
                      className={`flex items-center justify-between p-4 border rounded-lg ${rowClass}`}
                      data-disposition={disposition}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className={`w-5 h-5 ${isException ? 'text-amber-500' : 'text-gray-400'}`} />
                        <div>
                          {renamingId === submission.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={draftName}
                                onChange={(e) => setDraftName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') saveStudentName(submission.id); if (e.key === 'Escape') setRenamingId(null); }}
                                className="h-8 w-48"
                                autoFocus
                                aria-label="Student name"
                              />
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveStudentName(submission.id)} aria-label="Save name">
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setRenamingId(null)} aria-label="Cancel rename">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">{submission.student_name}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-gray-400"
                                onClick={() => { setRenamingId(submission.id); setDraftName(submission.student_name || ''); }}
                                aria-label="Edit student name"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                          <div className="text-sm text-gray-500">
                            Uploaded {new Date(submission.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAuto ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                            <Bot className="h-3 w-3" /> Auto-finalized by aiTA
                          </span>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs ${statusBadgeClass(effectiveStatus(submission.status, !!submission.hasGrade))}`}>
                            {statusLabel(effectiveStatus(submission.status, !!submission.hasGrade))}
                          </span>
                        )}
                        <Link to={`/submission/${submission.id}`}>
                          <Button variant={isException ? 'default' : 'outline'} size="sm">
                            {isException ? 'Review' : 'View'}
                          </Button>
                        </Link>
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
