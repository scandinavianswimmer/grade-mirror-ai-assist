import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X, FileText, BarChart3, Target, Star } from 'lucide-react';
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
  ai_feedback?: string;
  ai_score?: number;
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
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);

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
      const suggestionItem = submission?.feedback_json?.rubricBreakdown?.[index];
      if (!suggestionItem || !submission || !user) return;

      await supabase
        .from('teacher_edits')
        .insert({
          user_id: user.id,
          submission_id: submission.id,
          comment_id: `suggestion-${index}`,
          action_type: action,
          comment_text: suggestionItem.commentSuggestion
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
    if (!submission?.essay || suggestionsList.length === 0) {
      return (
        <div className="prose max-w-none text-gray-800 leading-7 font-light text-base">
          {submission?.essay?.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-6 first:mt-0">{paragraph}</p>
          ))}
        </div>
      );
    }

    let highlightedText = submission.essay;
    
    suggestionsList.forEach((item: any, index: number) => {
      const commentId = `comment-${index}`;
      const isSelected = selectedSuggestion === index;
      const isHovered = hoveredCommentId === commentId;
      
      const getUnderlineColor = (criterion: string) => {
        switch (criterion?.toLowerCase()) {
          case 'grammar': return 'decoration-red-500';
          case 'clarity': return 'decoration-blue-500';
          case 'structure': return 'decoration-green-500';
          default: return 'decoration-purple-500';
        }
      };
      
      const underlineClass = `underline ${getUnderlineColor(item.criterion)} decoration-2 underline-offset-2 cursor-pointer transition-all duration-200`;
      const hoverClass = isHovered || isSelected ? 'bg-blue-50' : '';
      
      if (item.evidenceQuote && highlightedText.includes(item.evidenceQuote)) {
        highlightedText = highlightedText.replace(
          item.evidenceQuote,
          `<span class="${underlineClass} ${hoverClass}" data-comment-id="${commentId}" data-suggestion-index="${index}">${item.evidenceQuote}</span>`
        );
      }
    });

    return (
      <div 
        className="prose max-w-none text-gray-800 leading-7 font-light text-base"
        dangerouslySetInnerHTML={{ 
          __html: highlightedText.replace(/\n/g, '</p><p class="mb-6">').replace(/^/, '<p class="mb-6 first:mt-0">').replace(/$/, '</p>')
        }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          const suggestionIndex = target.getAttribute('data-suggestion-index');
          if (suggestionIndex) {
            setSelectedSuggestion(parseInt(suggestionIndex));
          }
        }}
        onMouseOver={(e) => {
          const target = e.target as HTMLElement;
          const commentId = target.getAttribute('data-comment-id');
          if (commentId) {
            setHoveredCommentId(commentId);
          }
        }}
        onMouseOut={() => setHoveredCommentId(null)}
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg font-medium text-gray-700">Loading grading interface...</div>
      </div>
    );
  }

  if (!submission || !assignment) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-red-600 mb-4">Submission not found</div>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Parse feedback data correctly - handle both ai_feedback and feedback_json formats
  let suggestionsList = [];
  let parsedFeedback = null;
  
  // Try to get feedback from ai_feedback field first (properly formatted JSON)
  if (submission.ai_feedback) {
    try {
      parsedFeedback = JSON.parse(submission.ai_feedback.replace(/```json\n|\n```/g, ''));
      suggestionsList = parsedFeedback.rubricBreakdown || [];
    } catch (error) {
      console.error('Error parsing ai_feedback:', error);
    }
  }
  
  // Fallback to feedback_json if no ai_feedback or rubricBreakdown is empty
  if (suggestionsList.length === 0 && submission.feedback_json) {
    // Check if overallFeedback contains JSON string
    if (submission.feedback_json.overallFeedback && submission.feedback_json.overallFeedback.includes('rubricBreakdown')) {
      try {
        const jsonContent = submission.feedback_json.overallFeedback.replace(/```json\n|\n```/g, '');
        parsedFeedback = JSON.parse(jsonContent);
        suggestionsList = parsedFeedback.rubricBreakdown || [];
      } catch (error) {
        console.error('Error parsing feedback_json.overallFeedback:', error);
      }
    } else {
      suggestionsList = submission.feedback_json.rubricBreakdown || [];
    }
  }
  
  // Calculate issue counts by category
  const issueCategories = {
    'GRAMMAR': { color: 'text-red-600', count: 0 },
    'CLARITY': { color: 'text-blue-600', count: 0 },
    'ORGANIZATION': { color: 'text-green-600', count: 0 },
    'ANALYSIS': { color: 'text-purple-600', count: 0 },
    'THESIS': { color: 'text-orange-600', count: 0 },
    'USE OF EVIDENCE': { color: 'text-pink-600', count: 0 }
  };

  suggestionsList.forEach((suggestion: any) => {
    const category = suggestion.criterion || 'ANALYSIS';
    if (issueCategories[category as keyof typeof issueCategories]) {
      issueCategories[category as keyof typeof issueCategories].count++;
    }
  });

  const totalIssues = Object.values(issueCategories).reduce((sum, cat) => sum + cat.count, 0);
  const overallScore = submission?.ai_score || parsedFeedback?.confidence ? Math.round((parsedFeedback.confidence * 100)) : 85;

  return (
    <div className="min-h-screen bg-white">
      {/* Grammarly-style Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-medium text-gray-900">{assignment.title}</h1>
            <div className="text-sm text-gray-500">Student: {submission.student_name}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">{submission.essay?.split(' ').length || 0} words</div>
            <Button size="sm" variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Main Grammarly-style Layout */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Essay Content - Grammarly Style */}
        <div className="flex-1 max-w-4xl mx-auto px-12 py-8 overflow-y-auto">
          <div className="max-w-3xl">
            {renderEssayWithHighlights()}
          </div>
        </div>

        {/* Right Sidebar - Grammarly Style */}
        <div className="w-80 border-l border-gray-200 bg-gray-50/50 flex flex-col">
          {/* Overall Score Section */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
                <div className="text-2xl font-bold text-green-700">{overallScore}</div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Overall Score</div>
              <div className="text-xs text-gray-500">Good work! Your writing is clear and engaging.</div>
            </div>
          </div>

          {/* Goals Section */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Goals</span>
              </div>
              <select className="text-xs border border-gray-300 rounded px-2 py-1">
                <option>Academic</option>
                <option>Business</option>
                <option>Creative</option>
              </select>
            </div>
          </div>

          {/* Issue Categories */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Issues Found</span>
              <Badge variant="secondary" className="text-xs">{totalIssues}</Badge>
            </div>
            <div className="space-y-2">
              {Object.entries(issueCategories).map(([category, data]) => (
                <div key={category} className="flex justify-between items-center text-xs">
                  <span className={data.color}>{category}</span>
                  <span className="text-gray-500">{data.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Premium Suggestions */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-gray-700">Premium Suggestions</span>
            </div>
            <div className="text-xs text-gray-600 mb-3">
              Unlock {suggestionsList.length} advanced writing suggestions
            </div>
            <Button size="sm" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">
              Try Premium
            </Button>
          </div>

          {/* Suggestions List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {suggestionsList.map((suggestion, index) => {
              const isSelected = selectedSuggestion === index;
              const isAccepted = acceptedSuggestions.has(index);
              const isDismissed = dismissedSuggestions.has(index);
              
              return (
                <div
                  key={index}
                  className={`border rounded-lg p-3 transition-all duration-200 cursor-pointer ${
                    isSelected 
                      ? 'border-blue-400 shadow-sm bg-blue-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  } ${
                    isAccepted ? 'bg-green-50 border-green-300' : 
                    isDismissed ? 'bg-gray-100 border-gray-300 opacity-60' : ''
                  }`}
                  onClick={() => setSelectedSuggestion(index)}
                >
                  <div className="text-xs font-medium text-gray-600 uppercase mb-1">
                    {suggestion.criterion}
                  </div>
                  <div className="text-sm text-gray-900 mb-2 leading-relaxed">
                    {suggestion.commentSuggestion}
                  </div>
                  
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600 italic mb-3 p-2 bg-gray-50 rounded">
                        "{suggestion.evidenceQuote}"
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={isAccepted ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTeacherAction(index, 'accept');
                          }}
                          disabled={isDismissed}
                          className="text-xs flex-1"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant={isDismissed ? "secondary" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTeacherAction(index, 'dismiss');
                          }}
                          disabled={isAccepted}
                          className="text-xs flex-1"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {suggestionsList.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-2">No suggestions available</div>
                <p className="text-xs text-gray-400">Generate AI feedback to see suggestions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradingInterface;