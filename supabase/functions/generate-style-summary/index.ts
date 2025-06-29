
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StyleSummaryRequest {
  userId: string;
  examples: any[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, examples }: StyleSummaryRequest = await req.json();

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

    // For now, return a mock style summary
    // In a real implementation, this would analyze the grading examples using AI
    const mockStyleSummary = `Based on your grading examples, your teaching style shows:

1. **Constructive Feedback Approach**: You provide specific, actionable feedback that helps students improve
2. **Balanced Assessment**: You recognize both strengths and areas for improvement
3. **Evidence-Based Grading**: You look for concrete examples and supporting details in student work
4. **Encouraging Tone**: Your feedback is supportive while maintaining academic standards
5. **Focus on Learning**: You emphasize the learning process and growth rather than just grades

Your grading style is characterized by thorough analysis, clear communication, and a focus on student development. You tend to provide detailed explanations for your assessments and offer practical suggestions for improvement.`;

    // Save the AI profile
    await supabaseClient
      .from('ai_profiles')
      .upsert({
        user_id: userId,
        grading_style_summary: mockStyleSummary,
        last_trained: new Date().toISOString(),
        ai_model_id: `teacher_${userId}_${Date.now()}`
      });

    return new Response(
      JSON.stringify({ summary: mockStyleSummary }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in generate-style-summary:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
