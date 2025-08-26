import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Save, MessageSquare, Trash2, Edit3 } from 'lucide-react';
import { generatePDF, generateStudentVersion } from '@/lib/pdfExport';
import { useToast } from '@/hooks/use-toast';

interface TeacherComment {
  id: string;
  text_start: number;
  text_end: number;
  comment_text: string;
  comment_type: 'positive' | 'negative' | 'neutral';
  created_at: string;
}

interface AIComment {
  text: string;
  comment: string;
  category?: string;
}

interface TeacherGradingPanelProps {
  teacherComments: TeacherComment[];
  aiComments: AIComment[];
  overallFeedback: string;
  suggestedGrade: string;
  teacherFinalGrade?: string;
  teacherNotes?: string;
  studentName: string;
  assignmentTitle: string;
  essay: string;
  submissionId?: string;
  onSaveGrade: (grade: string, notes: string) => void;
  onDeleteComment: (commentId: string) => void;
  onEditComment: (comment: TeacherComment) => void;
}

export const TeacherGradingPanel: React.FC<TeacherGradingPanelProps> = ({
  teacherComments,
  aiComments,
  overallFeedback,
  suggestedGrade,
  teacherFinalGrade,
  teacherNotes,
  studentName,
  assignmentTitle,
  essay,
  submissionId,
  onSaveGrade,
  onDeleteComment,
  onEditComment
}) => {
  const [finalGrade, setFinalGrade] = useState(teacherFinalGrade || '');
  const [notes, setNotes] = useState(teacherNotes || '');
  const { toast } = useToast();

  const handleSaveGrade = async () => {
    await onSaveGrade(finalGrade, notes);
    toast({
      title: "Grade saved!",
      description: "Teacher grade and notes have been saved.",
    });
  };

  const handleExportPDF = (submissionId?: string) => {
    if (!submissionId) {
      toast({
        title: "Export Error",
        description: "No submission ID available",
        variant: "destructive",
      });
      return;
    }

    // Open the PDF route in a new window for printing
    const pdfUrl = `/pdf/submission/${submissionId}`;
    window.open(pdfUrl, '_blank');
    
    toast({
      title: "PDF Ready",
      description: "PDF opened in new tab - use your browser's print function to save",
    });
  };

  const handleExportStudentVersion = (submissionId?: string) => {
    if (!submissionId) {
      toast({
        title: "Export Error",
        description: "No submission ID available",
        variant: "destructive",
      });
      return;
    }

    // Open the PDF route in a new window for printing
    const pdfUrl = `/pdf/submission/${submissionId}`;
    window.open(pdfUrl, '_blank');
    
    toast({
      title: "Student PDF Ready",
      description: "PDF opened in new tab - use your browser's print function to save",
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Teacher Comments Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Teacher Comments ({teacherComments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teacherComments.length === 0 ? (
            <p className="text-gray-500 text-sm">No teacher comments yet. Select text in the essay to add comments.</p>
          ) : (
            <div className="space-y-3">
              {teacherComments.map((comment, index) => (
                <div key={comment.id} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getTypeColor(comment.comment_type)}>
                          {comment.comment_type}
                        </Badge>
                        <span className="text-xs text-gray-500">Comment #{index + 1}</span>
                      </div>
                      <p className="text-sm">{comment.comment_text}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditComment(comment)}
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteComment(comment.id)}
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Final Grade and Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher Final Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Final Grade</label>
            <Select value={finalGrade} onValueChange={setFinalGrade}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={`AI suggests: ${suggestedGrade}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">A+ (97-100)</SelectItem>
                <SelectItem value="A">A (93-96)</SelectItem>
                <SelectItem value="A-">A- (90-92)</SelectItem>
                <SelectItem value="B+">B+ (87-89)</SelectItem>
                <SelectItem value="B">B (83-86)</SelectItem>
                <SelectItem value="B-">B- (80-82)</SelectItem>
                <SelectItem value="C+">C+ (77-79)</SelectItem>
                <SelectItem value="C">C (73-76)</SelectItem>
                <SelectItem value="C-">C- (70-72)</SelectItem>
                <SelectItem value="D+">D+ (67-69)</SelectItem>
                <SelectItem value="D">D (63-66)</SelectItem>
                <SelectItem value="D-">D- (60-62)</SelectItem>
                <SelectItem value="F">F (0-59)</SelectItem>
              </SelectContent>
            </Select>
            {suggestedGrade && (
              <p className="text-xs text-gray-500 mt-1">AI suggested grade: {suggestedGrade}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Teacher Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your overall assessment and notes..."
              className="mt-1"
              rows={4}
            />
          </div>

          <Button onClick={handleSaveGrade} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Save Grade & Notes
          </Button>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={() => handleExportPDF(submissionId)} variant="outline" className="w-full">
            <FileDown className="w-4 h-4 mr-2" />
            Export Full PDF (Teacher Version)
          </Button>
          <Button onClick={() => handleExportStudentVersion(submissionId)} variant="outline" className="w-full">
            <FileDown className="w-4 h-4 mr-2" />
            Export Student-Friendly PDF
          </Button>
          <p className="text-xs text-gray-500">
            Teacher version includes all comments and internal notes. 
            Student version excludes internal teacher notes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};