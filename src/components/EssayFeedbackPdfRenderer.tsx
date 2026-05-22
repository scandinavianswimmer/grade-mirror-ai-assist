import React, { useState } from 'react';
import { parseAIFeedback, type ParsedAIFeedback } from '@/lib/aiParser';
import { resolveAnchors } from '@/lib/annotations/resolveAnchors';
import { moderateStudentText } from '@/lib/moderation';
import EssayWithAnnotations from './EssayWithAnnotations';
import AnnotationSidebar from './AnnotationSidebar';

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
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  
  // Parse the feedback JSON
  const parsedFeedback = parseAIFeedback(feedbackJson);
  
  if (!parsedFeedback) {
    return <div className="p-8">Error: Unable to parse feedback data</div>;
  }

  // Only teacher-approved, student-facing comments belong in the exported PDF — never
  // dismissed or un-reviewed (internal) notes (H27). If no status is present (legacy data),
  // include the comment (it predates the review workflow).
  const studentFacing = (parsedFeedback.inlineComments || []).filter((c) => {
    const status = (c as { status?: string }).status;
    return !status || status === 'accepted' || status === 'edited';
  });

  // Resolve anchors from approved comments. Do not log essay/feedback content (C7).
  const anchors = resolveAnchors(essayText, studentFacing);

  // Non-blocking moderation pass over student-facing text (M70).
  const moderation = moderateStudentText(
    [parsedFeedback.overallFeedback, ...studentFacing.map((c) => c.comment)].filter(Boolean).join(' '),
  );

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Print styles */}
      <style>{`
        .anno-underline {
          text-decoration-line: underline;
          text-decoration-color: #EF4444;
          text-decoration-thickness: 2px;
          text-underline-offset: 2px;
          cursor: pointer;
          background: transparent;
          border: none;
          padding: 0;
          font: inherit;
          color: inherit;
        }
        .anno-underline:hover {
          background-color: rgba(239, 68, 68, 0.1);
        }
        .anno-sup {
          display: none;
        }
        @media print {
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
          body { margin: 0; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; }
          .anno-sup { display: inline !important; }
          .break-inside-avoid { break-inside: avoid; }
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
        {moderation.flagged && (
          <div className="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <strong>Review before sharing:</strong> some feedback may read as harsh to a student.
            <ul className="ml-5 mt-1 list-disc">
              {moderation.reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
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

      {/* Main content grid */}
      <div className="container mx-auto grid grid-cols-12 gap-8 px-8">
        <div className="col-span-12 md:col-span-8 print:col-span-8">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Essay</h2>
          <div className="bg-muted/20 p-6 rounded border leading-relaxed text-foreground">
            <EssayWithAnnotations 
              body={essayText} 
              anchors={anchors} 
              onFocus={setActiveAnchor}
            />
          </div>
        </div>
        
        <div className="col-span-12 md:col-span-4 print:col-span-4">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Comments</h2>
          <AnnotationSidebar anchors={anchors} />
        </div>
      </div>

      {/* Overall Feedback */}
      {parsedFeedback.overallFeedback && (
        <div className="px-8 mb-8 page-break">
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
            {/* Internal AI confidence is intentionally not shown to students (H27/M66). */}
          </div>
        </div>
      )}
    </div>
  );
};