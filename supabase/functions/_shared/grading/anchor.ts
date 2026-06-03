// Text normalization + robust annotation anchoring.
// Anchors on model-provided char offsets first, validates, then fuzzy-matches as fallback.
// NEVER silently drops an annotation — unmatched ones return matched:false so the UI can surface them.

// Normalize for comparison: NFC, straighten smart quotes, collapse whitespace, strip edge ellipses.
export function normalize(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/\s+/g, " ")
    .trim();
}

export interface RawAnnotation {
  quote: string;
  startIndex: number;
  endIndex: number;
}
export interface Anchored {
  startIndex: number;
  endIndex: number;
  matched: boolean;
}

// Build a map from normalized-char position back to original-string position, so a normalized
// match can be reported as original offsets.
function buildNormIndex(essay: string): { norm: string; map: number[] } {
  const map: number[] = [];
  let norm = "";
  let prevSpace = false;
  const nfc = essay.normalize("NFC");
  for (let i = 0; i < nfc.length; i++) {
    let c = nfc[i];
    if (c === "‘" || c === "’" || c === "‛") c = "'";
    else if (c === "“" || c === "”") c = '"';
    else if (c === "–" || c === "—") c = "-";
    if (/\s/.test(c)) {
      if (prevSpace) continue;
      c = " ";
      prevSpace = true;
    } else {
      prevSpace = false;
    }
    norm += c;
    map.push(i);
  }
  return { norm: norm.trim(), map };
}

export function anchorOne(essay: string, a: RawAnnotation): Anchored {
  // 1) Trust offsets if the slice normalizes-equal to the quote.
  if (
    Number.isInteger(a.startIndex) &&
    Number.isInteger(a.endIndex) &&
    a.startIndex >= 0 &&
    a.endIndex <= essay.length &&
    a.startIndex < a.endIndex
  ) {
    const slice = essay.slice(a.startIndex, a.endIndex);
    if (normalize(slice) === normalize(a.quote)) {
      return { startIndex: a.startIndex, endIndex: a.endIndex, matched: true };
    }
  }

  // 2) Normalized substring search → map back to original offsets.
  const { norm, map } = buildNormIndex(essay);
  const q = normalize(a.quote);
  if (q.length > 0) {
    const idx = norm.indexOf(q);
    if (idx >= 0) {
      const start = map[idx];
      const endNorm = idx + q.length - 1;
      const end = map[Math.min(endNorm, map.length - 1)] + 1;
      return { startIndex: start, endIndex: end, matched: true };
    }
  }

  // 3) Fuzzy fallback: best-scoring window by token overlap (Jaccard) above a threshold.
  const fuzzy = fuzzyFind(norm, map, q);
  if (fuzzy) return { ...fuzzy, matched: true };

  // 4) Not found — DO NOT drop. Return as unmatched.
  return { startIndex: -1, endIndex: -1, matched: false };
}

function fuzzyFind(
  norm: string,
  map: number[],
  q: string,
): { startIndex: number; endIndex: number } | null {
  if (q.length < 8) return null;
  const qTokens = new Set(q.split(" "));
  const words = norm.split(" ");
  const windowLen = q.split(" ").length;
  let best = 0;
  let bestStartWord = -1;
  for (let i = 0; i + windowLen <= words.length; i++) {
    const win = new Set(words.slice(i, i + windowLen));
    let inter = 0;
    for (const t of win) if (qTokens.has(t)) inter++;
    const union = new Set([...win, ...qTokens]).size;
    const jaccard = union ? inter / union : 0;
    if (jaccard > best) {
      best = jaccard;
      bestStartWord = i;
    }
  }
  if (best < 0.6 || bestStartWord < 0) return null;
  // Translate the winning word window back to normalized char range, then to original offsets.
  let charPos = 0;
  for (let w = 0; w < bestStartWord; w++) charPos += words[w].length + 1;
  const startNorm = charPos;
  let endNorm = startNorm;
  for (let w = bestStartWord; w < bestStartWord + windowLen && w < words.length; w++) {
    endNorm += words[w].length + 1;
  }
  endNorm = Math.min(endNorm - 1, map.length - 1);
  return { startIndex: map[startNorm] ?? 0, endIndex: (map[endNorm] ?? map.length - 1) + 1 };
}

// True if the quote exists in the essay (used for evidence verification).
export function quoteExists(essay: string, quote: string): boolean {
  if (!quote.trim()) return false;
  return buildNormIndex(essay).norm.includes(normalize(quote));
}
