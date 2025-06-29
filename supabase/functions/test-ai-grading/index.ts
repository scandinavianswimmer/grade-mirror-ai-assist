
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, essay }: TestGradingRequest = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

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

    // Get the user's AI profile for personalized grading
    const { data: aiProfile } = await supabaseClient
      .from('ai_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    let styleContext = '';
    if (aiProfile?.grading_style_summary) {
      styleContext = `\n\nGrade this essay using the following personalized grading style:\n${aiProfile.grading_style_summary}`;
    }

    const prompt = `You are an expert teacher providing feedback on a student essay. Please provide constructive, detailed feedback and suggest a grade.

Essay to review:
${essay}

${styleContext}

Please provide:
1. Specific strengths of the essay
2. Areas for improvement
3. Suggestions for enhancement
4. An overall assessment and suggested grade

Be encouraging while providing honest, constructive feedback.`;

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.6,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const feedback = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!feedback) {
      throw new Error('No response from Gemini API');
    }

    // Extract grade from feedback (simple regex approach)
    const gradeMatch = feedback.match(/grade[:\s]*([A-F][+-]?)/i);
    const grade = gradeMatch ? gradeMatch[1] : "B";

    const testResult = {
      feedback,
      grade
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
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
