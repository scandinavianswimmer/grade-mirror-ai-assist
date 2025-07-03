import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Brain, Loader2, FileText, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { generateGradingFeedback, type GradingResponse } from '@/lib/geminiApi';
import { getTextFromStoredFile } from '@/lib/fileProcessing';

interface Submission {
  id: string;
  assignment_id: string;
  student_name: string;
  essay: string;
  file_url: string;
  submission_storage_path?: string;
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
  const [extractingText, setExtractingText] = useState(false);
  const [aiResponse, setAiResponse] = useState<GradingResponse | null>(null);
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);

  useEffect(() => {
    if (id && user) {
      fetchSubmissionData();
    }
  }, [id, user]);

  useEffect(() => {
    // Auto-extract text if we have a file but no essay content
    if (submission && submission.submission_storage_path && (!submission.essay || submission.essay.includes('[File'))) {
      console.log('Auto-extracting text for submission:', {
        id: submission.id,
        storagePath: submission.submission_storage_path,
        currentEssay: submission.essay?.substring(0, 100)
      });
      handleExtractText();
    }
  }, [submission]);

  useEffect(() => {
    // Auto-generate AI feedback if we have essay content but no AI response
    if (submission && submission.essay && !submission.essay.includes('[File') && !aiResponse && !generating) {
      console.log('Auto-generating AI feedback for extracted text');
      handleGenerateAIFeedback();
    }
  }, [submission?.essay, aiResponse]);

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

  const handleExtractText = async () => {
    if (!submission?.submission_storage_path) {
      console.log('No storage path found:', submission);
      return;
    }

    console.log('Starting text extraction for:', submission.submission_storage_path);
    setExtractingText(true);
    try {
      const extractedText = await getTextFromStoredFile(submission.submission_storage_path);
      console.log('Extracted text length:', extractedText?.length);
      console.log('Extracted text preview:', extractedText?.substring(0, 200));
      
      if (extractedText && extractedText.trim()) {
        // Update the submission in the database
        const { error: updateError } = await supabase
          .from('submissions')
          .update({ essay: extractedText })
          .eq('id', submission.id);

        if (updateError) {
          console.error('Error updating submission:', updateError);
          throw updateError;
        }

        // Update local state
        setSubmission(prev => prev ? { ...prev, essay: extractedText } : null);

        toast({
          title: "Text extracted successfully!",
          description: `Extracted ${extractedText.length} characters from the document.`,
        });
      } else {
        console.warn('No text extracted or empty text');
        toast({
          title: "No text found",
          description: "The document appears to be empty or text extraction failed.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      toast({
        title: "Text extraction failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setExtractingText(false);
    }
  };

  const handleGenerateAIFeedback = async () => {
    if (!submission || !assignment || !user) return;

    // If we don't have essay content, try to use the example text for demo
    let essayContent = submission.essay;
    if (!essayContent || essayContent.includes('[File')) {
      console.log('No essay content found, check if we should extract text first');
      toast({
        title: "No essay content",
        description: "Please extract text from the document first.",
        variant: "destructive"
      });
      return;
    }

    console.log('Generating AI feedback for essay:', essayContent.substring(0, 100) + '...');
    setGenerating(true);
    try {
      const response = await generateGradingFeedback(
        essayContent,
        assignment.rubric_text || '',
        user.id
      );

      console.log('AI Response received:', response);
      setAiResponse(response);

      // Save AI response to database
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          ai_grade: response.suggestedGrade,
          ai_feedback: response.overallFeedback,
          feedback_json: response as any,
          status: 'ai_graded'
        })
        .eq('id', submission.id);

      if (updateError) {
        console.error('Error saving AI response:', updateError);
      }

      toast({
        title: "AI feedback generated!",
        description: `Generated ${response.inlineComments?.length || 0} comments with ${Math.round(response.confidence * 100)}% confidence`,
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
    console.log('Rendering essay, current state:', {
      hasEssay: !!submission?.essay,
      essayLength: submission?.essay?.length,
      essayPreview: submission?.essay?.substring(0, 100),
      hasStoragePath: !!submission?.submission_storage_path,
      storagePath: submission?.submission_storage_path
    });

    if (!submission?.essay || submission.essay.trim() === '' || submission.essay.includes('[File')) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            {submission?.submission_storage_path 
              ? 'Document uploaded but text not extracted yet.'
              : 'No essay content available.'
            }
          </p>
          {submission?.submission_storage_path && (
            <div className="space-y-2">
              <p className="text-sm text-gray-400 mb-2">
                Storage path: {submission.submission_storage_path}
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Current essay field: {submission.essay ? `"${submission.essay.substring(0, 100)}..."` : 'null/empty'}
              </p>
              <Button 
                onClick={handleExtractText}
                disabled={extractingText}
                variant="outline"
                size="lg"
              >
                {extractingText ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Extracting Text...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Extract Text from Document
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (!aiResponse?.inlineComments) {
      return (
        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap">{submission.essay}</p>
        </div>
      );
    }

    let highlightedText = submission.essay;
    
    // Apply highlights for each inline comment
    aiResponse.inlineComments.forEach((comment, index) => {
      const commentId = `comment-${index}`;
      const isHovered = hoveredCommentId === commentId;
      const highlightClass = `cursor-pointer transition-all duration-200 border-b-2 ${
        isHovered 
          ? 'bg-yellow-200 border-yellow-500 shadow-md' 
          : 'bg-yellow-100 border-yellow-400 hover:bg-yellow-200'
      }`;
      
      highlightedText = highlightedText.replace(
        comment.text,
        `<span class="${highlightClass}" data-comment-id="${commentId}" title="${comment.comment}" onmouseenter="this.style.backgroundColor='rgb(254 240 138)'" onmouseleave="this.style.backgroundColor='rgb(254 249 195)'">${comment.text}</span>`
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

          {/* Comments Panel */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Areas for Comments
                  {aiResponse?.inlineComments && (
                    <Badge variant="secondary" className="ml-2">
                      {aiResponse.inlineComments.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiResponse?.inlineComments && aiResponse.inlineComments.length > 0 ? (
                  <div className="space-y-4">
                    {aiResponse.inlineComments.map((comment, index) => {
                      const commentId = `comment-${index}`;
                      return (
                        <HoverCard key={index}>
                          <HoverCardTrigger asChild>
                            <div 
                              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                                hoveredCommentId === commentId 
                                  ? 'bg-yellow-50 border-yellow-300 shadow-md' 
                                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                              }`}
                              onMouseEnter={() => setHoveredCommentId(commentId)}
                              onMouseLeave={() => setHoveredCommentId(null)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-600 mb-2">
                                    "{comment.text.length > 60 ? comment.text.substring(0, 60) + '...' : comment.text}"
                                  </div>
                                  <div className="text-sm text-gray-800">
                                    {comment.comment}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold">Full Text Excerpt</h4>
                              <p className="text-sm text-gray-600 italic">"{comment.text}"</p>
                              <h4 className="text-sm font-semibold">Suggested Comment</h4>
                              <p className="text-sm">{comment.comment}</p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No comments generated yet</p>
                    <p className="text-sm text-gray-400">Generate AI feedback to see suggested comments</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;