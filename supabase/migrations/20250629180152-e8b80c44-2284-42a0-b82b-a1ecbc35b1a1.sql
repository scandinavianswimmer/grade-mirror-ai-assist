
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends auth.users with app-specific data)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    full_name TEXT,
    school TEXT,
    gender TEXT,
    years_experience INTEGER,
    why_joining TEXT,
    plan TEXT DEFAULT 'freemium',
    weekly_feedback_count INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    onboarding_complete BOOLEAN DEFAULT false,
    role TEXT CHECK (role IN ('teacher', 'admin')) DEFAULT 'teacher',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    rubric_url TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('draft', 'active', 'completed')) DEFAULT 'draft',
    course_name TEXT,
    canvas_id TEXT,
    canvas_course_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
    student_name TEXT NOT NULL,
    essay TEXT,
    rubric TEXT,
    file_url TEXT,
    ai_score DECIMAL(5,2),
    ai_grade TEXT,
    final_score DECIMAL(5,2),
    feedback TEXT,
    ai_feedback TEXT,
    inline_comments JSONB,
    canvas_submission_id TEXT,
    status TEXT CHECK (status IN ('pending', 'ai_graded', 'finalize', 'pushed_to_lms')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training_examples table for freemium MVP
CREATE TABLE IF NOT EXISTS public.training_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    essay TEXT NOT NULL,
    rubric TEXT NOT NULL,
    feedback TEXT,
    grade TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grading_examples table for onboarding
CREATE TABLE IF NOT EXISTS public.grading_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_profiles table
CREATE TABLE IF NOT EXISTS public.ai_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    grading_style_summary TEXT,
    last_trained TIMESTAMP WITH TIME ZONE,
    ai_model_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rubrics table
CREATE TABLE IF NOT EXISTS public.rubrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    rubric_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training_data table
CREATE TABLE IF NOT EXISTS public.training_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    data_type TEXT CHECK (data_type IN ('assignment', 'rubric', 'feedback')) NOT NULL,
    file_url TEXT NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create privacy_settings table
CREATE TABLE IF NOT EXISTS public.privacy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    anonymize_student_names BOOLEAN DEFAULT TRUE,
    allow_training_on_content BOOLEAN DEFAULT TRUE,
    auto_delete_training_data BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lms_integrations table
CREATE TABLE IF NOT EXISTS public.lms_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    platform TEXT CHECK (platform IN ('canvas', 'blackboard', 'moodle')) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    canvas_url TEXT,
    auto_sync BOOLEAN DEFAULT FALSE,
    auto_push BOOLEAN DEFAULT FALSE,
    status TEXT CHECK (status IN ('connected', 'disconnected', 'error')) DEFAULT 'connected',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, platform)
);

-- Create llm_sessions table
CREATE TABLE IF NOT EXISTS public.llm_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
    input_data JSONB,
    output_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confidence_score DECIMAL(3,2)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for assignments
CREATE POLICY "Users can manage own assignments" ON public.assignments
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for submissions
CREATE POLICY "Users can manage submissions for own assignments" ON public.submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.assignments 
            WHERE assignments.id = submissions.assignment_id 
            AND assignments.user_id = auth.uid()
        )
    );

-- Create RLS policies for training_examples
CREATE POLICY "Users can manage own training examples" ON public.training_examples
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for grading_examples
CREATE POLICY "Users can access their own examples" ON public.grading_examples
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for ai_profiles
CREATE POLICY "Users can manage their own AI profiles" ON public.ai_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for rubrics
CREATE POLICY "Users can manage own rubrics" ON public.rubrics
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for training_data
CREATE POLICY "Users can manage own training data" ON public.training_data
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for privacy_settings
CREATE POLICY "Users can manage own privacy settings" ON public.privacy_settings
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for lms_integrations
CREATE POLICY "Users can manage own LMS integrations" ON public.lms_integrations
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for llm_sessions
CREATE POLICY "Users can view own LLM sessions" ON public.llm_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('uploads', 'uploads', true),
    ('training-data', 'training-data', false),
    ('grading-examples', 'grading-examples', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for uploads bucket
CREATE POLICY "Users can upload files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files" ON storage.objects
    FOR SELECT USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for training-data bucket
CREATE POLICY "Users can upload training data" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'training-data' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own training data" ON storage.objects
    FOR SELECT USING (bucket_id = 'training-data' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own training data" ON storage.objects
    FOR DELETE USING (bucket_id = 'training-data' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for grading-examples bucket
CREATE POLICY "Users can upload their own grading examples" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'grading-examples' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own grading examples" ON storage.objects
    FOR SELECT USING (bucket_id = 'grading-examples' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own grading examples" ON storage.objects
    FOR DELETE USING (bucket_id = 'grading-examples' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', 'teacher');
    
    -- Create default privacy settings
    INSERT INTO public.privacy_settings (user_id, anonymize_student_names, allow_training_on_content, auto_delete_training_data)
    VALUES (NEW.id, TRUE, TRUE, TRUE);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to reset weekly feedback count
CREATE OR REPLACE FUNCTION public.reset_weekly_feedback_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_reset_date < CURRENT_DATE - INTERVAL '7 days' THEN
        NEW.weekly_feedback_count := 0;
        NEW.last_reset_date := CURRENT_DATE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically reset weekly count
DROP TRIGGER IF EXISTS reset_weekly_count_trigger ON public.users;
CREATE TRIGGER reset_weekly_count_trigger
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.reset_weekly_feedback_count();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON public.assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.assignments(status);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_training_examples_user_id ON public.training_examples(user_id);
CREATE INDEX IF NOT EXISTS idx_training_examples_created_at ON public.training_examples(created_at);
CREATE INDEX IF NOT EXISTS idx_grading_examples_user_id ON public.grading_examples(user_id);
CREATE INDEX IF NOT EXISTS idx_grading_examples_uploaded_at ON public.grading_examples(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_ai_profiles_user_id ON public.ai_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_training_data_user_id ON public.training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_training_data_processed ON public.training_data(processed);
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON public.privacy_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_lms_integrations_user_id ON public.lms_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_sessions_user_id ON public.llm_sessions(user_id);
