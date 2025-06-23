
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

    // Get users who have enabled auto-delete
    const { data: settings, error: settingsError } = await supabaseClient
      .from('privacy_settings')
      .select('user_id')
      .eq('auto_delete_training_data', true)

    if (settingsError) throw settingsError

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 30) // 30 days old

    let totalDeleted = 0

    for (const setting of settings || []) {
      // Get user's assignment IDs
      const { data: assignments, error: assignmentsError } = await supabaseClient
        .from('assignments')
        .select('id')
        .eq('user_id', setting.user_id)

      if (assignmentsError) throw assignmentsError

      const assignmentIds = assignments?.map(a => a.id) || []

      if (assignmentIds.length > 0) {
        // Delete old unfinalized grades
        const { data: deletedSubmissions, error: deleteError } = await supabaseClient
          .from('submissions')
          .delete()
          .eq('status', 'ai_graded')
          .lt('created_at', cutoffDate.toISOString())
          .in('assignment_id', assignmentIds)
          .select('id')

        if (deleteError) throw deleteError
        totalDeleted += deletedSubmissions?.length || 0
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Deleted ${totalDeleted} old unfinalized submissions` 
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
