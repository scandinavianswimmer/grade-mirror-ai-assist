
import { supabase } from './supabase';

export const generateGradingFeedback = async (essayText: string, rubricText: string, userId: string) => {
  try {
    // Get training data for the user
    const { data: trainingData, error: trainingError } = await supabase
      .from('training_data')
      .select('*')
      .eq('user_id', userId)
      .eq('processed', true);

    if (trainingError) {
      console.error('Error fetching training data:', trainingError);
    }

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('generate-grading-feedback', {
      body: {
        essayText,
        rubricText,
        trainingData: trainingData || [],
        userId
      }
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Grading feedback error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
