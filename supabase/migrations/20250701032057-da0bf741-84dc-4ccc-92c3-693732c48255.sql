
-- Add missing columns to assignments table
ALTER TABLE assignments 
ADD COLUMN rubric_json jsonb,
ADD COLUMN prompt_instructions text;

-- Migrate existing rubric_text data to rubric_json format
UPDATE assignments 
SET rubric_json = jsonb_build_object('text', rubric_text, 'criteria', '[]'::jsonb)
WHERE rubric_text IS NOT NULL AND rubric_json IS NULL;

-- Add some sample prompt instructions for existing assignments
UPDATE assignments 
SET prompt_instructions = 'Please grade this assignment according to the provided rubric. Focus on clarity, accuracy, and depth of analysis.'
WHERE prompt_instructions IS NULL;
