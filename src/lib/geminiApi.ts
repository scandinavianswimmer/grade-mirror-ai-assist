
import { supabase } from './supabase';

export interface GradingResponse {
  inlineComments: Array<{
    text: string;
    comment: string;
    commentId: string;
    type: 'positive' | 'constructive' | 'question';
  }>;
  overallFeedback: string;
  suggestedGrade: string;
  reasoning: string;
  confidence: number;
}

export const generateGradingFeedback = async (
  essayText: string,
  rubricText: string,
  submissionId: string,
  userId: string
): Promise<GradingResponse> => {
  try {
    console.log('Generating grading feedback for submission:', submissionId);

    // Call the enhanced Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('generate-grading-feedback', {
      body: {
        essayText,
        rubricText,
        submissionId,
        userId
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message);
    }

    console.log('Grading feedback generated successfully');
    return data as GradingResponse;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate feedback');
  }
};

export const saveTeacherEdit = async (
  submissionId: string,
  commentId: string,
  actionType: 'accept' | 'decline',
  commentText?: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('teacher_edits')
      .insert({
        user_id: user.id,
        submission_id: submissionId,
        comment_id: commentId,
        action_type: actionType,
        comment_text: commentText
      });

    if (error) throw error;

    console.log('Teacher edit logged:', { submissionId, commentId, actionType });
  } catch (error) {
    console.error('Error saving teacher edit:', error);
    throw error;
  }
};
