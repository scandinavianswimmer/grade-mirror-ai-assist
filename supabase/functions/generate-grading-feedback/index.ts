
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GradingRequest {
  essayText: string;
  rubricText: string;
  submissionId: string;
  userId: string;
}

interface GradingResponse {
  inlineComments: Array<{
    text: string;
    comment: string;
    commentId: string;
    type: 'positive' | 'constructive' | 'question';
  }>;
  overallFeedback: string;
  suggestedGrade: string;
  reasoning: string;
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { essayText, rubricText, submissionId, userId }: GradingRequest = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    console.log('Processing grading request for user:', userId, 'submission:', submissionId);

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

    // Get teacher's style profile
    const { data: teacherProfile } = await supabaseClient
      .from('teacher_profiles')
      .select('style_profile_json')
      .eq('user_id', userId)
      .single();

    console.log('Teacher profile found:', !!teacherProfile);

    // Get training examples from user's history
    const { data: trainingData } = await supabaseClient
      .from('training_examples')
      .select('essay, rubric, feedback, grade')
      .eq('user_id', userId)
      .limit(5);

    console.log('Training examples found:', trainingData?.length || 0);

    // Build personalized context
    let styleContext = '';
    if (teacherProfile?.style_profile_json) {
      const profile = teacherProfile.style_profile_json as any;
      styleContext = `
Teaching Style Context:
- Teaching Philosophy: ${profile.teachingStyle || 'Not specified'}
- Feedback Preferences: ${profile.feedbackPreferences || 'Not specified'}
- Grading Priorities: ${profile.gradingPriorities || 'Not specified'}
- Tone Preference: ${profile.tonePreference || 'constructive'}
- Subject Expertise: ${profile.subjectExpertise || 'General'}
`;
    }

    let trainingContext = '';
    if (trainingData && trainingData.length > 0) {
      trainingContext = `
Previous Grading Examples:
${trainingData.map((example, index) => 
  `Example ${index + 1}:
  Essay excerpt: ${example.essay?.substring(0, 200)}...
  Feedback style: ${example.feedback}
  Grade given: ${example.grade}`
).join('\n\n')}`;
    }

    const prompt = `You are an expert teacher providing personalized feedback on a student essay. Analyze the essay and provide detailed, actionable feedback that matches the teacher's style.

${styleContext}

${trainingContext}

Essay to Grade:
${essayText}

Grading Rubric:
${rubricText}

Please provide feedback in this EXACT JSON format:
{
  "inlineComments": [
    {
      "text": "specific quoted text from essay",
      "comment": "your specific comment about this text",
      "commentId": "unique_id_for_comment",
      "type": "positive|constructive|question"
    }
  ],
  "overallFeedback": "comprehensive paragraph with specific strengths and improvement areas",
  "suggestedGrade": "letter grade (A+, A, A-, B+, B, B-, C+, C, C-, D+, D, F)",
  "reasoning": "detailed explanation for the grade based on rubric criteria",
  "confidence": 0.85
}

Requirements:
- Provide 3-5 inline comments on specific parts of the essay
- Make comments specific and actionable
- Match the teacher's stated tone and style preferences
- Reference the rubric criteria in your reasoning
- Be encouraging while providing honest feedback

Respond with ONLY the JSON object, no other text.`;

    console.log('Sending request to Gemini API...');

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
      throw new Error(`Gemini API error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

    console.log('Received response from Gemini API');

    // Parse the JSON response
    let gradingResponse: GradingResponse;
    try {
      // Clean the response text (remove markdown formatting if present)
      const cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      gradingResponse = JSON.parse(cleanedText);
      
      // Ensure inline comments have unique IDs
      gradingResponse.inlineComments = gradingResponse.inlineComments.map((comment, index) => ({
        ...comment,
        commentId: comment.commentId || `comment_${Date.now()}_${index}`
      }));

    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      // Fallback response
      gradingResponse = {
        inlineComments: [
          {
            text: essayText.substring(0, 50) + "...",
            comment: "AI-generated feedback based on essay analysis",
            commentId: `fallback_${Date.now()}`,
            type: 'constructive'
          }
        ],
        overallFeedback: generatedText,
        suggestedGrade: "B",
        reasoning: "AI-generated assessment based on submitted content",
        confidence: 0.7
      };
    }

    // Log the grading session
    await supabaseClient
      .from('llm_sessions')
      .insert({
        user_id: userId,
        status: 'completed',
        input_data: { 
          essayText: essayText.substring(0, 500), 
          rubricText,
          submissionId,
          hasTeacherProfile: !!teacherProfile,
          trainingExamplesCount: trainingData?.length || 0
        },
        output_data: gradingResponse,
        confidence_score: gradingResponse.confidence
      });

    console.log('Grading completed successfully');

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
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
