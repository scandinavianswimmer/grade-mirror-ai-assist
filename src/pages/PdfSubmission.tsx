import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EssayFeedbackPdfRenderer } from '@/components/EssayFeedbackPdfRenderer';
import { supabase } from '@/integrations/supabase/client';

interface Submission {
  id: string;
  assignment_id: string;
  student_name: string;
  file_url?: string;
  essay?: string;
  ai_feedback?: string;
  final_grade?: string;
  teacher_notes?: string;
  assignments?: {
    title: string;
    course_name?: string;
    class_id?: string;
    user_id?: string;
    users?: {
      name?: string;
      full_name?: string;
    };
    classes?: {
      class_name: string;
    };
  };
}

export const PdfSubmission: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!id) {
        setError('No submission ID provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('submissions')
          .select(`
            *,
            assignments (
              title,
              course_name,
              class_id,
              user_id,
              users!assignments_user_id_fkey (
                name,
                full_name
              ),
              classes (
                class_name
              )
            )
          `)
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching submission:', error);
          setError('Failed to load submission');
          return;
        }

        if (!data) {
          setError('Submission not found');
          return;
        }

        setSubmission(data);
      } catch (err) {
        console.error('Error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading submission...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Error</h1>
          <p className="text-muted-foreground">{error || 'Submission not found'}</p>
        </div>
      </div>
    );
  }

  // Prepare the meta data
  const meta = {
    assignmentTitle: submission.assignments?.title || 'Assignment',
    studentName: submission.student_name || 'Unknown Student',
    teacherName: submission.assignments?.users?.full_name || submission.assignments?.users?.name || 'Teacher',
    generatedAtISO: new Date().toISOString(),
    course: submission.assignments?.classes?.class_name || submission.assignments?.course_name || 'Course'
  };

  // Use essay if available, otherwise show a message
  const essayText = submission.essay || 'Essay content not available for PDF generation.';
  
  // Use ai_feedback if available, otherwise create empty feedback
  let feedbackJson = submission.ai_feedback;
  
  // If no AI feedback, create empty structure
  if (!feedbackJson) {
    feedbackJson = JSON.stringify({
      inlineComments: [],
      overallFeedback: 'No AI feedback available.',
      suggestedGrade: submission.final_grade || '',
      reasoning: '',
      confidence: 0,
      rubricBreakdown: []
    });
  }
  
  // If ai_feedback is already an object, stringify it
  if (typeof feedbackJson === 'object') {
    feedbackJson = JSON.stringify(feedbackJson);
  }

  return (
    <EssayFeedbackPdfRenderer
      essayText={essayText}
      feedbackJson={feedbackJson}
      meta={meta}
    />
  );
};