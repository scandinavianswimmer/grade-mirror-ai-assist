
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PersonalizationStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack?: () => void;
}

const THEME_OPTIONS = [
  { value: 'light', label: 'Light Theme' },
  { value: 'dark', label: 'Dark Theme' },
  { value: 'blue', label: 'Blue Theme' },
  { value: 'green', label: 'Green Theme' }
];

const LAYOUT_OPTIONS = [
  { value: 'compact', label: 'Compact Layout' },
  { value: 'comfortable', label: 'Comfortable Layout' },
  { value: 'spacious', label: 'Spacious Layout' }
];

const PersonalizationStep: React.FC<PersonalizationStepProps> = ({ data, onNext, onBack }) => {
  const [wantPersonalization, setWantPersonalization] = useState(data?.wantPersonalization || '');
  const [theme, setTheme] = useState(data?.theme || '');
  const [layout, setLayout] = useState(data?.layout || '');

  const handleNext = () => {
    onNext({
      wantPersonalization,
      theme: wantPersonalization === 'yes' ? theme : '',
      layout: wantPersonalization === 'yes' ? layout : ''
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-4 block">
          Do you want to personalize your dashboard now?
        </Label>
        <RadioGroup value={wantPersonalization} onValueChange={setWantPersonalization}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="personalize-yes" />
            <Label htmlFor="personalize-yes">Yes, let's customize it</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="personalize-no" />
            <Label htmlFor="personalize-no">No, I'll use the defaults for now</Label>
          </div>
        </RadioGroup>
      </div>

      {wantPersonalization === 'yes' && (
        <>
          <div>
            <Label htmlFor="theme" className="text-base font-medium">
              Choose your theme
            </Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="layout" className="text-base font-medium">
              Choose your layout
            </Label>
            <Select value={layout} onValueChange={setLayout}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a layout" />
              </SelectTrigger>
              <SelectContent>
                {LAYOUT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="flex justify-between pt-6">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <Button 
          onClick={handleNext}
          disabled={!wantPersonalization || (wantPersonalization === 'yes' && (!theme || !layout))}
          className="ml-auto"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default PersonalizationStep;
