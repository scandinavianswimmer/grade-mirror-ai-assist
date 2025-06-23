
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

console.log('Supabase config:', { 
  url: supabaseUrl, 
  hasKey: !!supabaseAnonKey 
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// TypeScript interfaces for database tables
export interface Assignment {
  id: string;
  user_id: string;
  title: string;
  due_date?: string;
  status: 'draft' | 'active' | 'completed';
  course_name?: string;
  canvas_id?: string;
  canvas_course_id?: string;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_name: string;
  file_url?: string;
  ai_score?: number;
  final_score?: number;
  feedback?: string;
  ai_feedback?: string;
  canvas_submission_id?: string;
  status: 'pending' | 'ai_graded' | 'finalize' | 'pushed_to_lms';
  created_at: string;
}

export interface Rubric {
  id: string;
  user_id: string;
  title: string;
  rubric_json: any;
  created_at: string;
}

export interface TrainingData {
  id: string;
  user_id: string;
  data_type: 'assignment' | 'rubric' | 'feedback';
  file_url: string;
  processed: boolean;
  created_at: string;
}

export interface PrivacySettings {
  id: string;
  user_id: string;
  anonymize_student_names: boolean;
  allow_training_on_content: boolean;
  auto_delete_training_data: boolean;
  created_at: string;
}
