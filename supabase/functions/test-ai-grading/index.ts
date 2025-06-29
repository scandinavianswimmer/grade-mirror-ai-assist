
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestGradingRequest {
  userId: string;
  essay: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, essay }: TestGradingRequest = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user's AI profile
    const { data: aiProfile } = await supabaseClient
      .from('ai_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // For now, return a mock test grading response
    // In a real implementation, this would use the AI profile to grade the essay
    const mockTestResult = {
      feedback: `This is a test of your personalized AI grading assistant. Based on your grading style, here's how I would evaluate this essay:

**Strengths:**
- Clear thesis statement
- Good use of examples
- Logical flow of ideas

**Areas for Improvement:**
- Could benefit from stronger transitions between paragraphs
- Consider adding more specific evidence to support claims
- Conclusion could be more impactful

**Overall Assessment:**
This essay demonstrates understanding of the topic and shows good writing fundamentals. With some refinement, it could be even stronger.`,
      grade: "B"
    };

    return new Response(
      JSON.stringify(mockTestResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in test-ai-grading:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
