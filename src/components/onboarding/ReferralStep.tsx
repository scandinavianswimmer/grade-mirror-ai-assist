
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ReferralStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack?: () => void;
}

const REFERRAL_OPTIONS = [
  'Google Search',
  'Facebook Ad',
  'Instagram Ad',
  'TikTok',
  'YouTube',
  'Twitter/X',
  'Reddit',
  'Referral from another teacher',
  'School administrator or district',
  'Conference or education event',
  'Blog or article',
  'Podcast',
  'Email newsletter',
  'Other (please specify)'
];

const ReferralStep: React.FC<ReferralStepProps> = ({ data, onNext, onBack }) => {
  const [referralSource, setReferralSource] = useState(data?.referralSource || '');
  const [otherReferral, setOtherReferral] = useState(data?.otherReferral || '');

  const handleNext = () => {
    if (!referralSource) {
      return;
    }

    if (referralSource === 'Other (please specify)' && !otherReferral.trim()) {
      return;
    }

    onNext({
      referralSource,
      otherReferral: referralSource === 'Other (please specify)' ? otherReferral : ''
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-4 block">
          How did you hear about us?
        </Label>
        <RadioGroup value={referralSource} onValueChange={setReferralSource}>
          {REFERRAL_OPTIONS.map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={option} />
              <Label htmlFor={option} className="text-sm">{option}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {referralSource === 'Other (please specify)' && (
        <div>
          <Label htmlFor="other-referral">Please specify:</Label>
          <Input
            id="other-referral"
            value={otherReferral}
            onChange={(e) => setOtherReferral(e.target.value)}
            placeholder="Tell us how you heard about us"
            className="mt-1"
          />
        </div>
      )}

      <div className="flex justify-between pt-6">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <Button 
          onClick={handleNext}
          disabled={!referralSource || (referralSource === 'Other (please specify)' && !otherReferral.trim())}
          className="ml-auto"
        >
          Complete Setup
        </Button>
      </div>
    </div>
  );
};

export default ReferralStep;
