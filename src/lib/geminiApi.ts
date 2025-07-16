
import { supabase } from './supabase';

export interface GradingResponse {
  inlineComments: Array<{
    text: string;
    comment: string;
  }>;
  overallFeedback: string;
  suggestedGrade: string;
  reasoning: string;
  confidence: number;
}

export const generateGradingFeedback = async (
  essayText: string,
  rubricText: string,
  userId: string
): Promise<GradingResponse> => {
  try {
    // Fetch user's training data
    const { data: trainingData, error: trainingError } = await supabase
      .from('training_data')
      .select('*')
      .eq('user_id', userId)
      .eq('processed', true)
      .limit(10);

    if (trainingError) {
      console.error('Error fetching training data:', trainingError);
    }

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('generate-grading-feedback', {
      body: {
        essayText,
        rubricText,
        trainingData: trainingData || [],
        userId
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
