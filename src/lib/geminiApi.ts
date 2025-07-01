
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
      throw new Error(error.message);
    }

    return data as GradingResponse;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate feedback');
  }
};
