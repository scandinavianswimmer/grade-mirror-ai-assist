
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface BasicInfoStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack?: () => void;
}

const GRADE_OPTIONS = [
  'Pre-K',
  'Elementary',
  'Middle School',
  'High School',
  'College',
  'Other'
];

const SUBJECT_OPTIONS = [
  'Math',
  'English',
  'Science',
  'History',
  'Art',
  'Physical Education',
  'Music',
  'Special Education',
  'Computer Science',
  'Foreign Language',
  'Other'
];

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ data, onNext, onBack }) => {
  const [fullName, setFullName] = useState(data?.fullName || '');
  const [grades, setGrades] = useState<string[]>(data?.grades || []);
  const [subjects, setSubjects] = useState<string[]>(data?.subjects || []);

  const handleGradeChange = (grade: string, checked: boolean) => {
    if (checked) {
      setGrades(prev => [...prev, grade]);
    } else {
      setGrades(prev => prev.filter(g => g !== grade));
    }
  };

  const handleSubjectChange = (subject: string, checked: boolean) => {
    if (checked) {
      setSubjects(prev => [...prev, subject]);
    } else {
      setSubjects(prev => prev.filter(s => s !== subject));
    }
  };

  const handleNext = () => {
    if (!fullName || grades.length === 0 || subjects.length === 0) {
      return;
    }

    onNext({
      fullName,
      grades,
      subjects
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="fullName">What is your full name?</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-base font-medium">What grade(s) or age group(s) do you teach?</Label>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {GRADE_OPTIONS.map((grade) => (
            <div key={grade} className="flex items-center space-x-2">
              <Checkbox
                id={`grade-${grade}`}
                checked={grades.includes(grade)}
                onCheckedChange={(checked) => handleGradeChange(grade, checked as boolean)}
              />
              <Label htmlFor={`grade-${grade}`} className="text-sm">{grade}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base font-medium">What subject(s) do you teach?</Label>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {SUBJECT_OPTIONS.map((subject) => (
            <div key={subject} className="flex items-center space-x-2">
              <Checkbox
                id={`subject-${subject}`}
                checked={subjects.includes(subject)}
                onCheckedChange={(checked) => handleSubjectChange(subject, checked as boolean)}
              />
              <Label htmlFor={`subject-${subject}`} className="text-sm">{subject}</Label>
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
          disabled={!fullName || grades.length === 0 || subjects.length === 0}
          className="ml-auto"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default BasicInfoStep;
