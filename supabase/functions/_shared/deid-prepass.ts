// De-id PRE-PASS (HIGH-7 real fix) — an OPTIONAL, OFF-by-default model pass that catches residual
// free-text PII inside an essay body that the explicit roster + extra-identifier masking cannot:
// OTHER students' names, parents/siblings, hometowns, street addresses, phone numbers, the school /
// employer. The existing maskNamesPreservingOffsets() only masks terms the system already KNOWS; this
// pre-pass asks a model to FIND the spans it doesn't know, then masks them with the SAME
// offset-preserving primitive so annotation anchors returned by the grader still hold.
//
// Why behind a flag (off by default): it is an EXTRA model call per grade (cost + latency). It is meant
// to be turned on for Cohort B (real essays) once enabled; Cohort A grades synthetic essays with no PII.
//
// FAIL-OPEN guarantee: this pre-pass must NEVER block grading. If the scorer errors, times out, or
// returns garbage, we fall back to the supplied base-masked text (roster + extras already applied) and
// log it. A de-id pre-pass that fails closed would take grading down — strictly worse than the existing
// documented residual leak, which is itself mitigated by Cohort separation + signed DPAs.
//
// PURE + TESTABLE: every function here is pure and the model is injected as a `scorer`. The unit tests
// pass a MOCK scorer (no Gemini key needed). The production scorer (Gemini wiring) lives at the bottom
// behind a lazy import so this module stays importable under vitest's node runtime.

import { maskNamesPreservingOffsets } from "./deid.ts";

// A residual-PII span the scorer claims to have found, as [start, end) offsets into the essay body it
// was given (the BASE-MASKED text — see runDeidPrepass). `end` is exclusive, JS string-index semantics.
export interface PiiSpan {
  start: number;
  end: number;
  // Advisory category from the model; not load-bearing for masking (we mask the offsets regardless),
  // kept for logging / debugging which classes of PII the pre-pass is catching.
  category?: "PERSON" | "LOCATION" | "ORG" | "CONTACT" | string;
}

// Injected model call. Given the (already base-masked) essay text, return the residual-PII spans it
// found. Throwing / rejecting is allowed and expected on model failure — runDeidPrepass fails open.
export type PrepassScorer = (text: string) => Promise<PiiSpan[]>;

export interface PrepassOptions {
  // OFF by default. The caller wires this to the env flag / privacy_settings column.
  enabled?: boolean;
  // Optional sink for the single structured log line (defaults to console). Injectable for tests.
  log?: (msg: string, detail?: Record<string, unknown>) => void;
}

export interface PrepassResult {
  // The text to send to the grader. Always defined when input text is non-null.
  text: string;
  // What happened, for logging / assertions. "disabled" => flag off (no-op). "applied" => spans masked.
  // "no_spans" => scorer ran but found nothing. "failed_open" => scorer error, base text returned.
  outcome: "disabled" | "applied" | "no_spans" | "failed_open";
  // Count of spans actually masked after validation (0 unless outcome === "applied").
  maskedSpans: number;
}

// Length of the redaction block matches the span length, so offsets after the span are unchanged —
// identical contract to maskNamesPreservingOffsets. ASCII "#" => 1 char == 1 code unit == 1 byte.
const REDACTION_CHAR = "#";

// Keep only spans that are well-formed, in-bounds, and non-empty — then sort + merge overlaps so the
// masking pass is a single non-overlapping sweep (a model can return overlapping/duplicate/garbage
// spans; we never trust them blindly — validate at the boundary, FERPA minimization is on us not it).
export function normalizeSpans(spans: PiiSpan[], textLength: number): Array<{ start: number; end: number }> {
  const clean = (spans ?? [])
    .filter(
      (s) =>
        s &&
        Number.isInteger(s.start) &&
        Number.isInteger(s.end) &&
        s.start >= 0 &&
        s.end <= textLength &&
        s.end > s.start,
    )
    .map((s) => ({ start: s.start, end: s.end }))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const merged: Array<{ start: number; end: number }> = [];
  for (const s of clean) {
    const last = merged[merged.length - 1];
    if (last && s.start <= last.end) {
      // Overlap or adjacency → extend the previous block (never shrink it).
      if (s.end > last.end) last.end = s.end;
    } else {
      merged.push({ ...s });
    }
  }
  return merged;
}

// Apply validated spans length-preservingly. Pure; offset-safe by construction (each masked region is
// replaced by an equal number of REDACTION_CHAR, so the string length and every later index is fixed).
// Already-masked regions (runs of REDACTION_CHAR from the roster/extras pass) are left as-is rather
// than re-redacted: re-masking "####" with "####" is a no-op, so there is no double-mask hazard, but we
// avoid pointless churn by only writing where the source differs.
export function applySpansPreservingOffsets(
  text: string,
  spans: Array<{ start: number; end: number }>,
): string {
  if (spans.length === 0) return text;
  let cursor = 0;
  let out = "";
  for (const { start, end } of spans) {
    out += text.slice(cursor, start);
    out += REDACTION_CHAR.repeat(end - start);
    cursor = end;
  }
  out += text.slice(cursor);
  return out;
}

// Orchestrates the pre-pass with the fail-OPEN contract. PURE w.r.t. the model: the `scorer` is
// injected. `baseMaskedText` is the essay AFTER the existing roster/extra-identifier masking — the
// pre-pass operates on top of it so its offsets match the text the grader (and thus annotations) see,
// and so it never has to re-discover names the system already masked.
export async function runDeidPrepass(
  baseMaskedText: string | null,
  scorer: PrepassScorer,
  opts: PrepassOptions = {},
): Promise<PrepassResult> {
  const log = opts.log ?? ((msg, detail) => console.log(msg, detail ?? {}));
  const text = baseMaskedText ?? "";

  // Flag off → strict no-op. No model call, no cost, byte-for-byte the base text.
  if (!opts.enabled) {
    return { text, outcome: "disabled", maskedSpans: 0 };
  }
  if (!text) {
    return { text, outcome: "no_spans", maskedSpans: 0 };
  }

  let rawSpans: PiiSpan[];
  try {
    rawSpans = await scorer(text);
  } catch (err) {
    // FAIL OPEN: never block grading. Return the base-masked text and log the failure so it's visible.
    log("[deid-prepass] scorer failed; falling back to base-masked text (fail-open)", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { text, outcome: "failed_open", maskedSpans: 0 };
  }

  const spans = normalizeSpans(rawSpans, text.length);
  if (spans.length === 0) {
    return { text, outcome: "no_spans", maskedSpans: 0 };
  }

  const masked = applySpansPreservingOffsets(text, spans);
  log("[deid-prepass] masked residual free-text PII spans", { spans: spans.length });
  return { text: masked, outcome: "applied", maskedSpans: spans.length };
}

// ── Production Gemini scorer (NOT exercised by unit tests — no key here) ─────────────────────────────
// Built lazily so importing this module under vitest's node runtime never pulls in the Gemini/Deno
// transport. The pure logic above is what the tests cover; this is the thin model-wiring shell.

// Span shape the model returns. Offsets index into the prompt's essay text (the base-masked text).
const PREPASS_SCHEMA = {
  type: "object",
  properties: {
    spans: {
      type: "array",
      description: "Residual PII spans found in the essay, as character offsets.",
      items: {
        type: "object",
        properties: {
          start: { type: "integer", description: "Start char offset (inclusive)." },
          end: { type: "integer", description: "End char offset (exclusive)." },
          category: {
            type: "string",
            enum: ["PERSON", "LOCATION", "ORG", "CONTACT"],
            description: "PII class.",
          },
        },
        required: ["start", "end"],
      },
    },
  },
  required: ["spans"],
};

const PREPASS_SYSTEM = [
  "You are a FERPA de-identification pre-processor for a student-essay grading system.",
  "You are given the body of ONE student essay. Find spans of residual personally-identifying",
  "information that should NOT be sent to a downstream grading model:",
  "- PERSON: names of people OTHER than the essay's own author — classmates, friends, siblings,",
  "  parents/guardians, teachers, employers (the author's own name is already redacted).",
  "- LOCATION: home town, neighborhood, street address, or other place that could identify the author.",
  "- ORG: the author's specific school, workplace, or team by name.",
  "- CONTACT: phone numbers, email addresses, social handles, student/ID numbers.",
  "Do NOT redact: historical/literary/public figures, book or author names being analyzed, common",
  "nouns, or generic places used as essay subject matter. When unsure whether a span identifies the",
  "real author or a classmate, prefer redacting (FERPA minimization).",
  "Return ONLY character offsets into the exact text given (start inclusive, end exclusive). Runs of",
  "'#' are already-redacted; do not return spans inside them.",
].join("\n");

// Default model for the pre-pass: a fast/cheap flash tier. Overridable via env without code change.
const DEFAULT_PREPASS_MODEL = "gemini-2.5-flash";

// Builds the real scorer. Imported lazily inside so this file is safe to import in node (vitest).
export async function buildGeminiPrepassScorer(modelId?: string): Promise<PrepassScorer> {
  const { geminiGenerateJSON } = await import("./ai/gemini.ts");
  const { optionalEnv } = await import("./env.ts");
  const model = modelId ?? optionalEnv("DEID_PREPASS_MODEL", DEFAULT_PREPASS_MODEL);
  return async (text: string): Promise<PiiSpan[]> => {
    const { json } = await geminiGenerateJSON({
      modelId: model,
      systemText: PREPASS_SYSTEM,
      userContent: `<essay>\n${text}\n</essay>`,
      jsonSchema: PREPASS_SCHEMA,
      deterministic: true,
      thinkingBudget: 0, // structured extraction, no reasoning budget needed
    });
    const spans = (json as { spans?: unknown })?.spans;
    return Array.isArray(spans) ? (spans as PiiSpan[]) : [];
  };
}

// Reads the OFF-by-default env flag. DEID_PREPASS_ENABLED=true|1|yes|on turns the pre-pass on globally;
// the call site can additionally gate on a per-teacher privacy_settings.deid_prepass column.
export function prepassEnabledFromEnv(): boolean {
  // Lazy: avoid a top-level Deno reference so node/vitest import stays clean.
  const v = (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno?.env.get(
    "DEID_PREPASS_ENABLED",
  );
  return /^(true|1|yes|on)$/i.test((v ?? "").trim());
}
