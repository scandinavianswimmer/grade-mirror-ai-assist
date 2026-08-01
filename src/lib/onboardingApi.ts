import { supabase } from '@/integrations/supabase/client';
import { getSignedUrl } from './fileUpload';

interface OnboardingProfile {
  basicInfo: {
    fullName: string;
    school: string;
    yearsExperience: number;
  };
  teachingEnvironment: {
    gradeLevel: string;
    subjects: string[];
    classSize: string;
  };
  goals: {
    primary: string;
    timeExpectation: string;
  };
  technicalComfort: {
    level: string;
    previousAI: boolean;
  };
  accountSetup: {
    notifications: boolean;
    privacy: string;
  };
  referral: {
    source: string;
    other?: string;
  };
}

export interface GradingExample {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
  teacher_comments?: unknown;
}

interface AIProfile {
  id: string;
  grading_style_summary: string;
  created_at: string;
}

export const updateOnboardingProfile = async (userId: string, profile: OnboardingProfile): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .update({
      full_name: profile.basicInfo.fullName,
      school: profile.basicInfo.school,
      years_experience: profile.basicInfo.yearsExperience,
      onboarding_complete: true
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating onboarding profile:', error);
    throw error;
  }
};

export const uploadGradingExample = async (userId: string, file: File, title: string): Promise<GradingExample> => {
  // Upload file to Supabase storage
  const fileExtension = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExtension}`;
  
  const { error: uploadError } = await supabase.storage
    .from('grading-examples')
    .upload(fileName, file);

  if (uploadError) {
    console.error('Error uploading file');
    throw uploadError;
  }

  // Store the storage PATH (not a public URL). The bucket is private; we sign on read (C6).
  const { data, error } = await supabase
    .from('grading_examples')
    .insert({
      user_id: userId,
      title,
      file_url: fileName,
      file_type: file.type
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving example metadata:', error);
    throw error;
  }

  return data;
};

export const getGradingExamples = async (userId: string): Promise<GradingExample[]> => {
  const { data, error } = await supabase
    .from('grading_examples')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching grading examples:', error);
    throw error;
  }

  // file_url holds a storage PATH for private-bucket objects — sign it on read (C6).
  // Legacy rows may hold an http(s) URL; pass those through unchanged.
  return await Promise.all(
    (data || []).map(async (item) => ({
      ...item,
      file_url: item.file_url && !/^https?:\/\//i.test(item.file_url)
        ? (await getSignedUrl('grading-examples', item.file_url)) ?? item.file_url
        : item.file_url,
      teacher_comments: typeof item.teacher_comments === 'string' ? item.teacher_comments : ''
    }))
  );
};

export const updateGradingExampleComments = async (exampleId: string, comments: string): Promise<void> => {
  const { error } = await supabase
    .from('grading_examples')
    .update({ teacher_comments: { comments } })
    .eq('id', exampleId);

  if (error) {
    console.error('Error updating example comments:', error);
    throw error;
  }
};

export const generateStyleSummary = async (userId: string): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('generate-style-summary', {
    body: { userId }
  });

  if (error) {
    console.error('Error generating style summary:', error);
    throw error;
  }

  return data.summary;
};

export const saveAIProfile = async (userId: string, summary: string): Promise<AIProfile> => {
  const { data, error } = await supabase
    .from('ai_profiles')
    .upsert({
      user_id: userId,
      grading_style_summary: summary,
      last_trained: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving AI profile:', error);
    throw error;
  }

  return data;
};

export const testAIGrading = async (userId: string, essay: string): Promise<{ feedback: string; grade: string }> => {
  const { data, error } = await supabase.functions.invoke('test-ai-grading', {
    body: { userId, essay }
  });

  if (error) {
    console.error('Error testing AI grading:', error);
    throw error;
  }

  return data;
};

export const completeOnboarding = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .update({ onboarding_complete: true })
    .eq('id', userId);

  if (error) {
    console.error('Error completing onboarding:', error);
    throw error;
  }
};

export const checkOnboardingStatus = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('users')
    .select('onboarding_complete')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }

  return data?.onboarding_complete || false;
};

export const checkGuidedTourStatus = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('users')
    .select('guided_tour_completed')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error checking guided tour status:', error);
    return false;
  }

  return data?.guided_tour_completed || false;
};
