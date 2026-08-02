
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GuidedTourProps {
  onComplete: () => void;
}

const TOUR_STEPS = [
  {
    title: "Welcome to Mr Selby! 🎉",
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const isCompletingRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  const restoreTriggerFocus = useCallback(() => {
    const trigger = returnFocusRef.current;
    if (trigger?.isConnected) {
      trigger.focus();
    }
  }, []);

  useEffect(() => {
    const activeElement = document.activeElement;
    returnFocusRef.current = activeElement instanceof HTMLElement && activeElement !== document.body
      ? activeElement
      : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      restoreTriggerFocus();
    };
  }, [restoreTriggerFocus]);

  useEffect(() => {
    if (!isVisible) return;

    const frame = window.requestAnimationFrame(() => {
      titleRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [currentStep, isVisible]);

  // Add spotlight effect for the current target
  useEffect(() => {
    const currentStepData = TOUR_STEPS[currentStep];
    if (currentStepData.target) {
      const element = document.querySelector(currentStepData.target);
      if (element) {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
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
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;

    setIsVisible(false);
    restoreTriggerFocus();
    window.setTimeout(onComplete, 300);

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
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) return null;

  const currentStepData = TOUR_STEPS[currentStep];

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      void handleComplete();
      return;
    }

    if (event.key !== 'Tab') return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableElements = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true');

    if (focusableElements.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement | null;
    const activeIsFocusable = activeElement ? focusableElements.includes(activeElement) : false;

    if (event.shiftKey && (!activeIsFocusable || activeElement === firstElement)) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && (!activeIsFocusable || activeElement === lastElement)) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 transition-opacity sm:p-6">
      <div
        className={`flex min-h-full justify-center ${
          currentStepData.position === 'center' ? 'items-center' : 'items-start py-12 sm:py-16'
        }`}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          onKeyDown={handleDialogKeyDown}
          className="w-full max-w-md"
        >
          <Card className="max-h-[calc(100dvh-2rem)] w-full overflow-y-auto shadow-2xl animate-fade-in">
            <CardContent className="p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3
                    ref={titleRef}
                    id={titleId}
                    tabIndex={-1}
                    className="mb-2 text-lg font-semibold outline-none"
                  >
                    {currentStepData.title}
                  </h3>
                  <div className="mb-3 text-sm text-gray-500">
                    Step {currentStep + 1} of {TOUR_STEPS.length}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSkip}
                  aria-label="Close guided tour"
                  className="min-h-11 min-w-11 shrink-0 p-0 text-gray-500 hover:text-gray-700"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </Button>
              </div>
              
              <p id={descriptionId} className="mb-6 text-gray-700 leading-relaxed">
                {currentStepData.content}
              </p>
              
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button 
                  variant="ghost" 
                  onClick={handleSkip}
                  className="min-h-11 self-start text-gray-600"
                >
                  Skip Tour
                </Button>
                
                <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
                  {currentStep > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={handlePrevious}
                      size="sm"
                      className="min-h-11"
                    >
                      <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                  )}
                  
                  <Button onClick={handleNext} size="sm" className="min-h-11">
                    {currentStep < TOUR_STEPS.length - 1 ? (
                      <>
                        Next
                        <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
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
    </div>
  );
};

export default GuidedTour;
