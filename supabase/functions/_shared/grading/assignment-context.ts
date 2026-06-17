// Grading trust — resolve the assignment context the grader actually grades against, from whatever
// columns the schema exposes. The assignment-creation UI writes the teacher's prompt to
// `assignments.description` and their rubric to `assignments.rubric_text` (v1/Lovable schema), while
// the v2 baseline only has `assignments.instructions`. The grader historically read `instructions`
// only — so an app-created assignment was graded against its TITLE, with the teacher's real prompt and
// rubric silently dropped (Sleuth F-001/F-002). This resolver coalesces every known column and decides
// whether there is enough real context to produce a TRUSTWORTHY grade — or whether to fail closed.
//
// Pure + dependency-free on purpose: the Deno grading engine imports it, and the vitest suite covers it.

export interface RawAssignmentContext {
  title?: string | null;
  instructions?: string | null; // v1 + v2 column
  description?: string | null; // v1 / app-UI column — the teacher's prompt
  rubricText?: string | null; // v1 / app-UI column — the teacher's free-text rubric
  hasCanonicalRubric: boolean; // a structured rubric (rubrics + rubric_criteria) exists for this assignment
}

export interface ResolvedAssignmentContext {
  assignmentPrompt: string; // title + real prompt body — what the relevance gate + grader receive
  promptBody: string; // the real prompt (instructions||description) WITHOUT the title — the trust signal
  rubricText: string | null; // the teacher's free-text rubric, trimmed; null if absent
  sufficient: boolean; // false ⇒ fail closed: no trustworthy grade can be produced
  reason: string | null; // teacher-visible reason when not sufficient
}

const clean = (s: string | null | undefined): string => (s ?? "").trim();

// The message a teacher sees when grading is refused for lack of context (fail-closed, F-002).
export const MISSING_CONTEXT_REASON =
  "This assignment has no prompt or rubric for aiTA to grade against, so a trustworthy grade can't be produced. Add an assignment prompt or a rubric, then re-grade.";

/**
 * Resolve the grading context and decide trust.
 *
 * Prompt: prefer `instructions` (canonical), fall back to `description` (app UI). The title is added
 * for context but is NOT itself a trust signal — grading against a bare title is exactly the bug.
 *
 * Sufficient (can we trust a grade?) iff there is a real rubric — a canonical structured rubric OR the
 * teacher's free-text rubric — OR a real prompt body to grade holistically against. A title alone is
 * never enough, so a context-less assignment fails closed instead of awarding marks from nothing.
 */
export function resolveAssignmentContext(raw: RawAssignmentContext): ResolvedAssignmentContext {
  const title = clean(raw.title);
  const promptBody = clean(raw.instructions) || clean(raw.description);
  const rubricText = clean(raw.rubricText) || null;
  const assignmentPrompt = [title, promptBody].filter(Boolean).join("\n\n");

  const sufficient = raw.hasCanonicalRubric || rubricText !== null || promptBody.length > 0;

  return {
    assignmentPrompt,
    promptBody,
    rubricText,
    sufficient,
    reason: sufficient ? null : MISSING_CONTEXT_REASON,
  };
}
