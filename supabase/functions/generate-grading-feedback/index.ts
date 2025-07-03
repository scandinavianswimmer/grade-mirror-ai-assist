
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
  rubricBreakdown: Array<{
    criterion: string;
    evidenceQuote: string;
    commentSuggestion: string;
    score: number;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { essayText, rubricText, trainingData, userId }: GradingRequest = await req.json();
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

    // Build context from training data
    let trainingContext = '';
    if (trainingData && trainingData.length > 0) {
      trainingContext = `\n\nBased on your previous grading examples:\n${trainingData.map(example => 
        `Essay: ${example.essay?.substring(0, 200)}...\nFeedback: ${example.feedback}\nGrade: ${example.grade}`
      ).join('\n\n')}`;
    }

    const prompt = `You are an expert teacher grading a student essay. Please provide detailed feedback following this exact JSON format:

{
  "inlineComments": [
    {
      "text": "specific text from essay",
      "comment": "your comment about this text"
    }
  ],
  "overallFeedback": "comprehensive feedback paragraph",
  "suggestedGrade": "letter grade (A, B+, C-, etc.)",
  "reasoning": "explanation for the grade",
  "confidence": 0.85,
  "rubricBreakdown": [
    {
      "criterion": "CLARITY",
      "evidenceQuote": "exact text excerpt from essay that demonstrates this criterion",
      "commentSuggestion": "specific feedback comment about this excerpt",
      "score": 8
    }
  ]
}

For the rubricBreakdown array, identify 4-6 specific areas of the essay that need feedback. Use these criteria types:
- CLARITY (clear expression of ideas)
- USE OF EVIDENCE (supporting examples and quotes)
- GRAMMAR (sentence structure and mechanics)
- ANALYSIS (depth of thinking and argument)
- ORGANIZATION (structure and flow)
- THESIS (strength of main argument)

For each criterion, find a specific quote from the essay (evidenceQuote) and provide constructive feedback (commentSuggestion).

Essay to grade:
${essayText}

Grading Rubric:
${rubricText}

${trainingContext}

Please respond with ONLY the JSON object, no additional text.`;

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
          temperature: 0.4,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

    // Parse the JSON response
    let gradingResponse: GradingResponse;
    try {
      gradingResponse = JSON.parse(generatedText);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      gradingResponse = {
        inlineComments: [],
        overallFeedback: generatedText,
        suggestedGrade: "B",
        reasoning: "AI-generated feedback based on essay analysis",
        confidence: 0.8,
        rubricBreakdown: []
      };
    }

    // Log the grading session
    await supabaseClient
      .from('llm_sessions')
      .insert({
        user_id: userId,
        status: 'completed',
        input_data: { essayText: essayText.substring(0, 500), rubricText },
        output_data: gradingResponse,
        confidence_score: gradingResponse.confidence
      });

    return new Response(
      JSON.stringify(gradingResponse),
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
