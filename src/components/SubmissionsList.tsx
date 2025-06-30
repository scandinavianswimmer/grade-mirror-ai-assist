
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical, ExternalLink, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileText } from 'lucide-react';
import { finalizeSubmission } from '@/lib/finalizationApi';

interface SubmissionsListProps {
  submissions: any[];
  onGradeSubmission: (submissionId: string) => void;
  onViewSubmission: (submissionId: string) => void;
}

const SubmissionsList = ({ submissions, onGradeSubmission, onViewSubmission }: SubmissionsListProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submissionIdToDelete, setSubmissionIdToDelete] = useState<string | null>(null);

  const [finalScore, setFinalScore] = useState<string>('');
  const [submissionIdToUpdate, setSubmissionIdToUpdate] = useState<string | null>(null);

  const handleDeleteSubmission = async () => {
    if (!submissionIdToDelete) return;

    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('id', submissionIdToDelete);

    if (error) {
      toast({
        title: "Error deleting submission",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Submission deleted",
        description: "Submission has been deleted successfully.",
      });
      // Refresh submissions list or update state accordingly
      window.location.reload();
    }

    setOpen(false);
    setSubmissionIdToDelete(null);
  };

  const handleOpenDeleteDialog = (submissionId: string) => {
    setSubmissionIdToDelete(submissionId);
    setOpen(true);
  };

  const handleUpdateFinalScore = async () => {
    if (!submissionIdToUpdate) return;

    const parsedScore = parseFloat(finalScore);
    if (isNaN(parsedScore)) {
      toast({
        title: "Invalid score",
        description: "Please enter a valid number for the final score.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('submissions')
      .update({ final_score: parsedScore })
      .eq('id', submissionIdToUpdate);

    if (error) {
      toast({
        title: "Error updating final score",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Final score updated",
        description: "Final score has been updated successfully.",
      });
      window.location.reload();
    }
    setSubmissionIdToUpdate(null);
    setFinalScore('');
  };

  const handleOpenScoreDialog = (submissionId: string) => {
    setSubmissionIdToUpdate(submissionId);
  };

  const handleExportSubmission = async (submissionId: string, format: 'pdf' | 'docx' = 'pdf') => {
    try {
      const { data, error } = await supabase.functions.invoke('export-graded-pdf', {
        body: {
          submissionId,
          includeComments: true,
          format
        }
      });

      if (error) throw error;

      // Create download link
      const blob = new Blob([data], { 
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `graded_submission.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Submission exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <CardHeader>
        <CardTitle>Submissions</CardTitle>
        <CardDescription>
          Here are the submissions for this assignment
        </CardDescription>
      </CardHeader>

      <div className="space-y-3">
        {submissions.map((submission) => (
          <Card key={submission.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{submission.student_name}</CardTitle>
                  <CardDescription>
                    {submission.status === "pending" ? "Awaiting AI Grading" : submission.status === "ai_graded" ? "AI Graded" : submission.status === "finalized" ? "Finalized" : "Graded"}
                  </CardDescription>
                  {submission.ai_grade && (
                    <Badge variant="secondary">AI Grade: {submission.ai_grade}</Badge>
                  )}
                  {submission.final_score && (
                    <Badge variant="default">Final Score: {submission.final_score}</Badge>
                  )}
                  {submission.canvas_submission_id && (
                    <Badge variant="outline">
                      <a
                        href={`https://canvas.instructure.com/courses/2447178/assignments/${submission.assignment_id}/submissions/${submission.canvas_submission_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        View in Canvas
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    </Badge>
                  )}
                  {submission.status === "pushed_to_lms" && (
                    <Badge variant="default" className="flex items-center bg-green-500 hover:bg-green-600">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Pushed to LMS
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {submission.status === "pending" && (
                  <Button variant="secondary" size="sm" disabled>
                    Grading...
                  </Button>
                )}
                {submission.status !== "pending" && (
                  <Button variant="outline" size="sm" onClick={() => onViewSubmission(submission.id)}>
                    View
                  </Button>
                )}
                {submission.status !== "finalized" && (
                  <Button variant="default" size="sm" onClick={() => onGradeSubmission(submission.id)}>
                    Grade Now
                  </Button>
                )}
                {submission.final_score === null && submission.status === "finalized" && (
                  <Button variant="ghost" size="sm" onClick={() => handleOpenScoreDialog(submission.id)}>
                    Add Score
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete
                        the submission from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteSubmission}>
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {(submission.status === 'ai_graded' || submission.status === 'finalized') && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleExportSubmission(submission.id, 'pdf')}>
                        <FileText className="w-4 h-4 mr-2" />
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportSubmission(submission.id, 'docx')}>
                        <FileText className="w-4 h-4 mr-2" />
                        Export as DOCX
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              submission from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSubmission}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {submissionIdToUpdate && (
        <AlertDialog open={!!submissionIdToUpdate} onOpenChange={() => setSubmissionIdToUpdate(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Update Final Score</AlertDialogTitle>
              <AlertDialogDescription>
                Enter the final score for this submission.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center space-x-4">
                <Label htmlFor="score">Final Score:</Label>
                <Input
                  type="number"
                  id="score"
                  placeholder="Enter score"
                  value={finalScore}
                  onChange={(e) => setFinalScore(e.target.value)}
                />
              </div>
            </CardContent>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSubmissionIdToUpdate(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleUpdateFinalScore}>
                Update Score
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default SubmissionsList;
