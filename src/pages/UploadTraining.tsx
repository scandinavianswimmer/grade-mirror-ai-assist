
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
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
        description: "Please sign in to upload training examples.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.essay.trim() || !formData.rubric.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please provide both the student essay and grading rubric.",
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
          description: `You've reached the maximum number of training examples (${limits.maxTrainingExamples}) for the ${limits.plan} plan.`,
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
        title: "Training example uploaded!",
        description: "Your grading example has been added to improve AI accuracy."
      });

      // Reset form
      setFormData({
        essay: '',
        rubric: '',
        feedback: '',
        grade: ''
      });

      // Navigate back to dashboard
      navigate('/');
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Sign In Required</h1>
            <p className="text-gray-600 mb-8">Please sign in to upload training examples.</p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Training Example</h1>
            <p className="text-gray-600">
              Upload a past graded essay to train the AI to match your grading style and feedback approach.
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Essay */}
              <div>
                <Label htmlFor="essay">Student Essay *</Label>
                <Textarea
                  id="essay"
                  value={formData.essay}
                  onChange={(e) => handleInputChange('essay', e.target.value)}
                  placeholder="Paste the student's essay text here..."
                  className="mt-1 min-h-[200px]"
                  required
                />
              </div>

              {/* Rubric */}
              <div>
                <Label htmlFor="rubric">Grading Rubric *</Label>
                <Textarea
                  id="rubric"
                  value={formData.rubric}
                  onChange={(e) => handleInputChange('rubric', e.target.value)}
                  placeholder="Paste the grading rubric or criteria used for this assignment..."
                  className="mt-1 min-h-[150px]"
                  required
                />
              </div>

              {/* Your Feedback */}
              <div>
                <Label htmlFor="feedback">Your Feedback</Label>
                <Textarea
                  id="feedback"
                  value={formData.feedback}
                  onChange={(e) => handleInputChange('feedback', e.target.value)}
                  placeholder="The feedback you provided to the student..."
                  className="mt-1 min-h-[120px]"
                />
              </div>

              {/* Grade Given */}
              <div>
                <Label htmlFor="grade">Grade Given</Label>
                <Input
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                  placeholder="e.g., A-, 87%, B+"
                  className="mt-1"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading Training Example...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Training Example
                  </>
                )}
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Training Tips</p>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Upload examples that represent your typical grading style</li>
                    <li>• Include both high and low-performing essays for balance</li>
                    <li>• More training examples = better AI accuracy</li>
                    <li>• Free plan allows up to 5 training examples</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UploadTraining;
