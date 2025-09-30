import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AIRouter } from '../_shared/ai-router.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestGradingRequest {
  userId: string;
  essay: string;
}

serve(async (req) => {
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

    // Initialize AI Router with multi-model fallback
    const aiRouter = new AIRouter(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      req.headers.get('Authorization')!
    );

    // Get the user's AI profile for personalized grading
    const { data: aiProfile } = await supabaseClient
      .from('ai_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    let styleContext = '';
    if (aiProfile?.grading_style_summary) {
      styleContext = `\n\nGrade this essay using the following personalized grading style:\n${aiProfile.grading_style_summary}`;
    }

    const systemPrompt = `You are an expert teacher providing feedback on a student essay. Be encouraging while providing honest, constructive feedback.${styleContext}`;

    const userPrompt = `Please provide constructive, detailed feedback on this essay and suggest a grade.

Essay to review:
${essay}

Please provide:
1. Specific strengths of the essay
2. Areas for improvement
3. Suggestions for enhancement
4. An overall assessment and suggested grade`;

    // Use AI Router with automatic fallback
    const aiResponse = await aiRouter.generate({
      prompt: userPrompt,
      systemPrompt,
      temperature: 0.6,
      maxTokens: 1024,
      userId,
      functionName: 'test-ai-grading',
      requestType: 'essay-grading',
    });

    console.log(`AI Response generated using ${aiResponse.modelUsed} (${aiResponse.provider})`);
    if (aiResponse.wasFallback) {
      console.log(`Fallback chain: ${aiResponse.fallbackChain?.join(' -> ')}`);
    }

    const feedback = aiResponse.content;

    // Extract grade from feedback (simple regex approach)
    const gradeMatch = feedback.match(/grade[:\s]*([A-F][+-]?)/i);
    const grade = gradeMatch ? gradeMatch[1] : "B";

    const testResult = {
      feedback,
      grade,
      metadata: {
        modelUsed: aiResponse.modelUsed,
        provider: aiResponse.provider,
        responseTimeMs: aiResponse.responseTimeMs,
        wasFallback: aiResponse.wasFallback,
        fallbackChain: aiResponse.fallbackChain,
      },
    };

    return new Response(
      JSON.stringify(testResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in test-ai-grading:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'All AI models failed. Please check the logs for more details.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
