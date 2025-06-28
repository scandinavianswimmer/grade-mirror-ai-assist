
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface StyleStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData: {
    tone: string;
    priority: string;
    approach: string;
    phrases: string;
  };
}

const StyleStep = ({ onNext, onBack, initialData }: StyleStepProps) => {
  const [formData, setFormData] = useState(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  const isComplete = formData.tone && formData.priority && formData.approach && formData.phrases;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Define Your Teaching Style</h2>
        <p className="text-gray-600">Your answers here will help us understand your voice and priorities.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Question 1: Tone */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">
            When giving feedback, my tone is primarily:
          </Label>
          <RadioGroup
            value={formData.tone}
            onValueChange={(value) => setFormData({ ...formData, tone: value })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="encouraging" id="encouraging" />
              <Label htmlFor="encouraging">Encouraging and Nurturing</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="direct" id="direct" />
              <Label htmlFor="direct">Direct and Analytical</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="formal" id="formal" />
              <Label htmlFor="formal">Formal and Academic</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="collaborative" id="collaborative" />
              <Label htmlFor="collaborative">Collaborative and Inquisitive</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Question 2: Priority */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">
            What is the most important element you look for in a student's essay?
          </Label>
          <RadioGroup
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="thesis" id="thesis" />
              <Label htmlFor="thesis">A strong, clear thesis statement</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="evidence" id="evidence" />
              <Label htmlFor="evidence">The quality and use of supporting evidence</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="structure" id="structure" />
              <Label htmlFor="structure">Logical structure and organization</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="originality" id="originality" />
              <Label htmlFor="originality">Originality and creative thinking</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="grammar" id="grammar" />
              <Label htmlFor="grammar">Grammar and technical correctness</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Question 3: Approach */}
        <div className="space-y-4">
          <Label htmlFor="approach" className="text-base font-semibold">
            Describe your approach to a student who is struggling:
          </Label>
          <Textarea
            id="approach"
            value={formData.approach}
            onChange={(e) => setFormData({ ...formData, approach: e.target.value })}
            placeholder="e.g., 'I always start by pointing out something they did well to build their confidence before moving on to areas for improvement.'"
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-gray-500">
            Do you focus on their strengths first? Are you direct about their weaknesses?
          </p>
        </div>

        {/* Question 4: Phrases */}
        <div className="space-y-4">
          <Label htmlFor="phrases" className="text-base font-semibold">
            Please provide a few common phrases you use when giving feedback:
          </Label>
          <Textarea
            id="phrases"
            value={formData.phrases}
            onChange={(e) => setFormData({ ...formData, phrases: e.target.value })}
            placeholder="e.g., 'This is a great start!', 'Can you provide a specific example here?', 'Make sure to proofread carefully.'"
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-gray-500">
            Include both positive and constructive feedback phrases you commonly use.
          </p>
        </div>

        <div className="flex justify-between pt-6">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" disabled={!isComplete}>
            Next
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StyleStep;
