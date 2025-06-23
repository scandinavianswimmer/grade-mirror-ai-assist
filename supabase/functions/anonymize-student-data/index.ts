
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get users who have enabled anonymization
    const { data: settings, error: settingsError } = await supabaseClient
      .from('privacy_settings')
      .select('user_id')
      .eq('anonymize_student_names', true)

    if (settingsError) throw settingsError

    let totalAnonymized = 0

    for (const setting of settings || []) {
      // Get submissions that haven't been anonymized yet for this user
      const { data: submissions, error: submissionsError } = await supabaseClient
        .from('submissions')
        .select(`
          id, 
          student_name,
          assignments!inner(user_id)
        `)
        .eq('assignments.user_id', setting.user_id)
        .not('student_name', 'like', 'Student_%') // Skip already anonymized

      if (submissionsError) throw submissionsError

      for (const submission of submissions || []) {
        // Generate anonymous ID
        const anonymousId = `Student_${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        
        const { error: updateError } = await supabaseClient
          .from('submissions')
          .update({ student_name: anonymousId })
          .eq('id', submission.id)

        if (updateError) throw updateError
        totalAnonymized++
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Anonymized ${totalAnonymized} submissions` 
      }),
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
