
-- Add missing columns to submissions table
ALTER TABLE public.submissions 
ADD COLUMN submission_storage_path TEXT,
ADD COLUMN feedback_json JSONB,
ADD COLUMN processing_status TEXT DEFAULT 'pending';

-- Create teacher_profiles table for storing AI avatars/style profiles
CREATE TABLE public.teacher_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  style_profile_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create teacher_edits table for logging teacher actions (for reinforcement loop)
CREATE TABLE public.teacher_edits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'accept' or 'decline'
  comment_id TEXT NOT NULL, -- identifier for the specific comment
  comment_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_edits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for teacher_profiles
CREATE POLICY "Users can view their own teacher profile" 
  ON public.teacher_profiles 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own teacher profile" 
  ON public.teacher_profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own teacher profile" 
  ON public.teacher_profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for teacher_edits
CREATE POLICY "Users can view their own teacher edits" 
  ON public.teacher_edits 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own teacher edits" 
  ON public.teacher_edits 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for submissions if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('submissions', 'submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for submissions bucket
CREATE POLICY "Users can upload their own submissions"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own submissions"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own submissions"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);
