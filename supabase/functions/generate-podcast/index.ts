import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.12.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PodcastGenerationResponse {
  script: string;
  summary: string;
  tags: string[];
  voiceStyle: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, inputNotes, userId } = await req.json();

    if (!title || !userId) {
      throw new Error('Title and userId are required');
    }

    console.log('Generating podcast for:', { title, userId });

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create comprehensive prompt for podcast generation
    const prompt = `
You are an expert podcast scriptwriter specializing in AEC (Architecture, Engineering, Construction) industry content. 

Create a comprehensive podcast script for the following:
Title: "${title}"
${inputNotes ? `Additional Notes: ${inputNotes}` : ''}

The podcast should be engaging, professional, and technically accurate. Structure it as follows:

1. **Opening Hook** (30-45 seconds): Start with a compelling statistic or story
2. **Introduction** (1-2 minutes): Introduce the topic and what listeners will learn
3. **Main Content** (8-12 minutes): Deep dive into the topic with real examples
4. **Tool Spotlight** (2-3 minutes): Highlight relevant AI tools like Togal.ai, Alice Tech, nPlan, Join.Build
5. **Key Takeaways** (1-2 minutes): Summarize main points
6. **Call to Action** (30 seconds): Encourage engagement

Include natural conversational elements, pauses for emphasis, and technical insights that would resonate with AEC professionals.

Please respond in JSON format with the following structure:
{
  "script": "full detailed script with timing cues and natural speech patterns",
  "summary": "compelling 2-3 sentence episode description",
  "tags": ["relevant", "hashtags", "for", "social", "media"],
  "voiceStyle": "detailed voice direction (tone, pace, emphasis style)"
}

Make it sound natural and engaging, not robotic. Include industry-specific insights and real-world applications.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Raw Gemini response:', text);

    let generatedContent: PodcastGenerationResponse;
    try {
      // Try to parse JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      // Fallback with structured content
      generatedContent = {
        script: text,
        summary: `Episode exploring ${title} - essential insights for AEC professionals.`,
        tags: ["#AEC", "#Construction", "#Technology", "#AI"],
        voiceStyle: "Professional yet conversational, confident delivery with technical expertise"
      };
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store the generated podcast in the database
    const { data: podcastData, error: dbError } = await supabase
      .from('podcast_episodes')
      .insert({
        user_id: userId,
        title: title,
        input_notes: inputNotes || null,
        script: generatedContent.script,
        summary: generatedContent.summary,
        tags: generatedContent.tags,
        voice_style: generatedContent.voiceStyle,
        status: 'generated'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to save podcast: ${dbError.message}`);
    }

    console.log('Podcast generated successfully:', podcastData.id);

    return new Response(
      JSON.stringify({
        success: true,
        podcast: podcastData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in generate-podcast function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});