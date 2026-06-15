import { describe, it, expect } from 'vitest';

import {
  SAMPLE_ASSIGNMENT,
  SAMPLE_ASSIGNMENT_TITLE,
  SAMPLE_SUBMISSIONS,
  buildSampleSubmissionRows,
} from './sampleEssays';

describe('SAMPLE_ASSIGNMENT — gradeable, not fail-closed', () => {
  it('has a non-trivial prompt (description) and rubric the grader can use', () => {
    expect(SAMPLE_ASSIGNMENT.title).toBe(SAMPLE_ASSIGNMENT_TITLE);
    expect(SAMPLE_ASSIGNMENT.description.length).toBeGreaterThan(80);
    expect(SAMPLE_ASSIGNMENT.rubricText).toMatch(/Thesis/i);
    expect(SAMPLE_ASSIGNMENT.rubricText).toMatch(/Evidence/i);
  });
});

describe('SAMPLE_SUBMISSIONS — On-the-Loop spread', () => {
  it('includes a strong, an ELL, a too-short, and an off-topic essay', () => {
    const names = SAMPLE_SUBMISSIONS.map((s) => s.studentName);
    expect(names).toContain('Sofia Reyes'); // strong → auto-finalize
    expect(names).toContain('Diego Hernández'); // ELL
    expect(names).toContain('Logan Mitchell'); // too short → review
    expect(names).toContain('Brandon Davis'); // off-topic → review
  });

  it('has at least 5 essays so a batch is a believable demo', () => {
    expect(SAMPLE_SUBMISSIONS.length).toBeGreaterThanOrEqual(5);
  });

  it('every essay is non-empty', () => {
    for (const s of SAMPLE_SUBMISSIONS) {
      expect(s.essay.trim().length).toBeGreaterThan(0);
    }
  });

  it('the off-topic essay really is off-topic (no Gatsby content)', () => {
    const offTopic = SAMPLE_SUBMISSIONS.find((s) => s.studentName === 'Brandon Davis')!;
    expect(offTopic.essay.toLowerCase()).not.toMatch(/gatsby|green light|fitzgerald/);
  });
});

describe('buildSampleSubmissionRows — gradeable insert rows', () => {
  const rows = buildSampleSubmissionRows('assignment-123');

  it('wires every row to the assignment', () => {
    expect(rows).toHaveLength(SAMPLE_SUBMISSIONS.length);
    expect(rows.every((r) => r.assignment_id === 'assignment-123')).toBe(true);
  });

  it('sets extracted_text + high extraction_confidence so grade-submission accepts them', () => {
    for (const r of rows) {
      expect(typeof r.extracted_text).toBe('string');
      expect((r.extracted_text as string).length).toBeGreaterThan(0);
      expect(r.extraction_confidence).toBe(1.0);
      expect(r.status).toBe('uploaded');
    }
  });

  it('mirrors essay text into both extracted_text and the v1 essay fallback', () => {
    expect(rows[0].extracted_text).toBe(rows[0].essay);
  });

  it('does not set user_id (matches the proven client insert path)', () => {
    expect(rows.every((r) => !('user_id' in r))).toBe(true);
  });
});
