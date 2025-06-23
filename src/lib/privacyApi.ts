
import { supabase, PrivacySettings } from './supabase'

// Privacy Settings
export const getPrivacySettings = async (userId: string): Promise<PrivacySettings | null> => {
  const { data, error } = await supabase
    .from('privacy_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    throw error
  }
  
  return data
}

export const createPrivacySettings = async (settings: Omit<PrivacySettings, 'id' | 'created_at'>): Promise<PrivacySettings> => {
  const { data, error } = await supabase
    .from('privacy_settings')
    .insert(settings)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updatePrivacySettings = async (userId: string, updates: Partial<PrivacySettings>): Promise<PrivacySettings> => {
  const { data, error } = await supabase
    .from('privacy_settings')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Data anonymization
export const anonymizeStudentData = async (submissionId: string): Promise<void> => {
  // Generate a random anonymous identifier
  const anonymousId = `Student_${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  
  const { error } = await supabase
    .from('submissions')
    .update({ student_name: anonymousId })
    .eq('id', submissionId)

  if (error) throw error
}

// Data export
export const exportUserData = async (userId: string) => {
  const [assignments, submissions, rubrics, trainingData, privacySettings] = await Promise.all([
    supabase.from('assignments').select('*').eq('user_id', userId),
    supabase.from('submissions').select('*, assignments!inner(user_id)').eq('assignments.user_id', userId),
    supabase.from('rubrics').select('*').eq('user_id', userId),
    supabase.from('training_data').select('*').eq('user_id', userId),
    supabase.from('privacy_settings').select('*').eq('user_id', userId).single()
  ])

  return {
    user_id: userId,
    export_date: new Date().toISOString(),
    assignments: assignments.data || [],
    submissions: submissions.data || [],
    rubrics: rubrics.data || [],
    training_data: trainingData.data || [],
    privacy_settings: privacySettings.data
  }
}

// Data deletion
export const deleteAllUserData = async (userId: string): Promise<void> => {
  // Delete in order to respect foreign key constraints
  await supabase.from('submissions').delete().eq('assignment_id', 
    supabase.from('assignments').select('id').eq('user_id', userId)
  )
  
  await supabase.from('assignments').delete().eq('user_id', userId)
  await supabase.from('rubrics').delete().eq('user_id', userId)
  await supabase.from('training_data').delete().eq('user_id', userId)
  await supabase.from('privacy_settings').delete().eq('user_id', userId)
  await supabase.from('lms_integrations').delete().eq('user_id', userId)
  await supabase.from('llm_sessions').delete().eq('user_id', userId)
}

// Auto-delete functionality
export const deleteUnfinalizedGrades = async (userId: string, daysOld: number = 30): Promise<void> => {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('status', 'ai_graded')
    .lt('created_at', cutoffDate.toISOString())
    .in('assignment_id', 
      supabase.from('assignments').select('id').eq('user_id', userId)
    )

  if (error) throw error
}
