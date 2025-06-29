
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

    // Get current user data
    const { data: user, error: fetchError } = await supabaseClient
      .from('users')
      .select('weekly_feedback_count, last_reset_date')
      .eq('id', userId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Check if we need to reset the weekly count
    const today = new Date();
    const lastReset = user.last_reset_date ? new Date(user.last_reset_date) : new Date();
    const daysDiff = Math.floor((today.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));

    let newCount = (user.weekly_feedback_count || 0) + 1;
    let resetDate = user.last_reset_date;

    // Reset if it's been more than 7 days
    if (daysDiff >= 7) {
      newCount = 1;
      resetDate = today.toISOString().split('T')[0];
    }

    // Update the user's feedback count
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({ 
        weekly_feedback_count: newCount,
        last_reset_date: resetDate
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        newCount,
        resetDate 
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
