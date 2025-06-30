
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TeachingEnvironmentStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack?: () => void;
}

const TEACHING_ENVIRONMENTS = [
  'Public School',
  'Private School',
  'Charter School',
  'Homeschool',
  'Online Only',
  'Other'
];

const STUDENT_COUNTS = [
  '1–10',
  '11–25',
  '26–50',
  '50+'
];

const TeachingEnvironmentStep: React.FC<TeachingEnvironmentStepProps> = ({ data, onNext, onBack }) => {
  const [environment, setEnvironment] = useState(data?.environment || '');
  const [studentCount, setStudentCount] = useState(data?.studentCount || '');

  const handleNext = () => {
    if (!environment || !studentCount) {
      return;
    }

    onNext({
      environment,
      studentCount
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-4 block">
          Where do you primarily teach?
        </Label>
        <RadioGroup value={environment} onValueChange={setEnvironment}>
          {TEACHING_ENVIRONMENTS.map((env) => (
            <div key={env} className="flex items-center space-x-2">
              <RadioGroupItem value={env} id={env} />
              <Label htmlFor={env}>{env}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div>
        <Label htmlFor="student-count" className="text-base font-medium">
          How many students do you typically work with?
        </Label>
        <Select value={studentCount} onValueChange={setStudentCount}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select student count range" />
          </SelectTrigger>
          <SelectContent>
            {STUDENT_COUNTS.map((count) => (
              <SelectItem key={count} value={count}>
                {count} students
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-between pt-6">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <Button 
          onClick={handleNext}
          disabled={!environment || !studentCount}
          className="ml-auto"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default TeachingEnvironmentStep;
