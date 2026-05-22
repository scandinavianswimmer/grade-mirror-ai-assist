// Lightweight client-side moderation pass for student-facing feedback (M70).
// This is a non-blocking safety net that flags harsh/inappropriate phrasing so the teacher
// can review before sharing — it is NOT a substitute for the teacher's judgment.
const HARSH_PATTERNS: RegExp[] = [
  /\b(stupid|idiot|idiotic|dumb|lazy|worthless|pathetic|moron|useless)\b/i,
  /\byou('| a)?re (a )?(failure|disgrace)\b/i,
  /\bnever (going to|gonna) (succeed|amount)\b/i,
  /\b(shut up|hopeless)\b/i,
];

export interface ModerationResult {
  flagged: boolean;
  reasons: string[];
}

export const moderateStudentText = (text: string): ModerationResult => {
  if (!text) return { flagged: false, reasons: [] };
  const reasons: string[] = [];
  for (const re of HARSH_PATTERNS) {
    const m = text.match(re);
    if (m) reasons.push(`Possibly harsh wording: "${m[0]}"`);
  }
  return { flagged: reasons.length > 0, reasons };
};
