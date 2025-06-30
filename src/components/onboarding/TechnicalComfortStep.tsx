
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';

interface TechnicalComfortStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack?: () => void;
}

const TechnicalComfortStep: React.FC<TechnicalComfortStepProps> = ({ data, onNext, onBack }) => {
  const [comfortLevel, setComfortLevel] = useState<number[]>([3]);
  const [needsGuidedTour, setNeedsGuidedTour] = useState(data?.needsGuidedTour || '');

  // Ensure comfortLevel is always a valid array
  useEffect(() => {
    if (data?.comfortLevel !== undefined) {
      const level = typeof data.comfortLevel === 'number' ? data.comfortLevel : 3;
      setComfortLevel([level]);
    }
  }, [data]);

  const getComfortLabel = (value: number) => {
    const labels = ['Not Comfortable', 'Slightly Comfortable', 'Moderately Comfortable', 'Comfortable', 'Very Comfortable'];
    return labels[value - 1] || 'Moderately Comfortable';
  };

  const handleSliderChange = (value: number[]) => {
    // Ensure we always have a valid array
    if (Array.isArray(value) && value.length > 0) {
      setComfortLevel(value);
    }
  };

  const handleNext = () => {
    onNext({
      comfortLevel: comfortLevel[0] || 3,
      needsGuidedTour
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-4 block">
          How comfortable are you with using new technology tools?
        </Label>
        <div className="px-4">
          <Slider
            value={comfortLevel}
            onValueChange={handleSliderChange}
            max={5}
            min={1}
            step={1}
            className="mb-4"
          />
          <div className="text-center">
            <span className="text-sm font-medium text-blue-600">
              {getComfortLabel(comfortLevel[0] || 3)}
            </span>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-base font-medium mb-4 block">
          Would you like a guided tour or to explore on your own?
        </Label>
        <RadioGroup value={needsGuidedTour} onValueChange={setNeedsGuidedTour}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="guided" id="guided" />
            <Label htmlFor="guided">I'd like a guided tour</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="explore" id="explore" />
            <Label htmlFor="explore">I'll explore on my own</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex justify-between pt-6">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <Button 
          onClick={handleNext}
          disabled={!needsGuidedTour}
          className="ml-auto"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default TechnicalComfortStep;
