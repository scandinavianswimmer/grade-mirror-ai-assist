
-- Add rubric_text column to assignments table
ALTER TABLE public.assignments 
ADD COLUMN rubric_text text;
