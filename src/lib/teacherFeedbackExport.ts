export interface FeedbackExportCriterion {
  name: string;
  score: number;
  maxScore: number;
  rationale?: string | null;
}

export interface FeedbackExportNote {
  type: string;
  quote?: string | null;
  comment: string;
  status: string;
}

export interface TeacherFeedbackExportInput {
  studentName?: string | null;
  assignmentTitle?: string | null;
  overallScore?: number | null;
  overallMax?: number | null;
  letter?: string | null;
  criteria?: FeedbackExportCriterion[] | null;
  summaryFeedback?: string | null;
  notes?: FeedbackExportNote[] | null;
}

const titleCase = (value: string): string => (
  value.length > 0 ? `${value[0].toUpperCase()}${value.slice(1)}` : 'Note'
);

export const buildTeacherFeedbackExport = (input: TeacherFeedbackExportInput): string => {
  const studentName = input.studentName?.trim() || 'Student';
  const assignmentTitle = input.assignmentTitle?.trim() || 'Assignment';
  const lines = [
    'MR SELBY — APPROVED FEEDBACK',
    '',
    `Student: ${studentName}`,
    `Assignment: ${assignmentTitle}`,
  ];

  if (input.overallScore != null) {
    const maximum = input.overallMax ?? 100;
    const letter = input.letter?.trim() ? ` (${input.letter.trim()})` : '';
    lines.push(`Score: ${input.overallScore}/${maximum}${letter}`);
  }

  const criteria = input.criteria ?? [];
  if (criteria.length > 0) {
    lines.push('', 'RUBRIC');
    for (const criterion of criteria) {
      lines.push(`${criterion.name}: ${criterion.score}/${criterion.maxScore}`);
      if (criterion.rationale?.trim()) lines.push(`  ${criterion.rationale.trim()}`);
    }
  }

  if (input.summaryFeedback?.trim()) {
    lines.push('', 'OVERALL FEEDBACK', input.summaryFeedback.trim());
  }

  const includedNotes = (input.notes ?? []).filter((note) => note.status !== 'rejected');
  if (includedNotes.length > 0) {
    lines.push('', 'MARGIN NOTES');
    for (const note of includedNotes) {
      lines.push(`${titleCase(note.type)}: ${note.comment.trim()}`);
      if (note.quote?.trim()) lines.push(`  Evidence: “${note.quote.trim()}”`);
    }
  }

  lines.push('', 'Approved by the teacher in Mr Selby.');
  return `${lines.join('\n')}\n`;
};

export const teacherFeedbackFilename = (
  studentName?: string | null,
  assignmentTitle?: string | null,
): string => {
  const identity = [studentName, assignmentTitle]
    .filter((value): value is string => Boolean(value?.trim()))
    .join('-');
  if (!identity) return 'mr-selby-feedback.txt';

  const stem = `${identity}-feedback`
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `${stem}.txt`;
};
