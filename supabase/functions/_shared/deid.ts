// De-identification of student PII in free text. Shared by the grading path (send-time, before
// any essay reaches a third-party LLM) and the privacy-tasks cron (retention-time scrub) so both
// behave identically. The grading-path use is the FERPA-critical one: it strips the student's own
// name from the essay body before it is transmitted to Google Gemini.

// Replace each known student name with an opaque token everywhere it appears in free text.
// Case-insensitive; names shorter than 2 chars are ignored (too ambiguous to scrub safely).
// Used by the retention cron, which rewrites stored text + annotations together, so the token
// length need not match the original.
export function scrubNames(text: string | null, names: string[]): string | null {
  if (!text) return text;
  let out = text;
  names.forEach((name, i) => {
    if (!name || name.trim().length < 2) return;
    const re = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    out = out.replace(re, `Student_${i + 1}`);
  });
  return out;
}

// Length-PRESERVING variant for the grading path: each name occurrence becomes a redaction block
// of identical character length. The grading engine returns annotation offsets into the text it
// graded, and the UI overlays those offsets on the ORIGINAL essay — so de-identifying the text
// sent to the LLM must not shift any offsets. Replacing "Jane Doe" (8) with 8 redaction chars
// keeps every downstream index valid while ensuring the real name never leaves for the LLM.
const REDACTION_CHAR = "▮"; // ▮
export function maskNamesPreservingOffsets(text: string | null, names: string[]): string | null {
  if (!text) return text;
  let out = text;
  for (const name of names) {
    const n = name?.trim();
    if (!n || n.length < 2) continue;
    const re = new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    out = out.replace(re, (m) => REDACTION_CHAR.repeat(m.length));
  }
  return out;
}
