
import { supabase } from './supabase';

export const generateGradingFeedback = async (essayText: string, rubricText: string, _userId?: string) => {
  try {
    // Training exemplars are fetched server-side, scoped to the authenticated teacher (C3).
    const { data, error } = await supabase.functions.invoke('generate-grading-feedback', {
      body: {
        essayText,
        rubricText
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
