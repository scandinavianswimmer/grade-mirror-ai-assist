
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import FileUpload from '@/components/FileUpload';
import { useAuth } from '@/components/AuthProvider';
import { generateAIFeedback, createSubmission, getUserLimits, type AIFeedbackResponse } from '@/lib/freemiumApi';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const SubmitAssignment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [essay, setEssay] = useState('');
  const [rubric, setRubric] = useState('');
  const [feedback, setFeedback] = useState<AIFeedbackResponse | null>(null);
  const [step, setStep] = useState<'input' | 'processing' | 'results'>('input');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = (file: File, content: string) => {
    setEssay(content);
    toast({
      title: "Essay uploaded",
      description: `${file.name} has been loaded successfully`
    });
  };

  const handleGenerateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!essay.trim() || !rubric.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both an essay and rubric",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setStep('processing');

    try {
      // Check limits first
      const limits = await getUserLimits(user.id);
      if (limits.weeklyFeedbackCount >= limits.maxWeeklyFeedback) {
        toast({
          title: "Weekly limit reached",
          description: "You've reached your weekly AI feedback limit for the free plan.",
          variant: "destructive"
        });
        setStep('input');
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
      setStep('results');

      toast({
        title: "AI feedback generated!",
        description: "Review the suggestions below and adjust as needed."
      });
    } catch (error) {
      // Surface the SPECIFIC, persistent reason (not an auto-dismissing generic toast), and
      // keep the teacher's essay + rubric intact in the form so they can retry without re-pasting.
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'AI grading is temporarily unavailable. Please try again.';
      console.error('Feedback generation error:', message);
      setErrorMessage(message);
      toast({
        title: 'Could not grade this essay',
        description: message,
        variant: 'destructive'
      });
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const startOver = () => {
    setEssay('');
    setRubric('');
    setFeedback(null);
    setErrorMessage(null);
    setStep('input');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Grade Student Essay</h1>
            <p className="text-gray-600">
              Upload a student essay and rubric to get AI-powered feedback suggestions.
            </p>
          </div>

          {step === 'input' && errorMessage && (
            <Card className="mb-6 p-4 bg-red-50 border-red-200" role="alert">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Grading didn't complete</p>
                  <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                  <p className="text-xs text-red-600 mt-2">Your essay and rubric are still here — press <strong>Generate AI Feedback</strong> to retry.</p>
                </div>
              </div>
            </Card>
          )}

          {step === 'input' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Form */}
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Upload Essay</h3>
                  <FileUpload
                    onFileSelect={handleFileUpload}
                    placeholder="Upload student essay..."
                    acceptedTypes={['.txt', '.docx', '.pdf']}
                  />
                </Card>

                <Card className="p-6">
                  <form onSubmit={handleGenerateFeedback} className="space-y-6">
                    <div>
                      <Label htmlFor="essay">Student Essay *</Label>
                      <Textarea
                        id="essay"
                        value={essay}
                        onChange={(e) => setEssay(e.target.value)}
                        placeholder="Paste or type the student's essay text here..."
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
                        placeholder="Enter the grading rubric or criteria..."
                        className="mt-1 min-h-[150px]"
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      <Brain className="w-4 h-4 mr-2" />
                      Generate AI Feedback
                    </Button>
                  </form>
                </Card>
              </div>

              {/* Instructions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">How it works</h3>
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-medium">1</span>
                    </div>
                    <p>Upload or paste the student's essay text</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-medium">2</span>
                    </div>
                    <p>Provide the grading rubric or criteria</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-medium">3</span>
                    </div>
                    <p>AI analyzes the essay against your criteria</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-medium">4</span>
                    </div>
                    <p>Review and customize the AI-generated feedback</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {step === 'processing' && (
            <Card className="p-12">
              <div className="text-center">
                <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-6 animate-spin" />
                <h3 className="text-xl font-semibold mb-4">Analyzing Essay</h3>
                <p className="text-gray-600 mb-6">
                  Our AI is carefully reviewing the essay against your rubric...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                </div>
              </div>
            </Card>
          )}

          {step === 'results' && feedback && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-semibold">AI Feedback Complete</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Suggested Grade */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Suggested Grade</h4>
                    <p className="text-3xl font-bold text-blue-600">{feedback.suggestedGrade}</p>
                    <p className="text-sm text-blue-700 mt-2">{feedback.reasoning}</p>
                  </div>

                  {/* AI completeness — real value only, never a fabricated default (H18/M66) */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">AI Completeness</h4>
                    <p className="text-2xl font-bold text-gray-600">
                      {typeof feedback.confidence === 'number'
                        ? `${Math.round(feedback.confidence * 100)}%`
                        : 'Review required'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">How complete the AI draft is — your review is required</p>
                  </div>
                </div>

                {/* Overall Feedback */}
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-3">Overall Feedback</h4>
                  <p className="text-sm text-green-700 whitespace-pre-wrap">{feedback.overallFeedback}</p>
                </div>

                {/* Inline Comments */}
                {feedback.inlineComments && feedback.inlineComments.length > 0 && (
                  <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold text-orange-800 mb-3">Specific Comments</h4>
                    <div className="space-y-3">
                      {feedback.inlineComments.map((comment, index) => (
                        <div key={index} className="border-l-3 border-orange-300 pl-3">
                          <p className="font-medium text-orange-700 text-sm">"{comment.text}"</p>
                          <p className="text-orange-600 text-sm mt-1">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <Button onClick={() => navigate('/dashboard')} className="flex-1">
                    Save & Return to Dashboard
                  </Button>
                  <Button variant="outline" onClick={startOver}>
                    Grade Another Essay
                  </Button>
                  <Button variant="outline" onClick={() => window.print()}>
                    Print Feedback
                  </Button>
                </div>
              </Card>
            </div>
          )}

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
      </main>
    </div>
  );
};

export default SubmitAssignment;
