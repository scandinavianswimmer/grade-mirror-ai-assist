
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { checkOnboardingStatus } from '@/lib/onboardingApi';
import ProfileSetup from '@/components/onboarding/ProfileSetup';
import UploadExamples from '@/components/onboarding/UploadExamples';
import AIStyleSummary from '@/components/onboarding/AIStyleSummary';
import TestGrading from '@/components/onboarding/TestGrading';
import Confirmation from '@/components/onboarding/Confirmation';

const STEPS = [
  { id: 1, title: 'Profile Setup' },
  { id: 2, title: 'Upload Examples' },
  { id: 3, title: 'AI Style Summary' },
  { id: 4, title: 'Test Grading' },
  { id: 5, title: 'Confirmation' }
];

const Onboarding = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if user has already completed onboarding
    checkOnboardingStatus(user.id).then((completed) => {
      if (completed) {
        navigate('/dashboard');
      }
    }).catch((error) => {
      console.error('Error checking onboarding status:', error);
    });
  }, [user, loading, navigate]);

  const handleStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
    
    if (stepId < STEPS.length) {
      setCurrentStep(stepId + 1);
    }
  };

  const handleGoToStep = (stepId: number) => {
    if (stepId <= Math.max(...completedSteps) + 1) {
      setCurrentStep(stepId);
    }
  };

  const renderStepContent = () => {
    if (!user) return null;

    switch (currentStep) {
      case 1:
        return <ProfileSetup userId={user.id} onComplete={() => handleStepComplete(1)} />;
      case 2:
        return <UploadExamples userId={user.id} onComplete={() => handleStepComplete(2)} />;
      case 3:
        return <AIStyleSummary userId={user.id} onComplete={() => handleStepComplete(3)} />;
      case 4:
        return <TestGrading userId={user.id} onComplete={() => handleStepComplete(4)} />;
      case 5:
        return <Confirmation userId={user.id} onComplete={() => navigate('/dashboard')} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to GradeMirror</h1>
          <p className="text-gray-600">Let's set up your personalized AI grading assistant</p>
        </div>

        {/* Progress Steps */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">
                Step {currentStep} of {STEPS.length}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round((completedSteps.length / STEPS.length) * 100)}% Complete
              </span>
            </div>
            <Progress value={(completedSteps.length / STEPS.length) * 100} className="mb-6" />

            <div className="flex flex-wrap gap-2">
              {STEPS.map((step) => (
                <Button
                  key={step.id}
                  variant={currentStep === step.id ? "default" : completedSteps.includes(step.id) ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => handleGoToStep(step.id)}
                  disabled={step.id > Math.max(...completedSteps, currentStep)}
                  className="text-xs"
                >
                  {step.id}. {step.title}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1]?.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
