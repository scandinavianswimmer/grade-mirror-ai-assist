
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface AccountSetupData {
  inviteColleagues?: string;
  syncLMS?: string;
}

interface AccountSetupStepProps {
  data?: AccountSetupData;
  onNext: (data: AccountSetupData) => void;
  onBack?: () => void;
}

const AccountSetupStep: React.FC<AccountSetupStepProps> = ({ data, onNext, onBack }) => {
  const [inviteColleagues, setInviteColleagues] = useState(data?.inviteColleagues || '');
  const [syncLMS, setSyncLMS] = useState('independent'); // Default to independent

  const handleNext = () => {
    onNext({
      inviteColleagues,
      syncLMS: 'independent'
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
          How would you like to use aiTA?
        </Label>
        <RadioGroup value={syncLMS} onValueChange={setSyncLMS}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="independent" id="independent" />
            <Label htmlFor="independent" className="font-medium">I will use it independently</Label>
          </div>
          <div className="flex items-center space-x-2 opacity-50">
            <RadioGroupItem value="sync-yes" id="sync-yes" disabled className="cursor-not-allowed" />
            <Label htmlFor="sync-yes" className="text-gray-400 cursor-not-allowed">
              Sync with Google Classroom / LMS <span className="text-xs">(Coming Soon)</span>
            </Label>
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
          disabled={!inviteColleagues}
          className="ml-auto"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default AccountSetupStep;
