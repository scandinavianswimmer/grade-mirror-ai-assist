
import { supabase } from './supabase';

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
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text || '');
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    if (file.type === 'text/plain' || file.type === 'text/csv') {
      reader.readAsText(file);
    } else if (file.type === 'application/json') {
      reader.readAsText(file);
    } else {
      // For PDF/DOCX, we'd need additional libraries
      // For now, return placeholder text indicating file was uploaded
      resolve(`[File "${file.name}" uploaded successfully. Text extraction for ${file.type} files would be implemented with additional libraries.]`);
    }
  });
};
