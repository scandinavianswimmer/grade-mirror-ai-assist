
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import BasicInfoStep, { type BasicInfoData } from './BasicInfoStep';
import TeachingEnvironmentStep, { type TeachingEnvironmentData } from './TeachingEnvironmentStep';
import GoalsStep, { type GoalsData } from './GoalsStep';
import TechnicalComfortStep, { type TechnicalComfortData } from './TechnicalComfortStep';
import AccountSetupStep, { type AccountSetupData } from './AccountSetupStep';
import ReferralStep, { type ReferralData } from './ReferralStep';
import { updateOnboardingProfile, checkGuidedTourStatus } from '@/lib/onboardingApi';
import GuidedTour from './GuidedTour';

const STEPS = [
  { id: 1, title: 'Basic Information' },
  { id: 2, title: 'Teaching Environment' },
  { id: 3, title: 'Goals & Use Cases' },
  { id: 4, title: 'Technical Comfort' },
  { id: 5, title: 'Account Setup' },
  { id: 6, title: 'How did you hear about us?' }
];

interface OnboardingData {
  basicInfo: BasicInfoData;
  teachingEnvironment: TeachingEnvironmentData;
  goals: GoalsData;
  technicalComfort: TechnicalComfortData;
  accountSetup: AccountSetupData;
  referral: ReferralData;
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

  const handleStepComplete = <K extends keyof OnboardingData>(
    stepKey: K,
    stepData: OnboardingData[K]
  ) => {
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

      // Check if they requested guided tour and haven't completed it
      const wantsGuidedTour = onboardingData.technicalComfort?.needsGuidedTour === 'guided';
      const tourCompleted = await checkGuidedTourStatus(user.id);
      
      if (wantsGuidedTour && !tourCompleted) {
        setShowWelcome(true);
        // After 3 seconds, show guided tour
        setTimeout(() => {
          setShowWelcome(false);
          setShowGuidedTour(true);
        }, 3000);
      } else {
        // Show welcome screen first
        setShowWelcome(true);
        // After 3 seconds, complete onboarding
        setTimeout(() => {
          toast({
            title: "Welcome to Mr Selby! ✨",
            description: "Your teaching journey just got a whole lot easier!"
          });
          onComplete();
        }, 3000);
      }
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast({
        title: "Error",
        description: "There was an issue saving your information. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderCurrentStep = () => {
    const onBack = currentStep > 1 ? handleBack : undefined;

    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            data={onboardingData.basicInfo}
            onNext={(data) => handleStepComplete('basicInfo', data)}
            onBack={onBack}
          />
        );
      case 2:
        return (
          <TeachingEnvironmentStep
            data={onboardingData.teachingEnvironment}
            onNext={(data) => handleStepComplete('teachingEnvironment', data)}
            onBack={onBack}
          />
        );
      case 3:
        return (
          <GoalsStep
            data={onboardingData.goals}
            onNext={(data) => handleStepComplete('goals', data)}
            onBack={onBack}
          />
        );
      case 4:
        return (
          <TechnicalComfortStep
            data={onboardingData.technicalComfort}
            onNext={(data) => handleStepComplete('technicalComfort', data)}
            onBack={onBack}
          />
        );
      case 5:
        return (
          <AccountSetupStep
            data={onboardingData.accountSetup}
            onNext={(data) => handleStepComplete('accountSetup', data)}
            onBack={onBack}
          />
        );
      case 6:
        return (
          <ReferralStep
            data={onboardingData.referral}
            onNext={(data) => handleStepComplete('referral', data)}
            onBack={onBack}
          />
        );
      default:
        return null;
    }
  };

  const handleTourComplete = () => {
    setShowGuidedTour(false);
    toast({
      title: "Welcome to Mr Selby! ✨",
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
              Welcome to Mr Selby! 🎉
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900">
              Welcome to Mr Selby! 🧑‍🏫
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
            {renderCurrentStep()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherOnboarding;
