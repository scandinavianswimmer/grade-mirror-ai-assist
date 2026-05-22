
import { deleteUnfinalizedGrades, anonymizeStudentData } from './privacyApi'
import { supabase } from './supabase'

// Auto-delete unfinalized grades based on user settings
export const runAutoDeleteTask = async () => {
  try {
    const { data: users, error } = await supabase
      .from('privacy_settings')
      .select('user_id, auto_delete_training_data, retention_days')
      .eq('auto_delete_training_data', true)

    if (error) throw error

    for (const user of users || []) {
      // null retention_days = keep forever; otherwise honor the teacher's choice (H32).
      const days = user.retention_days ?? 30
      if (days > 0) await deleteUnfinalizedGrades(user.user_id, days)
    }
  } catch (error) {
    console.error('Auto-delete task failed:', error)
  }
}

// Auto-anonymize student data based on user settings
export const runAnonymizationTask = async () => {
  try {
    const { data: settings, error } = await supabase
      .from('privacy_settings')
      .select('user_id, anonymize_student_names')
      .eq('anonymize_student_names', true)

    if (error) throw error

    for (const setting of settings || []) {
      // Get submissions that haven't been anonymized yet
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('id, student_name, assignments!inner(user_id)')
        .eq('assignments.user_id', setting.user_id)
        .not('student_name', 'like', 'Student_%') // Skip already anonymized

      if (submissionsError) throw submissionsError

      for (const submission of submissions || []) {
        await anonymizeStudentData(submission.id)
      }

      console.log(`Anonymized ${submissions?.length || 0} submissions for user: ${setting.user_id}`)
    }
  } catch (error) {
    console.error('Anonymization task failed:', error)
  }
}

// Main scheduled task runner
export const runScheduledTasks = async () => {
  console.log('Running scheduled privacy tasks...')
  
  await Promise.all([
    runAutoDeleteTask(),
    runAnonymizationTask()
  ])
  
  console.log('Scheduled privacy tasks completed')
}
