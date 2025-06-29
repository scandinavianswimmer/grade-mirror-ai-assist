
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const supabaseUrl = 'https://rwiqwuohbcvhuvtlxlvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aXF3dW9oYmN2aHV2dGx4bHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDcwOTEsImV4cCI6MjA2NjI4MzA5MX0.8j4C62pwhQ7QKUYFoWu4ZiCiZ7dRGiY9ArpHr5TX1wQ';

console.log('Supabase config:', { 
  url: supabaseUrl, 
  hasKey: !!supabaseAnonKey 
});

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// TypeScript interfaces for database tables
export interface Assignment {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  rubric_url?: string;
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
  essay?: string;
  rubric?: string;
  file_url?: string;
  ai_score?: number;
  ai_grade?: string;
  final_score?: number;
  feedback?: string;
  ai_feedback?: string;
  inline_comments?: any;
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

export interface TrainingExample {
  id: string;
  user_id: string;
  essay: string;
  rubric: string;
  feedback?: string;
  grade?: string;
  created_at: string;
}
