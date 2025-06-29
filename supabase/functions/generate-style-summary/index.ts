
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, examples }: StyleSummaryRequest = await req.json();
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

    // Build prompt from examples
    const examplesText = examples.map((example, index) => 
      `Example ${index + 1}:
      Essay: ${example.essay?.substring(0, 300)}...
      Rubric: ${example.rubric}
      Your Feedback: ${example.feedback}
      Your Grade: ${example.grade}`
    ).join('\n\n');

    const prompt = `Based on the following grading examples, analyze and summarize this teacher's grading style. Focus on:
1. Feedback approach and tone
2. Grading criteria emphasis
3. Communication style
4. Assessment patterns
5. Areas of focus

Grading Examples:
${examplesText}

Provide a comprehensive summary of the teacher's grading style that can be used to train an AI to grade in a similar manner. Be specific about patterns you observe.`;

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
          temperature: 0.7,
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
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary) {
      throw new Error('No response from Gemini API');
    }

    // Save the AI profile
    await supabaseClient
      .from('ai_profiles')
      .upsert({
        user_id: userId,
        grading_style_summary: summary,
        last_trained: new Date().toISOString(),
        ai_model_id: `teacher_${userId}_${Date.now()}`
      });

    return new Response(
      JSON.stringify({ summary }),
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
