import jsPDF from 'jspdf';
import { parseAIFeedback, type AIComment, type ParsedAIFeedback } from './aiParser';

interface TeacherComment {
  id: string;
  text_start: number;
  text_end: number;
  comment_text: string;
  comment_type: 'positive' | 'negative' | 'neutral';
  created_at: string;
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
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false, color: [number, number, number] = [0, 0, 0]) => {
    if (isBold) {
      pdf.setFont('helvetica', 'bold');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    pdf.setFontSize(fontSize);
    pdf.setTextColor(color[0], color[1], color[2]);
    
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
    pdf.setTextColor(0, 0, 0); // Reset to black
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
  addSection('FEEDBACK & ANNOTATIONS');
  
  allComments.forEach((comment) => {
    // Comment header with type color
    const typeColor: [number, number, number] = comment.type.includes('Teacher') ? [34, 139, 34] : [65, 105, 225];
    addText(`[${comment.index}] ${comment.type}`, 11, true, typeColor);
    
    // Quoted text reference
    const quotedText = comment.start < annotatedEssay.length ? 
      annotatedEssay.slice(comment.start, Math.min(comment.end, comment.start + 100)).replace(/\[\d+\]/g, '').trim() : 
      'Selected text';
    addText(`"${quotedText}${quotedText.length > 97 ? '...' : ''}"`, 9, false, [100, 100, 100]);
    
    // Comment text
    addText(comment.comment, 10);
    yPos += 8; // Extra spacing between comments
  });

  // Overall assessment
  addSection('OVERALL ASSESSMENT');
  
  if (cleanOverallFeedback && cleanOverallFeedback.trim() !== '') {
    addText('Summary Feedback:', 12, true, [65, 105, 225]);
    addText(cleanOverallFeedback, 11);
    yPos += 5;
  }

  if (data.teacherNotes) {
    addText('Teacher Notes:', 12, true, [34, 139, 34]);
    addText(data.teacherNotes, 11);
    yPos += 5;
  }

  // Grades section with better formatting
  addSection('ASSESSMENT RESULTS');
  
  if (cleanSuggestedGrade && cleanSuggestedGrade.trim() !== '') {
    addText(`Suggested Grade: ${cleanSuggestedGrade}`, 12, true, [65, 105, 225]);
    yPos += 3;
  }
  
  if (data.teacherFinalGrade) {
    addText(`Final Grade: ${data.teacherFinalGrade}`, 12, true, [34, 139, 34]);
    yPos += 3;
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