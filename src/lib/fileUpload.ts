
import { supabase } from './supabase';

export interface FileUploadResult {
  success: boolean;
  url?: string;
  text?: string;
  error?: string;
}

export const uploadFile = async (file: File, bucket: string = 'uploads'): Promise<FileUploadResult> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) {
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { 
      success: true, 
      url: urlData.publicUrl 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
};

export const extractTextFromFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // For now, just return the text content
      // In a real implementation, you'd use libraries like pdf-parse for PDFs
      resolve(text || '');
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    if (file.type === 'text/plain') {
      reader.readAsText(file);
    } else {
      // For PDF/DOCX, we'd need additional libraries
      // For now, return placeholder text
      resolve(`[File content from ${file.name} - text extraction would be implemented here]`);
    }
  });
};
