// Google Gemini client for structured grading output.
// Uses the REST generateContent endpoint with responseMimeType=application/json + responseSchema,
// which guarantees schema-shaped JSON without tool plumbing. temperature 0 => deterministic grading.
// Gemini 2.5+ does implicit prompt caching automatically, so keeping the stable system+rubric
// prefix first (and the volatile essay last) earns cache hits with no explicit cache management.
import { ENV } from "../env.ts";
import { withinGlobalGeminiBudget, paceUpstreamCall } from "../ratelimit.ts";
import { AppError } from "../http.ts";

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
  // Optional thinking budget (gemini-2.5 thinking models). 0 disables thinking so the
  // full maxOutputTokens is available for the JSON answer — use for structured, low-reasoning
  // tasks (e.g. rubric synthesis) where default dynamic thinking can truncate the output.
  thinkingBudget?: number;
}

// Module-level cursor into the key pool. Persists across calls within a warm function instance,
// so once a key's free-tier quota is exhausted we start from the next one instead of re-hitting
// the dead key on every request. Reset implicitly when the instance is recycled.
let keyCursor = 0;

// A 429, or any body mentioning RESOURCE_EXHAUSTED / quota, means "this key is rate/quota limited" —
// rotate to the next key. Other non-200s (4xx schema errors, 5xx) are not key-specific: throw so the
// model-level fallback (pro -> flash) in the engine handles them.
function isQuotaError(status: number, body: string): boolean {
  return status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(body);
}

async function call(modelId: string, body: AnyObj): Promise<AnyObj> {
  const keys = ENV.geminiKeys();
  const payload = JSON.stringify(body);
  let lastQuotaErr = "";
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const idx = (keyCursor + attempt) % keys.length;
    // Layer B: global cross-tenant ceiling. Counted per upstream call so key rotation can't
    // bypass it (rotation amplifies abuse exactly when we most need to stop). Over the ceiling we
    // throw immediately — no rotation — and let the model-fallback above surface the back-off.
    // Dev-mode pacing: space calls so free-tier RPM isn't exceeded (no-op in prod). Delays, not rejects.
    await paceUpstreamCall();
    const budget = await withinGlobalGeminiBudget();
    if (!budget.ok) {
      // Typed so the engine recognizes this as a cross-tenant rate limit — NOT a model fault — and
      // backs off instead of demoting the model's health or rotating to the next key.
      throw new AppError(
        429,
        "global_ceiling",
        `Gemini global rate ceiling reached (${budget.count}/${budget.ceiling} per min) — backing off to protect the key pool`,
      );
    }
    const res = await fetch(`${BASE}/${modelId}:generateContent?key=${keys[idx]}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    if (res.ok) {
      keyCursor = idx; // stick with the working key for subsequent calls in this instance
      return (await res.json()) as AnyObj;
    }
    const txt = await res.text();
    // Rotate on quota/rate limits; on the LAST key, fall through to the all-keys-exhausted throw
    // below (a clearer message) rather than the generic per-status throw.
    if (isQuotaError(res.status, txt)) {
      lastQuotaErr = `HTTP ${res.status}: ${txt.slice(0, 200)}`;
      if (attempt < keys.length - 1) continue;
      break;
    }
    throw new Error(`Gemini ${modelId} HTTP ${res.status}: ${txt.slice(0, 400)}`);
  }
  throw new Error(
    `Gemini ${modelId}: all ${keys.length} API key(s) quota-exhausted. Last: ${lastQuotaErr}`,
  );
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
      ...(p.thinkingBudget !== undefined ? { thinkingConfig: { thinkingBudget: p.thinkingBudget } } : {}),
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
