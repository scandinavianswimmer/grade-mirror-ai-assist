
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, essay } = await req.json()

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    // Get teacher's AI profile from database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: aiProfile, error: profileError } = await supabase
      .from('ai_profiles')
      .select('grading_style_summary')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      throw new Error('Could not fetch teacher grading profile')
    }

    const gradingStyle = aiProfile?.grading_style_summary || 'You have a balanced grading approach focusing on both content and writing mechanics.'

    // Create personalized grading prompt
    const prompt = `You are an AI grading assistant trained to match a specific teacher's grading style and preferences.

TEACHER'S GRADING STYLE:
${gradingStyle}

STUDENT ESSAY TO GRADE:
${essay}

Please provide comprehensive feedback that matches this teacher's style, including:

1. OVERALL FEEDBACK: A detailed paragraph summarizing the essay's strengths and areas for improvement
2. SUGGESTED GRADE: A letter grade (A+, A, A-, B+, B, B-, C+, C, C-, D+, D, F)
3. SPECIFIC AREAS:
   - Content and Ideas
   - Organization and Structure  
   - Writing Mechanics
   - Areas for Improvement

Format your response as follows:
GRADE: [Letter Grade]

OVERALL FEEDBACK:
[Comprehensive feedback paragraph]

DETAILED ANALYSIS:
Content and Ideas: [Analysis]
Organization: [Analysis] 
Writing Mechanics: [Analysis]
Areas for Improvement: [Specific suggestions]

Keep the tone and approach consistent with the teacher's established grading style.`

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const result = await response.json()
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      throw new Error('No response from Gemini API')
    }

    // Parse the response to extract grade and feedback
    const gradeMatch = generatedText.match(/GRADE:\s*([A-F][+-]?)/i)
    const feedbackMatch = generatedText.match(/OVERALL FEEDBACK:\s*(.*?)(?=DETAILED ANALYSIS:|$)/s)
    
    const grade = gradeMatch?.[1] || "B+"
    const feedback = feedbackMatch?.[1]?.trim() || generatedText.trim()

    return new Response(
      JSON.stringify({ feedback, grade }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error generating test grading:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
