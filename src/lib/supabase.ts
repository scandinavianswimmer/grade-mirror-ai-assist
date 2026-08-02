
import { createClient } from '@supabase/supabase-js';
import type { Json } from '@/integrations/supabase/types';
import type { AppDatabase } from '@/integrations/supabase/app-database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY');
}

export const supabase = createClient<AppDatabase>(supabaseUrl, supabaseAnonKey, {
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
  inline_comments?: Json;
  canvas_submission_id?: string;
  status: 'pending' | 'ai_graded' | 'finalize' | 'pushed_to_lms';
  created_at: string;
}

export interface Rubric {
  id: string;
  user_id: string;
  title: string;
  rubric_json: Json;
  created_at: string;
}

export interface TrainingData {
  id: string;
  user_id: string;
  data_type: 'assignment' | 'rubric' | 'feedback';
  title?: string | null;
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
  retention_days: number | null;
  // Auto-finalize (On-the-Loop): publish high-confidence grades unattended. Optional because the
  // columns are absent until migration 0020 (migrations_v2) is applied; UI falls back to the defaults.
  auto_finalize_enabled?: boolean;
  auto_finalize_threshold?: number;
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
