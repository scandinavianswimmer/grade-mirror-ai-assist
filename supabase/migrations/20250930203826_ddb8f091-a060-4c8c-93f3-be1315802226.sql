-- Create AI model health monitoring table
CREATE TABLE IF NOT EXISTS public.ai_model_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'healthy', -- healthy, degraded, down
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  consecutive_failures INTEGER DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  total_failures INTEGER DEFAULT 0,
  average_response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(model_name, provider)
);

-- Create AI request logs table for monitoring
CREATE TABLE IF NOT EXISTS public.ai_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  function_name TEXT NOT NULL,
  user_id UUID,
  request_type TEXT,
  status TEXT NOT NULL, -- success, fallback, failed
  response_time_ms INTEGER,
  error_message TEXT,
  fallback_model TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_model_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;

-- Policies for ai_model_health (teachers can view, system can update)
CREATE POLICY "Teachers can view AI model health"
  ON public.ai_model_health
  FOR SELECT
  USING (true);

-- Policies for ai_request_logs (teachers can view their own logs)
CREATE POLICY "Users can view their own AI request logs"
  ON public.ai_request_logs
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Create indexes for performance
CREATE INDEX idx_ai_model_health_status ON public.ai_model_health(status);
CREATE INDEX idx_ai_request_logs_created_at ON public.ai_request_logs(created_at DESC);
CREATE INDEX idx_ai_request_logs_user_id ON public.ai_request_logs(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_ai_model_health_updated_at
  BEFORE UPDATE ON public.ai_model_health
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial health records for known models
INSERT INTO public.ai_model_health (model_name, provider, status) VALUES
  ('gemini-2.5-flash', 'lovable', 'healthy'),
  ('gemini-pro', 'gemini', 'healthy'),
  ('gpt-5-mini', 'openai', 'healthy'),
  ('claude-sonnet-4', 'anthropic', 'healthy')
ON CONFLICT (model_name, provider) DO NOTHING;