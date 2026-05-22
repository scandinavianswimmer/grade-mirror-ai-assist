
import { supabase } from './supabase';
import { processSubmissionFile } from './fileProcessing';

export interface CreateSubmissionData {
  assignmentId: string;
  studentName: string;
  essay?: string;
  file?: File;
}

export interface IngestResult {
  status: string;
  confidence: number;
  pages: number;
  length: number;
  warnings: string[];
}

export interface CreateSubmissionResult {
  submission: any;
  ingest: IngestResult | null;
  ingestError: string | null;
}

// Surface the structured error body an edge function returns (FunctionsHttpError hides it on .message).
const readFunctionError = async (error: unknown): Promise<string> => {
  try {
    const body = await (error as any)?.context?.json?.();
    if (body?.error) return `${body.error}${body.stage ? ` (${body.stage})` : ''}`;
  } catch { /* ignore */ }
  return (error as any)?.message ?? 'Unknown error';
};

export const createSubmissionWithFile = async (data: CreateSubmissionData): Promise<CreateSubmissionResult> => {
  const { assignmentId, studentName, essay, file } = data;

  let submissionData: any = {
    assignment_id: assignmentId,
    student_name: studentName,
    status: 'uploaded',
    processing_status: 'uploaded'
  };

  // Process file if provided: uploads to the `submissions` bucket and returns its storage path.
  if (file) {
    const processResult = await processSubmissionFile(file, assignmentId, studentName);

    if (!processResult.success) {
      throw new Error(processResult.error || 'File processing failed');
    }

    // Store the storage PATH only — never a public/expiring URL (C6). Sign on demand for display.
    submissionData.submission_storage_path = processResult.storagePath;
    // v2 column read by ingest-document + grade-submission.
    submissionData.file_path = processResult.storagePath;
    // Keep the client-side extraction as a v1 display fallback; ingest-document writes the
    // authoritative extracted_text + extraction_confidence below.
    submissionData.essay = processResult.extractedText || essay;
  } else if (essay) {
    submissionData.essay = essay;
  }

  const { data: submission, error } = await supabase
    .from('submissions')
    .insert(submissionData)
    .select()
    .single();

  if (error) throw error;

  // Server-side extraction. This is what makes the submission gradeable: grade-submission
  // rejects anything without extracted_text or with extraction_confidence < 0.2.
  let ingest: IngestResult | null = null;
  let ingestError: string | null = null;
  if (file && submission.file_path) {
    const { data: ing, error: ingErr } = await supabase.functions.invoke('ingest-document', {
      body: { submissionId: submission.id }
    });
    if (ingErr) {
      ingestError = await readFunctionError(ingErr);
    } else {
      ingest = ing as IngestResult;
    }
  }

  return { submission, ingest, ingestError };
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
