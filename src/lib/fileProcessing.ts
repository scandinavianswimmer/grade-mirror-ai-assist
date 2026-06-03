
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
  studentName: string
): Promise<ProcessedSubmission> => {
  try {
    console.log('Processing submission file:', file.name);

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Create storage path: user_id/assignments/assignment_id/submissions/filename
    const fileExt = file.name.split('.').pop();
    // Sanitize student name and filename to remove special characters
    const sanitizedStudentName = studentName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${Date.now()}-${sanitizedFileName}`;
    const storagePath = `${user.id}/assignments/${assignmentId}/submissions/${fileName}`;

    console.log('Uploading to storage path:', storagePath);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
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
    console.log('Downloading file from storage path:', storagePath);
    
    const { data, error } = await supabase.storage
      .from('submissions')
      .download(storagePath);

    if (error) {
      console.error('Storage download error:', error);
      throw error;
    }

    console.log('File downloaded successfully, size:', data.size, 'type:', data.type);

    // Convert blob to file for text extraction
    const fileName = storagePath.split('/').pop() || 'file';
    const file = new File([data], fileName, { type: data.type });
    
    console.log('Created file object:', { name: fileName, size: file.size, type: file.type });
    
    const extractedText = await extractTextFromFile(file);
    console.log('Text extraction completed, length:', extractedText.length);
    
    return extractedText;
  } catch (error) {
    console.error('Error getting text from stored file:', error);
    throw error;
  }
};
