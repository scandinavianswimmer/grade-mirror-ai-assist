
import { Button } from '@/components/ui/button';
import { BookOpen, PenLine, ShieldCheck } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

const WelcomeStep = ({ onNext }: WelcomeStepProps) => {
  return (
    <div className="text-center space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Mr Selby</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Start with one fictional assignment and see a first pass of rubric scores and margin notes.
          You decide what to keep, what to change, and when the work is ready.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 my-12">
        <div className="flex flex-col items-center p-6 bg-blue-50 rounded-lg">
          <BookOpen className="w-12 h-12 text-blue-600 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Open a sample</h3>
          <p className="text-sm text-gray-600 text-center">
            The assignment, rubric, and five fictional responses are already included.
          </p>
        </div>

        <div className="flex flex-col items-center p-6 bg-green-50 rounded-lg">
          <PenLine className="w-12 h-12 text-green-600 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Review the draft</h3>
          <p className="text-sm text-gray-600 text-center">
            Check the rubric evidence and revise the wording in each margin note.
          </p>
        </div>

        <div className="flex flex-col items-center p-6 bg-purple-50 rounded-lg">
          <ShieldCheck className="w-12 h-12 text-purple-600 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Keep the last word</h3>
          <p className="text-sm text-gray-600 text-center">
            Accept, edit, or dismiss each margin note before approval.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">What you will do</h4>
        <ul className="text-sm text-gray-600 space-y-2 text-left max-w-md mx-auto">
          <li>Open a clearly labeled fictional assignment.</li>
          <li>Review one drafted score and margin note.</li>
          <li>Change or approve the draft.</li>
          <li>Add your own assignment only when you are ready.</li>
        </ul>
      </div>

      <Button onClick={onNext} size="lg" className="px-8">
        Review the sample assignment
      </Button>
    </div>
  );
};

export default WelcomeStep;
