
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ThumbsUp, ThumbsDown, MessageSquare, User, Brain } from 'lucide-react';
import { GradingResponse, saveTeacherEdit } from '@/lib/geminiApi';

interface GradingInterfaceProps {
  submission: any;
  gradingResult: GradingResponse;
  onSaveFeedback: (feedback: string, grade: string) => void;
}

const GradingInterface = ({ submission, gradingResult, onSaveFeedback }: GradingInterfaceProps) => {
  const { toast } = useToast();
  const [editedFeedback, setEditedFeedback] = useState(gradingResult.overallFeedback);
  const [editedGrade, setEditedGrade] = useState(gradingResult.suggestedGrade);
  const [commentFeedback, setCommentFeedback] = useState<Record<string, boolean>>({});

  const handleCommentFeedback = async (commentId: string, accepted: boolean) => {
    try {
      const comment = gradingResult.inlineComments.find(c => c.commentId === commentId);
      
      await saveTeacherEdit(
        submission.id,
        commentId,
        accepted ? 'accept' : 'decline',
        comment?.comment
      );

      setCommentFeedback(prev => ({ ...prev, [commentId]: accepted }));
      
      toast({
        title: accepted ? "Comment accepted" : "Comment declined",
        description: "Your feedback has been logged for AI improvement."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save feedback. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'constructive': return 'bg-yellow-100 text-yellow-800';
      case 'question': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSave = () => {
    onSaveFeedback(editedFeedback, editedGrade);
  };

  return (
    <div className="space-y-6">
      {/* AI Confidence Indicator */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="w-4 h-4" />
            AI Grading Confidence: {Math.round(gradingResult.confidence * 100)}%
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Inline Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Inline Comments ({gradingResult.inlineComments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {gradingResult.inlineComments.map((comment) => (
            <div key={comment.commentId} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <Badge className={getCommentTypeColor(comment.type)}>
                  {comment.type}
                </Badge>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={commentFeedback[comment.commentId] === true ? "default" : "outline"}
                    onClick={() => handleCommentFeedback(comment.commentId, true)}
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant={commentFeedback[comment.commentId] === false ? "destructive" : "outline"}
                    onClick={() => handleCommentFeedback(comment.commentId, false)}
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded text-sm">
                <strong>Selected text:</strong> "{comment.text}"
              </div>
              
              <div className="text-sm">
                <strong>AI Comment:</strong> {comment.comment}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Overall Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Overall Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={editedFeedback}
            onChange={(e) => setEditedFeedback(e.target.value)}
            rows={6}
            className="w-full"
            placeholder="Edit the overall feedback..."
          />
        </CardContent>
      </Card>

      {/* Grade and Reasoning */}
      <Card>
        <CardHeader>
          <CardTitle>Grade & Reasoning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="font-medium">Suggested Grade:</label>
            <input
              type="text"
              value={editedGrade}
              onChange={(e) => setEditedGrade(e.target.value)}
              className="border rounded px-3 py-1 w-20 text-center font-bold"
            />
          </div>
          
          <div className="space-y-2">
            <label className="font-medium">AI Reasoning:</label>
            <div className="bg-gray-50 p-3 rounded text-sm">
              {gradingResult.reasoning}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Save Final Grade & Feedback
        </Button>
      </div>
    </div>
  );
};

export default GradingInterface;
