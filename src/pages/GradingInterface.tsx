import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface Submission {
  id: string;
  assignment_id: string;
  student_name: string;
  essay: string;
  feedback_json?: any;
}

interface Assignment {
  id: string;
  title: string;
}

const GradingInterface = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<number>>(new Set());
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<number>>(new Set());

  const highlightColors = [
    'bg-yellow-200 hover:bg-yellow-300',
    'bg-cyan-200 hover:bg-cyan-300', 
    'bg-lime-200 hover:bg-lime-300',
    'bg-pink-200 hover:bg-pink-300'
  ];

  const borderColors = [
    'border-l-yellow-400',
    'border-l-cyan-400',
    'border-l-lime-400', 
    'border-l-pink-400'
  ];

  useEffect(() => {
    if (id && user) {
      fetchSubmissionData();
    }
  }, [id, user]);

  const fetchSubmissionData = async () => {
    try {
      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (submissionError) throw submissionError;
      setSubmission(submissionData);

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

  const handleTeacherAction = async (index: number, action: 'accept' | 'dismiss') => {
    try {
      const suggestion = submission?.feedback_json?.rubricBreakdown?.[index];
      if (!suggestion || !submission || !user) return;

      await supabase
        .from('teacher_edits')
        .insert({
          user_id: user.id,
          submission_id: submission.id,
          comment_id: `suggestion-${index}`,
          action_type: action,
          comment_text: suggestion.commentSuggestion
        });

      if (action === 'accept') {
        setAcceptedSuggestions(prev => new Set([...prev, index]));
        setDismissedSuggestions(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
      } else {
        setDismissedSuggestions(prev => new Set([...prev, index]));
        setAcceptedSuggestions(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
      }

      toast({
        title: `Suggestion ${action}ed`,
        description: `The feedback suggestion has been ${action}ed.`,
      });

    } catch (error) {
      console.error('Error logging teacher action:', error);
      toast({
        title: "Error",
        description: "Failed to save your action.",
        variant: "destructive"
      });
    }
  };

  const renderEssayWithHighlights = () => {
    if (!submission?.essay || !submission?.feedback_json?.rubricBreakdown) {
      return <div className="prose max-w-none">{submission?.essay}</div>;
    }

    let highlightedText = submission.essay;
    const breakdown = submission.feedback_json.rubricBreakdown;
    
    breakdown.forEach((item, index) => {
      const commentId = `comment-${index}`;
      const isHovered = hoveredCommentId === commentId;
      const colorClass = highlightColors[index % highlightColors.length];
      const hoverClass = isHovered ? colorClass.split(' ')[1] : colorClass.split(' ')[0];
      
      const highlightClass = `cursor-pointer transition-all duration-200 px-1 py-0.5 rounded ${hoverClass}`;
      
      if (item.evidenceQuote && highlightedText.includes(item.evidenceQuote)) {
        highlightedText = highlightedText.replace(
          item.evidenceQuote,
          `<span class="${highlightClass}" data-comment-id="${commentId}">${item.evidenceQuote}</span>`
        );
      }
    });

    return (
      <div 
        className="prose max-w-none leading-relaxed"
        dangerouslySetInnerHTML={{ 
          __html: highlightedText.replace(/\n/g, '</p><p class="mb-4">').replace(/^/, '<p class="mb-4">').replace(/$/, '</p>')
        }}
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg font-medium">Loading grading interface...</div>
      </div>
    );
  }

  if (!submission || !assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-red-600 mb-4">Submission not found</div>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const suggestions = submission.feedback_json?.rubricBreakdown || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{assignment.title}</h1>
            <p className="text-sm text-gray-600 mt-1">Student: {submission.student_name}</p>
          </div>
          <Button size="lg" className="px-6">
            <FileText className="w-4 h-4 mr-2" />
            Finalize & Export
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6 p-6 max-w-7xl mx-auto">
        {/* Left Column - Essay Editor Panel (65%) */}
        <div className="col-span-8">
          <Card className="h-full shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Student Essay
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-250px)] overflow-y-auto">
              {renderEssayWithHighlights()}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - AI Suggestions Panel (35%) */}
        <div className="col-span-4">
          <Card className="h-full shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>AI Feedback Suggestions</span>
                <Badge variant="secondary" className="ml-2">
                  {suggestions.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-250px)] overflow-y-auto space-y-4">
              {suggestions.map((suggestion, index) => {
                const commentId = `comment-${index}`;
                const isHovered = hoveredCommentId === commentId;
                const isAccepted = acceptedSuggestions.has(index);
                const isDismissed = dismissedSuggestions.has(index);
                const borderColor = borderColors[index % borderColors.length];
                
                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 transition-all duration-200 cursor-pointer ${
                      isHovered 
                        ? 'border-blue-300 shadow-md bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    } ${
                      isAccepted ? 'bg-green-50 border-green-200' : 
                      isDismissed ? 'bg-gray-50 border-gray-300 opacity-60' : ''
                    }`}
                    onMouseEnter={() => setHoveredCommentId(commentId)}
                    onMouseLeave={() => setHoveredCommentId(null)}
                  >
                    {/* Category Title */}
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      {suggestion.criterion}
                    </div>
                    
                    {/* Suggested Comment */}
                    <div className="text-sm text-gray-900 mb-3 leading-relaxed">
                      {suggestion.commentSuggestion}
                    </div>
                    
                    {/* Quoted Text */}
                    <blockquote className={`text-xs text-gray-600 italic border-l-4 pl-3 py-2 mb-3 bg-gray-50 ${borderColor}`}>
                      "{suggestion.evidenceQuote}"
                    </blockquote>
                    
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant={isAccepted ? "default" : "outline"}
                        onClick={() => handleTeacherAction(index, 'accept')}
                        disabled={isDismissed}
                        className="text-xs px-3"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant={isDismissed ? "secondary" : "outline"}
                        onClick={() => handleTeacherAction(index, 'dismiss')}
                        disabled={isAccepted}
                        className="text-xs px-3"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {suggestions.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">No AI suggestions available</div>
                  <p className="text-sm text-gray-400">Generate AI feedback to see suggestions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GradingInterface;