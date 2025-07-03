import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Brain, Loader2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { generateGradingFeedback, type GradingResponse } from '@/lib/geminiApi';

interface Submission {
  id: string;
  assignment_id: string;
  student_name: string;
  essay: string;
  file_url: string;
  status: string;
  created_at: string;
  ai_feedback?: string;
  ai_grade?: string;
  feedback_json?: any;
}

interface Assignment {
  id: string;
  title: string;
  rubric_text?: string;
  description?: string;
}

const SubmissionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [aiResponse, setAiResponse] = useState<GradingResponse | null>(null);
  const [finalGrade, setFinalGrade] = useState('');
  const [finalFeedback, setFinalFeedback] = useState('');

  useEffect(() => {
    if (id && user) {
      fetchSubmissionData();
    }
  }, [id, user]);

  const fetchSubmissionData = async () => {
    try {
      // Fetch submission
      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (submissionError) throw submissionError;
      setSubmission(submissionData);
      setFinalGrade(submissionData.ai_grade || '');
      setFinalFeedback(submissionData.ai_feedback || '');

      // Parse existing AI response if available
      if (submissionData.feedback_json && typeof submissionData.feedback_json === 'object') {
        setAiResponse(submissionData.feedback_json as unknown as GradingResponse);
      }

      // Fetch assignment details
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', submissionData.assignment_id)
        .eq('user_id', user?.id)
        .single();

      if (assignmentError) throw assignmentError;
      setAssignment(assignmentData);

    } catch (error) {
      console.error('Error fetching submission:', error);
      toast({
        title: "Error loading submission",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAIFeedback = async () => {
    if (!submission || !assignment || !user) return;

    setGenerating(true);
    try {
      const response = await generateGradingFeedback(
        submission.essay || '',
        assignment.rubric_text || '',
        user.id
      );

      setAiResponse(response);
      setFinalGrade(response.suggestedGrade);
      setFinalFeedback(response.overallFeedback);

      // Save AI response to database
      await supabase
        .from('submissions')
        .update({
          ai_grade: response.suggestedGrade,
          ai_feedback: response.overallFeedback,
          feedback_json: response as any,
          status: 'ai_graded'
        })
        .eq('id', submission.id);

      toast({
        title: "AI feedback generated!",
        description: `Generated with ${Math.round(response.confidence * 100)}% confidence`,
      });

    } catch (error) {
      console.error('Error generating feedback:', error);
      toast({
        title: "Failed to generate feedback",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const renderEssayWithHighlights = () => {
    if (!submission?.essay || !aiResponse?.inlineComments) {
      return (
        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap">{submission?.essay || 'No essay content available.'}</p>
        </div>
      );
    }

    let highlightedText = submission.essay;
    
    // Apply highlights for each inline comment
    aiResponse.inlineComments.forEach((comment, index) => {
      const commentId = `comment-${index}`;
      const highlightClass = "bg-yellow-100 border-b-2 border-yellow-400 cursor-pointer hover:bg-yellow-200 transition-colors";
      
      highlightedText = highlightedText.replace(
        comment.text,
        `<span class="${highlightClass}" data-comment-id="${commentId}" title="${comment.comment}">${comment.text}</span>`
      );
    });

    return (
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ 
          __html: highlightedText.replace(/\n/g, '</p><p class="mb-4">').replace(/^/, '<p class="mb-4">').replace(/$/, '</p>')
        }}
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-lg font-medium">Loading submission...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!submission || !assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-lg font-medium text-red-600">Submission not found</div>
            <Link to="/dashboard">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to={`/assignment/${assignment.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Assignment
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{submission.student_name}</Badge>
                <Badge variant={submission.status === 'ai_graded' ? 'default' : 'secondary'}>
                  {submission.status.replace('_', ' ').toUpperCase()}
                </Badge>
                {aiResponse && (
                  <Badge className="bg-green-100 text-green-800">
                    AI Confidence: {Math.round(aiResponse.confidence * 100)}%
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Essay Content */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Student Essay
                  </CardTitle>
                  <Button 
                    onClick={handleGenerateAIFeedback}
                    disabled={generating}
                    variant={aiResponse ? "outline" : "default"}
                    size="sm"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        {aiResponse ? 'Regenerate' : 'Generate'} AI Feedback
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {renderEssayWithHighlights()}
              </CardContent>
            </Card>
          </div>

          {/* Feedback Panel */}
          <div className="space-y-6">
            {/* AI Grade and Feedback */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-600" />
                  AI Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="grade">Suggested Grade</Label>
                  <Input
                    id="grade"
                    value={finalGrade}
                    onChange={(e) => setFinalGrade(e.target.value)}
                    className="text-2xl font-bold text-center"
                    placeholder="No grade yet"
                  />
                </div>

                <div>
                  <Label htmlFor="feedback">Overall Feedback</Label>
                  <Textarea
                    id="feedback"
                    value={finalFeedback}
                    onChange={(e) => setFinalFeedback(e.target.value)}
                    rows={8}
                    placeholder="AI feedback will appear here..."
                  />
                </div>

                {aiResponse?.reasoning && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>AI Reasoning:</strong> {aiResponse.reasoning}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inline Comments Summary */}
            {aiResponse?.inlineComments && aiResponse.inlineComments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Inline Comments ({aiResponse.inlineComments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {aiResponse.inlineComments.map((comment, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-600 mb-1">
                          "{comment.text.substring(0, 50)}..."
                        </div>
                        <div className="text-sm text-gray-800">
                          {comment.comment}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;