
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

export interface DeleteAllUserDataResult {
  scope: 'account'
  deletedSubmissions: number
  filesRemoved: number
  bucketsProcessed: string[]
  accountRetained: true
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object'
)

const readFunctionError = async (error: unknown): Promise<string> => {
  try {
    const context = isRecord(error) ? error.context : null
    if (isRecord(context) && typeof context.json === 'function') {
      const body = await context.json()
      if (isRecord(body) && typeof body.error === 'string' && body.error.trim()) {
        return body.error
      }
    }
  } catch {
    // Network/non-JSON response: use the stable retry-safe fallback below.
  }
  return 'Data deletion is temporarily unavailable. Your data was not reported as deleted; please retry.'
}

// The browser never performs destructive table/storage operations directly and never supplies a
// user id. The edge function derives identity from the JWT, recursively removes owned objects,
// verifies they are gone, and only then deletes database records.
export const deleteAllUserData = async (): Promise<DeleteAllUserDataResult> => {
  const { data, error } = await supabase.functions.invoke('delete-data', {
    body: { scope: 'account' }
  })

  if (error) throw new Error(await readFunctionError(error))
  const requiredBuckets = ['submissions', 'uploads', 'grading-examples', 'training-data']
  const bucketsProcessed = isRecord(data) && Array.isArray(data.bucketsProcessed)
    ? data.bucketsProcessed
    : null
  if (
    !isRecord(data) ||
    data.scope !== 'account' ||
    !Number.isInteger(data.deletedSubmissions) ||
    (data.deletedSubmissions as number) < 0 ||
    !Number.isInteger(data.filesRemoved) ||
    (data.filesRemoved as number) < 0 ||
    !bucketsProcessed ||
    !requiredBuckets.every((bucket) => bucketsProcessed.includes(bucket)) ||
    data.accountRetained !== true
  ) {
    throw new Error('Data deletion returned an invalid confirmation. Please contact support before retrying.')
  }

  return data as unknown as DeleteAllUserDataResult
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
