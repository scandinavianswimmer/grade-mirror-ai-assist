// Rubric synthesis (GRADE-02): when a teacher hasn't authored a structured rubric, derive a strict,
// criteria-based rubric from the assignment instructions + class level. This replaces the weak
// "free text, model invents its own generic criteria" fallback that let off-spec work score high.
// The synthesized rubric is persisted so the teacher can review/edit it and so grading is reproducible.
import { geminiGenerateJSON } from "../ai/gemini.ts";
import type { RubricInput } from "../grading-schema.ts";

const SYNTH_MODEL = "gemini-2.5-flash";

const SYNTH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    totalPoints: { type: "number", description: "Total points for the assignment (default 100)." },
    criteria: {
      type: "array",
      description: "3–6 concrete, weighted criteria that reflect what THIS assignment explicitly requires.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          weight: { type: "number", description: "Relative importance (e.g. 1–3)." },
          maxScore: { type: "number", description: "Max points for this criterion (e.g. 10)." },
          fullMarks: { type: "string", description: "What earns full marks on this criterion." },
          noMarks: { type: "string", description: "What earns zero on this criterion." },
        },
        required: ["name", "weight", "maxScore", "fullMarks", "noMarks"],
      },
    },
  },
  required: ["totalPoints", "criteria"],
} as const;

const SYNTH_SYSTEM = `You design strict, fair grading rubrics for teachers. Given an assignment's
instructions and the class level, produce concrete, weighted criteria that map to what the assignment
EXPLICITLY requires (e.g. a thesis, a specific number of body paragraphs, required quotations, on-topic
analysis). Reward only meeting those requirements — do not create vague criteria that fluent-but-empty
work could pass. Calibrate expectations to the class level. Return ONLY JSON matching the schema.`;

interface SynthCriterion {
  name: string;
  weight: number;
  maxScore: number;
  fullMarks: string;
  noMarks: string;
}

export interface SynthesizedRubric {
  totalPoints: number;
  criteria: SynthCriterion[];
}

// Calls Gemini to synthesize a rubric. Throws on failure (caller decides fallback).
export async function synthesizeRubric(
  assignmentPrompt: string,
  classContext: string | undefined,
): Promise<SynthesizedRubric> {
  const userContent = `CLASS: ${classContext ?? "unspecified level"}

ASSIGNMENT INSTRUCTIONS:
${assignmentPrompt || "(no instructions provided — grade for a coherent, on-topic, well-supported response)"}

Design the rubric now.`;
  const { json } = await geminiGenerateJSON({
    modelId: SYNTH_MODEL,
    systemText: SYNTH_SYSTEM,
    userContent,
    jsonSchema: SYNTH_SCHEMA as unknown as Record<string, unknown>,
    deterministic: true,
    // Disable thinking + give headroom: a 3–6 criterion rubric with prose descriptors can exceed a
    // 2048 budget once dynamic thinking eats into it, truncating the JSON and forcing a free-text fallback.
    thinkingBudget: 0,
    maxOutputTokens: 4096,
  });
  const o = (json ?? {}) as Record<string, unknown>;
  const rawCriteria = Array.isArray(o.criteria) ? (o.criteria as Record<string, unknown>[]) : [];
  const criteria: SynthCriterion[] = rawCriteria
    .map((c) => ({
      name: String(c.name ?? "").trim(),
      weight: Number(c.weight) > 0 ? Number(c.weight) : 1,
      maxScore: Number(c.maxScore) > 0 ? Number(c.maxScore) : 10,
      fullMarks: String(c.fullMarks ?? ""),
      noMarks: String(c.noMarks ?? ""),
    }))
    .filter((c) => c.name.length > 0);
  if (criteria.length === 0) throw new Error("rubric synthesis produced no criteria");
  const totalPoints = Number(o.totalPoints) > 0 ? Number(o.totalPoints) : 100;
  return { totalPoints, criteria };
}

// Convert a synthesized rubric to the engine's RubricInput shape.
export function toRubricInput(s: SynthesizedRubric): RubricInput {
  return {
    totalPoints: s.totalPoints,
    criteria: s.criteria.map((c) => ({
      name: c.name,
      weight: c.weight,
      maxScore: c.maxScore,
      levelDescriptors: { "Full marks": c.fullMarks, "No marks": c.noMarks },
    })),
  };
}
