
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { submissionId, includeComments = true, format = 'pdf' } = await req.json();
    
    console.log('Exporting graded submission:', submissionId);

    // Get submission with all grading data
    const { data: submission, error: submissionError } = await supabaseClient
      .from('submissions')
      .select(`
        *,
        assignments (
          title,
          description,
          rubric_text
        )
      `)
      .eq('id', submissionId)
      .single();

    if (submissionError) throw submissionError;
    if (!submission) throw new Error('Submission not found');

    const feedbackData = submission.feedback_json as any;
    if (!feedbackData) throw new Error('No feedback data found');

    // Generate export content based on format
    let exportContent;
    let contentType;
    let filename;

    if (format === 'pdf') {
      // For PDF export, we'll create HTML that can be converted to PDF
      const htmlContent = generateGradedHTML(submission, feedbackData, includeComments);
      
      // In a real implementation, you'd use a PDF generation library like Puppeteer
      // For now, we'll return the HTML content
      exportContent = htmlContent;
      contentType = 'text/html';
      filename = `${submission.student_name}_${submission.assignments.title}_graded.html`;
    } else if (format === 'docx') {
      // For DOCX, we'd use a library like docx
      // For now, return formatted text
      exportContent = generateGradedText(submission, feedbackData, includeComments);
      contentType = 'text/plain';
      filename = `${submission.student_name}_${submission.assignments.title}_graded.txt`;
    } else {
      throw new Error('Unsupported export format');
    }

    // Log the export activity
    await supabaseClient
      .from('llm_sessions')
      .insert({
        user_id: submission.assignments?.user_id || '',
        input_data: { 
          action: 'export_graded_submission',
          submissionId,
          format,
          includeComments 
        },
        output_data: { 
          success: true,
          filename,
          contentLength: exportContent.length
        },
        status: 'completed'
      });

    return new Response(exportContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function generateGradedHTML(submission: any, feedbackData: any, includeComments: boolean): string {
  const assignment = submission.assignments;
  let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Graded Submission - ${submission.student_name}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .grade-box { background: #f0f8ff; border: 2px solid #4a90e2; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .grade { font-size: 24px; font-weight: bold; color: #4a90e2; }
        .essay { margin: 30px 0; }
        .highlight-positive { background-color: #d4edda; padding: 2px 4px; border-radius: 3px; }
        .highlight-constructive { background-color: #fff3cd; padding: 2px 4px; border-radius: 3px; }
        .highlight-question { background-color: #cce5ff; padding: 2px 4px; border-radius: 3px; }
        .comment { margin: 10px 0; padding: 10px; border-left: 4px solid #4a90e2; background: #f8f9fa; }
        .feedback-section { margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${assignment.title}</h1>
        <h2>Student: ${submission.student_name}</h2>
        <p><strong>Submitted:</strong> ${new Date(submission.created_at).toLocaleDateString()}</p>
        <p><strong>Graded:</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="grade-box">
        <div class="grade">Grade: ${submission.ai_grade || 'Not graded'}</div>
    </div>

    <div class="essay">
        <h3>Submission</h3>
        <div>${highlightText(submission.essay || '', feedbackData.inlineComments || [], includeComments)}</div>
    </div>

    <div class="feedback-section">
        <h3>Overall Feedback</h3>
        <p>${submission.ai_feedback || feedbackData.overallFeedback || 'No feedback provided'}</p>
    </div>
  `;

  if (includeComments && feedbackData.inlineComments) {
    html += `
    <div class="feedback-section">
        <h3>Detailed Comments</h3>
    `;
    
    feedbackData.inlineComments.forEach((comment: any, index: number) => {
      html += `
        <div class="comment">
            <strong>Comment ${index + 1}:</strong> "${comment.text}"<br>
            <em>${comment.comment}</em>
        </div>
      `;
    });
    
    html += `</div>`;
  }

  if (feedbackData.reasoning) {
    html += `
    <div class="feedback-section">
        <h3>Grading Rationale</h3>
        <p>${feedbackData.reasoning}</p>
    </div>
    `;
  }

  html += `
</body>
</html>`;

  return html;
}

function highlightText(text: string, comments: any[], includeComments: boolean): string {
  if (!includeComments || !comments.length) {
    return text.replace(/\n/g, '<br>');
  }

  let highlightedText = text;
  
  comments.forEach((comment) => {
    const className = `highlight-${comment.type}`;
    const highlightedSpan = `<span class="${className}">${comment.text}</span>`;
    highlightedText = highlightedText.replace(comment.text, highlightedSpan);
  });

  return highlightedText.replace(/\n/g, '<br>');
}

function generateGradedText(submission: any, feedbackData: any, includeComments: boolean): string {
  const assignment = submission.assignments;
  let content = `
GRADED SUBMISSION
=================

Assignment: ${assignment.title}
Student: ${submission.student_name}
Grade: ${submission.ai_grade || 'Not graded'}
Submitted: ${new Date(submission.created_at).toLocaleDateString()}
Graded: ${new Date().toLocaleDateString()}

SUBMISSION
----------
${submission.essay || 'No essay content'}

OVERALL FEEDBACK
---------------
${submission.ai_feedback || feedbackData.overallFeedback || 'No feedback provided'}
`;

  if (includeComments && feedbackData.inlineComments) {
    content += `\n\nDETAILED COMMENTS\n----------------\n`;
    feedbackData.inlineComments.forEach((comment: any, index: number) => {
      content += `\nComment ${index + 1}: "${comment.text}"\n${comment.comment}\n`;
    });
  }

  if (feedbackData.reasoning) {
    content += `\n\nGRADING RATIONALE\n-----------------\n${feedbackData.reasoning}\n`;
  }

  return content;
}
