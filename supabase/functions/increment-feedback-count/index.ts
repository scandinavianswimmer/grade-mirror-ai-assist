
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

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

    // Increment the weekly feedback count
    const { data, error } = await supabaseClient
      .from('users')
      .select('weekly_feedback_count, plan')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    const newCount = (data.weekly_feedback_count || 0) + 1;
    const limit = data.plan === 'freemium' ? 3 : 999; // Freemium users get 3 per week

    if (newCount > limit) {
      return new Response(
        JSON.stringify({ 
          error: 'Weekly limit reached',
          limit,
          current: data.weekly_feedback_count 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        }
      );
    }

    // Update the count
    await supabaseClient
      .from('users')
      .update({ weekly_feedback_count: newCount })
      .eq('id', userId);

    return new Response(
      JSON.stringify({ 
        success: true,
        count: newCount,
        limit 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in increment-feedback-count:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
