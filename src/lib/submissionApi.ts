
import { supabase } from './supabase';
import { processSubmissionFile } from './fileProcessing';

export interface CreateSubmissionData {
  assignmentId: string;
  studentName: string;
  essay?: string;
  file?: File;
}

export const createSubmissionWithFile = async (data: CreateSubmissionData) => {
  const { assignmentId, studentName, essay, file } = data;

  try {
    console.log('Creating submission with file processing...');

    let submissionData: any = {
      assignment_id: assignmentId,
      student_name: studentName,
      status: 'pending',
      processing_status: 'uploaded'
    };

    // Process file if provided
    if (file) {
      const processResult = await processSubmissionFile(file, assignmentId, studentName);
      
      if (!processResult.success) {
        throw new Error(processResult.error || 'File processing failed');
      }

      submissionData.file_url = processResult.url;
      submissionData.submission_storage_path = processResult.storagePath;
      
      // Use extracted text or provided essay text
      submissionData.essay = processResult.extractedText || essay;
    } else if (essay) {
      submissionData.essay = essay;
    }

    console.log('Creating submission with data:', submissionData);

    const { data: submission, error } = await supabase
      .from('submissions')
      .insert(submissionData)
      .select()
      .single();

    if (error) throw error;

    console.log('Submission created successfully:', submission.id);
    return submission;

  } catch (error) {
    console.error('Error creating submission:', error);
    throw error;
  }
};

export const updateSubmissionStatus = async (submissionId: string, status: string, processingStatus?: string) => {
  const updates: any = { status };
  if (processingStatus) {
    updates.processing_status = processingStatus;
  }

  const { error } = await supabase
    .from('submissions')
    .update(updates)
    .eq('id', submissionId);

  if (error) throw error;
};

export const getTeacherProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('teacher_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
};
