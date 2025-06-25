
import { supabase } from './supabase';
import { uploadFile } from './fileUpload';

export interface OnboardingProfile {
  full_name: string;
  school: string;
  gender: string;
  years_experience: number;
  why_joining: string;
}

export interface GradingExample {
  id: string;
  user_id: string;
  title: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
}

export interface AIProfile {
  id: string;
  user_id: string;
  grading_style_summary: string;
  last_trained: string;
  ai_model_id: string;
}

// Update user profile for onboarding
export const updateOnboardingProfile = async (userId: string, profile: OnboardingProfile): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .update({
      name: profile.full_name,
      school: profile.school,
      gender: profile.gender,
      years_experience: profile.years_experience,
      why_joining: profile.why_joining
    })
    .eq('id', userId);

  if (error) throw error;
};

// Upload grading example
export const uploadGradingExample = async (userId: string, file: File, title: string): Promise<GradingExample> => {
  // Upload file to storage
  const uploadResult = await uploadFile(file, 'grading-examples');
  if (!uploadResult.success) {
    throw new Error(uploadResult.error || 'Failed to upload file');
  }

  // Save to database
  const { data, error } = await supabase
    .from('grading_examples')
    .insert({
      user_id: userId,
      title,
      file_url: uploadResult.url,
      file_type: file.type
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get grading examples for user
export const getGradingExamples = async (userId: string): Promise<GradingExample[]> => {
  const { data, error } = await supabase
    .from('grading_examples')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Generate AI style summary
export const generateStyleSummary = async (userId: string): Promise<string> => {
  const examples = await getGradingExamples(userId);
  
  if (examples.length < 3) {
    throw new Error('Need at least 3 grading examples to generate style summary');
  }

  const { data, error } = await supabase.functions.invoke('generate-style-summary', {
    body: { userId, examples }
  });

  if (error) throw error;
  return data.summary;
};

// Save AI profile
export const saveAIProfile = async (userId: string, summary: string): Promise<AIProfile> => {
  const { data, error } = await supabase
    .from('ai_profiles')
    .upsert({
      user_id: userId,
      grading_style_summary: summary,
      last_trained: new Date().toISOString(),
      ai_model_id: `teacher_${userId}_${Date.now()}`
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Test AI grading
export const testAIGrading = async (userId: string, essay: string): Promise<{ feedback: string; grade: string }> => {
  const { data, error } = await supabase.functions.invoke('test-ai-grading', {
    body: { userId, essay }
  });

  if (error) throw error;
  return data;
};

// Complete onboarding
export const completeOnboarding = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .update({ onboarding_complete: true })
    .eq('id', userId);

  if (error) throw error;
};

// Check onboarding status
export const checkOnboardingStatus = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('users')
    .select('onboarding_complete')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data?.onboarding_complete || false;
};
