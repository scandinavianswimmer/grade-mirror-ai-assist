
import { supabase } from './supabase';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

export interface FileUploadResult {
  success: boolean;
  url?: string;
  text?: string;
  error?: string;
}

export const uploadFile = async (file: File, bucket: string = 'uploads'): Promise<FileUploadResult> => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    console.log('Uploading file to bucket:', bucket, 'path:', filePath);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log('Upload successful, URL:', urlData.publicUrl);

    return { 
      success: true, 
      url: urlData.publicUrl 
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
};

export const extractTextFromFile = async (file: File): Promise<string> => {
  try {
    const fileType = file.type;
    console.log('Extracting text from file type:', fileType);

    if (fileType === 'text/plain' || fileType === 'text/csv') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });
    }

    if (fileType === 'application/json') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });
    }

    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        fileType === 'application/msword') {
      // Extract text from DOCX files using mammoth
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      console.log('DOCX text extracted:', result.value.substring(0, 100) + '...');
      return result.value;
    }

    if (fileType === 'application/pdf') {
      // Extract text from PDF files using pdf.js
      const arrayBuffer = await file.arrayBuffer();
      
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      console.log('PDF text extracted:', fullText.substring(0, 100) + '...');
      return fullText;
    }

    // Fallback for unsupported file types
    throw new Error(`Unsupported file type: ${fileType}`);

  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error(`Failed to extract text from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
