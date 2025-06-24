
-- Add freemium-specific columns and tables for MVP

-- Update users table to track usage limits
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'freemium';
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_feedback_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;

-- Create training_examples table for freemium MVP
CREATE TABLE IF NOT EXISTS training_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  essay TEXT NOT NULL,
  rubric TEXT NOT NULL,
  feedback TEXT,
  grade TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on training_examples
ALTER TABLE training_examples ENABLE ROW LEVEL SECURITY;

-- Create policy for training_examples
CREATE POLICY "Users can manage own training examples" ON training_examples
    FOR ALL USING (auth.uid() = user_id);

-- Update submissions table to match MVP requirements
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS essay TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS rubric TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ai_grade TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS inline_comments JSONB;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_examples_user_id ON training_examples(user_id);
CREATE INDEX IF NOT EXISTS idx_training_examples_created_at ON training_examples(created_at);

-- Function to reset weekly feedback count
CREATE OR REPLACE FUNCTION reset_weekly_feedback_count()
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
CREATE OR REPLACE TRIGGER reset_weekly_count_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION reset_weekly_feedback_count();
