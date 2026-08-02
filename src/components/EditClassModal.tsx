import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassUpdated: () => void;
  classData: {
    id: string;
    class_name: string;
    details_jsonb: {
      grade: string;
      size: string;
      level: string;
      time: string;
      students?: string;
    };
  } | null;
  returnFocusRef?: React.RefObject<HTMLElement>;
}

const EditClassModal: React.FC<EditClassModalProps> = ({
  isOpen,
  onClose,
  onClassUpdated,
  classData,
  returnFocusRef,
}) => {
  const [formData, setFormData] = useState({
    className: '',
    grade: '',
    size: '',
    level: '',
    time: '',
    students: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (classData) {
      setFormData({
        className: classData.class_name || '',
        grade: classData.details_jsonb?.grade || '',
        size: classData.details_jsonb?.size || '',
        level: classData.details_jsonb?.level || '',
        time: classData.details_jsonb?.time || '',
        students: classData.details_jsonb?.students || ''
      });
    }
  }, [classData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!classData) return;
    
    if (!formData.className.trim()) {
      toast.error('Class name is required');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('classes')
        .update({
          class_name: formData.className,
          details_jsonb: {
            grade: formData.grade,
        size: formData.size,
            level: formData.level,
            time: formData.time,
            students: formData.students
          }
        })
        .eq('id', classData.id);

      if (error) {
        console.error('Error updating class:', error);
        toast.error('Failed to update class. Please try again.');
        return;
      }

      toast.success('Class updated successfully!');
      onClassUpdated();
      handleCancel();
    } catch (error) {
      console.error('Error updating class:', error);
      toast.error('Failed to update class. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      className: '',
      grade: '',
      size: '',
      level: '',
      time: '',
      students: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="sm:max-w-md"
        data-tour="edit-class-modal"
        onCloseAutoFocus={(event) => {
          if (!returnFocusRef?.current) return;
          event.preventDefault();
          returnFocusRef.current.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit Class</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="className">Class Name</Label>
            <Input
              id="className"
              type="text"
              value={formData.className}
              onChange={(e) => handleInputChange('className', e.target.value)}
              placeholder="e.g., AP Literature Period 3"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade">Grade Level</Label>
            <Select value={formData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
              <SelectTrigger id="grade">
                <SelectValue placeholder="Select grade level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6th">6th Grade</SelectItem>
                <SelectItem value="7th">7th Grade</SelectItem>
                <SelectItem value="8th">8th Grade</SelectItem>
                <SelectItem value="9th">9th Grade</SelectItem>
                <SelectItem value="10th">10th Grade</SelectItem>
                <SelectItem value="11th">11th Grade</SelectItem>
                <SelectItem value="12th">12th Grade</SelectItem>
                <SelectItem value="college">College</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="size">Class Size</Label>
            <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
              <SelectTrigger id="size">
                <SelectValue placeholder="Select class size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (1-15 students)</SelectItem>
                <SelectItem value="medium">Medium (16-25 students)</SelectItem>
                <SelectItem value="large">Large (26+ students)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">Class Level</Label>
            <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
              <SelectTrigger id="level">
                <SelectValue placeholder="Select class level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remedial">Remedial</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="honors">Honors</SelectItem>
                <SelectItem value="ap">AP/Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Class Time</Label>
            <Input
              id="time"
              type="text"
              value={formData.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
              placeholder="e.g., MWF 9:00-10:00 AM"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="students">Student Roster (Optional)</Label>
            <Textarea
              id="students"
              value={formData.students}
              onChange={(e) => handleInputChange('students', e.target.value)}
              placeholder="List student names, one per line or comma-separated"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Class'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditClassModal;
