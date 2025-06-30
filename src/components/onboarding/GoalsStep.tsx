
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface GoalsStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack?: () => void;
}

const GOAL_OPTIONS = [
  'Lesson planning',
  'Student progress tracking',
  'Classroom engagement',
  'Parent communication',
  'Sharing resources',
  'Behavior management',
  'AI support (e.g., grading, summaries, etc.)'
];

const GoalsStep: React.FC<GoalsStepProps> = ({ data, onNext, onBack }) => {
  const [goals, setGoals] = useState<string[]>(data?.goals || []);

  const handleGoalChange = (goal: string, checked: boolean) => {
    if (checked) {
      setGoals(prev => [...prev, goal]);
    } else {
      setGoals(prev => prev.filter(g => g !== goal));
    }
  };

  const handleNext = () => {
    if (goals.length === 0) {
      return;
    }

    onNext({
      goals
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-4 block">
          What are you hoping to use GradeMirror for? (Choose all that apply)
        </Label>
        <div className="space-y-3">
          {GOAL_OPTIONS.map((goal) => (
            <div key={goal} className="flex items-center space-x-2">
              <Checkbox
                id={`goal-${goal}`}
                checked={goals.includes(goal)}
                onCheckedChange={(checked) => handleGoalChange(goal, checked as boolean)}
              />
              <Label htmlFor={`goal-${goal}`} className="text-sm">{goal}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-6">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <Button 
          onClick={handleNext}
          disabled={goals.length === 0}
          className="ml-auto"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default GoalsStep;
