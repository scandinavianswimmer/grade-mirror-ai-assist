import { useState, useEffect } from 'react';
import { Check, X, Edit3, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface GrammarlyTooltipProps {
  comment: string;
  category: string;
  onAccept: () => void;
  onReject: () => void;
  onEdit: (newComment: string) => void;
  position: { x: number; y: number };
  isVisible: boolean;
}

const categoryColors = {
  grammar: 'border-red-500 bg-red-50',
  spelling: 'border-red-500 bg-red-50',
  content: 'border-blue-500 bg-blue-50',
  structure: 'border-purple-500 bg-purple-50',
  style: 'border-green-500 bg-green-50',
  clarity: 'border-yellow-500 bg-yellow-50',
  default: 'border-gray-500 bg-gray-50'
};

const categoryIcons = {
  grammar: '📝',
  spelling: '✏️',
  content: '💡',
  structure: '📋',
  style: '🎨',
  clarity: '🔍',
  default: '💭'
};

export function GrammarlyTooltip({
  comment,
  category,
  onAccept,
  onReject,
  onEdit,
  position,
  isVisible
}: GrammarlyTooltipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedComment, setEditedComment] = useState(comment);

  useEffect(() => {
    setEditedComment(comment);
  }, [comment]);

  if (!isVisible) return null;

  const categoryKey = category.toLowerCase() as keyof typeof categoryColors;
  const colorClass = categoryColors[categoryKey] || categoryColors.default;
  const icon = categoryIcons[categoryKey] || categoryIcons.default;

  const handleSaveEdit = () => {
    onEdit(editedComment);
    setIsEditing(false);
  };

  return (
    <div
      className={`absolute z-50 w-80 rounded-lg shadow-xl border-2 ${colorClass} transition-all duration-200 animate-fade-in`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateY(-100%) translateY(-10px)'
      }}
    >
      {/* Header */}
      <div className="px-4 py-2 border-b border-current/20 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wide">
          {category}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editedComment}
              onChange={(e) => setEditedComment(e.target.value)}
              className="min-h-[80px] text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveEdit}
                className="flex-1"
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditedComment(comment);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{comment}</p>
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="px-3 py-2 bg-white/50 border-t border-current/20 flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onAccept}
            className="flex-1 gap-1 hover:bg-green-100"
            title="Accept (Enter)"
          >
            <Check className="w-3 h-3" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="flex-1 gap-1 hover:bg-blue-100"
            title="Edit (E)"
          >
            <Edit3 className="w-3 h-3" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onReject}
            className="flex-1 gap-1 hover:bg-red-100"
            title="Reject (X)"
          >
            <X className="w-3 h-3" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
