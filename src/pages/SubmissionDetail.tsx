import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Brain, Loader2, FileText, MessageSquare, Check, X, Target, Edit3, RotateCcw, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { generateGradingFeedback, type GradingResponse } from '@/lib/geminiApi';
import { getTextFromStoredFile } from '@/lib/fileProcessing';
import { TeacherCommentModal } from '@/components/TeacherCommentModal';
import { TeacherGradingPanel } from '@/components/TeacherGradingPanel';

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
  teacher_final_grade?: string;
  teacher_notes?: string;
}

interface Assignment {
  id: string;
  title: string;
  rubric_text?: string;
  description?: string;
}

interface FeedbackTile {
  category: string;
  score: number;
  summary: string;
  details: string;
  examples: string[];
}

interface VocabularyCard {
  word: string;
  suggestions: string[];
  reason: string;
  position: number;
}

interface TeacherComment {
  id: string;
  text_start: number;
  text_end: number;
  comment_text: string;
  comment_type: 'positive' | 'negative' | 'neutral';
  created_at: string;
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
  const [essayText, setEssayText] = useState<string>('');
  const [liveFeedback, setLiveFeedback] = useState(false);
  const [expandedTiles, setExpandedTiles] = useState<{[key: string]: boolean}>({});
  const [overallScore, setOverallScore] = useState<number>(0);
  const [feedbackTiles, setFeedbackTiles] = useState<FeedbackTile[]>([]);
  const [vocabularyCards, setVocabularyCards] = useState<VocabularyCard[]>([]);
  
  // Teacher comment states
  const [teacherComments, setTeacherComments] = useState<TeacherComment[]>([]);
  const [selectedText, setSelectedText] = useState<string>('');
  const [textSelection, setTextSelection] = useState<{start: number, end: number} | null>(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<TeacherComment | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id && user) {
      fetchSubmissionData();
      fetchTeacherComments();
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

  useEffect(() => {
    if (submission?.essay) {
      setEssayText(submission.essay);
    }
  }, [submission]);

  useEffect(() => {
    if (aiResponse) {
      processAIResponse(aiResponse);
    }
  }, [aiResponse]);

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
        processAIResponse(aiData);
      } else if (submissionData.ai_feedback && typeof submissionData.ai_feedback === 'string') {
        // Handle legacy data that might have JSON wrapped in markdown
        try {
          let cleanedFeedback = submissionData.ai_feedback.trim();
          
          // Check if it contains JSON wrapped in markdown
          if (cleanedFeedback.includes('```json')) {
            cleanedFeedback = cleanedFeedback.replace(/^.*```json\s*/, '').replace(/\s*```.*$/, '');
          } else if (cleanedFeedback.includes('```')) {
            cleanedFeedback = cleanedFeedback.replace(/^.*```\s*/, '').replace(/\s*```.*$/, '');
          }
          
          // Remove any remaining backticks and try to parse
          cleanedFeedback = cleanedFeedback.replace(/^`+|`+$/g, '').trim();
          
          if (cleanedFeedback.startsWith('{') && cleanedFeedback.endsWith('}')) {
            const parsedData = JSON.parse(cleanedFeedback) as GradingResponse;
            setAiResponse(parsedData);
            setSuggestionsList(parsedData.inlineComments || []);
            processAIResponse(parsedData);
          }
        } catch (error) {
          console.log('Could not parse legacy AI feedback as JSON:', error);
          // If parsing fails, we'll just use the fallback text display
        }
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

  const fetchTeacherComments = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from('teacher_comments')
        .select('*')
        .eq('submission_id', id)
        .order('text_start', { ascending: true });

      if (error) throw error;
      setTeacherComments((data || []) as TeacherComment[]);
    } catch (error) {
      console.error('Error fetching teacher comments:', error);
    }
  };

  // Text selection handling for teacher comments
  const handleTextSelection = () => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!range.collapsed && range.toString().trim()) {
      const selectedText = range.toString().trim();
      
      // Calculate text positions
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editorRef.current);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      const textStart = preCaretRange.toString().length;
      const textEnd = textStart + selectedText.length;

      setSelectedText(selectedText);
      setTextSelection({ start: textStart, end: textEnd });
      setCommentModalOpen(true);
    }
  };

  // Teacher comment CRUD operations
  const handleSaveTeacherComment = async (commentData: Omit<TeacherComment, 'id' | 'created_at'>) => {
    if (!user || !submission) return;

    try {
      if (editingComment) {
        // Update existing comment
        const { error } = await supabase
          .from('teacher_comments')
          .update(commentData)
          .eq('id', editingComment.id);

        if (error) throw error;

        toast({
          title: "Comment updated!",
          description: "Your comment has been updated successfully.",
        });
      } else {
        // Create new comment
        const { error } = await supabase
          .from('teacher_comments')
          .insert({
            ...commentData,
            user_id: user.id,
            submission_id: submission.id,
          });

        if (error) throw error;

        toast({
          title: "Comment added!",
          description: "Your comment has been added successfully.",
        });
      }

      // Refresh comments and reset states
      await fetchTeacherComments();
      setEditingComment(null);
    } catch (error) {
      console.error('Error saving teacher comment:', error);
      toast({
        title: "Error saving comment",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTeacherComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('teacher_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: "Comment deleted",
        description: "The comment has been removed.",
      });

      await fetchTeacherComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error deleting comment",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditTeacherComment = (comment: TeacherComment) => {
    setEditingComment(comment);
    setSelectedText(essayText.slice(comment.text_start, comment.text_end));
    setTextSelection({ start: comment.text_start, end: comment.text_end });
    setCommentModalOpen(true);
  };

  const handleSaveGrade = async (finalGrade: string, teacherNotes: string) => {
    if (!user || !submission) return;

    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          teacher_final_grade: finalGrade,
          teacher_notes: teacherNotes
        })
        .eq('id', submission.id);

      if (error) throw error;

      setSubmission(prev => prev ? {
        ...prev,
        teacher_final_grade: finalGrade,
        teacher_notes: teacherNotes
      } : null);
    } catch (error) {
      console.error('Error saving grade:', error);
      throw error;
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

  const processAIResponse = (response: GradingResponse) => {
    // Calculate overall score from letter grade
    const gradeToScore = (grade: string): number => {
      const cleanGrade = grade?.toUpperCase().trim() || '';
      const gradeMap: { [key: string]: number } = {
        'A+': 97, 'A': 93, 'A-': 90,
        'B+': 87, 'B': 83, 'B-': 80,
        'C+': 77, 'C': 73, 'C-': 70,
        'D+': 67, 'D': 63, 'D-': 60,
        'F': 50
      };
      return gradeMap[cleanGrade] || 75; // Default to C grade if unknown
    };
    
    const score = gradeToScore(response.suggestedGrade || 'B');
    setOverallScore(score);

    // Process feedback into tiles
    const tiles: FeedbackTile[] = [
      {
        category: 'Grammar',
        score: Math.round(Math.random() * 3 + 7), // Mock scores for demo
        summary: 'Minor grammar issues found',
        details: 'Found several instances of subject-verb disagreement and comma splices. Focus on sentence structure.',
        examples: ['Line 1: "The students is" should be "The students are"']
      },
      {
        category: 'Clarity',
        score: Math.round(Math.random() * 3 + 7),
        summary: 'Writing could be clearer',
        details: 'Some sentences are overly complex and could benefit from simplification.',
        examples: ['Paragraph 2: Consider breaking down long sentences']
      },
      {
        category: 'Vocabulary',
        score: Math.round(Math.random() * 3 + 7),
        summary: 'Good word choice overall',
        details: 'Vocabulary is appropriate but some words are overused.',
        examples: ['Word "important" appears 5 times']
      },
      {
        category: 'Organization',
        score: Math.round(Math.random() * 3 + 7),
        summary: 'Well-structured essay',
        details: 'Clear introduction, body, and conclusion. Good use of transitions.',
        examples: ['Strong thesis statement', 'Logical paragraph flow']
      },
      {
        category: 'Analysis',
        score: Math.round(Math.random() * 3 + 7),
        summary: 'Analysis needs depth',
        details: 'Arguments are present but need more supporting evidence.',
        examples: ['Add more specific examples', 'Strengthen counterarguments']
      },
      {
        category: 'Thesis',
        score: Math.round(Math.random() * 3 + 7),
        summary: 'Clear thesis statement',
        details: 'Thesis is well-defined and arguable.',
        examples: ['Strong position taken', 'Could be more specific']
      }
    ];
    setFeedbackTiles(tiles);

    // Process vocabulary suggestions
    const vocab: VocabularyCard[] = [
      { word: 'important', suggestions: ['crucial', 'vital', 'significant'], reason: 'Overused word', position: 45 },
      { word: 'good', suggestions: ['excellent', 'effective', 'beneficial'], reason: 'Vague adjective', position: 123 },
      { word: 'things', suggestions: ['elements', 'factors', 'aspects'], reason: 'Too general', position: 234 }
    ];
    setVocabularyCards(vocab);
  };

  // Handle vocabulary actions
  const handleVocabularyAction = async (vocabIndex: number, action: 'apply' | 'dismiss') => {
    if (!user || !submission) return;

    try {
      const vocab = vocabularyCards[vocabIndex];
      
      if (action === 'apply') {
        // Apply the first suggestion by default
        const suggestion = vocab.suggestions[0];
        
        // Replace the word in the essay text
        const regex = new RegExp(`\\b${vocab.word}\\b`, 'gi');
        const newText = essayText.replace(regex, suggestion);
        setEssayText(newText);
        
        // Update submission in database
        await supabase
          .from('submissions')
          .update({ essay: newText })
          .eq('id', submission.id);

        toast({
          title: "Word replaced!",
          description: `Replaced "${vocab.word}" with "${suggestion}"`,
        });
      } else {
        toast({
          title: "Suggestion dismissed",
          description: `Dismissed vocabulary suggestion for "${vocab.word}"`,
        });
      }
      
      // Remove this vocabulary card from the list
      setVocabularyCards(prev => prev.filter((_, index) => index !== vocabIndex));
      
    } catch (error) {
      console.error('Error handling vocabulary action:', error);
      toast({
        title: "Error",
        description: "Failed to process vocabulary suggestion",
        variant: "destructive"
      });
    }
  };

  const toggleTile = (category: string) => {
    setExpandedTiles(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleEssayEdit = (newText: string) => {
    setEssayText(newText);
    if (liveFeedback) {
      // Implement live feedback regeneration here
      console.log('Live feedback would regenerate here');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      grammar: 'text-red-600 bg-red-50 border-red-200',
      clarity: 'text-blue-600 bg-blue-50 border-blue-200',
      'word choice': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      evidence: 'text-green-600 bg-green-50 border-green-200',
      vocabulary: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      organization: 'text-green-600 bg-green-50 border-green-200',
      analysis: 'text-purple-600 bg-purple-50 border-purple-200',
      thesis: 'text-orange-600 bg-orange-50 border-orange-200'
    };
    return colors[category.toLowerCase() as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getHighlightColor = (category: string) => {
    const colors = {
      grammar: 'border-b-2 border-red-400 bg-red-50 hover:bg-red-100',
      clarity: 'border-b-2 border-blue-400 bg-blue-50 hover:bg-blue-100',
      'word choice': 'border-b-2 border-yellow-400 bg-yellow-50 hover:bg-yellow-100',
      evidence: 'border-b-2 border-green-400 bg-green-50 hover:bg-green-100',
      vocabulary: 'border-b-2 border-yellow-400 bg-yellow-50 hover:bg-yellow-100',
      organization: 'border-b-2 border-green-400 bg-green-50 hover:bg-green-100',
      analysis: 'border-b-2 border-purple-400 bg-purple-50 hover:bg-purple-100',
      thesis: 'border-b-2 border-orange-400 bg-orange-50 hover:bg-orange-100'
    };
    return colors[category.toLowerCase() as keyof typeof colors] || 'border-b-2 border-gray-400 bg-gray-50 hover:bg-gray-100';
  };

  const getColorForCategory = (category: string, action?: string) => {
    if (action === 'approved') return 'border-green-500 bg-green-100';
    if (action === 'declined') return 'border-gray-400 bg-gray-100 opacity-50';
    if (action === 'modified') return 'border-blue-500 bg-blue-100';
    
    return getHighlightColor(category);
  };

  const getCategoryBadgeClass = (category: string) => {
    const badgeClasses = {
      grammar: 'bg-red-100 text-red-800 border-red-200',
      clarity: 'bg-blue-100 text-blue-800 border-blue-200',
      organization: 'bg-green-100 text-green-800 border-green-200',
      analysis: 'bg-purple-100 text-purple-800 border-purple-200',
      thesis: 'bg-orange-100 text-orange-800 border-orange-200',
      evidence: 'bg-pink-100 text-pink-800 border-pink-200',
      vocabulary: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'word choice': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return badgeClasses[category as keyof typeof badgeClasses] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const renderEssayWithHighlights = () => {
    if (!essayText || essayText.trim() === '' || essayText.includes('[File')) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-4">
            {submission?.submission_storage_path 
              ? 'Document uploaded but text not extracted yet.'
              : 'No essay content available.'
            }
          </p>
          {submission?.submission_storage_path && (
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
          )}
        </div>
      );
    }

    let processedText = essayText;

    // Apply highlights if we have suggestions
    if (suggestionsList.length > 0) {
      const enhancedSuggestions = suggestionsList.map((suggestion, index) => ({
        ...suggestion,
        commentId: suggestion.commentId || `comment-${index}`,
        originalIndex: index
      }));

      const suggestionsWithPositions = enhancedSuggestions.map(suggestion => {
        if (suggestion.startIndex !== undefined && suggestion.endIndex !== undefined) {
          return suggestion;
        }
        
        const textToFind = suggestion.text;
        const startIndex = essayText.indexOf(textToFind);
        if (startIndex >= 0) {
          const endIndex = startIndex + textToFind.length;
          return {
            ...suggestion,
            startIndex,
            endIndex
          };
        }
        return suggestion;
      }).filter(s => s.startIndex !== undefined && s.startIndex >= 0);

      suggestionsWithPositions.sort((a, b) => (a.startIndex || 0) - (b.startIndex || 0));
      
      let lastIndex = 0;
      let result = '';
      
      for (const suggestion of suggestionsWithPositions) {
        const startIdx = suggestion.startIndex as number;
        const endIdx = suggestion.endIndex as number;
        
        if (startIdx >= lastIndex) {
          result += processedText.substring(lastIndex, startIdx);
          
          const category = suggestion.category || 'general';
          const action = teacherActions[suggestion.originalIndex];
          const colorClass = getColorForCategory(category, action);
          
          result += `<span 
            class="cursor-pointer transition-all duration-200 px-1 py-0.5 rounded-sm ${colorClass}" 
            data-comment-id="${suggestion.commentId}"
            data-comment-index="${suggestion.originalIndex}"
            data-category="${category}"
            title="${suggestion.popupText || suggestion.comment || 'Click to view comment'}"
          >${processedText.substring(startIdx, endIdx)}</span>`;
          
          lastIndex = endIdx;
        }
      }
      
      if (lastIndex < processedText.length) {
        result += processedText.substring(lastIndex);
      }
      
      processedText = result;
    }

    return (
      <div className="relative">
        <div 
          ref={editorRef}
          className="prose max-w-none leading-relaxed text-base font-['Inter'] min-h-[400px] focus:outline-none p-4 border rounded-lg bg-white"
          contentEditable={true}
          suppressContentEditableWarning={true}
          dangerouslySetInnerHTML={{ 
            __html: processedText.replace(/\n/g, '<br/>').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
          }}
          onInput={(e) => {
            const target = e.target as HTMLDivElement;
            handleEssayEdit(target.innerText);
          }}
          onMouseUp={handleTextSelection}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            const commentIndex = target.getAttribute('data-comment-index');
            if (commentIndex) {
              const index = parseInt(commentIndex);
              setSelectedCommentIndex(index);
              
              const rect = target.getBoundingClientRect();
              setActiveCommentPopup({
                index,
                position: { x: rect.left + rect.width / 2, y: rect.bottom + 5 }
              });
            }
          }}
        />
        
        {/* Comment Popup */}
        {activeCommentPopup && suggestionsList[activeCommentPopup.index] && (
          <div 
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-sm animate-in fade-in-0 zoom-in-95"
            style={{
              left: `${activeCommentPopup.position.x}px`,
              top: `${activeCommentPopup.position.y}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge 
                  className={`text-xs ${getCategoryBadgeClass(suggestionsList[activeCommentPopup.index]?.category || 'general')}`}
                >
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
                  "{suggestionsList[activeCommentPopup.index]?.text}"
                </p>
                <p className="text-sm text-gray-800">
                  {suggestionsList[activeCommentPopup.index]?.comment}
                </p>
              </div>
              
              {modifyingComment === activeCommentPopup.index ? (
                <div className="space-y-2">
                  <Textarea
                    value={modifiedText}
                    onChange={(e) => setModifiedText(e.target.value)}
                    placeholder="Edit the comment..."
                    className="text-sm"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        handleTeacherAction(activeCommentPopup.index, 'modified', modifiedText);
                      }}
                      className="flex-1"
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setModifyingComment(null);
                        setModifiedText('');
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTeacherAction(activeCommentPopup.index, 'approved')}
                    className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setModifyingComment(activeCommentPopup.index);
                      setModifiedText(suggestionsList[activeCommentPopup.index]?.comment || '');
                    }}
                    className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTeacherAction(activeCommentPopup.index, 'declined')}
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!submission || !assignment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Submission not found</h2>
            <Link to="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter']">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {assignment.title}
              </h1>
              <p className="text-gray-600 text-sm">
                {submission.student_name} • Submitted {new Date(submission.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 mb-6">
            <Button 
              onClick={handleGenerateAIFeedback} 
              disabled={generating || !essayText}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Essay...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  {aiResponse ? 'Re-analyze' : 'Analyze'} Essay
                </>
              )}
            </Button>
            
            {aiResponse && (
              <Button 
                variant="outline"
                onClick={() => setLiveFeedback(!liveFeedback)}
                className={`shadow-sm ${liveFeedback ? 'bg-green-50 border-green-200 text-green-700' : ''}`}
              >
                <Target className={`w-4 h-4 mr-2 ${liveFeedback ? 'text-green-600' : ''}`} />
                Live Feedback {liveFeedback ? 'On' : 'Off'}
              </Button>
            )}
            
            <Button variant="outline" className="shadow-sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Regenerate All
            </Button>
          </div>
        </div>

        {/* Main Content - Grammarly Style Two Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-240px)]">
          
          {/* Left Panel - Interactive Essay Editor */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Essay Editor
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{essayText.length} characters</span>
                  <span>•</span>
                  <span>{suggestionsList.length} suggestions</span>
                </div>
              </div>
            </div>
            <div className="p-6 h-full overflow-y-auto">
              {renderEssayWithHighlights()}
            </div>
          </div>

          {/* Right Panel - Feedback Sidebar */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-white">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                Writing Assistant
              </h2>
            </div>
            
            <div className="p-6 h-full overflow-y-auto space-y-6">
              
              {/* Overall Score Ring */}
              {aiResponse && (
                <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="35"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="35"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 35}`}
                        strokeDashoffset={`${2 * Math.PI * 35 * (1 - overallScore / 100)}`}
                        className="text-blue-600 transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-900">{overallScore}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Overall Score</p>
                  <p className="text-xs text-gray-500">Great work! Room for improvement in a few areas.</p>
                </div>
              )}

              {/* Feedback Category Tiles */}
              {feedbackTiles.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Writing Categories</h3>
                  {feedbackTiles.map((tile) => (
                    <Collapsible
                      key={tile.category}
                      open={expandedTiles[tile.category]}
                      onOpenChange={() => toggleTile(tile.category)}
                    >
                      <Card className="transition-all duration-200 hover:shadow-md border-0 shadow-sm">
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${getCategoryColor(tile.category).split(' ')[1]}`}></div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{tile.category}</p>
                                  <p className="text-xs text-gray-500">{tile.summary}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-lg font-bold text-gray-900">{tile.score}/10</span>
                                {expandedTiles[tile.category] ? 
                                  <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                }
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="px-4 pb-4">
                            <div className="border-t border-gray-100 pt-3">
                              <p className="text-sm text-gray-700 mb-3 leading-relaxed">{tile.details}</p>
                              {tile.examples.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <p className="text-xs font-semibold text-gray-600 mb-2">Examples:</p>
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {tile.examples.map((example, idx) => (
                                      <li key={idx} className="flex items-start">
                                        <span className="text-blue-500 mr-2 mt-0.5">•</span>
                                        <span className="flex-1">{example}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  ))}
                </div>
              )}

              {/* Vocabulary Enhancement Cards */}
              {vocabularyCards.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center">
                    <Lightbulb className="w-4 h-4 mr-1 text-yellow-500" />
                    Vocabulary Enhancement
                  </h3>
                  {vocabularyCards.map((vocab, idx) => (
                    <Card key={idx} className="border shadow-sm hover:shadow-md transition-shadow bg-white">
                      <CardContent className="p-5">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="inline-flex items-center gap-2 mb-3">
                                <span className="font-mono font-semibold text-lg text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                                  "{vocab.word}"
                                </span>
                                <Badge variant="outline" className="text-xs border-amber-200 text-amber-700 bg-amber-50">
                                  {vocab.reason}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                              Better alternatives:
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              {vocab.suggestions.map((suggestion, sidx) => (
                                <div
                                  key={sidx}
                                  className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors cursor-pointer group"
                                >
                                  <span className="text-sm font-medium text-gray-800 group-hover:text-green-800">
                                    {suggestion}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Check className="w-3 h-3 text-green-600" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                           <div className="flex gap-3 pt-2">
                             <Button 
                               size="sm" 
                               className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                               onClick={() => handleVocabularyAction(idx, 'apply')}
                             >
                               <Check className="w-4 h-4 mr-2" />
                               Apply Suggestions
                             </Button>
                             <Button 
                               size="sm" 
                               variant="outline" 
                               className="flex-1 border-gray-300 hover:bg-gray-50"
                               onClick={() => handleVocabularyAction(idx, 'dismiss')}
                             >
                               <X className="w-4 h-4 mr-2" />
                               Dismiss
                             </Button>
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Overall Assessment */}
              {aiResponse && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Overall Assessment</h3>
                  <Card className="border shadow-sm bg-white">
                    <CardContent className="p-6 space-y-6">
                      
                      {/* Teacher Comments Section */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                          <h4 className="text-lg font-semibold text-gray-800">Teacher Comments</h4>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {(() => {
                              // Extract clean feedback text
                              let feedbackText = aiResponse.overallFeedback;
                              
                              // If the feedback contains JSON structure, try to extract the overallFeedback field
                              if (typeof feedbackText === 'string' && feedbackText.includes('"overallFeedback"')) {
                                try {
                                  // Clean markdown formatting first
                                  let cleanText = feedbackText.trim();
                                  if (cleanText.includes('```json')) {
                                    cleanText = cleanText.replace(/^.*```json\s*/, '').replace(/\s*```.*$/, '');
                                  } else if (cleanText.includes('```')) {
                                    cleanText = cleanText.replace(/^.*```\s*/, '').replace(/\s*```.*$/, '');
                                  }
                                  cleanText = cleanText.replace(/^`+|`+$/g, '').trim();
                                  
                                  // Parse and extract overallFeedback
                                  const parsed = JSON.parse(cleanText);
                                  feedbackText = parsed.overallFeedback || feedbackText;
                                } catch (error) {
                                  console.log('Could not extract overallFeedback from JSON:', error);
                                }
                              }
                              
                              return typeof feedbackText === 'string' && feedbackText.trim() !== '' 
                                ? feedbackText 
                                : "This essay demonstrates solid understanding of the text with clear organization and relevant examples. The analysis could be strengthened with deeper exploration of themes and more detailed textual evidence. Overall, this is good work with room for growth in critical thinking and analytical depth.";
                            })()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Grade and Rationale Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                          <h5 className="text-sm font-semibold text-gray-700 mb-2">Suggested Grade</h5>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-700">
                              {aiResponse.suggestedGrade || 'B+'}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">Final Assessment</p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h5 className="text-sm font-semibold text-gray-700 mb-2">AI Confidence</h5>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-700">
                              {Math.round((aiResponse.confidence || 0.8) * 100)}%
                            </div>
                            <p className="text-xs text-gray-600 mt-1">Accuracy Rating</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Grading Rationale */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-6 bg-gray-500 rounded-full"></div>
                          <h4 className="text-base font-semibold text-gray-800">Grading Rationale</h4>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {typeof aiResponse.reasoning === 'string' && aiResponse.reasoning.trim() !== ''
                              ? aiResponse.reasoning 
                              : 'This grade reflects the essay\'s adherence to assignment requirements, organization, use of textual evidence, and depth of analysis. The writing demonstrates competent understanding with opportunities for improvement in analytical sophistication.'}
                          </p>
                        </div>
                      </div>
                      
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Teacher Grading Panel */}
              <div>
                <TeacherGradingPanel
                  teacherComments={teacherComments}
                  aiComments={aiResponse?.inlineComments?.map(c => ({
                    text: c.text,
                    comment: c.comment,
                    category: 'General'
                  })) || []}
                  overallFeedback={aiResponse?.overallFeedback || ''}
                  suggestedGrade={aiResponse?.suggestedGrade || ''}
                  teacherFinalGrade={submission?.teacher_final_grade}
                  teacherNotes={submission?.teacher_notes}
                  studentName={submission.student_name}
                  assignmentTitle={assignment.title}
                  essay={essayText}
                  onSaveGrade={handleSaveGrade}
                  onDeleteComment={handleDeleteTeacherComment}
                  onEditComment={handleEditTeacherComment}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Comment Modal */}
      <TeacherCommentModal
        isOpen={commentModalOpen}
        onClose={() => {
          setCommentModalOpen(false);
          setEditingComment(null);
          setSelectedText('');
          setTextSelection(null);
        }}
        onSave={handleSaveTeacherComment}
        selectedText={selectedText}
        textStart={textSelection?.start || 0}
        textEnd={textSelection?.end || 0}
        existingComment={editingComment}
      />
    </div>
  );
};

export default SubmissionDetail;