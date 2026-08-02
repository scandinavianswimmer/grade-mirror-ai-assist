export type NoteTone = 'praise' | 'question' | 'suggestion';
export type ReviewStatus = 'needs-look' | 'ready';

export type FictionalPreviewPaper = {
  id: string;
  student: string;
  title: string;
  reviewStatus: ReviewStatus;
  wordCount: number;
  paragraphs: Array<{ lead: string; highlight: string }>;
  rubricScores: [number, number, number, number, number];
  draftSummary: string;
  notes: Array<{ id: number; label: string; tone: NoteTone }>;
};

export const rubricCriteria = [
  { name: 'Thesis & focus', detail: 'Clear, arguable, and well focused' },
  { name: 'Evidence & support', detail: 'Relevant and sufficient evidence' },
  { name: 'Organization', detail: 'Logical structure and flow' },
  { name: 'Analysis & reasoning', detail: 'Explains why the evidence matters' },
  { name: 'Style & conventions', detail: 'Effective style; clear mechanics' },
] as const;

export const fictionalPreviewPapers: readonly FictionalPreviewPaper[] = [
  {
    id: 'price-of-convenience',
    student: 'Jordan Lee',
    title: 'The Price of Convenience',
    reviewStatus: 'needs-look',
    wordCount: 487,
    paragraphs: [
      {
        lead: 'Convenience is so common that it is easy to ignore its cost. Each small choice to save time or effort often shifts the burden somewhere else.',
        highlight: 'If we want a better future, we need to slow down long enough to see what we are paying for.',
      },
      {
        lead: 'Consider single-use plastics. They are light and cheap, but after a few minutes of use they can remain in landfills and oceans for years.',
        highlight: 'The ease of throwing something away becomes someone else\'s problem to clean up.',
      },
      {
        lead: 'Technology works the same way. Streaming and overnight shipping feel effortless, while the energy and labor behind them stay out of sight.',
        highlight: 'The hidden costs are built into the systems we use every day.',
      },
      {
        lead: 'Progress is not only about making life easier for us.',
        highlight: 'It is also about making life better for more people, for longer.',
      },
    ],
    rubricScores: [4, 3, 3, 3, 3],
    draftSummary: 'A clear argument with relevant examples. The final paragraph could give readers a more specific action to consider.',
    notes: [
      { id: 1, label: 'Strong claim and preview.', tone: 'praise' },
      { id: 2, label: 'Good example. Add a source?', tone: 'question' },
      { id: 3, label: 'Insightful connection.', tone: 'praise' },
      { id: 4, label: 'Clear conclusion. Consider a specific next step.', tone: 'suggestion' },
    ],
  },
  {
    id: 'later-school-start',
    student: 'Maya Ortiz',
    title: 'A Better Start to the School Day',
    reviewStatus: 'ready',
    wordCount: 524,
    paragraphs: [
      {
        lead: 'The first bell rings while many students are still fighting their own body clocks. That makes the opening class harder than it needs to be.',
        highlight: 'A school schedule should help students arrive ready to learn, not ask them to overcome exhaustion first.',
      },
      {
        lead: 'Sleep affects attention, memory, and mood. Those are not side issues in a classroom; they shape whether a lesson can take hold.',
        highlight: 'Starting later would treat rest as part of learning instead of as a student\'s private problem.',
      },
      {
        lead: 'A schedule change would affect buses, sports, and family routines, so the district should plan with those concerns in view.',
        highlight: 'The inconvenience is real, but it can be addressed through a phased schedule and a semester-long pilot.',
      },
      {
        lead: 'The goal is not to make mornings effortless.',
        highlight: 'It is to build a school day around the hours when students can do their strongest thinking.',
      },
    ],
    rubricScores: [4, 4, 3, 4, 3],
    draftSummary: 'A focused argument that anticipates practical objections. One cited local data point would make the recommendation even stronger.',
    notes: [
      { id: 1, label: 'Clear position in the opening.', tone: 'praise' },
      { id: 2, label: 'Connect this claim to a cited study.', tone: 'question' },
      { id: 3, label: 'Good acknowledgment of scheduling concerns.', tone: 'praise' },
      { id: 4, label: 'Define what a successful pilot would measure.', tone: 'suggestion' },
    ],
  },
  {
    id: 'library-third-place',
    student: 'Eli Thompson',
    title: 'The Library as Our Third Place',
    reviewStatus: 'needs-look',
    wordCount: 451,
    paragraphs: [
      {
        lead: 'A neighborhood needs somewhere people can spend time without being expected to buy anything.',
        highlight: 'For many students, the public library is the only quiet, welcoming room available after school.',
      },
      {
        lead: 'Libraries already provide books, internet access, and help finding trustworthy information.',
        highlight: 'Longer evening hours could turn those resources into a dependable place for homework and group projects.',
      },
      {
        lead: 'Keeping a building open costs money, and the town would need enough staff to keep the space safe.',
        highlight: 'The essay should compare that cost with the community benefit before claiming the change will pay for itself.',
      },
      {
        lead: 'The library can be more than a place we visit when an assignment requires it.',
        highlight: 'It can become the shared room our neighborhood is missing.',
      },
    ],
    rubricScores: [3, 2, 3, 2, 3],
    draftSummary: 'The central idea is promising, but the cost claim needs evidence and the proposal needs a more concrete implementation plan.',
    notes: [
      { id: 1, label: 'Strong connection to student experience.', tone: 'praise' },
      { id: 2, label: 'Which current library hours support this point?', tone: 'question' },
      { id: 3, label: 'This sentence flags an unsupported claim.', tone: 'question' },
      { id: 4, label: 'End with a specific request to town leaders.', tone: 'suggestion' },
    ],
  },
] as const;

export const movePreviewPaperIndex = (
  currentIndex: number,
  direction: -1 | 1,
  paperCount = fictionalPreviewPapers.length,
) => Math.min(Math.max(currentIndex + direction, 0), Math.max(paperCount - 1, 0));

export const FICTIONAL_STACK_PROGRESS = { reviewed: 18, total: 27 } as const;
export const PUBLIC_PREVIEW_APPROVAL_MESSAGE = 'Fictional feedback approved in this preview. Nothing was sent or exported.';
export const PUBLIC_PREVIEW_EXPORT_MESSAGE = 'Fictional export simulated. No file was created, nothing was sent, and no student data was used.';
