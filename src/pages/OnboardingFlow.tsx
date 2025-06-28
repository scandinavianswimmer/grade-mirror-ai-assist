
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import WelcomeStep from '@/components/onboarding/WelcomeStep';
import StyleStep from '@/components/onboarding/StyleStep';
import UploadStep from '@/components/onboarding/UploadStep';

const STEPS = [
  { id: 1, title: 'Welcome' },
  { id: 2, title: 'Define Your Style' },
  { id: 3, title: 'Upload Examples' }
];

const OnboardingFlow = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [styleData, setStyleData] = useState({
    tone: '',
    priority: '',
    approach: '',
    phrases: ''
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg font-medium">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleNext = (data?: any) => {
    if (currentStep === 2 && data) {
      setStyleData(data);
    }
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    navigate('/dashboard');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep onNext={handleNext} />;
      case 2:
        return <StyleStep onNext={handleNext} onBack={handleBack} initialData={styleData} />;
      case 3:
        return <UploadStep onComplete={handleComplete} onBack={handleBack} styleData={styleData} userId={user.id} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">
                Step {currentStep} of {STEPS.length}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round((currentStep / STEPS.length) * 100)}% Complete
              </span>
            </div>
            <Progress value={(currentStep / STEPS.length) * 100} className="mb-6" />

            <div className="flex justify-center gap-4">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    currentStep === step.id
                      ? 'bg-blue-600 text-white'
                      : currentStep > step.id
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep === step.id
                      ? 'bg-white text-blue-600'
                      : currentStep > step.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {step.id}
                  </div>
                  <span className="hidden sm:block">{step.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingFlow;
