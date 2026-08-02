import { describe, expect, it } from 'vitest';

import { buildTeacherFeedbackExport, teacherFeedbackFilename } from './teacherFeedbackExport';

describe('teacher feedback export', () => {
  it('builds a teacher-readable record and leaves out dismissed notes', () => {
    const text = buildTeacherFeedbackExport({
      studentName: 'Jordan Lee',
      assignmentTitle: 'Argument essay',
      overallScore: 87,
      overallMax: 100,
      letter: 'B+',
      criteria: [{ name: 'Evidence', score: 18, maxScore: 20, rationale: 'Uses two relevant sources.' }],
      summaryFeedback: 'A clear claim with room for a stronger counterargument.',
      notes: [
        { type: 'praise', quote: 'The evidence shows', comment: 'Strong connection.', status: 'accepted' },
        { type: 'suggestion', quote: 'Some people disagree', comment: 'Dismissed wording.', status: 'rejected' },
      ],
    });

    expect(text).toContain('Student: Jordan Lee');
    expect(text).toContain('Assignment: Argument essay');
    expect(text).toContain('Score: 87/100 (B+)');
    expect(text).toContain('Evidence: 18/20');
    expect(text).toContain('Strong connection.');
    expect(text).not.toContain('Dismissed wording.');
    expect(text).toContain('Approved by the teacher');
  });

  it('creates a safe, recognizable filename', () => {
    expect(teacherFeedbackFilename('José Rivera', 'Cause & Effect')).toBe('jose-rivera-cause-effect-feedback.txt');
    expect(teacherFeedbackFilename(null, null)).toBe('mr-selby-feedback.txt');
  });
});
