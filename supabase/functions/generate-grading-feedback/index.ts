
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GradingRequest {
  essayText: string;
  rubricText: string;
  trainingData: any[];
  userId: string;
}

interface GradingResponse {
  inlineComments: Array<{
    text: string;
    comment: string;
  }>;
  overallFeedback: string;
  suggestedGrade: string;
  reasoning: string;
  confidence: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { essayText, rubricText, trainingData, userId }: GradingRequest = await req.json();

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

    // For now, return a mock response
    // In a real implementation, this would call an AI service like OpenAI or Google Gemini
    const mockResponse: GradingResponse = {
      inlineComments: [
        {
          text: essayText.substring(0, 50),
          comment: "Good introduction, but could be more engaging."
        },
        {
          text: essayText.substring(50, 100),
          comment: "Strong argument presented here."
        }
      ],
      overallFeedback: `This essay demonstrates a solid understanding of the topic. The arguments are well-structured and supported with evidence. However, there are areas for improvement:\n\n1. Strengthen the introduction to better hook the reader\n2. Provide more specific examples to support your claims\n3. Consider addressing potential counterarguments\n\nOverall, this is a good piece of writing that shows clear thought and effort.`,
      suggestedGrade: "B+",
      reasoning: "The essay meets most criteria outlined in the rubric. Strong content and structure, with room for improvement in engagement and depth of analysis.",
      confidence: 0.85
    };

    // Log the grading session
    await supabaseClient
      .from('llm_sessions')
      .insert({
        user_id: userId,
        status: 'completed',
        input_data: { essayText: essayText.substring(0, 200), rubricText },
        output_data: mockResponse,
        confidence_score: mockResponse.confidence
      });

    return new Response(
      JSON.stringify(mockResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in generate-grading-feedback:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
