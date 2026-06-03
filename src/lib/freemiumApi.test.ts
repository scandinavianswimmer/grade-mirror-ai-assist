import { describe, it, expect, vi, beforeEach } from 'vitest';

const invoke = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } },
}));

import { generateAIFeedback } from './freemiumApi';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('generateAIFeedback — F-001 Quick Grade error handling', () => {
  it('returns feedback and increments the count on success', async () => {
    const feedback = { overallFeedback: 'Solid thesis.', suggestedGrade: '88/100', confidence: 0.8 };
    invoke
      .mockResolvedValueOnce({ data: feedback, error: null }) // generate-grading-feedback
      .mockResolvedValueOnce({ data: null, error: null }); // increment-feedback-count

    const result = await generateAIFeedback('essay', 'rubric', 'teacher-1');

    expect(result).toEqual(feedback);
    expect(invoke).toHaveBeenCalledWith('generate-grading-feedback', {
      body: { essayText: 'essay', rubricText: 'rubric' },
    });
    expect(invoke).toHaveBeenCalledWith('increment-feedback-count', { body: { userId: 'teacher-1' } });
  });

  it('surfaces the SPECIFIC backend error message (not a generic one) on a 503/non-2xx', async () => {
    // supabase-js wraps non-2xx in a FunctionsHttpError whose .context is the raw Response.
    const context = { json: async () => ({ error: 'AI provider is not configured', stage: 'config' }) };
    invoke.mockResolvedValueOnce({ data: null, error: { name: 'FunctionsHttpError', context } });

    await expect(generateAIFeedback('essay', 'rubric', 'teacher-1')).rejects.toThrow(
      'AI provider is not configured',
    );
  });

  it('does NOT increment the feedback count when grading fails', async () => {
    const context = { json: async () => ({ error: 'AI is rate limited right now — please retry in a moment.' }) };
    invoke.mockResolvedValueOnce({ data: null, error: { name: 'FunctionsHttpError', context } });

    await expect(generateAIFeedback('essay', 'rubric', 'teacher-1')).rejects.toThrow(/rate limited/);
    expect(invoke).toHaveBeenCalledTimes(1); // only the grading call, never the increment
  });

  it('falls back to a usable message when the error body is not JSON', async () => {
    const context = { json: async () => { throw new Error('not json'); } };
    invoke.mockResolvedValueOnce({ data: null, error: { name: 'FunctionsHttpError', context } });

    await expect(generateAIFeedback('essay', 'rubric', 'teacher-1')).rejects.toThrow(
      /temporarily unavailable/,
    );
  });
});
