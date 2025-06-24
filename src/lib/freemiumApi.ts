
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

// Training Examples API
export const getTrainingExamples = async (userId: string): Promise<TrainingExample[]> => {
  const { data, error } = await supabase
    .from('training_examples')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createTrainingExample = async (example: Omit<TrainingExample, 'id' | 'created_at'>): Promise<TrainingExample> => {
  const { data, error } = await supabase
    .from('training_examples')
    .insert(example)
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

// Submissions API
export const getSubmissions = async (userId: string): Promise<FreemiumSubmission[]> => {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createSubmission = async (submission: Omit<FreemiumSubmission, 'id' | 'created_at'>): Promise<FreemiumSubmission> => {
  const { data, error } = await supabase
    .from('submissions')
    .insert(submission)
    .select()
    .single();

  if (error) throw error;
  return data;
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
  const { error } = await supabase.rpc('increment_feedback_count', { user_id: userId });
  if (error) throw error;
};

// Generate AI Feedback
export const generateAIFeedback = async (essay: string, rubric: string, userId: string) => {
  // Get user's training examples for context
  const trainingExamples = await getTrainingExamples(userId);
  const recentExamples = trainingExamples.slice(0, 3);

  const { data, error } = await supabase.functions.invoke('generate-grading-feedback', {
    body: {
      essayText: essay,
      rubricText: rubric,
      trainingData: recentExamples,
      userId
    }
  });

  if (error) throw error;
  
  // Increment feedback count
  await incrementFeedbackCount(userId);
  
  return data;
};
