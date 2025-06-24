
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Loader2, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/components/AuthProvider';
import { generateAIFeedback, createSubmission, getUserLimits } from '@/lib/freemiumApi';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const SubmitAssignment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [essay, setEssay] = useState('');
  const [rubric, setRubric] = useState('');
  const [feedback, setFeedback] = useState<any>(null);

  const handleGenerateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Check limits first
      const limits = await getUserLimits(user.id);
      if (limits.weeklyFeedbackCount >= limits.maxWeeklyFeedback) {
        toast({
          title: "Weekly limit reached",
          description: "You've reached your weekly AI feedback limit for the free plan.",
          variant: "destructive"
        });
        return;
      }

      // Generate AI feedback
      const aiResponse = await generateAIFeedback(essay, rubric, user.id);

      // Save submission
      await createSubmission({
        user_id: user.id,
        essay,
        rubric,
        ai_feedback: aiResponse.overallFeedback,
        ai_grade: aiResponse.suggestedGrade,
        inline_comments: aiResponse.inlineComments
      });

      setFeedback(aiResponse);

      toast({
        title: "AI feedback generated!",
        description: "Review the suggestions below and adjust as needed."
      });
    } catch (error) {
      console.error('Feedback generation error:', error);
      toast({
        title: "Failed to generate feedback",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Grade Student Essay</h1>
            <p className="text-gray-600">
              Upload a student essay and rubric to get AI-powered feedback suggestions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <Card className="p-6">
              <form onSubmit={handleGenerateFeedback} className="space-y-6">
                <div>
                  <Label htmlFor="essay">Student Essay *</Label>
                  <Textarea
                    id="essay"
                    value={essay}
                    onChange={(e) => setEssay(e.target.value)}
                    placeholder="Paste the student's essay text here..."
                    className="mt-1 min-h-[200px]"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="rubric">Grading Rubric *</Label>
                  <Textarea
                    id="rubric"
                    value={rubric}
                    onChange={(e) => setRubric(e.target.value)}
                    placeholder="Paste the grading rubric or criteria..."
                    className="mt-1 min-h-[150px]"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating AI Feedback...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Generate AI Feedback
                    </>
                  )}
                </Button>
              </form>
            </Card>

            {/* AI Feedback Results */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">AI Feedback</h3>
              
              {!feedback && !loading && (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Submit essay and rubric to generate AI feedback</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">AI is analyzing the essay...</p>
                </div>
              )}

              {feedback && (
                <div className="space-y-4">
                  {/* Suggested Grade */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Suggested Grade</h4>
                    <p className="text-2xl font-bold text-blue-600">{feedback.suggestedGrade}</p>
                    <p className="text-sm text-blue-700 mt-1">{feedback.reasoning}</p>
                  </div>

                  {/* Overall Feedback */}
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Overall Feedback</h4>
                    <p className="text-sm text-green-700">{feedback.overallFeedback}</p>
                  </div>

                  {/* Inline Comments */}
                  {feedback.inlineComments && feedback.inlineComments.length > 0 && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-800 mb-2">Inline Comments</h4>
                      <div className="space-y-2">
                        {feedback.inlineComments.map((comment: any, index: number) => (
                          <div key={index} className="text-sm">
                            <p className="font-medium text-orange-700">"{comment.text}"</p>
                            <p className="text-orange-600">{comment.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confidence Score */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">AI Confidence</h4>
                    <p className="text-sm text-gray-700">
                      {Math.round((feedback.confidence || 0.8) * 100)}% confident in this assessment
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => navigate('/dashboard')} className="flex-1">
                      Save & Return to Dashboard
                    </Button>
                    <Button variant="outline" onClick={() => window.print()}>
                      Print Feedback
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Usage Warning */}
          <Card className="mt-8 p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-800">
                  <strong>Freemium Plan:</strong> You can generate up to 10 AI feedback reports per week. 
                  Upgrade to unlimited for more advanced features.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SubmitAssignment;
