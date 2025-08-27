-- Add guided_tour_completed column to users table
ALTER TABLE users ADD COLUMN guided_tour_completed BOOLEAN DEFAULT FALSE;

-- Add teacher_comments column to grading_examples table for storing comments per example
ALTER TABLE grading_examples ADD COLUMN teacher_comments JSONB;