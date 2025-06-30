
import { supabase } from './supabase';
import { pushFeedbackToCanvas } from './canvasApi';

export interface FinalizationOptions {
  exportFormat?: 'pdf' | 'docx' | 'html';
  includeComments?: boolean;
  pushToLMS?: boolean;
  sendNotification?: boolean;
}

export const finalizeSubmission = async (
  submissionId: string, 
  options: FinalizationOptions = {}
) => {
  try {
    console.log('Finalizing submission:', submissionId);

    const {
      exportFormat = 'pdf',
      includeComments = true,
      pushToLMS = false,
      sendNotification = false
    } = options;

    // Update submission status to finalized
    const { data: submission, error: updateError } = await supabase
      .from('submissions')
      .update({ 
        status: 'finalized',
        processing_status: 'completed'
      })
      .eq('id', submissionId)
      .select(`
        *,
        assignments (
          user_id,
          title,
          canvas_id
        )
      `)
      .single();

    if (updateError) throw updateError;

    const results: any = {
      submissionId,
      finalized: true,
      finalizedAt: new Date().toISOString(),
    };

    // Export graded file if requested
    if (exportFormat) {
      try {
        const { data: exportData, error: exportError } = await supabase.functions.invoke(
          'export-graded-pdf',
          {
            body: {
              submissionId,
              includeComments,
              format: exportFormat
            }
          }
        );

        if (exportError) throw exportError;
        
        results.exported = true;
        results.exportFormat = exportFormat;
        results.exportUrl = exportData?.url;
      } catch (exportError) {
        console.error('Export failed:', exportError);
        results.exportError = exportError.message;
      }
    }

    // Push to LMS if requested and configured
    if (pushToLMS && submission.assignments.canvas_id) {
      try {
        await pushFeedbackToCanvas(submissionId);
        results.pushedToLMS = true;
      } catch (lmsError) {
        console.error('LMS push failed:', lmsError);
        results.lmsError = lmsError.message;
      }
    }

    // Log finalization activity - fix type issues by simplifying
    const logData = {
      user_id: submission.assignments.user_id,
      input_data: {
        action: 'finalize_submission',
        submissionId,
        options: {
          exportFormat,
          includeComments,
          pushToLMS,
          sendNotification
        }
      },
      output_data: results,
      status: 'completed'
    };

    await supabase
      .from('llm_sessions')
      .insert(logData);

    return results;

  } catch (error) {
    console.error('Finalization error:', error);
    throw error;
  }
};

export const bulkFinalizeSubmissions = async (
  submissionIds: string[],
  options: FinalizationOptions = {}
) => {
  console.log(`Bulk finalizing ${submissionIds.length} submissions`);
  
  const results = [];
  const errors = [];

  for (const submissionId of submissionIds) {
    try {
      const result = await finalizeSubmission(submissionId, options);
      results.push(result);
    } catch (error) {
      errors.push({
        submissionId,
        error: error.message
      });
    }
  }

  return {
    totalSubmissions: submissionIds.length,
    successful: results.length,
    failed: errors.length,
    results,
    errors
  };
};

export const getFinalizationHistory = async (assignmentId: string) => {
  const { data, error } = await supabase
    .from('llm_sessions')
    .select('*')
    .eq('input_data->action', 'finalize_submission')
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data;
};
