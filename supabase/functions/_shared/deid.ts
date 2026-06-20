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
// ASCII so 1 char == 1 byte == 1 UTF-16 code unit — offsets stay valid no matter how any consumer
// (JS string index, byte offset, the model) counts. A multi-byte glyph would only be safe under
// code-unit indexing; "#" is unambiguous.
const REDACTION_CHAR = "#";

// Masks the roster `names` PLUS an optional `extraIdentifiers` list (HIGH-7 de-id expansion). The
// extra list lets the grading path strip caller-supplied FERPA-relevant terms that aren't on the
// student roster — the teacher's own name, the school name, a course/section identifier, or any other
// term the caller explicitly knows. Both lists are masked identically and the offset-preserving
// contract is unchanged: every matched occurrence becomes a redaction block of equal character
// length, so annotation offsets returned by the grader still anchor onto the original UI text.
//
// IMPORTANT — what this does NOT do: it only masks terms the caller passes in. It performs NO
// heuristic name detection, so OTHER students' names, parents' names, hometowns, or addresses written
// freely inside the essay body are NOT removed. Aggressive heuristics were deliberately rejected:
// over-masking essay content corrupts grading (a capitalized common word redacted mid-sentence shifts
// meaning the model grades against). Real residual-PII coverage requires an NER / model de-id pre-pass
// (documented as the follow-up in docs/COMPLIANCE-POSTURE.md). Terms shorter than 2 chars are ignored
// in both lists (too ambiguous — a single letter would corrupt every essay containing it).
export function maskNamesPreservingOffsets(
  text: string | null,
  names: string[],
  extraIdentifiers: string[] = [],
): string | null {
  if (!text) return text;
  let out = text;
  for (const term of [...names, ...extraIdentifiers]) {
    const n = term?.trim();
    if (!n || n.length < 2) continue;
    const re = new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    out = out.replace(re, (m) => REDACTION_CHAR.repeat(m.length));
  }
  return out;
}
