-- Create function to update timestamps (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create podcast episodes table
CREATE TABLE public.podcast_episodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  input_notes TEXT,
  script TEXT,
  summary TEXT,
  tags TEXT[],
  voice_style TEXT,
  audio_url TEXT,
  transcript TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.podcast_episodes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own podcast episodes" 
ON public.podcast_episodes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own podcast episodes" 
ON public.podcast_episodes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own podcast episodes" 
ON public.podcast_episodes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own podcast episodes" 
ON public.podcast_episodes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_podcast_episodes_updated_at
BEFORE UPDATE ON public.podcast_episodes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();