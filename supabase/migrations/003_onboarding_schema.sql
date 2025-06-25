
-- Add onboarding fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS school TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS why_joining TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;

-- Create grading_examples table
CREATE TABLE IF NOT EXISTS grading_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on grading_examples
ALTER TABLE grading_examples ENABLE ROW LEVEL SECURITY;

-- Create policy for grading_examples
CREATE POLICY "Only teachers can access their own examples" ON grading_examples
    FOR ALL USING (auth.uid() = user_id);

-- Create ai_profiles table
CREATE TABLE IF NOT EXISTS ai_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  grading_style_summary TEXT,
  last_trained TIMESTAMP WITH TIME ZONE,
  ai_model_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on ai_profiles
ALTER TABLE ai_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for ai_profiles
CREATE POLICY "Users can manage their own AI profiles" ON ai_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_grading_examples_user_id ON grading_examples(user_id);
CREATE INDEX IF NOT EXISTS idx_grading_examples_uploaded_at ON grading_examples(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_ai_profiles_user_id ON ai_profiles(user_id);

-- Create storage bucket for grading examples
INSERT INTO storage.buckets (id, name, public) VALUES ('grading-examples', 'grading-examples', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for grading examples
CREATE POLICY "Users can upload their own grading examples" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'grading-examples' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own grading examples" ON storage.objects
    FOR SELECT USING (bucket_id = 'grading-examples' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own grading examples" ON storage.objects
    FOR DELETE USING (bucket_id = 'grading-examples' AND auth.uid()::text = (storage.foldername(name))[1]);
