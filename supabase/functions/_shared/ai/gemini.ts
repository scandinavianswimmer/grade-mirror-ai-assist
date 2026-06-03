// Google Gemini client for structured grading output.
// Uses the REST generateContent endpoint with responseMimeType=application/json + responseSchema,
// which guarantees schema-shaped JSON without tool plumbing. temperature 0 => deterministic grading.
// Gemini 2.5+ does implicit prompt caching automatically, so keeping the stable system+rubric
// prefix first (and the volatile essay last) earns cache hits with no explicit cache management.
import { ENV } from "../env.ts";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

type AnyObj = Record<string, unknown>;

// Convert our JSON-Schema-ish object into Gemini's responseSchema dialect:
// types are UPPERCASE, `additionalProperties` is unsupported (dropped), ordering is explicit.
export function toGeminiSchema(s: AnyObj): AnyObj {
  const TYPE: Record<string, string> = {
    object: "OBJECT",
    array: "ARRAY",
    string: "STRING",
    number: "NUMBER",
    integer: "INTEGER",
    boolean: "BOOLEAN",
  };
  const out: AnyObj = {};
  if (typeof s.type === "string") out.type = TYPE[s.type] ?? String(s.type).toUpperCase();
  if (s.description) out.description = s.description;
  if (Array.isArray(s.enum)) out.enum = s.enum;
  if (s.properties && typeof s.properties === "object") {
    const props: AnyObj = {};
    for (const [k, v] of Object.entries(s.properties as AnyObj)) {
      props[k] = toGeminiSchema(v as AnyObj);
    }
    out.properties = props;
    out.propertyOrdering = Object.keys(s.properties as AnyObj);
  }
  if (s.items && typeof s.items === "object") out.items = toGeminiSchema(s.items as AnyObj);
  if (Array.isArray(s.required)) out.required = s.required;
  // intentionally drop: additionalProperties, format (unsupported / unneeded by Gemini)
  return out;
}

export interface GeminiUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
}

export interface GeminiJSONParams {
  modelId: string;
  systemText: string; // stable, cacheable prefix (system + rubric)
  userContent: string; // volatile per-submission content (delimited essay)
  jsonSchema: AnyObj; // our JSON schema; converted to Gemini dialect internally
  deterministic?: boolean;
  maxOutputTokens?: number;
}

async function call(modelId: string, body: AnyObj): Promise<AnyObj> {
  const res = await fetch(`${BASE}/${modelId}:generateContent?key=${ENV.geminiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini ${modelId} HTTP ${res.status}: ${txt.slice(0, 400)}`);
  }
  return (await res.json()) as AnyObj;
}

function extractText(data: AnyObj): { text: string; finishReason?: string } {
  const cand = (data.candidates as AnyObj[] | undefined)?.[0];
  const parts = ((cand?.content as AnyObj)?.parts as AnyObj[] | undefined) ?? [];
  const text = parts.map((p) => (typeof p.text === "string" ? p.text : "")).join("");
  return { text, finishReason: cand?.finishReason as string | undefined };
}

function usageOf(data: AnyObj): GeminiUsage {
  const um = (data.usageMetadata as AnyObj) ?? {};
  return {
    inputTokens: Number(um.promptTokenCount ?? 0),
    outputTokens: Number(um.candidatesTokenCount ?? 0),
    cacheReadTokens: Number(um.cachedContentTokenCount ?? 0),
  };
}

// Schema-constrained JSON generation. Throws on non-200 / empty / non-JSON (caller repairs/escalates).
export async function geminiGenerateJSON(
  p: GeminiJSONParams,
): Promise<{ json: unknown; usage: GeminiUsage }> {
  const data = await call(p.modelId, {
    systemInstruction: { parts: [{ text: p.systemText }] },
    contents: [{ role: "user", parts: [{ text: p.userContent }] }],
    generationConfig: {
      temperature: p.deterministic ? 0 : 0.4,
      responseMimeType: "application/json",
      responseSchema: toGeminiSchema(p.jsonSchema),
      maxOutputTokens: p.maxOutputTokens ?? 8192,
    },
  });
  const { text, finishReason } = extractText(data);
  if (!text.trim()) throw new Error(`Gemini ${p.modelId} returned no content (finishReason=${finishReason})`);
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Gemini ${p.modelId} returned non-JSON output`);
  }
  return { json, usage: usageOf(data) };
}

// Plain text generation (used by build-style-profile).
export async function geminiGenerateText(
  modelId: string,
  systemText: string,
  userContent: string,
  maxOutputTokens = 2048,
): Promise<{ text: string }> {
  const data = await call(modelId, {
    systemInstruction: { parts: [{ text: systemText }] },
    contents: [{ role: "user", parts: [{ text: userContent }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens },
  });
  return { text: extractText(data).text };
}
