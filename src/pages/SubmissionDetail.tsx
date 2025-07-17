import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Brain, Loader2, FileText, MessageSquare, Check, X, Target, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const [suggestionsList, setSuggestionsList] = useState<any[]>([]);
  const [selectedCommentIndex, setSelectedCommentIndex] = useState<number | null>(null);
  const [teacherActions, setTeacherActions] = useState<{[key: string]: 'approved' | 'declined' | 'modified'}>({});
  const [activeCommentPopup, setActiveCommentPopup] = useState<{index: number, position: {x: number, y: number}} | null>(null);
  const [modifyingComment, setModifyingComment] = useState<number | null>(null);
  const [modifiedText, setModifiedText] = useState<string>('');

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
        const aiData = submissionData.feedback_json as unknown as GradingResponse;
        setAiResponse(aiData);
        setSuggestionsList(aiData.inlineComments || []);
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
      setSuggestionsList(response.inlineComments || []);

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

  // Handle teacher actions on suggestions
  const handleTeacherAction = async (index: number, action: 'approved' | 'declined' | 'modified', modifiedComment?: string) => {
    if (!user || !submission) return;

    try {
      // Update local state
      setTeacherActions(prev => ({
        ...prev,
        [index]: action
      }));

      // Update modified comment if provided
      if (action === 'modified' && modifiedComment) {
        setSuggestionsList(prev => prev.map((suggestion, i) => 
          i === index ? { ...suggestion, comment: modifiedComment } : suggestion
        ));
      }

      // Save to database
      const { error } = await supabase
        .from('teacher_edits')
        .insert({
          user_id: user.id,
          submission_id: submission.id,
          comment_id: index.toString(),
          action_type: action,
          comment_text: modifiedComment || suggestionsList[index]?.comment || ''
        });

      if (error) {
        console.error('Error saving teacher action:', error);
        toast({
          title: "Error saving action",
          description: "Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: `Comment ${action}`,
          description: `Successfully ${action} the suggestion.`,
        });
      }
      
      // Close popup and reset states
      setActiveCommentPopup(null);
      setModifyingComment(null);
      setModifiedText('');
    } catch (error) {
      console.error('Error handling teacher action:', error);
    }
  };

  const getColorForCategory = (category: string, action?: string) => {
    if (action === 'approved') return 'border-green-500 bg-green-100';
    if (action === 'declined') return 'border-gray-400 bg-gray-100 opacity-50';
    if (action === 'modified') return 'border-blue-500 bg-blue-100';
    
    const colors = {
      grammar: 'border-red-400 bg-red-50 hover:bg-red-100',
      clarity: 'border-blue-400 bg-blue-50 hover:bg-blue-100', 
      organization: 'border-green-400 bg-green-50 hover:bg-green-100',
      analysis: 'border-purple-400 bg-purple-50 hover:bg-purple-100',
      thesis: 'border-orange-400 bg-orange-50 hover:bg-orange-100',
      evidence: 'border-pink-400 bg-pink-50 hover:bg-pink-100'
    };
    return colors[category as keyof typeof colors] || 'border-gray-400 bg-gray-50 hover:bg-gray-100';
  };

  const renderEssayWithHighlights = () => {
    console.log('Rendering essay with highlights:', {
      hasEssay: !!submission?.essay,
      hasSuggestions: suggestionsList.length > 0,
      suggestionsCount: suggestionsList.length
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

    // Always show the essay content, even if no suggestions yet
    let highlightedText = submission.essay;
    
    // Apply color-coded highlights for each suggestion
    if (suggestionsList.length > 0) {
      // Sort suggestions by text length (longer first) to avoid overlap issues
      const sortedSuggestions = [...suggestionsList]
        .map((suggestion, index) => ({ ...suggestion, originalIndex: index }))
        .filter(suggestion => suggestion.text && highlightedText.includes(suggestion.text))
        .sort((a, b) => (b.text?.length || 0) - (a.text?.length || 0));

      sortedSuggestions.forEach((suggestion) => {
        const index = suggestion.originalIndex;
        const category = suggestion.category || 'general';
        const action = teacherActions[index];
        const colorClass = getColorForCategory(category, action);
        
        // Create a unique identifier for this highlight
        const highlightId = `highlight-${index}`;
        
        const highlightClass = `cursor-pointer transition-all duration-200 border-b-2 px-1 py-0.5 rounded-sm ${colorClass}`;
        
        // Only replace if the exact text exists and hasn't been replaced yet
        if (highlightedText.includes(suggestion.text) && !highlightedText.includes(`data-comment-index="${index}"`)) {
          highlightedText = highlightedText.replace(
            suggestion.text,
            `<span 
              class="${highlightClass}" 
              data-comment-index="${index}"
              data-category="${category}"
              id="${highlightId}"
              title="Click to view comment: ${suggestion.comment?.substring(0, 50)}..."
            >${suggestion.text}</span>`
          );
        }
      });
    }

    return (
      <div className="relative">
        <div 
          className="prose max-w-none leading-relaxed text-base"
          dangerouslySetInnerHTML={{ 
            __html: highlightedText.replace(/\n/g, '<br/>').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
          }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            const commentIndex = target.getAttribute('data-comment-index');
            if (commentIndex) {
              const index = parseInt(commentIndex);
              setSelectedCommentIndex(index);
              
              // Get click position for popup
              const rect = target.getBoundingClientRect();
              setActiveCommentPopup({
                index,
                position: { x: rect.left + rect.width / 2, y: rect.bottom + 10 }
              });
            }
          }}
        />
        
        {/* Comment Popup */}
        {activeCommentPopup && (
          <div 
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm animate-fade-in"
            style={{
              left: `${activeCommentPopup.position.x}px`,
              top: `${activeCommentPopup.position.y}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {suggestionsList[activeCommentPopup.index]?.category || 'general'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setActiveCommentPopup(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <div>
                <p className="text-xs text-gray-600 mb-2 italic">
                  "{suggestionsList[activeCommentPopup.index]?.text?.substring(0, 50)}..."
                </p>
                
                {modifyingComment === activeCommentPopup.index ? (
                  <div className="space-y-2">
                    <textarea
                      value={modifiedText}
                      onChange={(e) => setModifiedText(e.target.value)}
                      className="w-full text-sm border rounded p-2 h-20 resize-none"
                      placeholder="Enter your modified comment..."
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleTeacherAction(activeCommentPopup.index, 'modified', modifiedText)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          setModifyingComment(null);
                          setModifiedText('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-800 mb-3">
                      {suggestionsList[activeCommentPopup.index]?.comment}
                    </p>
                    
                    {!teacherActions[activeCommentPopup.index] && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => handleTeacherAction(activeCommentPopup.index, 'approved')}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleTeacherAction(activeCommentPopup.index, 'declined')}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            setModifyingComment(activeCommentPopup.index);
                            setModifiedText(suggestionsList[activeCommentPopup.index]?.comment || '');
                          }}
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Modify
                        </Button>
                      </div>
                    )}
                    
                    {teacherActions[activeCommentPopup.index] && (
                      <div className="text-center">
                        <Badge variant={teacherActions[activeCommentPopup.index] === 'approved' ? 'default' : 'secondary'}>
                          {teacherActions[activeCommentPopup.index]}
                        </Badge>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
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

          {/* AI Suggestions Panel */}
          <div className="space-y-4">
            {/* Overall Score Card */}
            {aiResponse && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Overall Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">AI Confidence</span>
                      <Badge variant="outline">
                        {Math.round((aiResponse.confidence || 0) * 100)}%
                      </Badge>
                    </div>
                    {aiResponse.overallFeedback && (
                      <p className="text-sm text-gray-600 mt-2">
                        {aiResponse.overallFeedback}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suggestions List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Suggestions
                  {suggestionsList.length > 0 && (
                    <Badge variant="secondary">{suggestionsList.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-sm text-gray-600 mb-2">Click on highlighted text in the essay to review comments</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-red-400 bg-red-50 rounded-sm"></div>
                      <span className="text-xs text-gray-600">Grammar</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-blue-400 bg-blue-50 rounded-sm"></div>
                      <span className="text-xs text-gray-600">Clarity</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-green-400 bg-green-50 rounded-sm"></div>
                      <span className="text-xs text-gray-600">Organization</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-purple-400 bg-purple-50 rounded-sm"></div>
                      <span className="text-xs text-gray-600">Analysis</span>
                    </div>
                  </div>
                  
                  {suggestionsList.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {suggestionsList.length} comments available
                      </p>
                      <div className="flex justify-center gap-4 text-xs text-gray-600">
                        <span>
                          <span className="font-medium text-green-600">
                            {Object.values(teacherActions).filter(a => a === 'approved').length}
                          </span> approved
                        </span>
                        <span>
                          <span className="font-medium text-gray-600">
                            {Object.values(teacherActions).filter(a => a === 'declined').length}
                          </span> declined
                        </span>
                        <span>
                          <span className="font-medium text-blue-600">
                            {Object.values(teacherActions).filter(a => a === 'modified').length}
                          </span> modified
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;