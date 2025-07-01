
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, GraduationCap } from 'lucide-react';

interface EmptyClassStateProps {
  onCreateClass: () => void;
  hasAnimated: boolean;
}

const EmptyClassState = ({ onCreateClass, hasAnimated }: EmptyClassStateProps) => {
  return (
    <Card className={`p-12 text-center transition-all duration-700 delay-400 ${hasAnimated ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}>
      <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        No classes created yet
      </h3>
      <p className="text-gray-600 mb-6">
        Create your first class to get started with organizing your assignments!
      </p>
      <Button onClick={onCreateClass}>
        <Plus className="w-4 h-4 mr-2" />
        Create Your First Class
      </Button>
    </Card>
  );
};

export default EmptyClassState;
