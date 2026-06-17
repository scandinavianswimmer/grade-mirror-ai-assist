import { describe, it, expect } from 'vitest';
// Shared with the Deno grading engine. Resolves which assignment context the grader grades against and
// whether it's enough to trust a grade — the fix for Sleuth F-001 (graded against title only) and
// F-002 (full marks awarded when context is missing). Covered under the `npm test` gate.
import {
  resolveAssignmentContext,
  MISSING_CONTEXT_REASON,
} from '../../supabase/functions/_shared/grading/assignment-context';

describe('resolveAssignmentContext — grading trust contract (F-001/F-002)', () => {
  it('reads the app-UI prompt from description when instructions is empty (F-001 root cause)', () => {
    // The app writes the teacher's prompt to `description`; the grader used to read only `instructions`.
    const ctx = resolveAssignmentContext({
      title: 'Sleuth Engine Gatsby',
      instructions: null,
      description: 'Analyze how MLK builds his argument in Letter from Birmingham Jail.',
      rubricText: 'Thesis, two rhetorical strategies, evidence, analysis, conventions.',
      hasCanonicalRubric: false,
    });
    expect(ctx.promptBody).toContain('MLK builds his argument');
    // Title is included for context but the real prompt body is present — no more title-only grading.
    expect(ctx.assignmentPrompt).toContain('Sleuth Engine Gatsby');
    expect(ctx.assignmentPrompt).toContain('Letter from Birmingham Jail');
    expect(ctx.rubricText).toContain('rhetorical strategies');
    expect(ctx.sufficient).toBe(true);
  });

  it('prefers instructions over description when both exist (canonical/seeded path)', () => {
    const ctx = resolveAssignmentContext({
      title: 'Gatsby Symbolism',
      instructions: 'Canonical prompt from the seed.',
      description: 'Stale app description.',
      rubricText: null,
      hasCanonicalRubric: true,
    });
    expect(ctx.promptBody).toBe('Canonical prompt from the seed.');
    expect(ctx.sufficient).toBe(true);
  });

  it('FAILS CLOSED when there is no rubric and no real prompt — only a title (F-002)', () => {
    // The pathological case: weak/strong essays were getting 100/100 graded against nothing.
    const ctx = resolveAssignmentContext({
      title: 'Essay #1',
      instructions: null,
      description: null,
      rubricText: null,
      hasCanonicalRubric: false,
    });
    expect(ctx.promptBody).toBe('');
    expect(ctx.sufficient).toBe(false);
    expect(ctx.reason).toBe(MISSING_CONTEXT_REASON);
  });

  it('is sufficient with a canonical rubric even if the free-text prompt/rubric are blank', () => {
    const ctx = resolveAssignmentContext({
      title: 'Seeded assignment',
      instructions: null,
      description: null,
      rubricText: null,
      hasCanonicalRubric: true,
    });
    expect(ctx.sufficient).toBe(true);
    expect(ctx.reason).toBeNull();
  });

  it('is sufficient for a holistic assignment (real prompt, no rubric at all)', () => {
    // "Grade holistically" is a deliberate teacher choice — a real prompt is enough to trust a grade.
    const ctx = resolveAssignmentContext({
      title: 'Reflection',
      instructions: 'Write a one-page reflection on your growth as a writer this semester.',
      description: null,
      rubricText: null,
      hasCanonicalRubric: false,
    });
    expect(ctx.sufficient).toBe(true);
    expect(ctx.rubricText).toBeNull();
  });

  it('treats whitespace-only fields as empty (no false sufficiency)', () => {
    const ctx = resolveAssignmentContext({
      title: '   ',
      instructions: '   ',
      description: '',
      rubricText: '  \n ',
      hasCanonicalRubric: false,
    });
    expect(ctx.promptBody).toBe('');
    expect(ctx.rubricText).toBeNull();
    expect(ctx.assignmentPrompt).toBe('');
    expect(ctx.sufficient).toBe(false);
  });
});
