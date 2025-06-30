
import { supabase } from './supabase';
import { gradeSubmissionWithAI } from './submissionApi';
import { processSubmissionFile } from './fileProcessing';

export interface BatchProcessingStatus {
  submissionId: string;
  studentName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export interface BatchProcessingResult {
  totalSubmissions: number;
  processedSuccessfully: number;
  failed: number;
  statuses: BatchProcessingStatus[];
}

export class BatchProcessor {
  private onProgress?: (status: BatchProcessingStatus[]) => void;

  constructor(onProgress?: (status: BatchProcessingStatus[]) => void) {
    this.onProgress = onProgress;
  }

  async processSubmissionsBatch(submissionIds: string[]): Promise<BatchProcessingResult> {
    console.log(`Starting batch processing for ${submissionIds.length} submissions`);
    
    const statuses: BatchProcessingStatus[] = [];
    let processedSuccessfully = 0;
    let failed = 0;

    // Initialize status tracking
    for (const submissionId of submissionIds) {
      const { data: submission } = await supabase
        .from('submissions')
        .select('student_name')
        .eq('id', submissionId)
        .single();

      statuses.push({
        submissionId,
        studentName: submission?.student_name || 'Unknown',
        status: 'pending',
        progress: 0
      });
    }

    this.onProgress?.(statuses);

    // Process each submission
    for (let i = 0; i < submissionIds.length; i++) {
      const submissionId = submissionIds[i];
      const statusIndex = i;

      try {
        // Update status to processing
        statuses[statusIndex].status = 'processing';
        statuses[statusIndex].progress = 25;
        this.onProgress?.(statuses);

        // Update database status
        await supabase
          .from('submissions')
          .update({ processing_status: 'processing' })
          .eq('id', submissionId);

        // Progress update - file processing
        statuses[statusIndex].progress = 50;
        this.onProgress?.(statuses);

        // Grade the submission with AI
        await gradeSubmissionWithAI(submissionId);

        // Complete
        statuses[statusIndex].status = 'completed';
        statuses[statusIndex].progress = 100;
        processedSuccessfully++;

      } catch (error) {
        console.error(`Error processing submission ${submissionId}:`, error);
        
        statuses[statusIndex].status = 'error';
        statuses[statusIndex].error = error instanceof Error ? error.message : 'Unknown error';
        failed++;

        // Update database status
        await supabase
          .from('submissions')
          .update({ 
            processing_status: 'error',
            status: 'pending' 
          })
          .eq('id', submissionId);
      }

      this.onProgress?.(statuses);
    }

    return {
      totalSubmissions: submissionIds.length,
      processedSuccessfully,
      failed,
      statuses
    };
  }

  async reprocessFailedSubmissions(assignmentId: string): Promise<BatchProcessingResult> {
    // Get failed submissions
    const { data: failedSubmissions } = await supabase
      .from('submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .in('processing_status', ['error', 'failed']);

    if (!failedSubmissions || failedSubmissions.length === 0) {
      return {
        totalSubmissions: 0,
        processedSuccessfully: 0,
        failed: 0,
        statuses: []
      };
    }

    const submissionIds = failedSubmissions.map(s => s.id);
    return this.processSubmissionsBatch(submissionIds);
  }
}

export const createBatchProcessor = (onProgress?: (status: BatchProcessingStatus[]) => void) => {
  return new BatchProcessor(onProgress);
};
