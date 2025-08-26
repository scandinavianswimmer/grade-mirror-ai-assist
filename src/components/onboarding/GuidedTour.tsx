
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

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
    content: "This is your main dashboard where you can see all your assignments, recent activity, and quick stats about your grading progress.",
    target: ".dashboard-overview",
    position: "bottom"
  },
  {
    title: "Create New Assignment",
    content: "Click here to create a new assignment. You can set grading criteria, upload student submissions, and let our AI help with grading.",
    target: "[data-tour='create-assignment']",
    position: "bottom"
  },
  {
    title: "AI Grading Assistant",
    content: "Our AI learns your grading style and provides consistent, detailed feedback on student work. It saves you hours while maintaining your standards.",
    target: ".grading-section",
    position: "top"
  },
  {
    title: "View Your Assignments",
    content: "Here you can see all your assignments, track progress, and access detailed grading reports for each one.",
    target: ".assignments-list",
    position: "top"
  },
  {
    title: "Settings & Training",
    content: "Use this area to train the AI on your grading style, adjust settings, and customize how aiTA works for you.",
    target: ".settings-section",
    position: "left"
  }
];

const GuidedTour: React.FC<GuidedTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

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

  const handleComplete = () => {
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
