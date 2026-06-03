// aiTA grading contract — the single source of truth for grading I/O.
// Imported by the grading engine (server) and mirrored on the client (src/lib/grading/).
// zod (Deno-compatible) validates model output and the final result.
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

export const GRADING_SCHEMA_VERSION = "1";

export const AnnotationType = z.enum(["praise", "suggestion", "error", "question"]);

// What the MODEL is allowed to return (server-set fields like `verified`/`matched`
// and the recomputed total are intentionally absent here).
export const GradingModelOutputSchema = z
  .object({
    criteria: z
      .array(
        z.object({
          name: z.string(),
          score: z.number(),
          level: z.string().optional(),
          rationale: z.string(),
          evidence: z.object({
            quote: z.string(),
            startIndex: z.number().int(),
            endIndex: z.number().int(),
          }),
          // Raw model output: a plain number (models sometimes use a 0-10 reading).
          // The engine clamps/normalizes to 0..1 before building the final result.
          confidence: z.number(),
        }),
      )
      .min(1),
    annotations: z.array(
      z.object({
        quote: z.string(),
        startIndex: z.number().int(),
        endIndex: z.number().int(),
        comment: z.string(),
        type: AnnotationType,
      }),
    ),
    summaryFeedback: z.string(),
    flags: z.array(z.string()).default([]),
  })
  .strict();

export type GradingModelOutput = z.infer<typeof GradingModelOutputSchema>;

// The full, server-finalized result persisted + returned to the client.
export const GradingResultSchema = z
  .object({
    schemaVersion: z.literal(GRADING_SCHEMA_VERSION),
    overall: z.object({
      score: z.number(),
      maxScore: z.number(),
      letter: z.string().optional(),
      confidence: z.number().min(0).max(1),
    }),
    criteria: z.array(
      z.object({
        name: z.string(),
        weight: z.number(),
        maxScore: z.number(),
        score: z.number(),
        level: z.string().optional(),
        rationale: z.string(),
        evidence: z.object({
          quote: z.string(),
          startIndex: z.number().int(),
          endIndex: z.number().int(),
        }),
        verified: z.boolean(), // server-set: quote actually found in essay
        confidence: z.number().min(0).max(1),
      }),
    ),
    annotations: z.array(
      z.object({
        quote: z.string(),
        startIndex: z.number().int(),
        endIndex: z.number().int(),
        comment: z.string(),
        type: AnnotationType,
        matched: z.boolean(), // server-set: anchored to verified text
      }),
    ),
    summaryFeedback: z.string(),
    flags: z.array(z.string()),
    modelId: z.string(),
  })
  .strict();

export type GradingResult = z.infer<typeof GradingResultSchema>;

// JSON Schema for the grading output. Converted to Gemini's responseSchema dialect by
// ai/gemini.ts (toGeminiSchema) to constrain generateContent JSON output.
// Kept in lockstep with GradingModelOutputSchema above.
export const GRADING_TOOL_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    criteria: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          score: { type: "number" },
          level: { type: "string" },
          rationale: { type: "string" },
          evidence: {
            type: "object",
            additionalProperties: false,
            properties: {
              quote: { type: "string" },
              startIndex: { type: "integer" },
              endIndex: { type: "integer" },
            },
            required: ["quote", "startIndex", "endIndex"],
          },
          confidence: { type: "number", description: "Decimal from 0.0 to 1.0" },
        },
        required: ["name", "score", "rationale", "evidence", "confidence"],
      },
    },
    annotations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          quote: { type: "string" },
          startIndex: { type: "integer" },
          endIndex: { type: "integer" },
          comment: { type: "string" },
          type: { type: "string", enum: ["praise", "suggestion", "error", "question"] },
        },
        required: ["quote", "startIndex", "endIndex", "comment", "type"],
      },
    },
    summaryFeedback: { type: "string" },
    flags: { type: "array", items: { type: "string" } },
  },
  required: ["criteria", "annotations", "summaryFeedback", "flags"],
} as const;

// Rubric shape passed into the engine (from rubric_criteria rows, or a free-text fallback).
export interface RubricCriterionInput {
  name: string;
  weight: number;
  maxScore: number;
  levelDescriptors?: Record<string, string>;
}
export interface RubricInput {
  totalPoints: number;
  criteria: RubricCriterionInput[];
  freeText?: string; // used when no structured criteria exist yet
}
