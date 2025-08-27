
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GuidedTourProps {
  onComplete: () => void;
}

const TOUR_STEPS = [
  {
    title: "Welcome to aiTA! 🎉",
    content: "Let's take a quick tour to show you around. This will help you get the most out of our AI-powered grading assistant.",
    position: "center"
  },
  {
    title: "Dashboard Overview",
    content: "This is your main dashboard where you can see all your classes and assignments. You can track your grading progress and manage your teaching workflow.",
    target: "[data-tour='dashboard-overview']",
    position: "bottom"
  },
  {
    title: "Creating Classes",
    content: "Start by creating classes for your courses. Click here to add a new class with details like grade level, size, and schedule.",
    target: "[data-tour='create-class']",
    position: "bottom"
  },
  {
    title: "Managing Classes",
    content: "You can edit your classes anytime by clicking the edit button. Update class details, student rosters, and schedules as needed.",
    target: "[data-tour='edit-class']",
    position: "top"
  },
  {
    title: "Creating Assignments",
    content: "Once you have classes, create assignments for your students. Set grading criteria and let our AI help with consistent grading.",
    target: "[data-tour='create-assignment']",
    position: "bottom"
  },
  {
    title: "Uploading Student Work",
    content: "Upload student submissions easily. Our AI will analyze them based on your grading style and provide detailed feedback.",
    target: "[data-tour='upload-section']",
    position: "top"
  },
  {
    title: "AI-Powered Grading",
    content: "Our AI has learned from your 10 uploaded examples and will grade consistently according to your standards. You can always review and adjust the feedback.",
    target: "[data-tour='grading-results']",
    position: "center"
  }
];

const GuidedTour: React.FC<GuidedTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Add spotlight effect for the current target
  useEffect(() => {
    const currentStepData = TOUR_STEPS[currentStep];
    if (currentStepData.target) {
      const element = document.querySelector(currentStepData.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add spotlight effect
        element.classList.add('tour-spotlight');
        return () => {
          element.classList.remove('tour-spotlight');
        };
      }
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    // Mark tour as completed in database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('users')
          .update({ guided_tour_completed: true })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error marking tour as completed:', error);
    }
    
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) return null;

  const currentStepData = TOUR_STEPS[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity">
        {/* Tour Card */}
        <div className={`absolute ${
          currentStepData.position === 'center' 
            ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
            : 'top-20 left-1/2 transform -translate-x-1/2'
        }`}>
          <Card className="w-96 shadow-2xl animate-fade-in">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{currentStepData.title}</h3>
                  <div className="text-sm text-gray-500 mb-3">
                    Step {currentStep + 1} of {TOUR_STEPS.length}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                {currentStepData.content}
              </p>
              
              <div className="flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  onClick={handleSkip}
                  className="text-gray-500"
                >
                  Skip Tour
                </Button>
                
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={handlePrevious}
                      size="sm"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                  )}
                  
                  <Button onClick={handleNext} size="sm">
                    {currentStep < TOUR_STEPS.length - 1 ? (
                      <>
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      'Get Started!'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default GuidedTour;
