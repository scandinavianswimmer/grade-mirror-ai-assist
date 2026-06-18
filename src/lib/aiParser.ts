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
    // Clean the feedback string first - remove any markdown code blocks
    let cleanedFeedback = feedbackString.trim();
    
    // Remove JSON code blocks if they exist
    if (cleanedFeedback.startsWith('```json') && cleanedFeedback.endsWith('```')) {
      cleanedFeedback = cleanedFeedback.slice(7, -3).trim();
    } else if (cleanedFeedback.startsWith('```') && cleanedFeedback.endsWith('```')) {
      cleanedFeedback = cleanedFeedback.slice(3, -3).trim();
    }
    
    // Try to parse as JSON first
    const parsed = JSON.parse(cleanedFeedback);
    return {
      inlineComments: parsed.inlineComments || [],
      overallFeedback: parsed.overallFeedback || '',
      suggestedGrade: parsed.suggestedGrade || '',
      reasoning: parsed.reasoning || '',
      confidence: parsed.confidence || 0,
      rubricBreakdown: parsed.rubricBreakdown || []
    };
  } catch {
    // If not JSON, treat as plain text but don't show raw JSON
    // Check if it looks like raw JSON that failed to parse
    if (feedbackString.trim().startsWith('{') && feedbackString.trim().endsWith('}')) {
      // This looks like malformed JSON, return empty structure
      return {
        inlineComments: [],
        overallFeedback: 'Unable to parse feedback data properly.',
        suggestedGrade: '',
        reasoning: '',
        confidence: 0,
        rubricBreakdown: []
      };
    }
    
    // Regular plain text feedback
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