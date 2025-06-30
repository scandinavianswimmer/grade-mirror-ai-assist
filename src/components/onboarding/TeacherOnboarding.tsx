
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import BasicInfoStep from './BasicInfoStep';
import TeachingEnvironmentStep from './TeachingEnvironmentStep';
import GoalsStep from './GoalsStep';
import TechnicalComfortStep from './TechnicalComfortStep';
import AccountSetupStep from './AccountSetupStep';
import PersonalizationStep from './PersonalizationStep';
import ReferralStep from './ReferralStep';

const STEPS = [
  { id: 1, title: 'Basic Information', component: BasicInfoStep },
  { id: 2, title: 'Teaching Environment', component: TeachingEnvironmentStep },
  { id: 3, title: 'Goals & Use Cases', component: GoalsStep },
  { id: 4, title: 'Technical Comfort', component: TechnicalComfortStep },
  { id: 5, title: 'Account Setup', component: AccountSetupStep },
  { id: 6, title: 'Personalization', component: PersonalizationStep },
  { id: 7, title: 'How did you hear about us?', component: ReferralStep }
];

interface OnboardingData {
  basicInfo: any;
  teachingEnvironment: any;
  goals: any;
  technicalComfort: any;
  accountSetup: any;
  personalization: any;
  referral: any;
}

interface TeacherOnboardingProps {
  onComplete: () => void;
}

const TeacherOnboarding: React.FC<TeacherOnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    basicInfo: {},
    teachingEnvironment: {},
    goals: {},
    technicalComfort: {},
    accountSetup: {},
    personalization: {},
    referral: {}
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const handleStepComplete = (stepData: any) => {
    const stepKey = getCurrentStepKey();
    setOnboardingData(prev => ({
      ...prev,
      [stepKey]: stepData
    }));

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleOnboardingComplete();
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      // Save onboarding data to user profile
      console.log('Onboarding completed with data:', onboardingData);
      
      toast({
        title: "Welcome to GradeMirror!",
        description: "Your account has been set up successfully."
      });

      onComplete();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast({
        title: "Error",
        description: "There was an issue saving your information. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getCurrentStepKey = () => {
    const keyMap: { [key: number]: keyof OnboardingData } = {
      1: 'basicInfo',
      2: 'teachingEnvironment',
      3: 'goals',
      4: 'technicalComfort',
      5: 'accountSetup',
      6: 'personalization',
      7: 'referral'
    };
    return keyMap[currentStep];
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const currentStepKey = getCurrentStepKey();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900">
              Welcome to GradeMirror! 🧑‍🏫
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Let's set up your teaching profile to personalize your experience
            </p>
          </CardHeader>

          <CardContent className="p-6">
            {/* Progress Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-600">
                  Step {currentStep} of {STEPS.length}
                </span>
                <span className="text-sm text-gray-600">
                  {Math.round((currentStep / STEPS.length) * 100)}% Complete
                </span>
              </div>
              <Progress value={(currentStep / STEPS.length) * 100} className="mb-6" />
              
              <h3 className="text-lg font-semibold text-center mb-6">
                {STEPS[currentStep - 1].title}
              </h3>
            </div>

            {/* Step Content */}
            <CurrentStepComponent
              data={onboardingData[currentStepKey]}
              onNext={handleStepComplete}
              onBack={currentStep > 1 ? handleBack : undefined}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherOnboarding;
