import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  geminiGenerateJSON: vi.fn(),
  getHealthyGradingModels: vi.fn(),
  recordModelResult: vi.fn(),
}));

// engine.ts is a Deno edge module whose production schema imports Zod by URL. Mock only those
// boundaries so Vitest can exercise the real gradeSubmission control flow under Node.
vi.mock("../grading-schema.ts", () => {
  const passthroughSchema = {
    parse: (value: unknown) => value,
    safeParse: (value: unknown) => ({ success: true, data: value }),
  };
  return {
    GRADING_SCHEMA_VERSION: "1",
    GRADING_TOOL_INPUT_SCHEMA: {},
    GradingModelOutputSchema: passthroughSchema,
    GradingResultSchema: passthroughSchema,
  };
});

vi.mock("../ai/gemini.ts", () => ({ geminiGenerateJSON: mocks.geminiGenerateJSON }));
vi.mock("../ai/router.ts", () => ({
  getHealthyGradingModels: mocks.getHealthyGradingModels,
  recordModelResult: mocks.recordModelResult,
}));
vi.mock("./anchor.ts", () => ({
  anchorOne: () => ({ startIndex: 0, endIndex: 0, matched: false }),
  quoteExists: () => false,
}));
vi.mock("./exemplars.ts", () => ({ renderExemplars: () => "" }));

import { gradeSubmission } from "./engine.ts";

const input = {
  essay: "A sufficiently long student submission for the grading workflow.",
  assignmentPrompt: "Explain how the author develops the central claim.",
  rubric: {
    totalPoints: 20,
    criteria: [{ name: "Claim and evidence", weight: 1, maxScore: 20 }],
  },
};

describe("gradeSubmission relevance gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getHealthyGradingModels.mockResolvedValue([{ id: "gemini-2.5-pro" }]);
  });

  it("fails closed with no score and never calls the grading model when relevance is unavailable", async () => {
    mocks.geminiGenerateJSON.mockRejectedValueOnce(new Error("relevance timeout"));

    const outcome = await gradeSubmission(input);

    // The one Gemini call was the relevance check. A second call would be rubric grading.
    expect(mocks.geminiGenerateJSON).toHaveBeenCalledTimes(1);
    expect(mocks.getHealthyGradingModels).not.toHaveBeenCalled();
    expect(mocks.recordModelResult).not.toHaveBeenCalled();

    expect(outcome.disposition).toBe("needs_review");
    expect(outcome.relevance).toEqual({
      status: "unavailable",
      onTopic: null,
      relevanceScore: null,
      reason: "The relevance service was unavailable, so no score was proposed.",
      riskFlags: [],
    });
    expect(outcome.result.flags).toEqual([
      "grade_withheld",
      "relevance_check_unavailable",
    ]);
    expect(outcome.result.flags).not.toContain("off_topic");
    expect(outcome.result.criteria).toEqual([]);
    expect(outcome.result.summaryFeedback).toMatch(/service was unavailable.*No score was proposed/i);
    expect(outcome.trace).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          agent: "relevance_risk",
          status: "error",
          detail: expect.objectContaining({ error: "relevance check unavailable; grading withheld" }),
        }),
        expect.objectContaining({
          agent: "grading",
          status: "skipped",
          detail: { reason: "withheld: relevance check unavailable" },
        }),
      ]),
    );
  });

  it("preserves the distinct off-topic result and still skips rubric grading", async () => {
    mocks.geminiGenerateJSON.mockResolvedValueOnce({
      json: {
        onTopic: false,
        relevanceScore: 0.12,
        reason: "The response addresses a different assignment.",
        riskFlags: ["off_topic"],
      },
      usage: { inputTokens: 50, outputTokens: 20, cacheReadTokens: 0 },
    });

    const outcome = await gradeSubmission(input);

    expect(mocks.geminiGenerateJSON).toHaveBeenCalledTimes(1);
    expect(mocks.getHealthyGradingModels).not.toHaveBeenCalled();
    expect(outcome.disposition).toBe("needs_review");
    expect(outcome.relevance.status).toBe("assessed");
    expect(outcome.result.flags).toContain("off_topic");
    expect(outcome.result.flags).toContain("grade_withheld");
    expect(outcome.result.flags).not.toContain("relevance_check_unavailable");
    expect(outcome.result.summaryFeedback).toMatch(/does not appear to address the assignment/i);
  });
});
