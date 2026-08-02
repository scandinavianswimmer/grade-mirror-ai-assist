import { AIComment } from '@/lib/aiParser';

export type AnchorRange = {
  start: number; 
  end: number; 
  id: string; 
  n: number; 
  text: string; 
  comment: string;
};

type AnchorMetadata = {
  startIndex?: unknown;
  length?: unknown;
  occurrence?: unknown;
};

export function resolveAnchors(essayText: string, comments: AIComment[]): AnchorRange[] {
  const usedRanges: [number, number][] = [];
  const results: AnchorRange[] = [];

  function isFree(start: number, end: number) {
    return !usedRanges.some(([s,e]) => Math.max(s, start) < Math.min(e, end));
  }

  function nthIndexOf(hay: string, needle: string, occurrence: number) {
    let idx = -1, from = 0;
    for (let i = 0; i <= occurrence; i++) {
      idx = hay.indexOf(needle, from);
      if (idx === -1) return -1;
      from = idx + 1;
    }
    return idx;
  }

  comments.forEach((c, i) => {
    const metadata = c as AIComment & AnchorMetadata;
    let start = -1; 
    let len = c.text.length;
    
    // Priority 1: Use startIndex if available
    if (typeof metadata.startIndex === 'number') {
      start = metadata.startIndex;
      if (typeof metadata.length === 'number' && metadata.length) len = metadata.length;
    }
    
    // Priority 2: Use occurrence if available
    if (start === -1 && typeof metadata.occurrence === 'number') {
      start = nthIndexOf(essayText, c.text, metadata.occurrence);
    }
    
    // Priority 3: Find first occurrence
    if (start === -1) {
      start = essayText.indexOf(c.text);
    }
    
    if (start === -1) return; // skip if not found

    let end = start + len;
    // if overlap, try to find next occurrence
    let tries = 0; 
    let from = start;
    while (!isFree(start, end) && tries < 20) {
      from = essayText.indexOf(c.text, from + 1);
      if (from === -1) break;
      start = from; 
      end = start + len; 
      tries++;
    }
    if (!isFree(start, end)) return;

    usedRanges.push([start, end]);
    results.push({ 
      start, 
      end, 
      id: `a-${i+1}-${start}`, 
      n: 0, 
      text: c.text, 
      comment: c.comment 
    });
  });

  results.sort((a,b)=>a.start-b.start).forEach((r, idx)=> r.n = idx+1);
  return results;
}
