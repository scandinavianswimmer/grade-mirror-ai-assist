// Phase 15 Wave 2 (PROOF-02): render a teacher's binary-signal few-shot exemplars into the grading
// prompt's cacheable prefix. These exemplars are derived from the teacher's OWN accept/edit/dismiss
// decisions on Mr Selby's past notes (see rebuild-exemplars), so the grader learns this teacher's voice
// from behavior rather than a prose description.
//
// Pure + dependency-free on purpose: the Deno grading engine imports it, and the vitest suite covers
// it under the `npm test` gate (no Deno globals to leak into the node test environment).

export interface StyleExemplar {
  kind: "positive" | "correction" | "negative";
  annotationType?: string; // praise|suggestion|error|question — matchable context, not a rubric criterion
  aiText?: string; // Mr Selby's original wording (correction + negative)
  finalText?: string; // the teacher's final wording (positive + correction)
}

// Keep injected exemplar text bounded so one verbose note can't blow out (or destabilize) the prefix.
const MAX_EXEMPLAR_CHARS = 400;

function clip(s: string | undefined): string {
  const t = (s ?? "").trim();
  return t.length > MAX_EXEMPLAR_CHARS ? `${t.slice(0, MAX_EXEMPLAR_CHARS)}…` : t;
}

// Render top-K exemplars as labeled few-shot lines. Returns "" when there are none (cold start).
// The caller passes an already-bounded, recency-ordered list; this function does not re-sort, so the
// output is stable for a given store ⇒ the cacheable prefix still earns prompt-cache hits.
export function renderExemplars(exemplars: StyleExemplar[]): string {
  if (!exemplars.length) return "";
  const lines = exemplars
    .map((e) => {
      const tag = e.annotationType ? ` (${e.annotationType})` : "";
      if (e.kind === "positive") {
        const t = clip(e.finalText);
        return t ? `✓ KEEP — this teacher accepted a note like this${tag}: "${t}"` : "";
      }
      if (e.kind === "correction") {
        const from = clip(e.aiText);
        const to = clip(e.finalText);
        return to ? `✎ REWRITE — this teacher changed Mr Selby's "${from}" into "${to}"` : "";
      }
      const t = clip(e.aiText);
      return t ? `✗ AVOID — this teacher dismissed a note like this${tag}: "${t}"` : "";
    })
    .filter(Boolean);
  if (!lines.length) return "";
  return `\n\nTHIS TEACHER'S FEEDBACK SIGNALS — learned from their own edits to Mr Selby's past notes. Match the
voice of the KEEP examples, apply the direction of the REWRITE corrections, and avoid the AVOID patterns.
Stay within the rubric; do not invent new criteria:
${lines.join("\n")}`;
}
