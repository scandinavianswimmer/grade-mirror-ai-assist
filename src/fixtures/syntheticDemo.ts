/**
 * Canonical public demo fixture.
 *
 * This module is deliberately data-only: it has no database fields, account identifiers, network
 * client, storage access, or side effects. Every passage, response, and feedback example was written
 * for Mr Selby. Participant labels are roles, not people.
 */
export const SYNTHETIC_DEMO_FIXTURE = {
  fixtureVersion: '1.0.0',
  marker: 'SYNTHETIC DEMO — ORIGINAL FIXTURE — NO REAL STUDENT DATA',
  provenance: {
    synthetic: true,
    originalCopy: true,
    containsRealPeople: false,
    containsContactDetails: false,
    containsBackendIdentifiers: false,
  },
  workspaceLabel: 'Synthetic ELA Lab',
  sourceText: {
    title: 'The Beacon Ledger',
    origin: 'Original passage written for the Mr Selby synthetic demo fixture.',
    text:
      'Each winter, the harbor kept a brass beacon beside a weathered ledger. Before any boat left, ' +
      'its crew wrote one promise in the book: return with news of the sea. The keeper lit the beacon ' +
      'at dusk and left it burning until every promise had an answer. One stormy evening, the council ' +
      'ordered the light extinguished to save fuel. An empty line in the ledger belonged to a boat ' +
      'already three days late, and the council said certainty should come before expense. The newest ' +
      'keeper lit the beacon anyway. “A signal is not a prize for being safe,” the keeper wrote beneath ' +
      'the empty line. “It is a promise made before proof.” The missing boat did not appear that night. ' +
      'But near dawn, three smaller skiffs followed the light through rain after the storm erased the ' +
      'shore. The council praised the rescue. The keeper closed the ledger without crossing out the ' +
      'unanswered promise.',
  },
  assignment: {
    title: 'Synthetic demo — Responsibility in “The Beacon Ledger”',
    description:
      'Read the original passage “The Beacon Ledger” below. In one to three paragraphs, make an ' +
      'arguable claim about how the beacon and ledger develop a theme of responsibility under ' +
      'uncertainty. Use at least two exact details from the passage and explain how each supports your ' +
      'claim. Do not merely summarize.\n\nSOURCE TEXT — ORIGINAL DEMO COPY\n' +
      'Each winter, the harbor kept a brass beacon beside a weathered ledger. Before any boat left, ' +
      'its crew wrote one promise in the book: return with news of the sea. The keeper lit the beacon ' +
      'at dusk and left it burning until every promise had an answer. One stormy evening, the council ' +
      'ordered the light extinguished to save fuel. An empty line in the ledger belonged to a boat ' +
      'already three days late, and the council said certainty should come before expense. The newest ' +
      'keeper lit the beacon anyway. “A signal is not a prize for being safe,” the keeper wrote beneath ' +
      'the empty line. “It is a promise made before proof.” The missing boat did not appear that night. ' +
      'But near dawn, three smaller skiffs followed the light through rain after the storm erased the ' +
      'shore. The council praised the rescue. The keeper closed the ledger without crossing out the ' +
      'unanswered promise.',
    rubricText: [
      'Original-Passage Literary Analysis Rubric (100 points):',
      '- Claim and focus (25): Makes a clear, arguable claim about responsibility under uncertainty.',
      '- Evidence (25): Uses at least two accurate details or short quotations from the supplied passage.',
      '- Reasoning (30): Explains how the beacon and ledger support the claim instead of retelling events.',
      '- Organization (10): Connects ideas in a readable progression.',
      '- Conventions (10): Language and mechanics make the reasoning understandable.',
    ].join('\n'),
  },
  styleProfile: {
    label: 'Synthetic coaching profile',
    summary: [
      'Begin with one precise strength from the response.',
      'Distinguish evidence from explanation and ask one focused coaching question.',
      'Treat developing language respectfully; prioritize the idea before minor mechanics.',
      'Use calm, direct sentences without generic praise.',
      'End with “Revision move:” followed by one concrete action.',
    ].join(' '),
    exemplars: [
      {
        response:
          'The beacon shows responsibility because the keeper turns it on before knowing whether it will help.',
        feedback:
          'You identify the key choice: the keeper acts before the outcome is known. Which exact line makes ' +
          'that uncertainty visible? Explain why acting without proof changes responsibility from a reaction ' +
          'into a commitment. Revision move: add one quotation and connect it to your claim.',
      },
      {
        response:
          'The ledger matters because the keeper leaves the unanswered promise visible even after the rescue.',
        feedback:
          'You notice that the ending refuses an easy victory. Why does the keeper preserve the empty line ' +
          'when the council is ready to celebrate? That contrast can show responsibility as ongoing rather ' +
          'than completed. Revision move: name the council’s view, then explain how the ledger challenges it.',
      },
    ],
  },
  submissions: [
    {
      participantLabel: 'Synthetic learner 01',
      scenario: 'strong_analysis',
      demonstrates: 'Clear claim, two anchored details, and developed reasoning',
      text:
        'The beacon and ledger show that responsibility begins before anyone can promise a good outcome. ' +
        'The council wants “certainty” before spending fuel, treating care like a transaction that must ' +
        'guarantee a return. The keeper rejects that logic by calling the signal “a promise made before ' +
        'proof.” The phrase matters because the light is useful precisely when proof is impossible: the ' +
        'storm has erased the shore, so waiting for certainty would make action too late. The ledger extends ' +
        'the same idea. At the end, the keeper does not cross out the unanswered promise even after three ' +
        'skiffs are rescued. That empty line prevents one success from erasing the boat that is still missing. ' +
        'Together, the objects turn responsibility into a continuing practice of attention, not a reward for ' +
        'results. The keeper cannot control the sea, but can choose not to look away.',
    },
    {
      participantLabel: 'Synthetic learner 02',
      scenario: 'partial_analysis',
      demonstrates: 'Relevant evidence with reasoning that needs another step',
      text:
        'The beacon represents hope and responsibility. The keeper lights it even though the council says ' +
        'to save fuel. This helps the three skiffs find the shore. The line “a promise made before proof” ' +
        'shows the keeper believes people should help without knowing the result. The ledger also has an ' +
        'empty line for the missing boat. Keeping the line shows the keeper remembers that boat. These ' +
        'details show that being responsible means not giving up on people.',
    },
    {
      participantLabel: 'Synthetic learner 03',
      scenario: 'developing_language',
      demonstrates: 'Sound central idea expressed in developing language',
      text:
        'The light is responsibility because keeper use it when no proof the boat come back. Council want ' +
        'certainty first, but storm make certainty not possible. Three small boats see light and come home. ' +
        'The empty line stay in book too. This mean helping is not only about success. Keeper remember the ' +
        'boat still missing and keep the promise open.',
    },
    {
      participantLabel: 'Synthetic learner 04',
      scenario: 'insufficient_evidence',
      demonstrates: 'Too short to satisfy the evidence requirement; should be held for review',
      text: 'The beacon means hope. The keeper is responsible because the light helps boats.',
    },
    {
      participantLabel: 'Synthetic learner 05',
      scenario: 'off_topic',
      demonstrates: 'Unrelated response; should be withheld or routed to review',
      text:
        'A tidy desk is easier to use when every object has one place. Put loose paper in a tray, keep ' +
        'frequently used tools within reach, and clear the surface at the end of each day. A weekly reset ' +
        'prevents small piles from becoming a larger distraction.',
    },
  ],
} as const;

export type SyntheticDemoSubmission = (typeof SYNTHETIC_DEMO_FIXTURE.submissions)[number];
