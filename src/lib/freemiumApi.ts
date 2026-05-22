
import { supabase } from './supabase';

export interface TrainingExample {
  id: string;
  user_id: string;
  essay: string;
  rubric: string;
  feedback?: string;
  grade?: string;
  created_at: string;
}

export interface FreemiumSubmission {
  id: string;
  user_id: string;
  essay: string;
  rubric: string;
  ai_feedback?: string;
  ai_grade?: string;
  inline_comments?: any;
  created_at: string;
}

export interface UserLimits {
  trainingExamplesCount: number;
  weeklyFeedbackCount: number;
  maxTrainingExamples: number;
  maxWeeklyFeedback: number;
  plan: string;
}

// Training Examples API. "Exemplars" are genuine teacher style samples (is_exemplar=true);
// freemium graded submissions are stored in the same table but flagged is_exemplar=false (H21/M49).
export const getTrainingExamples = async (userId: string): Promise<TrainingExample[]> => {
  const { data, error } = await supabase
    .from('training_examples')
    .select('*')
    .eq('user_id', userId)
    .eq('is_exemplar', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createTrainingExample = async (example: Omit<TrainingExample, 'id' | 'created_at'>): Promise<TrainingExample> => {
  // A style exemplar is only meaningful with the teacher's own feedback (H22).
  if (!example.feedback || !example.feedback.trim()) {
    throw new Error('A training exemplar requires your feedback so aiTA can learn your style.');
  }
  const { data, error } = await supabase
    .from('training_examples')
    .insert({ ...example, is_exemplar: true })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteTrainingExample = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('training_examples')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Submissions API - Updated to work with freemium model
export const getSubmissions = async (userId: string): Promise<FreemiumSubmission[]> => {
  const { data, error } = await supabase
    .from('training_examples')
    .select('id, user_id, essay, rubric, feedback, grade, created_at')
    .eq('user_id', userId)
    .eq('is_exemplar', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Transform training examples to look like submissions for freemium users
  return (data || []).map(item => ({
    id: item.id,
    user_id: item.user_id,
    essay: item.essay,
    rubric: item.rubric,
    ai_feedback: item.feedback,
    ai_grade: item.grade,
    inline_comments: null,
    created_at: item.created_at
  }));
};

export const createSubmission = async (submission: Omit<FreemiumSubmission, 'id' | 'created_at'>): Promise<FreemiumSubmission> => {
  // Freemium graded submissions live in the same table but are NOT style exemplars (H21/M49).
  const { data, error } = await supabase
    .from('training_examples')
    .insert({
      user_id: submission.user_id,
      essay: submission.essay,
      rubric: submission.rubric,
      feedback: submission.ai_feedback,
      grade: submission.ai_grade,
      is_exemplar: false
    })
    .select()
    .single();

  if (error) throw error;
  
  return {
    id: data.id,
    user_id: data.user_id,
    essay: data.essay,
    rubric: data.rubric,
    ai_feedback: data.feedback,
    ai_grade: data.grade,
    inline_comments: null,
    created_at: data.created_at
  };
};

// User Limits API
export const getUserLimits = async (userId: string): Promise<UserLimits> => {
  const [trainingExamples, user] = await Promise.all([
    getTrainingExamples(userId),
    supabase.from('users').select('plan, weekly_feedback_count').eq('id', userId).single()
  ]);

  if (user.error) throw user.error;

  return {
    trainingExamplesCount: trainingExamples.length,
    weeklyFeedbackCount: user.data.weekly_feedback_count || 0,
    maxTrainingExamples: user.data.plan === 'freemium' ? 5 : 50,
    maxWeeklyFeedback: user.data.plan === 'freemium' ? 10 : 100,
    plan: user.data.plan || 'freemium'
  };
};

export const incrementFeedbackCount = async (userId: string): Promise<void> => {
  const { error } = await supabase.functions.invoke('increment-feedback-count', {
    body: { userId }
  });
  if (error) throw error;
};

// Generate AI Feedback. Training exemplars are fetched server-side, scoped to the
// authenticated teacher (C3) — the client no longer supplies training data.
export const generateAIFeedback = async (essay: string, rubric: string, userId: string) => {
  const { data, error } = await supabase.functions.invoke('generate-grading-feedback', {
    body: {
      essayText: essay,
      rubricText: rubric
    }
  });

  if (error) throw error;

  // Increment feedback count
  await incrementFeedbackCount(userId);

  return data;
};
