
import { supabase } from './supabase';

export const gradeSubmission = async (submissionId: string) => {
  console.log('Starting AI grading for submission:', submissionId);

  try {
    // Call the enhanced generate-grading-feedback function
    const { data, error } = await supabase.functions.invoke('generate-grading-feedback', {
      body: { submissionId }
    });

    if (error) {
      console.error('Error calling grading function:', error);
      throw new Error(error.message || 'Failed to generate feedback');
    }

    console.log('Grading completed successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in gradeSubmission:', error);
    throw error;
  }
};

export const processSubmissionFile = async (submissionId: string, fileContent: string) => {
  console.log('Processing submission file for ID:', submissionId);
  
  try {
    // Update the submission with the file content
    const { error: updateError } = await supabase
      .from('submissions')
      .update({ 
        essay: fileContent,
        processing_status: 'file_processed' 
      })
      .eq('id', submissionId);

    if (updateError) {
      throw updateError;
    }

    // Now grade the submission
    return await gradeSubmission(submissionId);
  } catch (error) {
    console.error('Error processing submission file:', error);
    throw error;
  }
};
