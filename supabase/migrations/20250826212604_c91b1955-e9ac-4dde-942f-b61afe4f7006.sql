-- Create teacher_comments table for manual teacher feedback
CREATE TABLE public.teacher_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  submission_id UUID NOT NULL,
  text_start INTEGER NOT NULL,
  text_end INTEGER NOT NULL,
  comment_text TEXT NOT NULL,
  comment_type TEXT NOT NULL DEFAULT 'neutral',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT teacher_comments_submission_fk FOREIGN KEY (submission_id) REFERENCES public.submissions(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.teacher_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for teacher comments
CREATE POLICY "Users can manage comments for own submissions" 
ON public.teacher_comments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM submissions s
    JOIN assignments a ON s.assignment_id = a.id
    WHERE s.id = teacher_comments.submission_id 
    AND a.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_teacher_comments_updated_at
BEFORE UPDATE ON public.teacher_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_teacher_comments_submission_id ON public.teacher_comments(submission_id);
CREATE INDEX idx_teacher_comments_user_id ON public.teacher_comments(user_id);

-- Add teacher_final_grade and teacher_notes to submissions table
ALTER TABLE public.submissions 
ADD COLUMN teacher_final_grade TEXT,
ADD COLUMN teacher_notes TEXT;