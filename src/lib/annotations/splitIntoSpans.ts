import type { AnchorRange } from "./resolveAnchors";

export type Span = { type: 'text'|'anno'; text: string; anchor?: AnchorRange };

export function splitIntoSpans(text: string, anchors: AnchorRange[]): Span[] {
  const spans: Span[] = [];
  let cursor = 0;
  
  anchors.forEach(a => {
    if (a.start > cursor) {
      spans.push({ type: 'text', text: text.slice(cursor, a.start) });
    }
    spans.push({ type: 'anno', text: text.slice(a.start, a.end), anchor: a });
    cursor = a.end;
  });
  
  if (cursor < text.length) {
    spans.push({ type: 'text', text: text.slice(cursor) });
  }
  
  return spans;
}