'use client';
import { splitIntoSpans } from '@/lib/annotations/splitIntoSpans';
import type { AnchorRange } from '@/lib/annotations/resolveAnchors';
import { useCallback } from 'react';

export default function EssayWithAnnotations({ 
  body, 
  anchors, 
  onFocus 
}: { 
  body: string; 
  anchors: AnchorRange[]; 
  onFocus?: (id: string) => void; 
}) {
  const spans = splitIntoSpans(body, anchors);
  const handleClick = useCallback((id: string) => onFocus?.(id), [onFocus]);

  // Simple paragraph split by blank lines
  const paragraphs = body.split(/\n\s*\n/).filter(p => p.trim());
  let globalCursor = 0;

  return (
    <div className="prose max-w-none">
      {paragraphs.map((paragraph, pi) => {
        const paragraphStart = globalCursor;
        const paragraphEnd = paragraphStart + paragraph.length;
        
        // Find spans that fall within this paragraph
        const paragraphSpans = spans.filter(span => {
          if (span.type === 'text') {
            // For text spans, check if they overlap with this paragraph
            const spanStart = body.indexOf(span.text, paragraphStart);
            return spanStart >= paragraphStart && spanStart < paragraphEnd;
          } else {
            // For annotation spans, check if anchor falls within paragraph
            const anchor = span.anchor!;
            return anchor.start >= paragraphStart && anchor.end <= paragraphEnd;
          }
        });

        // If no spans found for this paragraph, render as plain text
        if (paragraphSpans.length === 0) {
          globalCursor = paragraphEnd + 2; // account for paragraph separator
          return (
            <p key={`p-${pi}`} className="break-inside-avoid">
              {paragraph}
            </p>
          );
        }

        // Render paragraph with spans
        let paragraphCursor = paragraphStart;
        const content: JSX.Element[] = [];
        let spanIndex = 0;

        // Build content for this paragraph
        const sortedAnchors = anchors
          .filter(a => a.start >= paragraphStart && a.end <= paragraphEnd)
          .sort((a, b) => a.start - b.start);

        sortedAnchors.forEach((anchor, idx) => {
          // Add text before this anchor
          if (anchor.start > paragraphCursor) {
            const textBefore = body.slice(paragraphCursor, anchor.start);
            content.push(
              <span key={`text-${pi}-${idx}`}>
                {textBefore}
              </span>
            );
          }

          // Add the anchor
          content.push(
            <button
              key={anchor.id}
              className="anno-underline"
              data-id={anchor.id}
              onClick={() => handleClick(anchor.id)}
              aria-describedby={`note-${anchor.id}`}
            >
              {anchor.text}
              <sup className="anno-sup align-super text-red-600 print:inline hidden">
                [{anchor.n}]
              </sup>
            </button>
          );

          paragraphCursor = anchor.end;
        });

        // Add remaining text in paragraph
        if (paragraphCursor < paragraphEnd) {
          const remainingText = body.slice(paragraphCursor, paragraphEnd);
          content.push(
            <span key={`text-end-${pi}`}>
              {remainingText}
            </span>
          );
        }

        globalCursor = paragraphEnd + 2; // account for paragraph separator

        return (
          <p key={`p-${pi}`} className="break-inside-avoid">
            {content.length > 0 ? content : paragraph}
          </p>
        );
      })}
    </div>
  );
}