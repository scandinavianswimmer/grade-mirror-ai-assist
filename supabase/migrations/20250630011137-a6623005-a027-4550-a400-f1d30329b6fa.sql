
-- Create classes table
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  details_jsonb JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Create policies for classes table
CREATE POLICY "Users can view their own classes" 
  ON public.classes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own classes" 
  ON public.classes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own classes" 
  ON public.classes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own classes" 
  ON public.classes 
  FOR DELETE 
  USING (auth.uid() = user_id);
