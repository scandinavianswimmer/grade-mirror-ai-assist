
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Star, ArrowRight } from 'lucide-react';
import { completeOnboarding } from '@/lib/onboardingApi';

interface ConfirmationProps {
  userId: string;
  onComplete: () => void;
}

const Confirmation = ({ userId, onComplete }: ConfirmationProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      await completeOnboarding(userId);
      toast({
        title: "Welcome to GradeMirror!",
        description: "Your account is now fully set up and ready to use."
      });
      onComplete();
    } catch (error) {
      toast({
        title: "Setup error",
        description: "Could not complete setup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center space-y-6">
      <div>
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h3>
        <p className="text-gray-600 text-lg">
          Your personalized AI grading assistant is ready to help you save time and provide consistent feedback.
        </p>
      </div>

      <Card className="p-6 text-left">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          What You Can Do Now
        </h4>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            Upload student essays and get AI-generated feedback in your style
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            Add more training examples to improve AI accuracy
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            Generate up to 10 AI feedbacks per week on the free plan
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            Store up to 5 training examples to personalize your AI
          </li>
        </ul>
      </Card>

      <div className="bg-blue-50 p-6 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Ready to Start Grading?</h4>
        <p className="text-blue-700 text-sm mb-4">
          Head to your dashboard to upload your first assignment and experience the power of personalized AI grading.
        </p>
        <Button onClick={handleComplete} disabled={loading} className="w-full">
          {loading ? 'Finalizing Setup...' : (
            <>
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Confirmation;
