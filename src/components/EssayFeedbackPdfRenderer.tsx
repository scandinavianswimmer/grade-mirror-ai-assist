import React from 'react';
import { parseAIFeedback, type ParsedAIFeedback } from '@/lib/aiParser';

interface EssayFeedbackPdfRendererProps {
  essayText: string;
  feedbackJson: string;
  meta: {
    assignmentTitle: string;
    studentName: string;
    teacherName: string;
    generatedAtISO: string;
    course: string;
  };
  onPrint?: () => void;
}

export const EssayFeedbackPdfRenderer: React.FC<EssayFeedbackPdfRendererProps> = ({
  essayText,
  feedbackJson,
  meta,
  onPrint
}) => {
  const parsedFeedback = parseAIFeedback(feedbackJson);
  
  if (!parsedFeedback) {
    return <div className="p-8">Error: Unable to parse feedback data</div>;
  }

  // Function to inject numbered markers into essay text
  const injectMarkers = (text: string, comments: ParsedAIFeedback['inlineComments']) => {
    if (!comments || comments.length === 0) return text;
    
    let annotatedText = text;
    const usedRanges: Array<{start: number, end: number}> = [];
    
    comments.forEach((comment, index) => {
      if (!comment.text) return;
      
      const marker = `[${index + 1}]`;
      
      // Try exact match first
      let matchIndex = annotatedText.indexOf(comment.text);
      
      // Try case-insensitive match
      if (matchIndex === -1) {
        const lowerText = annotatedText.toLowerCase();
        const lowerComment = comment.text.toLowerCase();
        matchIndex = lowerText.indexOf(lowerComment);
      }
      
      // Try whitespace-normalized match
      if (matchIndex === -1) {
        const normalizedText = annotatedText.replace(/\s+/g, ' ').trim();
        const normalizedComment = comment.text.replace(/\s+/g, ' ').trim();
        const normalizedIndex = normalizedText.indexOf(normalizedComment);
        if (normalizedIndex !== -1) {
          // Map back to original text position (approximate)
          matchIndex = normalizedIndex;
        }
      }
      
      if (matchIndex !== -1) {
        const endIndex = matchIndex + comment.text.length;
        
        // Check for overlaps with existing markers
        const hasOverlap = usedRanges.some(range => 
          (matchIndex >= range.start && matchIndex <= range.end) ||
          (endIndex >= range.start && endIndex <= range.end) ||
          (matchIndex <= range.start && endIndex >= range.end)
        );
        
        if (!hasOverlap) {
          annotatedText = annotatedText.slice(0, endIndex) + marker + annotatedText.slice(endIndex);
          usedRanges.push({ start: matchIndex, end: endIndex + marker.length });
        }
      }
    });
    
    return annotatedText;
  };

  const annotatedEssay = injectMarkers(essayText, parsedFeedback.inlineComments);
  
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-background text-foreground">
      {/* Print styles */}
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
          body { margin: 0; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; }
        }
      `}</style>
      
      {/* Print button - hidden in print */}
      <div className="no-print p-4 border-b">
        <button 
          onClick={handlePrint}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Export PDF
        </button>
      </div>

      {/* Header */}
      <div className="p-8 avoid-break">
        <div className="text-center border-b border-border pb-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">{meta.assignmentTitle}</h1>
          <div className="mt-2 text-muted-foreground">
            <p><strong>Student:</strong> {meta.studentName}</p>
            <p><strong>Course:</strong> {meta.course}</p>
            <p><strong>Teacher:</strong> {meta.teacherName}</p>
            <p><strong>Generated:</strong> {new Date(meta.generatedAtISO).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Essay with annotations */}
      <div className="px-8 mb-8 avoid-break">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Essay</h2>
        <div 
          className="prose prose-lg max-w-none bg-muted/20 p-6 rounded border leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ 
            __html: annotatedEssay
              .replace(/\n/g, '<br/>')
              .replace(/\[(\d+)\]/g, '<sup class="bg-primary text-primary-foreground px-1 py-0.5 rounded text-xs font-bold ml-1">[$1]</sup>')
          }}
        />
      </div>

      {/* Feedback & Annotations */}
      {parsedFeedback.inlineComments && parsedFeedback.inlineComments.length > 0 && (
        <div className="px-8 mb-8 page-break">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Feedback & Annotations</h2>
          <div className="space-y-4">
            {parsedFeedback.inlineComments.map((comment, index) => (
              <div key={index} className="border border-border rounded p-4 bg-card avoid-break">
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm font-bold">
                    [{index + 1}]
                  </span>
                  <div className="flex-1">
                    <p className="text-foreground mb-2">{comment.comment}</p>
                    {comment.text && (
                      <blockquote className="border-l-4 border-muted-foreground pl-4 text-muted-foreground italic text-sm">
                        "{comment.text}"
                      </blockquote>
                    )}
                    {comment.category && (
                      <span className="inline-block mt-2 px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                        {comment.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Feedback */}
      {parsedFeedback.overallFeedback && (
        <div className="px-8 mb-8 avoid-break">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Overall Feedback</h2>
          <div className="bg-card border border-border rounded p-6">
            <p className="text-foreground leading-relaxed">{parsedFeedback.overallFeedback}</p>
            {parsedFeedback.reasoning && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="font-medium mb-2 text-foreground">Reasoning:</h4>
                <p className="text-muted-foreground">{parsedFeedback.reasoning}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rubric Breakdown */}
      {parsedFeedback.rubricBreakdown && parsedFeedback.rubricBreakdown.length > 0 && (
        <div className="px-8 mb-8 avoid-break">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Rubric Breakdown</h2>
          <div className="border border-border rounded overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium text-foreground">Criterion</th>
                  <th className="text-left p-3 font-medium text-foreground">Evidence</th>
                  <th className="text-left p-3 font-medium text-foreground">Comment</th>
                  <th className="text-center p-3 font-medium text-foreground">Score</th>
                </tr>
              </thead>
              <tbody>
                {parsedFeedback.rubricBreakdown.map((item, index) => (
                  <tr key={index} className="border-t border-border">
                    <td className="p-3 font-medium text-foreground">{item.criterion}</td>
                    <td className="p-3 text-muted-foreground italic">"{item.evidenceQuote}"</td>
                    <td className="p-3 text-foreground">{item.commentSuggestion}</td>
                    <td className="p-3 text-center font-semibold text-foreground">{item.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suggested Grade */}
      {parsedFeedback.suggestedGrade && (
        <div className="px-8 mb-8 avoid-break">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Suggested Grade</h2>
          <div className="bg-card border border-border rounded p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {parsedFeedback.suggestedGrade}
            </div>
            {parsedFeedback.confidence && (
              <p className="text-muted-foreground">
                Confidence: {Math.round(parsedFeedback.confidence * 100)}%
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};