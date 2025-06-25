
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
    const { essayText, rubricText, trainingData, userId } = await req.json()

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    // Create training prompt with historical examples
    const trainingExamples = trainingData.map((data: any) => `
---
Essay:
${data.essay_text || data.file_content}
Rubric:
${data.rubric_text || 'Standard rubric'}
Feedback:
${data.feedback_text || 'No feedback provided'}
Grade:
${data.grade || 'Not graded'}
---`).join('\n')

    const prompt = `You are an educator using a structured rubric to provide thoughtful feedback. Below are past grading examples:
${trainingExamples}

New Essay:
${essayText}
Rubric:
${rubricText}

Respond with:
- Inline comments (mark specific text segments with suggestions)
- Overall feedback (comprehensive summary)
- Suggested grade (letter grade with explanation)
- Reasoning behind score (brief justification)

Format your response as JSON with the following structure:
{
  "inlineComments": [{"text": "highlighted text", "comment": "suggestion"}],
  "overallFeedback": "comprehensive feedback text",
  "suggestedGrade": "A-",
  "reasoning": "explanation of grade",
  "confidence": 0.87
}`

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
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const result = await response.json()
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      throw new Error('No response from Gemini')
    }

    // Parse JSON response
    let parsedResponse
    try {
      // Extract JSON from response (sometimes wrapped in markdown)
      const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || generatedText.match(/{[\s\S]*}/)
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : generatedText
      parsedResponse = JSON.parse(jsonString)
    } catch (e) {
      // Fallback if JSON parsing fails
      parsedResponse = {
        inlineComments: [],
        overallFeedback: generatedText,
        suggestedGrade: "B",
        reasoning: "AI generated feedback",
        confidence: 0.7
      }
    }

    // Log the session
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    await supabase
      .from('llm_sessions')
      .insert({
        user_id: userId,
        status: 'completed',
        input_data: { essayText, rubricText },
        output_data: parsedResponse,
        timestamp: new Date().toISOString(),
        confidence_score: parsedResponse.confidence || 0.8
      })

    return new Response(
      JSON.stringify(parsedResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
