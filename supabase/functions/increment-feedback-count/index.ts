
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id } = await req.json()

    // Get current user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('weekly_feedback_count, last_reset_date')
      .eq('id', user_id)
      .single()

    if (userError) throw userError

    // Check if we need to reset the weekly count
    const today = new Date()
    const lastReset = new Date(user.last_reset_date)
    const daysDiff = Math.floor((today.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24))

    let newCount = (user.weekly_feedback_count || 0) + 1
    let resetDate = user.last_reset_date

    if (daysDiff >= 7) {
      newCount = 1
      resetDate = today.toISOString().split('T')[0]
    }

    // Update the user's feedback count
    const { error: updateError } = await supabase
      .from('users')
      .update({
        weekly_feedback_count: newCount,
        last_reset_date: resetDate
      })
      .eq('id', user_id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true, new_count: newCount }),
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
