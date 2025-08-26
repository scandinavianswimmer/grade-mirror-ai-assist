// Shared utility for parsing AI feedback JSON structures

export interface AIComment {
  text: string;
  comment: string;
  category?: string;
}

export interface ParsedAIFeedback {
  inlineComments: AIComment[];
  overallFeedback: string;
  suggestedGrade: string;
  reasoning?: string;
  confidence?: number;
  rubricBreakdown?: Array<{
    criterion: string;
    evidenceQuote: string;
    commentSuggestion: string;
    score: number;
  }>;
}

/**
 * Parses AI feedback that might be in JSON format or plain text
 * Returns cleaned, structured data for UI display and PDF export
 */
export const parseAIFeedback = (feedbackString: string): ParsedAIFeedback | null => {
  if (!feedbackString || feedbackString.trim() === '') {
    return null;
  }

  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(feedbackString);
    return {
      inlineComments: parsed.inlineComments || [],
      overallFeedback: parsed.overallFeedback || feedbackString,
      suggestedGrade: parsed.suggestedGrade || '',
      reasoning: parsed.reasoning,
      confidence: parsed.confidence,
      rubricBreakdown: parsed.rubricBreakdown || []
    };
  } catch {
    // If not JSON, treat as plain text
    return {
      inlineComments: [],
      overallFeedback: feedbackString,
      suggestedGrade: '',
      reasoning: '',
      confidence: 0,
      rubricBreakdown: []
    };
  }
};

/**
 * Extracts clean text for display purposes, removing JSON artifacts
 */
export const extractCleanFeedback = (feedbackString: string): string => {
  const parsed = parseAIFeedback(feedbackString);
  return parsed?.overallFeedback || feedbackString;
};

/**
 * Extracts clean grade for display purposes
 */
export const extractCleanGrade = (gradeString: string): string => {
  const parsed = parseAIFeedback(gradeString);
  return parsed?.suggestedGrade || gradeString;
};