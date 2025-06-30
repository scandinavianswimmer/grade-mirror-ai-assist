
import { supabase } from './supabase';
import { processSubmissionFileEnhanced } from './enhancedFileProcessing';
import { generateGradingFeedback } from './geminiApi';

export interface CreateSubmissionData {
  assignmentId: string;
  studentName: string;
  essay?: string;
  file?: File;
}

export const createSubmissionWithFile = async (data: CreateSubmissionData) => {
  const { assignmentId, studentName, essay, file } = data;

  try {
    console.log('Creating submission with enhanced file processing...');

    let submissionData: any = {
      assignment_id: assignmentId,
      student_name: studentName,
      status: 'pending',
      processing_status: 'uploaded'
    };

    // Process file if provided
    if (file) {
      const processResult = await processSubmissionFileEnhanced(file, assignmentId, studentName);
      
      if (!processResult.success) {
        throw new Error(processResult.error || 'File processing failed');
      }

      submissionData.file_url = processResult.url;
      submissionData.submission_storage_path = processResult.storagePath;
      
      // Use extracted text or provided essay text
      submissionData.essay = processResult.extractedText || essay;
      
      // Store processing metadata
      if (processResult.metadata) {
        submissionData.inline_comments = {
          processing_metadata: processResult.metadata
        };
      }
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

export const gradeSubmissionWithAI = async (submissionId: string) => {
  try {
    console.log('Starting AI grading for submission:', submissionId);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get submission and assignment details
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select(`
        *,
        assignments (
          title,
          rubric_text,
          description
        )
      `)
      .eq('id', submissionId)
      .single();

    if (submissionError) throw submissionError;
    if (!submission) throw new Error('Submission not found');

    console.log('Retrieved submission data for grading');

    // Update status to processing
    await updateSubmissionStatus(submissionId, 'pending', 'processing');

    // Generate AI feedback
    const gradingResult = await generateGradingFeedback(
      submission.essay || '',
      submission.assignments?.rubric_text || '',
      submissionId,
      user.id
    );

    console.log('AI grading completed, updating submission...');

    // Update submission with AI results - fix the type error
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        ai_feedback: gradingResult.overallFeedback,
        ai_grade: gradingResult.suggestedGrade, // This is correct - ai_grade is text
        feedback_json: gradingResult as any,
        status: 'ai_graded',
        processing_status: 'completed'
      })
      .eq('id', submissionId);

    if (updateError) throw updateError;

    console.log('Submission updated with AI grading results');
    return gradingResult;

  } catch (error) {
    console.error('Error in AI grading:', error);
    
    // Update status to error
    await updateSubmissionStatus(submissionId, 'pending', 'error');
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

export const saveSubmissionFeedback = async (submissionId: string, feedback: string, grade: string) => {
  try {
    const { error } = await supabase
      .from('submissions')
      .update({
        feedback: feedback,
        ai_grade: grade, // Save letter grade as text to ai_grade field
        status: 'finalized'
      })
      .eq('id', submissionId);

    if (error) throw error;
    
    console.log('Final feedback saved for submission:', submissionId);
  } catch (error) {
    console.error('Error saving submission feedback:', error);
    throw error;
  }
};
