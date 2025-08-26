
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import BasicInfoStep from './BasicInfoStep';
import TeachingEnvironmentStep from './TeachingEnvironmentStep';
import GoalsStep from './GoalsStep';
import TechnicalComfortStep from './TechnicalComfortStep';
import AccountSetupStep from './AccountSetupStep';
import ReferralStep from './ReferralStep';
import GuidedTour from './GuidedTour';

const STEPS = [
  { id: 1, title: 'Basic Information', component: BasicInfoStep },
  { id: 2, title: 'Teaching Environment', component: TeachingEnvironmentStep },
  { id: 3, title: 'Goals & Use Cases', component: GoalsStep },
  { id: 4, title: 'Technical Comfort', component: TechnicalComfortStep },
  { id: 5, title: 'Account Setup', component: AccountSetupStep },
  { id: 6, title: 'How did you hear about us?', component: ReferralStep }
];

interface OnboardingData {
  basicInfo: any;
  teachingEnvironment: any;
  goals: any;
  technicalComfort: any;
  accountSetup: any;
  referral: any;
}

interface TeacherOnboardingProps {
  onComplete: () => void;
}

const TeacherOnboarding: React.FC<TeacherOnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showGuidedTour, setShowGuidedTour] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    basicInfo: {},
    teachingEnvironment: {},
    goals: {},
    technicalComfort: {},
    accountSetup: {},
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
    if (!user) {
      toast({
        title: "Error",
        description: "User not found. Please try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Saving onboarding data:', onboardingData);
      
      // Save onboarding data to the users table
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          full_name: onboardingData.basicInfo.fullName,
          onboarding_complete: true,
        })
        .eq('id', user.id);

      if (userUpdateError) {
        console.error('Error updating user:', userUpdateError);
        throw userUpdateError;
      }

      // Update the user's metadata in auth to include onboarding completion
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          onboarding_complete: true,
          onboarding_data: onboardingData
        }
      });

      if (authUpdateError) {
        console.error('Error updating auth metadata:', authUpdateError);
      }

      // Show welcome screen first
      setShowWelcome(true);
      
      // After 3 seconds, show guided tour or complete
      setTimeout(() => {
        const needsGuidedTour = onboardingData.technicalComfort?.needsGuidedTour === 'guided';
        if (needsGuidedTour) {
          setShowWelcome(false);
          setShowGuidedTour(true);
        } else {
          toast({
            title: "Welcome to aiTA! ✨",
            description: "Your teaching journey just got a whole lot easier!"
          });
          onComplete();
        }
      }, 3000);
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
      6: 'referral'
    };
    return keyMap[currentStep];
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTourComplete = () => {
    setShowGuidedTour(false);
    toast({
      title: "Welcome to aiTA! ✨",
      description: "Your teaching journey just got a whole lot easier!"
    });
    onComplete();
  };

  // Show guided tour
  if (showGuidedTour) {
    return <GuidedTour onComplete={handleTourComplete} />;
  }

  // Welcome completion screen
  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center animate-fade-in">
        <Card className="max-w-lg mx-4 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <div className="mb-8">
              <div className="relative">
                <Sparkles className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
                <div className="absolute inset-0 w-16 h-16 mx-auto bg-blue-200 rounded-full blur-xl opacity-50"></div>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-6" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to aiTA! 🎉
            </h1>
            
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              You're all set up! Get ready to transform your grading experience with AI that understands your teaching style.
            </p>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-6">
              <p className="text-sm text-blue-800 font-medium">
                {onboardingData.technicalComfort?.needsGuidedTour === 'guided' 
                  ? 'Preparing your guided tour...' 
                  : 'Taking you to your dashboard...'}
              </p>
              <div className="mt-3">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const currentStepKey = getCurrentStepKey();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900">
              Welcome to aiTA! 🧑‍🏫
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
