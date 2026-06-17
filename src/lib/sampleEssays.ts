// Sample-essay onboarding (XPRIZE Master Plan Week 1, priority #2 — Cohort A activation).
//
// Pre-loads ONE realistic assignment + a spread of student essays into a new teacher's account so
// they can grade within their first minute — and *see auto-finalize work*: the strong essays publish
// unattended while the too-short and off-topic ones route to their review queue (On-the-Loop). This
// is the "aha" that converts a trial.
//
// No student PII and no file upload: essays are inserted directly with extracted_text +
// extraction_confidence=1.0 (the two fields grade-submission requires), through the SAME authed-user
// client path the real upload flow uses (src/lib/submissionApi.ts) — so RLS + columns are proven and
// no new edge function/deploy is needed. The assignment carries a real prompt (description) AND a
// real rubric (rubric_text) so grading is well-calibrated and never fails closed.
//
// This module is PURE (no supabase/localStorage import) so its data + row-builder are unit-tested in
// the node test env. The I/O loader that talks to the database lives in ./sampleEssaysApi.ts.

// Marker title used for idempotency — loading twice must not duplicate the sample set.
export const SAMPLE_ASSIGNMENT_TITLE = 'Sample: Symbolism in The Great Gatsby';

export const SAMPLE_ASSIGNMENT = {
  title: SAMPLE_ASSIGNMENT_TITLE,
  // Written to assignments.description — the grader reads this as the assignment prompt.
  description:
    'Write a 5-paragraph literary analysis explaining how Fitzgerald uses ONE symbol (the green ' +
    'light, the eyes of Dr. T.J. Eckleburg, or the valley of ashes) to develop the theme of the ' +
    'American Dream. Include a clear thesis, at least three pieces of textual evidence with ' +
    'analysis of how each supports the argument, and a conclusion tying the symbol to the theme.',
  // Written to assignments.rubric_text — authoritative for rubric synthesis (Sleuth F-001), so the
  // grade is rubric-aligned rather than graded against model-invented generic criteria.
  rubricText: [
    'Literary Analysis Rubric (100 points):',
    '- Thesis & Focus (25): A clear, arguable thesis that names the symbol and the claim about the American Dream; stays focused throughout.',
    '- Textual Evidence (25): At least three relevant quotations or specific references, accurately used.',
    '- Analysis (30): Explains HOW each piece of evidence supports the thesis; interprets the symbol rather than summarizing plot.',
    '- Organization (10): Logical paragraphing with a recognizable introduction, body, and conclusion.',
    '- Conventions (10): Grammar, spelling, and mechanics support clarity.',
  ].join('\n'),
} as const;

export interface SampleSubmissionSeed {
  studentName: string;
  /** Short note (for our own reference) on what this essay demonstrates. Not stored. */
  demonstrates: string;
  essay: string;
}

// A deliberate spread: strong essays should auto-finalize; the too-short and off-topic ones should
// route to the teacher's review queue — showcasing On-the-Loop in one batch.
export const SAMPLE_SUBMISSIONS: SampleSubmissionSeed[] = [
  {
    studentName: 'Sofia Reyes',
    demonstrates: 'High achiever — should auto-finalize',
    essay:
      'Fitzgerald never lets the green light be simple hope. When Gatsby reaches for the "single ' +
      'green light, minute and far away," the adjectives do the arguing: the dream is luminous only ' +
      'because it stays out of reach. Green—growth, money, envy—lets one image hold Gatsby\'s ' +
      'aspiration and its rot at once. By the novel\'s end, Nick reframes the light as "the orgastic ' +
      'future that year by year recedes before us," widening Gatsby\'s private longing into a ' +
      'national condition. Fitzgerald\'s symbol indicts the American Dream not for failing, but for ' +
      'being designed to recede.',
  },
  {
    studentName: 'Marcus Johnson',
    demonstrates: 'Strong analysis, weak structure — should auto-finalize',
    essay:
      'The valley of ashes is where the dream goes to die. Fitzgerald describes it as a "fantastic ' +
      'farm where ashes grow like wheat," which is ironic because nothing grows there but poverty. ' +
      'The eyes of Dr. T.J. Eckleburg watch over it like a god that gave up. Also the green light is ' +
      'in the book and it means hope for Gatsby. The rich people drive through the ashes and never ' +
      'stop. This shows the American Dream leaves people behind. The symbols all connect to money ' +
      'and class which is the theme.',
  },
  {
    studentName: 'Diego Hernández',
    demonstrates: 'English language learner — ideas present, language developing',
    essay:
      'The green light have big meaning in the story. Gatsby see it every night and he reach his ' +
      'hand to it. For him it is the future with Daisy and also to be important person. But the ' +
      'light is far and small, so the dream is difficult to touch. I think Fitzgerald want to say ' +
      'the american dream give hope but also make people sad because they can not reach. The color ' +
      'green is like money and also like hope, two things together.',
  },
  {
    studentName: 'Logan Mitchell',
    demonstrates: 'Extremely short — should route to teacher (low confidence)',
    essay: 'The green light means hope and the american dream. Gatsby wants Daisy.',
  },
  {
    studentName: 'Brandon Davis',
    demonstrates: 'Off-topic — should route to teacher (relevance gate)',
    essay:
      'The best way to improve your jump shot is consistent practice. Start with proper form: feet ' +
      'shoulder-width apart, elbow under the ball, and follow through with your wrist. Shoot 100 ' +
      'free throws a day and track your makes. Watching film of professional shooters like Steph ' +
      'Curry can also help you learn arc and release timing. Strength training for your legs adds ' +
      'range over time.',
  },
];

/**
 * Build the submission insert rows for a created sample assignment. Pure (no I/O) so the shape is
 * unit-tested. extracted_text + extraction_confidence are what make a submission gradeable
 * (grade-submission rejects anything without them); `essay` is the v1 display fallback.
 */
export function buildSampleSubmissionRows(assignmentId: string): Record<string, unknown>[] {
  return SAMPLE_SUBMISSIONS.map((s) => ({
    assignment_id: assignmentId,
    student_name: s.studentName,
    essay: s.essay,
    extracted_text: s.essay,
    extraction_confidence: 1.0,
    status: 'uploaded',
    processing_status: 'uploaded',
  }));
}

export interface LoadSampleResult {
  assignmentId: string;
  created: boolean; // false when the sample assignment already existed (idempotent no-op)
  submissionsInserted: number;
}
