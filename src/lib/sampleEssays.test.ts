import { describe, it, expect } from 'vitest';

import {
  SAMPLE_ASSIGNMENT,
  SAMPLE_ASSIGNMENT_TITLE,
  SAMPLE_SUBMISSIONS,
  buildSampleSubmissionRows,
} from './sampleEssays';
import { SYNTHETIC_DEMO_FIXTURE } from '@/fixtures/syntheticDemo';

const fixtureText = JSON.stringify(SYNTHETIC_DEMO_FIXTURE);

describe('SYNTHETIC_DEMO_FIXTURE — public-safe provenance', () => {
  it('is explicitly synthetic, original, identifier-free, and side-effect-free data', () => {
    expect(SYNTHETIC_DEMO_FIXTURE.provenance).toEqual({
      synthetic: true,
      originalCopy: true,
      containsRealPeople: false,
      containsContactDetails: false,
      containsBackendIdentifiers: false,
    });
    expect(SYNTHETIC_DEMO_FIXTURE.marker).toMatch(/SYNTHETIC DEMO/);
  });

  it('contains no email address or hard-coded UUID', () => {
    expect(fixtureText).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(fixtureText).not.toMatch(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i);
  });

  it('uses role labels rather than person-like student names', () => {
    expect(SYNTHETIC_DEMO_FIXTURE.submissions.every((s) => /^Synthetic learner \d{2}$/.test(s.participantLabel))).toBe(true);
  });

  it('does not reuse the third-party works from the retired demo seeds', () => {
    expect(fixtureText).not.toMatch(/gatsby|fitzgerald|holes|sachar|the giver|lowry|maupassant|thoreau/i);
  });
});

describe('SAMPLE_ASSIGNMENT — gradeable, not fail-closed', () => {
  it('has a non-trivial prompt (description) and rubric the grader can use', () => {
    expect(SAMPLE_ASSIGNMENT.title).toBe(SAMPLE_ASSIGNMENT_TITLE);
    expect(SAMPLE_ASSIGNMENT.description.length).toBeGreaterThan(80);
    expect(SAMPLE_ASSIGNMENT.description).toContain(SYNTHETIC_DEMO_FIXTURE.marker);
    expect(SAMPLE_ASSIGNMENT.rubricText).toMatch(/Claim/i);
    expect(SAMPLE_ASSIGNMENT.rubricText).toMatch(/Evidence/i);
  });
});

describe('SAMPLE_SUBMISSIONS — On-the-Loop spread', () => {
  it('includes strong, developing-language, too-short, and off-topic scenarios', () => {
    const names = SAMPLE_SUBMISSIONS.map((s) => s.studentName);
    expect(names).toEqual([
      'Synthetic learner 01',
      'Synthetic learner 02',
      'Synthetic learner 03',
      'Synthetic learner 04',
      'Synthetic learner 05',
    ]);
  });

  it('has at least 5 essays so a batch is a believable demo', () => {
    expect(SAMPLE_SUBMISSIONS.length).toBeGreaterThanOrEqual(5);
  });

  it('every essay is non-empty', () => {
    for (const s of SAMPLE_SUBMISSIONS) {
      expect(s.essay.trim().length).toBeGreaterThan(0);
    }
  });

  it('the off-topic essay really is off-topic (no beacon assignment content)', () => {
    const offTopic = SAMPLE_SUBMISSIONS.find((s) => s.studentName === 'Synthetic learner 05')!;
    expect(offTopic.essay.toLowerCase()).not.toMatch(/beacon|ledger|keeper|harbor/);
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
