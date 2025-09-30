import { useState, useCallback, useEffect, useRef } from 'react';
import { GrammarlyTooltip } from './GrammarlyTooltip';
import type { AnchorRange } from '@/lib/annotations/resolveAnchors';

interface GrammarlyAnnotationsProps {
  body: string;
  anchors: AnchorRange[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string, newComment: string) => void;
  acceptedIds?: Set<string>;
  rejectedIds?: Set<string>;
}

const categoryColors = {
  grammar: 'bg-red-200/40 border-b-2 border-red-500',
  spelling: 'bg-red-200/40 border-b-2 border-red-500',
  content: 'bg-blue-200/40 border-b-2 border-blue-500',
  structure: 'bg-purple-200/40 border-b-2 border-purple-500',
  style: 'bg-green-200/40 border-b-2 border-green-500',
  clarity: 'bg-yellow-200/40 border-b-2 border-yellow-500',
  default: 'bg-gray-200/40 border-b-2 border-gray-500'
};

export function GrammarlyAnnotations({
  body,
  anchors,
  onAccept,
  onReject,
  onEdit,
  acceptedIds = new Set(),
  rejectedIds = new Set()
}: GrammarlyAnnotationsProps) {
  const [activeAnchor, setActiveAnchor] = useState<AnchorRange | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter out accepted/rejected anchors
  const visibleAnchors = anchors.filter(
    a => !acceptedIds.has(a.id) && !rejectedIds.has(a.id)
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeAnchor) return;

      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          onAccept(activeAnchor.id);
          setActiveAnchor(null);
          break;
        case 'x':
        case 'X':
          e.preventDefault();
          onReject(activeAnchor.id);
          setActiveAnchor(null);
          break;
        case 'e':
        case 'E':
          e.preventDefault();
          // Tooltip handles edit mode
          break;
        case 'Escape':
          e.preventDefault();
          setActiveAnchor(null);
          break;
        case 'Tab':
          e.preventDefault();
          // Navigate to next annotation
          const nextIndex = (currentIndex + 1) % visibleAnchors.length;
          setCurrentIndex(nextIndex);
          focusAnnotation(visibleAnchors[nextIndex]);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAnchor, onAccept, onReject, currentIndex, visibleAnchors]);

  const focusAnnotation = (anchor: AnchorRange) => {
    const element = document.querySelector(`[data-annotation-id=\\"${anchor.id}\\"]`);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTooltipPosition({ x: rect.left, y: rect.top });
      setActiveAnchor(anchor);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleAnnotationHover = useCallback((anchor: AnchorRange, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setTooltipPosition({ x: rect.left, y: rect.top });
    setActiveAnchor(anchor);
    setCurrentIndex(visibleAnchors.findIndex(a => a.id === anchor.id));
  }, [visibleAnchors]);

  const handleMouseLeave = useCallback(() => {
    // Keep tooltip open for a moment to allow interaction
    setTimeout(() => {
      if (activeAnchor && !document.querySelector('[data-tooltip]:hover')) {
        setActiveAnchor(null);
      }
    }, 200);
  }, [activeAnchor]);

  // Split text into segments with annotations
  const renderAnnotatedText = () => {
    const segments: JSX.Element[] = [];
    let lastIndex = 0;

    const sortedAnchors = [...visibleAnchors].sort((a, b) => a.start - b.start);

    sortedAnchors.forEach((anchor, idx) => {
      // Add text before annotation
      if (anchor.start > lastIndex) {
        segments.push(
          <span key={`text-${idx}`}>
            {body.slice(lastIndex, anchor.start)}
          </span>
        );
      }

      // Add annotated text
      const category = (anchor as any).category || 'default';
      const categoryKey = category.toLowerCase() as keyof typeof categoryColors;
      const colorClass = categoryColors[categoryKey] || categoryColors.default;

      segments.push(
        <span
          key={anchor.id}
          data-annotation-id={anchor.id}
          className={`${colorClass} cursor-pointer transition-all hover:opacity-80 relative inline-block`}
          onMouseEnter={(e) => handleAnnotationHover(anchor, e)}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => handleAnnotationHover(anchor, e)}
        >
          {anchor.text}
        </span>
      );

      lastIndex = anchor.end;
    });

    // Add remaining text
    if (lastIndex < body.length) {
      segments.push(
        <span key="text-end">
          {body.slice(lastIndex)}
        </span>
      );
    }

    return segments;
  };

  // Split into paragraphs and render
  const paragraphs = body.split(/\n\s*\n/).filter(p => p.trim());

  return (
    <div ref={containerRef} className="relative">
      <div className="prose max-w-none leading-relaxed">
        {paragraphs.map((paragraph, idx) => (
          <p key={`p-${idx}`} className="mb-4 break-words">
            {renderAnnotatedText()}
          </p>
        ))}
      </div>

      {activeAnchor && (
        <div data-tooltip>
          <GrammarlyTooltip
            comment={activeAnchor.comment}
            category={(activeAnchor as any).category || 'feedback'}
            onAccept={() => {
              onAccept(activeAnchor.id);
              setActiveAnchor(null);
            }}
            onReject={() => {
              onReject(activeAnchor.id);
              setActiveAnchor(null);
            }}
            onEdit={(newComment) => {
              onEdit(activeAnchor.id, newComment);
              setActiveAnchor(null);
            }}
            position={tooltipPosition}
            isVisible={true}
          />
        </div>
      )}

      {/* Progress indicator */}
      {visibleAnchors.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg px-4 py-2 border">
          <p className="text-sm font-medium">
            {anchors.length - visibleAnchors.length} of {anchors.length} reviewed
          </p>
          <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
            <div
              className="h-2 bg-green-500 rounded-full transition-all"
              style={{
                width: `${((anchors.length - visibleAnchors.length) / anchors.length) * 100}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Keyboard hints */}
      <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2 border text-xs space-y-1">
        <p><kbd className="px-1 py-0.5 bg-gray-100 rounded">Tab</kbd> Next comment</p>
        <p><kbd className="px-1 py-0.5 bg-gray-100 rounded">Enter</kbd> Accept</p>
        <p><kbd className="px-1 py-0.5 bg-gray-100 rounded">X</kbd> Reject</p>
        <p><kbd className="px-1 py-0.5 bg-gray-100 rounded">E</kbd> Edit</p>
      </div>
    </div>
  );
}
