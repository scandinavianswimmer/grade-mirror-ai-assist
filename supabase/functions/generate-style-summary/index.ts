
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, examples } = await req.json()

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    // Create a prompt to analyze grading style from examples
    const prompt = `You are an educational assessment expert. Analyze the following grading examples from a teacher and create a comprehensive summary of their grading style, preferences, and approach.

Based on ${examples.length} grading examples, please provide a detailed analysis that covers:
- Overall grading philosophy and approach
- Focus areas (content, structure, mechanics, creativity, etc.)
- Feedback style (encouraging, direct, detailed, brief, etc.)
- Standards and expectations
- Areas of emphasis in student development

Create a 3-4 sentence summary that captures the essence of this teacher's grading style that can be used to train an AI model to grade similarly.

Examples metadata:
${examples.map((ex, i) => `Example ${i + 1}: ${ex.title} (${ex.file_type})`).join('\n')}

Provide only the grading style summary, no additional commentary.`

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
          maxOutputTokens: 512,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const result = await response.json()
    const summary = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!summary) {
      throw new Error('No response from Gemini API')
    }

    return new Response(
      JSON.stringify({ summary: summary.trim() }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error generating style summary:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
