
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassCreated: () => void;
}

const CreateClassModal = ({ isOpen, onClose, onClassCreated }: CreateClassModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    className: '',
    gradeLevel: '',
    classSize: '',
    classLevel: '',
    classTime: ''
  });

  const gradeOptions = [
    '6th Grade',
    '7th Grade', 
    '8th Grade',
    '9th Grade',
    '10th Grade',
    '11th Grade',
    '12th Grade',
    'College/University'
  ];

  const classLevelOptions = [
    'Standard',
    'Honors / Advanced',
    'AP / IB',
    'Special Education',
    'Gifted Program',
    'English Language Learner (ELL)'
  ];

  const timeOptions = [
    '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    console.log('Submitting class creation with data:', formData);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-class', {
        body: {
          className: formData.className,
          gradeLevel: formData.gradeLevel,
          classSize: formData.classSize,
          classLevel: formData.classLevel,
          classTime: formData.classTime
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Class created successfully:', data);

      toast({
        title: "Class created successfully!",
        description: `${formData.className} has been added to your classes.`
      });

      // Reset form and close modal
      setFormData({
        className: '',
        gradeLevel: '',
        classSize: '',
        classLevel: '',
        classTime: ''
      });
      
      onClassCreated();
      onClose();

    } catch (error) {
      console.error('Error creating class:', error);
      toast({
        title: "Error creating class",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      className: '',
      gradeLevel: '',
      classSize: '',
      classLevel: '',
      classTime: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a New Class</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="className">Class Name</Label>
            <Input
              id="className"
              value={formData.className}
              onChange={(e) => handleInputChange('className', e.target.value)}
              placeholder="e.g., English 10 - Period 3"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gradeLevel">Grade Level</Label>
            <Select value={formData.gradeLevel} onValueChange={(value) => handleInputChange('gradeLevel', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select grade level" />
              </SelectTrigger>
              <SelectContent>
                {gradeOptions.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="classTime">Class Time</Label>
            <Select value={formData.classTime} onValueChange={(value) => handleInputChange('classTime', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select class time" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="classSize">Class Size (Number of Students)</Label>
            <Input
              id="classSize"
              type="number"
              value={formData.classSize}
              onChange={(e) => handleInputChange('classSize', e.target.value)}
              placeholder="e.g., 30"
              min="1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="classLevel">Class Level</Label>
            <Select value={formData.classLevel} onValueChange={(value) => handleInputChange('classLevel', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select class level" />
              </SelectTrigger>
              <SelectContent>
                {classLevelOptions.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating Class...' : 'Create Class'}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClassModal;
