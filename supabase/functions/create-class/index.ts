
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Authentication failed')
    }

    console.log('Authenticated user:', user.id)

    // Parse the request body
    const { className, gradeLevel, classSize, classLevel } = await req.json()

    console.log('Creating class with data:', { className, gradeLevel, classSize, classLevel })

    // Validate required fields
    if (!className || !gradeLevel || !classSize || !classLevel) {
      throw new Error('Missing required fields')
    }

    // Assemble the details JSON object
    const detailsJsonb = {
      grade: gradeLevel,
      size: parseInt(classSize),
      level: classLevel
    }

    // Insert the new class into the database
    const { data, error } = await supabase
      .from('classes')
      .insert({
        user_id: user.id,
        class_name: className,
        details_jsonb: detailsJsonb
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    console.log('Class created successfully:', data)

    return new Response(
      JSON.stringify({ success: true, class: data }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in create-class function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while creating the class' 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
