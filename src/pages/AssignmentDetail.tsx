import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Book, Loader2, PlusCircle, Edit, FileText, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAssignment, getSubmissions } from "@/lib/api";
import { createSubmissionWithFile } from "@/lib/submissionApi";
import { processSubmissionFile } from "@/lib/fileProcessing";
import SubmissionsList from "@/components/SubmissionsList";
import CreateSubmissionModal from "@/components/CreateSubmissionModal";
import BatchProcessingModal from '@/components/BatchProcessingModal';
import { createBatchProcessor } from '@/lib/batchProcessing';
import FinalizationModal from '@/components/FinalizationModal';

interface Submission {
  id: string;
  created_at: string;
  student_name: string;
  essay: string;
  ai_feedback: string;
  ai_grade: string;
  status: string;
}

const AssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use 'id' instead of 'assignmentId' to match the route parameter
  const assignmentId = id;

  console.log('AssignmentDetail: assignmentId from params:', assignmentId);

  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchStatuses, setBatchStatuses] = useState<any[]>([]);
  const [batchResult, setBatchResult] = useState<any>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [showFinalizationModal, setShowFinalizationModal] = useState(false);

  useEffect(() => {
    console.log('AssignmentDetail: useEffect triggered with assignmentId:', assignmentId);
    
    if (!assignmentId) {
      console.log('AssignmentDetail: No assignmentId found, showing toast and navigating');
      toast({
        title: "Missing Assignment ID",
        description: "Please select a valid assignment.",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }

    fetchAssignment();
    fetchSubmissions();
  }, [assignmentId, navigate, toast]);

  const fetchAssignment = async () => {
    if (!assignmentId) return;
    
    console.log('AssignmentDetail: Fetching assignment with ID:', assignmentId);
    setIsLoading(true);
    try {
      const assignmentData = await getAssignment(assignmentId);
      console.log('AssignmentDetail: Assignment data received:', assignmentData);
      setAssignment(assignmentData);
    } catch (error: any) {
      console.error('AssignmentDetail: Error fetching assignment:', error);
      toast({
        title: "Error fetching assignment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!assignmentId) return;
    
    console.log('AssignmentDetail: Fetching submissions for assignment:', assignmentId);
    setIsLoading(true);
    try {
      const submissionsData = await getSubmissions(assignmentId);
      console.log('AssignmentDetail: Submissions data received:', submissionsData);
      setSubmissions(submissionsData);
    } catch (error: any) {
      console.error('AssignmentDetail: Error fetching submissions:', error);
      toast({
        title: "Error fetching submissions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubmission = async (data: any, file: File | null) => {
    setIsSubmitting(true);
    try {
      await createSubmissionWithFile({
        assignmentId: assignmentId || '',
        studentName: data.studentName,
        essay: data.essay,
        file: file || undefined
      });

      toast({
        title: "Submission created",
        description: "The submission has been successfully created.",
      });
      setShowCreateModal(false);
      fetchSubmissions();
    } catch (error: any) {
      toast({
        title: "Error creating submission",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGradeSubmission = (submissionId: string) => {
    console.log('Navigating to grade submission:', submissionId);
    navigate(`/grade/${submissionId}`);
  };

  const handleViewSubmission = (submissionId: string) => {
    console.log('Navigating to view submission:', submissionId);
    navigate(`/submission/${submissionId}`);
  };

  const handleBatchGrade = async () => {
    setIsBatchProcessing(true);
    setShowBatchModal(true);

    const submissionIds = submissions.map(sub => sub.id);
    const batchProcessor = createBatchProcessor((status) => {
      setBatchStatuses([...status]);
    });

    try {
      const result = await batchProcessor.processSubmissionsBatch(submissionIds);
      setBatchResult(result);
      toast({
        title: "Batch grading complete",
        description: `${result.processedSuccessfully} submissions graded successfully, ${result.failed} failed.`,
      });
    } catch (error: any) {
      toast({
        title: "Batch grading error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsBatchProcessing(false);
      fetchSubmissions();
    }
  };

  const handleFinalization = () => {
    setShowFinalizationModal(false);
    fetchSubmissions();
  };

  const getFinalizableSubmissions = () => {
    return submissions.filter(sub => sub.status === 'ai_graded' || sub.status === 'graded');
  };

  console.log('AssignmentDetail: Rendering with assignment:', assignment, 'isLoading:', isLoading);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <Book className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate(`/assignment/edit/${assignmentId}`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Assignment
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{assignment?.title || 'Loading...'}</h1>
              <p className="text-gray-600">{assignment?.description || 'Loading description...'}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Assignment Details Sidebar */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Assignment Details</CardTitle>
                    <CardDescription>Information about this assignment.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label>Due Date</Label>
                      <p className="text-sm font-medium">{assignment?.due_date ? new Date(assignment?.due_date).toLocaleDateString() : 'No due date'}</p>
                    </div>
                    <div>
                      <Label>Rubric</Label>
                      <Textarea
                        readOnly
                        value={assignment?.rubric_text || 'No rubric provided'}
                        className="mt-1 resize-none"
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                    <CardDescription>Overview of submissions.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Total Submissions</Label>
                        <p className="text-sm font-medium">{submissions.length}</p>
                      </div>
                      <div>
                        <Label>AI Graded</Label>
                        <p className="text-sm font-medium">{submissions.filter(sub => sub.status === 'ai_graded').length}</p>
                      </div>
                      <div>
                        <Label>Finalized</Label>
                        <p className="text-sm font-medium">{submissions.filter(sub => sub.status === 'finalized').length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Total Submissions</CardTitle>
                      <CardDescription>All student submissions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{submissions.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Needs Grading</CardTitle>
                      <CardDescription>Submissions awaiting AI grading.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{submissions.filter(sub => sub.status === 'pending').length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Graded</CardTitle>
                      <CardDescription>Submissions graded by AI.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{submissions.filter(sub => sub.status === 'ai_graded').length}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add Submission
                  </Button>
                  <Button
                    onClick={handleBatchGrade}
                    disabled={submissions.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Brain className="w-4 h-4" />
                    Grade All Submissions
                  </Button>
                  
                  <Button
                    onClick={() => setShowFinalizationModal(true)}
                    disabled={getFinalizableSubmissions().length === 0}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Finalize Submissions ({getFinalizableSubmissions().length})
                  </Button>
                </div>

                {/* Submissions List */}
                <SubmissionsList
                  submissions={submissions}
                  onGradeSubmission={handleGradeSubmission}
                  onViewSubmission={handleViewSubmission}
                />
              </div>
            </div>

            {/* Create Submission Modal */}
            <CreateSubmissionModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSubmit={handleCreateSubmission}
              isLoading={isSubmitting}
            />

            {/* Batch Processing Modal */}
            <BatchProcessingModal
              isOpen={showBatchModal}
              onClose={() => setShowBatchModal(false)}
              statuses={batchStatuses}
              result={batchResult}
              isProcessing={isBatchProcessing}
            />
          </>
        )}

        {/* Finalization Modal */}
        <FinalizationModal
          isOpen={showFinalizationModal}
          onClose={() => setShowFinalizationModal(false)}
          submissions={getFinalizableSubmissions()}
          onFinalized={handleFinalization}
        />
      </div>
    </div>
  );
};

export default AssignmentDetail;
