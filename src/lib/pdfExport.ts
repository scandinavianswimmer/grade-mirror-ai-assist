import jsPDF from 'jspdf';

interface TeacherComment {
  id: string;
  text_start: number;
  text_end: number;
  comment_text: string;
  comment_type: 'positive' | 'negative' | 'neutral';
  created_at: string;
}

interface AIComment {
  text: string;
  comment: string;
  category?: string;
}

interface ParsedAIFeedback {
  inlineComments: AIComment[];
  overallFeedback: string;
  suggestedGrade: string;
  reasoning?: string;
}

interface ExportData {
  studentName: string;
  assignmentTitle: string;
  essay: string;
  aiComments: AIComment[];
  teacherComments: TeacherComment[];
  overallFeedback: string;
  suggestedGrade: string;
  teacherFinalGrade?: string;
  teacherNotes?: string;
}

// Helper function to parse AI feedback JSON
const parseAIFeedback = (feedbackString: string): ParsedAIFeedback | null => {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(feedbackString);
    return {
      inlineComments: parsed.inlineComments || [],
      overallFeedback: parsed.overallFeedback || feedbackString,
      suggestedGrade: parsed.suggestedGrade || '',
      reasoning: parsed.reasoning
    };
  } catch {
    // If not JSON, return as plain text
    return {
      inlineComments: [],
      overallFeedback: feedbackString,
      suggestedGrade: '',
      reasoning: ''
    };
  }
};

export const generatePDF = (data: ExportData): void => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  const maxLineWidth = pageWidth - 2 * margin;
  
  let yPos = margin;
  
  // Parse AI feedback if it's in JSON format
  const parsedFeedback = parseAIFeedback(data.overallFeedback);
  const cleanOverallFeedback = parsedFeedback?.overallFeedback || data.overallFeedback;
  const cleanSuggestedGrade = parsedFeedback?.suggestedGrade || data.suggestedGrade;
  
  // Helper function to add text with word wrapping
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    if (isBold) {
      pdf.setFont('helvetica', 'bold');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    pdf.setFontSize(fontSize);
    
    const lines = pdf.splitTextToSize(text, maxLineWidth);
    
    lines.forEach((line: string) => {
      if (yPos > pageHeight - margin) {
        pdf.addPage();
        yPos = margin;
      }
      pdf.text(line, margin, yPos);
      yPos += fontSize * 0.6;
    });
    
    yPos += 5; // Add space after text block
  };

  // Helper function to add a new section
  const addSection = (title: string) => {
    yPos += 10;
    if (yPos > pageHeight - margin - 20) {
      pdf.addPage();
      yPos = margin;
    }
    
    // Add section divider
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 15;
    
    addText(title, 14, true);
  };

  // Header
  addText(`Student Essay Analysis - ${data.assignmentTitle}`, 16, true);
  addText(`Student: ${data.studentName}`, 12);
  addText(`Generated: ${new Date().toLocaleDateString()}`, 10);

  // Essay with annotations
  addSection('ANNOTATED ESSAY');
  
  // Create annotated essay text
  let annotatedEssay = data.essay;
  const allComments: Array<{ start: number; end: number; comment: string; type: string; index: number }> = [];
  
  // Add teacher comments
  data.teacherComments.forEach((comment, index) => {
    allComments.push({
      start: comment.text_start,
      end: comment.text_end,
      comment: comment.comment_text,
      type: `Teacher (${comment.comment_type})`,
      index: index + 1
    });
  });

  // Add AI comments from parsed feedback if available
  const aiCommentsToUse = parsedFeedback?.inlineComments || data.aiComments;
  aiCommentsToUse.forEach((aiComment, index) => {
    const textPosition = annotatedEssay.indexOf(aiComment.text);
    if (textPosition !== -1) {
      allComments.push({
        start: textPosition,
        end: textPosition + aiComment.text.length,
        comment: aiComment.comment,
        type: `AI Feedback`,
        index: data.teacherComments.length + index + 1
      });
    }
  });

  // Sort comments by position
  allComments.sort((a, b) => a.start - b.start);

  // Insert annotation markers
  let offset = 0;
  allComments.forEach((comment) => {
    const marker = ` [${comment.index}] `;
    const insertPos = comment.end + offset;
    annotatedEssay = annotatedEssay.slice(0, insertPos) + marker + annotatedEssay.slice(insertPos);
    offset += marker.length;
  });

  addText(annotatedEssay, 11);

  // Comments section
  addSection('DETAILED COMMENTS');
  
  allComments.forEach((comment) => {
    addText(`[${comment.index}] ${comment.type}`, 10, true);
    addText(`"${annotatedEssay.slice(comment.start, comment.end).replace(/\[\d+\]/g, '').trim()}"`, 9);
    addText(comment.comment, 10);
    yPos += 5;
  });

  // Overall assessment
  addSection('OVERALL ASSESSMENT');
  
  if (cleanOverallFeedback && cleanOverallFeedback.trim() !== '') {
    addText('Feedback Summary:', 12, true);
    addText(cleanOverallFeedback, 11);
  }

  if (data.teacherNotes) {
    addText('Teacher Notes:', 12, true);
    addText(data.teacherNotes, 11);
  }

  // Grades
  addSection('GRADING');
  
  if (cleanSuggestedGrade && cleanSuggestedGrade.trim() !== '') {
    addText(`AI Suggested Grade: ${cleanSuggestedGrade}`, 11, true);
  }
  
  if (data.teacherFinalGrade) {
    addText(`Teacher Final Grade: ${data.teacherFinalGrade}`, 11, true);
  }

  // Footer
  const footerY = pageHeight - 15;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Generated by AI Writing Assistant', margin, footerY);
  pdf.text('Page 1', pageWidth - margin - 20, footerY);

  // Save the PDF
  const fileName = `${data.studentName.replace(/\s+/g, '_')}_${data.assignmentTitle.replace(/\s+/g, '_')}_Analysis.pdf`;
  pdf.save(fileName);
};

export const generateStudentVersion = (data: ExportData): void => {
  // Generate a student-friendly version - include all teacher comments for now
  const studentData = {
    ...data,
    teacherNotes: undefined // Remove internal teacher notes
  };
  
  generatePDF(studentData);
};