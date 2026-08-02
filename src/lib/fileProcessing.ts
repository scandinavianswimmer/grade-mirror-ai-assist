
import { supabase } from './supabase';
import { extractTextFromFile, getSignedUrl } from './fileUpload';

export interface ProcessedSubmission {
  success: boolean;
  url?: string;
  storagePath?: string;
  extractedText?: string;
  error?: string;
}

export const processSubmissionFile = async (
  file: File, 
  assignmentId: string, 
  _studentName: string
): Promise<ProcessedSubmission> => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Create storage path: user_id/assignments/assignment_id/submissions/filename
    // Sanitize the filename to remove special characters. Student names are intentionally omitted
    // from storage object keys so personally identifying data does not leak into infrastructure logs.
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${Date.now()}-${sanitizedFileName}`;
    const storagePath = `${user.id}/assignments/${assignmentId}/submissions/${fileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('submissions')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Private bucket — short-lived signed URL only, never public (C6).
    const signedUrl = await getSignedUrl('submissions', storagePath);

    // Extract text content from file
    let extractedText = '';
    try {
      extractedText = await extractTextFromFile(file);
    } catch {
      // Continue without text extraction - this is not critical; server-side ingest is authoritative.
    }

    return {
      success: true,
      url: signedUrl ?? undefined,
      storagePath,
      extractedText
    };

  } catch (error) {
    console.error('File processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'File processing failed'
    };
  }
};

export const getTextFromStoredFile = async (storagePath: string): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from('submissions')
      .download(storagePath);

    if (error) {
      console.error('Storage download error:', error);
      throw error;
    }

    // Convert blob to file for text extraction
    const fileName = storagePath.split('/').pop() || 'file';
    const file = new File([data], fileName, { type: data.type });
    
    const extractedText = await extractTextFromFile(file);

    return extractedText;
  } catch (error) {
    console.error('Error getting text from stored file:', error);
    throw error;
  }
};
