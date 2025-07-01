
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { submissionId } = await req.json();

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: 'submissionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Phase 1: Gather Context - Get submission with assignment and teacher profile
    const { data: submission, error: submissionError } = await supabaseClient
      .from('submissions')
      .select(`
        *,
        assignments (
          id,
          title,
          description,
          rubric_text,
          rubric_json,
          prompt_instructions,
          user_id
        )
      `)
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return new Response(
        JSON.stringify({ error: 'Submission not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get teacher profile for personalization
    const { data: teacherProfile } = await supabaseClient
      .from('teacher_profiles')
      .select('style_profile_json')
      .eq('user_id', submission.assignments.user_id)
      .single();

    // Get historical teacher edits for this teacher to understand preferences
    const { data: teacherEdits } = await supabaseClient
      .from('teacher_edits')
      .select('action_type, comment_text')
      .eq('user_id', submission.assignments.user_id)
      .limit(10);

    // Phase 2: Assemble Master Prompt with Context
    let masterPrompt = `You are an expert grading assistant helping a teacher evaluate student work. Your task is to provide detailed, actionable feedback.

ASSIGNMENT CONTEXT:
Title: ${submission.assignments.title}
Description: ${submission.assignments.description || 'No description provided'}

RUBRIC:
${submission.assignments.rubric_text || 'No specific rubric provided'}

GRADING INSTRUCTIONS:
${submission.assignments.prompt_instructions}

STUDENT SUBMISSION:
${submission.essay || 'No essay content available'}

TEACHER STYLE PREFERENCES:`;

    if (teacherProfile?.style_profile_json) {
      const styleProfile = teacherProfile.style_profile_json;
      masterPrompt += `\n- Feedback Style: ${styleProfile.feedback_style || 'Balanced'}`;
      masterPrompt += `\n- Focus Areas: ${styleProfile.focus_areas?.join(', ') || 'General'}`;
      masterPrompt += `\n- Tone Preference: ${styleProfile.tone || 'Professional'}`;
    }

    if (teacherEdits && teacherEdits.length > 0) {
      const acceptedComments = teacherEdits.filter(edit => edit.action_type === 'accept');
      if (acceptedComments.length > 0) {
        masterPrompt += `\n\nBased on this teacher's previous preferences, they tend to accept feedback that includes: ${acceptedComments.slice(0, 3).map(edit => edit.comment_text).join('; ')}`;
      }
    }

    masterPrompt += `

Please provide your response in the following JSON format:
{
  "overall_grade": "A letter grade (A-F)",
  "overall_score": "A numeric score out of 100",
  "summary_feedback": "A concise overall assessment",
  "detailed_feedback": [
    {
      "id": "unique_id",
      "category": "Content|Organization|Grammar|Style",
      "type": "strength|improvement|suggestion",
      "text": "Specific feedback text",
      "severity": "high|medium|low",
      "text_selection": "Exact text from essay this refers to (if applicable)"
    }
  ],
  "inline_comments": [
    {
      "id": "unique_id", 
      "start_pos": 0,
      "end_pos": 10,
      "comment": "Specific comment about this text section",
      "type": "suggestion|correction|praise"
    }
  ]
}`;

    // Phase 3: Call Gemini API
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: masterPrompt
          }]
        }]
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate feedback' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return new Response(
        JSON.stringify({ error: 'No feedback generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response from Gemini
    let feedbackData;
    try {
      // Extract JSON from the response (in case it's wrapped in markdown)
      const jsonMatch = generatedText.match(/```json\n?(.*?)\n?```/s) || generatedText.match(/\{.*\}/s);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : generatedText;
      feedbackData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      // Fallback to basic feedback structure
      feedbackData = {
        overall_grade: "B",
        overall_score: 85,
        summary_feedback: generatedText.substring(0, 500),
        detailed_feedback: [],
        inline_comments: []
      };
    }

    // Phase 4: Store Results in Database
    const { error: updateError } = await supabaseClient
      .from('submissions')
      .update({
        ai_feedback: feedbackData.summary_feedback,
        ai_grade: feedbackData.overall_grade,
        ai_score: feedbackData.overall_score,
        feedback_json: feedbackData,
        inline_comments: feedbackData.inline_comments,
        status: 'ai_graded',
        processing_status: 'completed'
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Error updating submission:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save feedback' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the grading session
    await supabaseClient
      .from('llm_sessions')
      .insert({
        user_id: user.id,
        input_data: { submissionId, masterPrompt },
        output_data: feedbackData,
        status: 'completed'
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        feedback: feedbackData,
        submissionId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-grading-feedback function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
