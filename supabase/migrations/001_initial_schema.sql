
-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('teacher', 'admin')) DEFAULT 'teacher',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Create assignments table
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('draft', 'active', 'completed')) DEFAULT 'draft',
    course_name TEXT,
    canvas_id TEXT,
    canvas_course_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on assignments table
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for assignments
CREATE POLICY "Users can manage own assignments" ON assignments
    FOR ALL USING (auth.uid() = user_id);

-- Create submissions table
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    file_url TEXT,
    ai_score DECIMAL(5,2),
    final_score DECIMAL(5,2),
    feedback TEXT,
    ai_feedback TEXT,
    canvas_submission_id TEXT,
    status TEXT CHECK (status IN ('pending', 'ai_graded', 'finalize', 'pushed_to_lms')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on submissions table
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policy for submissions (users can access submissions for their assignments)
CREATE POLICY "Users can manage submissions for own assignments" ON submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM assignments 
            WHERE assignments.id = submissions.assignment_id 
            AND assignments.user_id = auth.uid()
        )
    );

-- Create rubrics table
CREATE TABLE rubrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    rubric_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on rubrics table
ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;

-- Create policy for rubrics
CREATE POLICY "Users can manage own rubrics" ON rubrics
    FOR ALL USING (auth.uid() = user_id);

-- Create training_data table
CREATE TABLE training_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    data_type TEXT CHECK (data_type IN ('assignment', 'rubric', 'feedback')) NOT NULL,
    file_url TEXT NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on training_data table
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;

-- Create policy for training_data
CREATE POLICY "Users can manage own training data" ON training_data
    FOR ALL USING (auth.uid() = user_id);

-- Create privacy_settings table
CREATE TABLE privacy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    anonymize_student_names BOOLEAN DEFAULT TRUE,
    allow_training_on_content BOOLEAN DEFAULT TRUE,
    auto_delete_training_data BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on privacy_settings table
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for privacy_settings
CREATE POLICY "Users can manage own privacy settings" ON privacy_settings
    FOR ALL USING (auth.uid() = user_id);

-- Create lms_integrations table
CREATE TABLE lms_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- Enable RLS on lms_integrations table
ALTER TABLE lms_integrations ENABLE ROW LEVEL SECURITY;

-- Create policy for lms_integrations
CREATE POLICY "Users can manage own LMS integrations" ON lms_integrations
    FOR ALL USING (auth.uid() = user_id);

-- Create llm_sessions table
CREATE TABLE llm_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
    input_data JSONB,
    output_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confidence_score DECIMAL(3,2)
);

-- Enable RLS on llm_sessions table
ALTER TABLE llm_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for llm_sessions
CREATE POLICY "Users can view own LLM sessions" ON llm_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('uploads', 'uploads', true),
    ('training-data', 'training-data', false);

-- Create storage policies
CREATE POLICY "Users can upload files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files" ON storage.objects
    FOR SELECT USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Training data storage policies
CREATE POLICY "Users can upload training data" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'training-data' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own training data" ON storage.objects
    FOR SELECT USING (bucket_id = 'training-data' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own training data" ON storage.objects
    FOR DELETE USING (bucket_id = 'training-data' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, name, role)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', 'teacher');
    
    -- Create default privacy settings
    INSERT INTO privacy_settings (user_id, anonymize_student_names, allow_training_on_content, auto_delete_training_data)
    VALUES (NEW.id, TRUE, TRUE, TRUE);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_created_at ON submissions(created_at);
CREATE INDEX idx_training_data_user_id ON training_data(user_id);
CREATE INDEX idx_training_data_processed ON training_data(processed);
CREATE INDEX idx_privacy_settings_user_id ON privacy_settings(user_id);
CREATE INDEX idx_lms_integrations_user_id ON lms_integrations(user_id);
CREATE INDEX idx_llm_sessions_user_id ON llm_sessions(user_id);

