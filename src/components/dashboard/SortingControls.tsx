
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortAsc } from 'lucide-react';

type SortOption = 'time' | 'size' | 'grade' | 'name';

interface SortingControlsProps {
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  hasAnimated: boolean;
  showControls: boolean;
}

const SortingControls = ({ sortBy, onSortChange, hasAnimated, showControls }: SortingControlsProps) => {
  if (!showControls) return null;

  return (
    <div className={`flex items-center gap-4 mb-6 transition-all duration-700 delay-200 ${hasAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center gap-2">
        <SortAsc className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Sort classes by:</span>
      </div>
      <Select value={sortBy} onValueChange={(value: SortOption) => onSortChange(value)}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="time">Class Time</SelectItem>
          <SelectItem value="size">Class Size</SelectItem>
          <SelectItem value="grade">Grade Level</SelectItem>
          <SelectItem value="name">Class Name</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default SortingControls;
