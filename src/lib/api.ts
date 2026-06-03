
import { supabase, Assignment, Submission, Rubric, TrainingData } from './supabase'

// Assignments
export const getAssignments = async (userId: string) => {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const createAssignment = async (assignment: Omit<Assignment, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('assignments')
    .insert(assignment)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getAssignment = async (id: string) => {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export const deleteAssignment = async (id: string) => {
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Submissions
export const getSubmissions = async (assignmentId: string) => {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const createSubmission = async (submission: Omit<Submission, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('submissions')
    .insert(submission)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateSubmission = async (id: string, updates: Partial<Submission>) => {
  const { data, error } = await supabase
    .from('submissions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Rubrics
export const getRubrics = async (userId: string) => {
  const { data, error } = await supabase
    .from('rubrics')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const createRubric = async (rubric: Omit<Rubric, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('rubrics')
    .insert(rubric)
    .select()
    .single()

  if (error) throw error
  return data
}

// Classes
export const deleteClass = async (id: string) => {
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Training Data
export const deleteTrainingData = async (id: string) => {
  const { error } = await supabase
    .from('training_data')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export const updateTrainingData = async (id: string, updates: Partial<TrainingData>) => {
  const { data, error } = await supabase
    .from('training_data')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Training Data
export const getTrainingData = async (userId: string) => {
  const { data, error } = await supabase
    .from('training_data')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const uploadTrainingData = async (trainingData: Omit<TrainingData, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('training_data')
    .insert(trainingData)
    .select()
    .single()

  if (error) throw error
  return data
}

// File Upload
export const uploadFile = async (file: File, bucket: string, path: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file)

  if (error) throw error
  return data
}

// Buckets are private — return a short-lived signed URL, never a public URL (C6).
export const getFileUrl = async (bucket: string, path: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600)

  if (error) throw error
  return data.signedUrl
}

// AI Grading API
export const generateGradingFeedback = async (payload: {
  teacher_id: string
  rubric_text: string
  essay_text: string
  training_examples: Array<{
    essay: string
    rubric: string
    feedback: string
    grade: string
  }>
}) => {
  const { data, error } = await supabase.functions.invoke('generate-grading-feedback', {
    body: {
      essayText: payload.essay_text,
      rubricText: payload.rubric_text,
      trainingData: payload.training_examples,
      userId: payload.teacher_id
    }
  })

  if (error) throw error
  return data
}
