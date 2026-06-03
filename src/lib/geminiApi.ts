
import { supabase } from './supabase';

export interface GradingResponse {
  inlineComments: Array<{
    text: string;
    comment: string;
    category: string;
    startIndex?: number;
    endIndex?: number;
    commentId?: string;
    status?: 'pending' | 'accepted' | 'edited' | 'dismissed';
    popupText?: string;
  }>;
  overallFeedback: string;
  suggestedGrade: string;
  reasoning: string;
  confidence: number;
  rubricBreakdown?: Array<{
    criterion: string;
    evidenceQuote: string;
    commentSuggestion: string;
    score: number;
  }>;
}

export const generateGradingFeedback = async (
  essayText: string,
  rubricText: string,
  userId: string
): Promise<GradingResponse> => {
  try {
    // Training exemplars are fetched server-side (scoped to the authenticated teacher).
    // The client never supplies training data — it cannot be trusted (C3).
    const { data, error } = await supabase.functions.invoke('generate-grading-feedback', {
      body: {
        essayText,
        rubricText
      }
    });

    if (error) {
      console.error('Edge function error details:', error);
      throw new Error(`Edge function error: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data received from edge function');
    }

    return data as GradingResponse;
  } catch (error) {
    console.error('Gemini API error:', error);
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Gemini API key not configured')) {
        throw new Error('Gemini API key is not configured. Please contact your administrator.');
      }
      throw new Error(error.message);
    }
    throw new Error('Failed to generate feedback');
  }
};
