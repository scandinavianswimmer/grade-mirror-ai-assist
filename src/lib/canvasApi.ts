
import { supabase } from './supabase';
import type { AppDatabase } from '@/integrations/supabase/app-database';

type SyncedAssignment = AppDatabase['public']['Tables']['assignments']['Row'];

interface CanvasGradeUpdate {
  submission: {
    posted_grade: string;
    score?: number;
  };
}

export interface CanvasAssignment {
  id: number;
  name: string;
  description: string;
  due_at: string;
  points_possible: number;
  course_id: number;
}

export interface CanvasSubmission {
  id: number;
  assignment_id: number;
  user_id: number;
  body: string;
  submitted_at: string;
  grade: string;
  score: number;
}

export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
}

class CanvasApiClient {
  private baseUrl: string;
  private accessToken: string;

  constructor(baseUrl: string, accessToken: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.accessToken = accessToken;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async getCourses(): Promise<CanvasCourse[]> {
    return this.makeRequest<CanvasCourse[]>('/courses?enrollment_type=teacher&state=available');
  }

  async getAssignments(courseId: number): Promise<CanvasAssignment[]> {
    return this.makeRequest<CanvasAssignment[]>(`/courses/${courseId}/assignments`);
  }

  async getSubmissions(assignmentId: number): Promise<CanvasSubmission[]> {
    return this.makeRequest<CanvasSubmission[]>(`/assignments/${assignmentId}/submissions?include[]=body`);
  }

  async postComment(submissionId: number, comment: string): Promise<unknown> {
    return this.makeRequest<unknown>(`/submissions/${submissionId}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        comment: {
          text_comment: comment
        }
      })
    });
  }

  async updateGrade(submissionId: number, grade: string, score?: number): Promise<CanvasSubmission> {
    const body: CanvasGradeUpdate = { submission: { posted_grade: grade } };
    if (score !== undefined) {
      body.submission.score = score;
    }

    return this.makeRequest<CanvasSubmission>(`/submissions/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }
}

export const getCanvasClient = async (userId: string): Promise<CanvasApiClient | null> => {
  const { data: integration } = await supabase
    .from('lms_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', 'canvas')
    .eq('status', 'connected')
    .single();

  if (!integration) {
    return null;
  }

  // In a real implementation, this would be the Canvas instance URL
  const canvasUrl = integration.canvas_url || 'https://canvas.instructure.com';
  return new CanvasApiClient(canvasUrl, integration.access_token);
};

export const syncCanvasAssignments = async (userId: string) => {
  const client = await getCanvasClient(userId);
  if (!client) {
    throw new Error('Canvas not connected');
  }

  const courses = await client.getCourses();
  const allAssignments: SyncedAssignment[] = [];

  for (const course of courses) {
    const assignments = await client.getAssignments(course.id);
    for (const assignment of assignments) {
      // Store in our database
      const { data, error } = await supabase
        .from('assignments')
        .upsert({
          user_id: userId,
          title: assignment.name,
          due_date: assignment.due_at,
          status: 'active',
          course_name: course.name,
          canvas_id: assignment.id.toString(),
          canvas_course_id: course.id.toString()
        }, {
          onConflict: 'canvas_id'
        })
        .select()
        .single();

      if (!error && data) {
        allAssignments.push(data);
      }
    }
  }

  return allAssignments;
};

export const pushFeedbackToCanvas = async (submissionId: string) => {
  const { data: submission } = await supabase
    .from('submissions')
    .select(`
      *,
      assignments!inner(
        user_id,
        canvas_id
      )
    `)
    .eq('id', submissionId)
    .single();

  if (!submission || !submission.assignments.canvas_id) {
    throw new Error('Submission or Canvas assignment not found');
  }

  const client = await getCanvasClient(submission.assignments.user_id);
  if (!client) {
    throw new Error('Canvas not connected');
  }

  // Push feedback as comment
  if (submission.feedback) {
    await client.postComment(parseInt(submission.canvas_submission_id), submission.feedback);
  }

  // Update grade if finalized
  if (submission.final_score !== null) {
    await client.updateGrade(
      parseInt(submission.canvas_submission_id),
      submission.final_score.toString(),
      submission.final_score
    );
  }

  // Update submission status
  await supabase
    .from('submissions')
    .update({ status: 'pushed_to_lms' })
    .eq('id', submissionId);
};
