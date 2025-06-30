
import { supabase } from './supabase';

export interface FileProcessingResult {
  success: boolean;
  extractedText?: string;
  url?: string;
  storagePath?: string;
  error?: string;
  metadata?: {
    fileName: string;
    fileSize: number;
    fileType: string;
    wordCount?: number;
    processingTime: number;
  };
}

export const processSubmissionFileEnhanced = async (
  file: File,
  assignmentId: string,
  studentName: string
): Promise<FileProcessingResult> => {
  const startTime = Date.now();
  
  try {
    console.log(`Starting enhanced processing for file: ${file.name}`);

    // Validate file
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const sanitizedStudentName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${assignmentId}/${sanitizedStudentName}_${timestamp}.${fileExt}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('submissions')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('submissions')
      .getPublicUrl(fileName);

    let extractedText = '';
    let wordCount = 0;

    // Extract text based on file type
    if (file.type === 'text/plain') {
      extractedText = await file.text();
      wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;
    } else {
      // For PDF and DOCX files, we'll use a placeholder for now
      // In a real implementation, you'd use libraries like pdf-parse or mammoth
      extractedText = `[${file.type} file content - ${file.name}]`;
      console.log('Note: Advanced text extraction for PDF/DOCX not implemented in this demo');
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      extractedText,
      url: urlData.publicUrl,
      storagePath: fileName,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        wordCount,
        processingTime
      }
    };

  } catch (error) {
    console.error('Enhanced file processing error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown processing error',
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        processingTime: Date.now() - startTime
      }
    };
  }
};

export const validateSubmissionFile = (file: File): { valid: boolean; error?: string } => {
  // Size limit: 50MB
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 50MB limit' };
  }

  // Type validation
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Unsupported file type. Please use PDF, DOCX, DOC, or TXT files.' };
  }

  return { valid: true };
};
