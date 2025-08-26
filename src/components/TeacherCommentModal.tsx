import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, X } from 'lucide-react';

interface TeacherComment {
  id: string;
  text_start: number;
  text_end: number;
  comment_text: string;
  comment_type: 'positive' | 'negative' | 'neutral';
  created_at: string;
}

interface TeacherCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (comment: Omit<TeacherComment, 'id' | 'created_at'>) => void;
  selectedText: string;
  textStart: number;
  textEnd: number;
  existingComment?: TeacherComment;
}

export const TeacherCommentModal: React.FC<TeacherCommentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedText,
  textStart,
  textEnd,
  existingComment
}) => {
  const [commentText, setCommentText] = useState(existingComment?.comment_text || '');
  const [commentType, setCommentType] = useState<'positive' | 'negative' | 'neutral'>(
    existingComment?.comment_type || 'neutral'
  );

  const handleSave = () => {
    if (!commentText.trim()) return;
    
    onSave({
      text_start: textStart,
      text_end: textEnd,
      comment_text: commentText.trim(),
      comment_type: commentType
    });
    
    setCommentText('');
    setCommentType('neutral');
    onClose();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {existingComment ? 'Edit Comment' : 'Add Teacher Comment'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Selected Text</label>
            <div className="mt-1 p-3 bg-gray-50 rounded-md border">
              <p className="text-sm italic">"{selectedText}"</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Comment Type</label>
            <Select value={commentType} onValueChange={(value: any) => setCommentType(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor('positive')}>Positive</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="negative">
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor('negative')}>Needs Improvement</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="neutral">
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor('neutral')}>Neutral</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Comment</label>
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add your feedback here..."
              className="mt-1"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!commentText.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {existingComment ? 'Update' : 'Add'} Comment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};