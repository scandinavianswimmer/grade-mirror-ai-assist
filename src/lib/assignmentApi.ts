
import { supabase } from './supabase';

export interface CreateAssignmentData {
  title: string;
  description?: string;
  class_id: string;
  due_date?: string;
  rubric_text?: string;
  rubric_json?: any;
  prompt_instructions?: string;
}

export const createAssignment = async (data: CreateAssignmentData) => {
  const { data: result, error } = await supabase.functions.invoke('create-assignment', {
    body: data
  });

  if (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }

  return result.assignment;
};

export const logTeacherEdit = async (
  submissionId: string,
  commentId: string,
  actionType: 'accept' | 'decline' | 'modify',
  commentText?: string
) => {
  const { data: result, error } = await supabase.functions.invoke('log-teacher-edit', {
    body: {
      submission_id: submissionId,
      comment_id: commentId,
      action_type: actionType,
      comment_text: commentText
    }
  });

  if (error) {
    console.error('Error logging teacher edit:', error);
    throw error;
  }

  return result.teacherEdit;
};
