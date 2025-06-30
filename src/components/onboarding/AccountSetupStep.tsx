
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface AccountSetupStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack?: () => void;
}

const AccountSetupStep: React.FC<AccountSetupStepProps> = ({ data, onNext, onBack }) => {
  const [inviteColleagues, setInviteColleagues] = useState(data?.inviteColleagues || '');
  const [syncLMS, setSyncLMS] = useState(data?.syncLMS || '');

  const handleNext = () => {
    onNext({
      inviteColleagues,
      syncLMS
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-4 block">
          Do you want to invite co-teachers or assistants now?
        </Label>
        <RadioGroup value={inviteColleagues} onValueChange={setInviteColleagues}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="invite-yes" />
            <Label htmlFor="invite-yes">Yes, I'd like to invite colleagues</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="invite-no" />
            <Label htmlFor="invite-no">No, not right now</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label className="text-base font-medium mb-4 block">
          Would you like to sync with your Google Classroom / LMS now?
        </Label>
        <RadioGroup value={syncLMS} onValueChange={setSyncLMS}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="sync-yes" />
            <Label htmlFor="sync-yes">Yes, set up sync now</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="sync-no" />
            <Label htmlFor="sync-no">No, I'll do this later</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="na" id="sync-na" />
            <Label htmlFor="sync-na">I don't use an LMS</Label>
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
          disabled={!inviteColleagues || !syncLMS}
          className="ml-auto"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default AccountSetupStep;
