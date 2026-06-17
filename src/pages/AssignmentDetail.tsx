
import { useState, useEffect } from 'react';
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
import { statusBadgeClass, statusLabel, statusMetaWithProvenance, effectiveStatus } from '@/lib/submissionStatus';

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
  finalized_by?: string | null; // 'ai' = auto-finalized by aiTA; absent pre-migration
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

  useEffect(() => {
    if (id && user) {
      fetchAssignmentData();
    }
  }, [id, user]);

  const fetchAssignmentData = async () => {
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
      // value (e.g. a failed re-grade left `grade_error` while a valid grade still stands).
      const subs = (submissionsData || []) as Submission[];
      const subIds = subs.map((s) => s.id);
      const gradedIds = new Set<string>();
      if (subIds.length) {
        const { data: gradeRows } = await supabase
          .from('submission_grades')
          .select('submission_id')
          .in('submission_id', subIds);
        for (const g of (gradeRows ?? []) as { submission_id: string }[]) gradedIds.add(g.submission_id);
      }
      setSubmissions(subs.map((s) => ({ ...s, hasGrade: gradedIds.has(s.id) })));
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
  };

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
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-lg font-medium">Loading assignment...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-lg font-medium text-red-600">Assignment not found</div>
            <Link to="/dashboard">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
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
              {(() => {
                // On-the-Loop monitoring line: how many aiTA published vs. how many it routed to you.
                const autoFinalized = submissions.filter((s) => s.finalized_by === 'ai').length;
                const needsReview = submissions.filter(
                  (s) => effectiveStatus(s.status, !!s.hasGrade) === 'needs_review',
                ).length;
                if (autoFinalized === 0 && needsReview === 0) return null;
                return (
                  <p className="text-sm text-gray-600">
                    {autoFinalized > 0 && (
                      <span className="text-praise font-medium">{autoFinalized} auto-finalized by aiTA</span>
                    )}
                    {autoFinalized > 0 && needsReview > 0 && ' · '}
                    {needsReview > 0 && (
                      <span className="text-destructive font-medium">{needsReview} need{needsReview === 1 ? 's' : ''} your review</span>
                    )}
                  </p>
                );
              })()}
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
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400" />
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
                        {(() => {
                          const meta = statusMetaWithProvenance(effectiveStatus(submission.status, !!submission.hasGrade), submission.finalized_by);
                          return <span className={`px-2 py-1 rounded-full text-xs ${meta.badgeClass}`}>{meta.label}</span>;
                        })()}
                        <Link to={`/submission/${submission.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;
