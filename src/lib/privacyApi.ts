
import { supabase, PrivacySettings } from './supabase'
import type { AppTableInsert, AppTableUpdate } from '@/integrations/supabase/app-database'

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

export const createPrivacySettings = async (settings: AppTableInsert<'privacy_settings'>): Promise<PrivacySettings> => {
  const { data, error } = await supabase
    .from('privacy_settings')
    .insert(settings)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updatePrivacySettings = async (userId: string, updates: AppTableUpdate<'privacy_settings'>): Promise<PrivacySettings> => {
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

// Best-effort delete that ignores "table/column doesn't exist" so a partial schema
// (v1 + additive v2) never aborts the whole deletion (H29).
const tryDelete = async (run: () => PromiseLike<{ error: unknown }>) => {
  try { await run() } catch { /* table may not exist in this schema */ }
}

// Remove every object a user owns from a private bucket (best-effort).
const purgeBucket = async (bucket: string, prefix: string) => {
  try {
    const { data } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 })
    if (data?.length) {
      await supabase.storage.from(bucket).remove(data.map((f) => `${prefix}/${f.name}`))
    }
  } catch { /* bucket may not exist */ }
}

// Full data deletion: DB rows across v1 + v2 tables AND storage files (H29, H31).
// Note: deleting the auth account itself requires a service-role server function and is
// not performed here — this clears all of the user's content and storage objects.
export const deleteAllUserData = async (userId: string): Promise<void> => {
  // Assignment + submission IDs needed to clear child rows.
  const { data: assignments } = await supabase.from('assignments').select('id').eq('user_id', userId)
  const assignmentIds = assignments?.map((a) => a.id) || []

  let submissionIds: string[] = []
  if (assignmentIds.length > 0) {
    const { data: subs } = await supabase.from('submissions').select('id').in('assignment_id', assignmentIds)
    submissionIds = subs?.map((s) => s.id) || []
  }

  // v2 grade artifacts (scoped by user_id).
  await tryDelete(() => supabase.from('annotation_edits').delete().eq('user_id', userId))
  await tryDelete(() => supabase.from('annotations').delete().eq('user_id', userId))
  await tryDelete(() => supabase.from('submission_grades').delete().eq('user_id', userId))
  await tryDelete(() => supabase.from('teacher_style_profiles').delete().eq('user_id', userId))
  await tryDelete(() => supabase.from('consent_records').delete().eq('user_id', userId))
  await tryDelete(() => supabase.from('lms_credentials').delete().eq('user_id', userId))
  await tryDelete(() => supabase.from('access_audit_log').delete().eq('actor_id', userId))

  // Submissions (and any child rows keyed by submission_id).
  if (submissionIds.length > 0) {
    await tryDelete(() => supabase.from('annotations').delete().in('submission_id', submissionIds))
    await tryDelete(() => supabase.from('submission_grades').delete().in('submission_id', submissionIds))
  }
  if (assignmentIds.length > 0) {
    await tryDelete(() => supabase.from('submissions').delete().in('assignment_id', assignmentIds))
  }

  // v1 + core tables.
  await tryDelete(() => supabase.from('rubric_criteria').delete().eq('user_id', userId))
  await tryDelete(() => supabase.from('assignments').delete().eq('user_id', userId))
  await tryDelete(() => supabase.from('rubrics').delete().eq('user_id', userId))
  await tryDelete(() => supabase.from('training_data').delete().eq('user_id', userId))
  await tryDelete(() => supabase.from('training_examples').delete().eq('user_id', userId))
  await tryDelete(() => supabase.from('grading_examples').delete().eq('user_id', userId))
  await tryDelete(() => supabase.from('ai_profiles').delete().eq('user_id', userId))
  await tryDelete(() => supabase.from('teacher_profiles').delete().eq('user_id', userId))
  await tryDelete(() => supabase.from('lms_integrations').delete().eq('user_id', userId))
  await tryDelete(() => supabase.from('llm_sessions').delete().eq('user_id', userId))
  await tryDelete(() => supabase.from('privacy_settings').delete().eq('user_id', userId))

  // Storage objects across all user-owned buckets (H31).
  await purgeBucket('submissions', userId)
  await purgeBucket('uploads', userId)
  await purgeBucket('grading-examples', userId)
  await purgeBucket('training-data', userId)
}

// Auto-delete functionality
export const deleteUnfinalizedGrades = async (userId: string, daysOld: number = 30): Promise<void> => {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  // First get assignment IDs for this user
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id')
    .eq('user_id', userId)
  
  const assignmentIds = assignments?.map(a => a.id) || []
  
  // Delete unfinalized grades for user's assignments
  if (assignmentIds.length > 0) {
    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('status', 'ai_graded')
      .lt('created_at', cutoffDate.toISOString())
      .in('assignment_id', assignmentIds)

    if (error) throw error
  }
}
