
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, CheckCircle, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/components/AuthProvider';
import { createTrainingExample, getUserLimits } from '@/lib/freemiumApi';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const UploadTraining = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    essay: '',
    rubric: '',
    feedback: '',
    grade: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add feedback examples.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.essay.trim() || !formData.rubric.trim() || !formData.feedback.trim()) {
      toast({
        title: "Missing required fields",
        description: "Provide the student essay, the rubric, and your own feedback — your feedback is what teaches Mr Selby your style.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Check limits first
      const limits = await getUserLimits(user.id);
      if (limits.trainingExamplesCount >= limits.maxTrainingExamples) {
        toast({
          title: "Limit reached",
          description: `You've reached the feedback-example limit (${limits.maxTrainingExamples}) for the ${limits.plan} plan.`,
          variant: "destructive"
        });
        return;
      }

      await createTrainingExample({
        user_id: user.id,
        essay: formData.essay,
        rubric: formData.rubric,
        feedback: formData.feedback,
        grade: formData.grade
      });

      toast({
        title: "Feedback example added",
        description: "Your paper, rubric, and wording are saved in Feedback style."
      });

      // Reset form
      setFormData({
        essay: '',
        rubric: '',
        feedback: '',
        grade: ''
      });

      navigate('/training');
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Could not add that example",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-display text-3xl font-semibold mb-4">Sign in to add an example</h1>
            <p className="text-muted-foreground mb-8">Feedback examples stay with your teacher workspace.</p>
            <Button onClick={() => navigate('/auth')}>Sign in</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <p className="text-sm font-semibold text-primary">Feedback style</p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Add a feedback example</h1>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Add a de-identified paper, the rubric you used, and your final wording. Mr Selby can use
              the example as context for future first passes.
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student paper */}
              <div>
                <Label htmlFor="essay">Student paper *</Label>
                <Textarea
                  id="essay"
                  value={formData.essay}
                  onChange={(e) => handleInputChange('essay', e.target.value)}
                  placeholder="Paste de-identified paper text here…"
                  className="mt-1 min-h-[200px]"
                  required
                />
              </div>

              {/* Rubric */}
              <div>
                <Label htmlFor="rubric">Rubric *</Label>
                <Textarea
                  id="rubric"
                  value={formData.rubric}
                  onChange={(e) => handleInputChange('rubric', e.target.value)}
                  placeholder="Paste the rubric or criteria used for this assignment…"
                  className="mt-1 min-h-[150px]"
                  required
                />
              </div>

              {/* Your Feedback */}
              <div>
                <Label htmlFor="feedback">Your final feedback *</Label>
                <Textarea
                  id="feedback"
                  value={formData.feedback}
                  onChange={(e) => handleInputChange('feedback', e.target.value)}
                  placeholder="Paste the feedback you wrote…"
                  className="mt-1 min-h-[120px]"
                />
              </div>

              {/* Grade Given */}
              <div>
                <Label htmlFor="grade">Score or grade</Label>
                <Input
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                  placeholder="For example: 16/20, 87%, B+"
                  className="mt-1"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding example…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Add feedback example
                  </>
                )}
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-6 rounded-lg border border-border bg-secondary/45 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Before you add it</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    <li>Remove names, emails, student IDs, and identifying details.</li>
                    <li>Use the feedback you actually returned, including edits you made.</li>
                    <li>A few representative examples are more useful than a large inconsistent set.</li>
                    <li>Your plan limit is shown before anything is saved.</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UploadTraining;
