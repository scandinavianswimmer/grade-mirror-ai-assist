
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
    const { userId, essay } = await req.json()

    // Simulate AI grading based on teacher's style
    // In a real implementation, this would use the teacher's AI profile and Gemini API
    const feedback = `This essay demonstrates a solid understanding of the American Revolution's key events and causes. The introduction effectively sets up the historical context, and the student shows good knowledge of specific events like the Boston Tea Party and Boston Massacre.

Strengths:
- Clear chronological organization
- Good use of specific historical examples
- Solid conclusion that ties back to the thesis

Areas for improvement:
- Could benefit from more analysis of cause-and-effect relationships
- Some transitions between paragraphs could be smoother
- Consider expanding on the significance of the Treaty of Paris

The writing is clear and demonstrates good historical knowledge. With some additional analysis and smoother transitions, this would be an excellent essay.`

    const grade = "B+"

    return new Response(
      JSON.stringify({ feedback, grade }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
