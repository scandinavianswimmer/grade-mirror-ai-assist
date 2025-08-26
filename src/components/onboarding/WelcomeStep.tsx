
import { Button } from '@/components/ui/button';
import { GraduationCap, Clock, Users } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

const WelcomeStep = ({ onNext }: WelcomeStepProps) => {
  return (
    <div className="text-center space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to aiTA</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          We're excited to help you reclaim your time while providing personalized, high-quality feedback to your students. 
          This short setup process will teach our AI to become your personal grading assistant, mirroring your unique style and standards.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 my-12">
        <div className="flex flex-col items-center p-6 bg-blue-50 rounded-lg">
          <Clock className="w-12 h-12 text-blue-600 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Save Time</h3>
          <p className="text-sm text-gray-600 text-center">
            Reduce grading time by up to 70% while maintaining your quality standards
          </p>
        </div>

        <div className="flex flex-col items-center p-6 bg-green-50 rounded-lg">
          <GraduationCap className="w-12 h-12 text-green-600 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Your Style</h3>
          <p className="text-sm text-gray-600 text-center">
            AI learns from your actual grading patterns and feedback style
          </p>
        </div>

        <div className="flex flex-col items-center p-6 bg-purple-50 rounded-lg">
          <Users className="w-12 h-12 text-purple-600 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Better Feedback</h3>
          <p className="text-sm text-gray-600 text-center">
            Provide more consistent, detailed feedback to help students improve
          </p>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">What to Expect</h4>
        <ul className="text-sm text-gray-600 space-y-2 text-left max-w-md mx-auto">
          <li>• Define your teaching and feedback style (2 minutes)</li>
          <li>• Upload 3-5 examples of your graded work (5 minutes)</li>
          <li>• Let our AI learn your patterns and preferences</li>
          <li>• Start grading with your personalized assistant!</li>
        </ul>
      </div>

      <Button onClick={onNext} size="lg" className="px-8">
        Let's Get Started
      </Button>
    </div>
  );
};

export default WelcomeStep;
