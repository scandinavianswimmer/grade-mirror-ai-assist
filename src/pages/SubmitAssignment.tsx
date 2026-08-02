
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PenLine, Loader2, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
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
      title: "Paper added",
      description: `${file.name} is ready to review.`
    });
  };

  const handleGenerateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!essay.trim() || !rubric.trim()) {
      toast({
        title: "Missing information",
        description: "Add both the paper and the rubric.",
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
          description: "You've reached this plan's weekly first-pass limit.",
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
        title: "First pass ready",
        description: "Check the draft score and wording against the paper before you use it."
      });
    } catch (error) {
      // Surface the SPECIFIC, persistent reason (not an auto-dismissing generic toast), and
      // keep the teacher's essay + rubric intact in the form so they can retry without re-pasting.
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'The first pass is temporarily unavailable. Please try again.';
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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-semibold text-primary">One-paper review</p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Draft a first pass</h1>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Add one paper and the rubric it should follow. Mr Selby drafts a score and notes;
              you check, revise, and decide what is ready.
            </p>
          </div>

          {step === 'input' && errorMessage && (
            <Card className="mb-6 p-4 bg-red-50 border-red-200" role="alert">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Grading didn't complete</p>
                  <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                  <p className="text-xs text-red-600 mt-2">Your paper and rubric are still here — press <strong>Draft score and notes</strong> to retry.</p>
                </div>
              </div>
            </Card>
          )}

          {step === 'input' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Form */}
              <div className="space-y-6">
                <Card className="p-6">
                  <h2 className="font-display text-xl font-semibold mb-4">Add the paper</h2>
                  <FileUpload
                    onFileSelect={handleFileUpload}
                    placeholder="Upload a student paper…"
                    acceptedTypes={['.txt', '.docx', '.pdf']}
                  />
                </Card>

                <Card className="p-6">
                  <form onSubmit={handleGenerateFeedback} className="space-y-6">
                    <div>
                      <Label htmlFor="essay">Student paper *</Label>
                      <Textarea
                        id="essay"
                        value={essay}
                        onChange={(e) => setEssay(e.target.value)}
                        placeholder="Paste the paper text here…"
                        className="mt-1 min-h-[200px]"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="rubric">Rubric *</Label>
                      <Textarea
                        id="rubric"
                        value={rubric}
                        onChange={(e) => setRubric(e.target.value)}
                        placeholder="Enter the rubric or criteria…"
                        className="mt-1 min-h-[150px]"
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      <PenLine className="w-4 h-4 mr-2" />
                      Draft score and notes
                    </Button>
                  </form>
                </Card>
              </div>

              {/* Instructions */}
              <Card className="p-6">
                <h2 className="font-display text-xl font-semibold mb-4">What happens next</h2>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-medium">1</span>
                    </div>
                    <p>Upload or paste the student's essay text</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-medium">2</span>
                    </div>
                    <p>Provide the grading rubric or criteria</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-medium">3</span>
                    </div>
                    <p>Mr Selby drafts a score and notes tied to the rubric</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-medium">4</span>
                    </div>
                    <p>You check the evidence and revise or dismiss the draft</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {step === 'processing' && (
            <Card className="p-12">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-6 animate-spin" />
                <h2 className="font-display text-xl font-semibold mb-4">Drafting the first pass</h2>
                <p className="text-muted-foreground">
                  Checking the paper against the rubric. Your paper stays here if the draft does not finish.
                </p>
              </div>
            </Card>
          )}

          {step === 'results' && feedback && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h2 className="font-display text-xl font-semibold">First pass ready for review</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Draft score */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h3 className="font-sans text-base font-semibold tracking-normal mb-2">Draft score</h3>
                    <p className="metric text-3xl font-semibold text-primary">{feedback.suggestedGrade}</p>
                    <p className="text-sm text-muted-foreground mt-2">{feedback.reasoning}</p>
                  </div>

                  {/* Evidence signal — real value only, never a fabricated default (H18/M66) */}
                  <div className="rounded-lg border border-border bg-secondary/40 p-4">
                    <h3 className="font-sans text-base font-semibold tracking-normal mb-2">Evidence signal</h3>
                    <p className="metric text-2xl font-semibold text-foreground">
                      {typeof feedback.confidence === 'number'
                        ? `${Math.round(feedback.confidence * 100)}%`
                        : 'Review required'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">An internal draft signal—not a substitute for your review.</p>
                  </div>
                </div>

                {/* Overall Feedback */}
                <div className="mt-6 rounded-lg border border-border bg-card p-4">
                  <h3 className="font-sans text-base font-semibold tracking-normal mb-3">Draft summary feedback</h3>
                  <p className="text-sm leading-6 text-foreground whitespace-pre-wrap">{feedback.overallFeedback}</p>
                </div>

                {/* Inline Comments */}
                {feedback.inlineComments && feedback.inlineComments.length > 0 && (
                  <div className="mt-6 rounded-lg border border-suggestion/30 bg-suggestion-soft/45 p-4">
                    <h3 className="font-sans text-base font-semibold tracking-normal mb-3">Draft margin notes</h3>
                    <div className="space-y-3">
                      {feedback.inlineComments.map((comment, index) => (
                        <div key={index} className="border-l-2 border-suggestion pl-3">
                          <p className="font-medium text-foreground text-sm">“{comment.text}”</p>
                          <p className="text-muted-foreground text-sm mt-1">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <Button onClick={() => navigate('/dashboard')} className="flex-1">
                    Save and return to Today
                  </Button>
                  <Button variant="outline" onClick={startOver}>
                    Review another paper
                  </Button>
                  <Button variant="outline" onClick={() => window.print()}>
                    Print Feedback
                  </Button>
                </div>
              </Card>
            </div>
          )}

          <div className="mt-8 flex items-start gap-3 rounded-lg border border-border bg-secondary/45 p-4 text-sm leading-6 text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <p>Use student work only when your school policy and permissions allow it. Remove identifying details whenever possible.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SubmitAssignment;
