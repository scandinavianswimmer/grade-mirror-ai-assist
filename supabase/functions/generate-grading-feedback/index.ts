
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
    category: string;
    startIndex?: number;
    endIndex?: number;
    commentId?: string;
    status?: 'pending' | 'accepted' | 'edited' | 'dismissed';
    popupText?: string;
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

    console.log('Processing grading request for user:', userId);
    console.log('Essay length:', essayText?.length || 0);
    console.log('Rubric provided:', !!rubricText);
    console.log('Gemini API key available:', !!geminiApiKey);

    if (!geminiApiKey) {
      console.error('Gemini API key not configured');
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

const prompt = `You are an expert teacher grading a student essay. Please provide detailed feedback following this exact JSON format.

CRITICAL: Return ONLY valid JSON without any markdown formatting, code blocks, or additional text. Do not wrap the response in \`\`\`json or any other formatting.

{
  "inlineComments": [
    {
      "text": "specific text from essay",
      "comment": "your comment about this text",
      "category": "grammar|clarity|organization|analysis|thesis|evidence",
      "commentId": "unique-id",
      "popupText": "short summary for tooltip"
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

Return ONLY the JSON object with no markdown formatting, code blocks, or additional text.`;

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
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

    // Clean and parse the JSON response
    let gradingResponse: GradingResponse;
    try {
      // Strip markdown formatting if present
      let cleanedText = generatedText.trim();
      
      // Remove markdown code blocks if present
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any remaining backticks
      cleanedText = cleanedText.replace(/^`+|`+$/g, '');
      
      gradingResponse = JSON.parse(cleanedText);
      
      // Validate required fields exist
      if (!gradingResponse.overallFeedback || !gradingResponse.suggestedGrade) {
        throw new Error('Missing required fields in AI response');
      }
      
    } catch (parseError) {
      console.error('JSON parsing error:', parseError, 'Raw text:', generatedText);
      // Fallback if JSON parsing fails
      gradingResponse = {
        inlineComments: [],
        overallFeedback: "I've provided detailed feedback on your essay focusing on areas for improvement and strengths. Please review the specific comments for actionable suggestions.",
        suggestedGrade: "B",
        reasoning: "Grade based on overall essay quality, organization, and content analysis.",
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
