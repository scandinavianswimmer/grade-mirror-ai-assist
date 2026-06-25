// Tests for the de-id PRE-PASS pure logic (HIGH-7 real fix). The model is INJECTED as a mock scorer,
// so these run under vitest's node runtime with no Gemini key and no Deno globals. They lock the
// offset-preserving + fail-open contract. Path is covered by the root vitest `_shared/**` glob.
import { describe, it, expect, vi } from 'vitest';

import {
  runDeidPrepass,
  normalizeSpans,
  applySpansPreservingOffsets,
  type PiiSpan,
} from './deid-prepass.ts';

// Build a mock scorer that returns spans for the given substrings (computed against the input text),
// so test intent reads in terms of words, not brittle hand-counted offsets.
function scorerForWords(words: string[]) {
  return async (text: string): Promise<PiiSpan[]> => {
    const spans: PiiSpan[] = [];
    for (const w of words) {
      const i = text.indexOf(w);
      if (i >= 0) spans.push({ start: i, end: i + w.length, category: 'PERSON' });
    }
    return spans;
  };
}

describe('runDeidPrepass — masking model-returned spans length-preservingly', () => {
  it('masks the residual free-text PII spans the scorer returns', async () => {
    const text = 'My friend Marcus lives in Cleveland and helped me revise.';
    const res = await runDeidPrepass(text, scorerForWords(['Marcus', 'Cleveland']), { enabled: true });

    expect(res.outcome).toBe('applied');
    expect(res.maskedSpans).toBe(2);
    expect(res.text).not.toMatch(/Marcus/);
    expect(res.text).not.toMatch(/Cleveland/);
    expect(res.text).toContain('######'); // "Marcus" -> 6 #
  });

  it('preserves total length and every downstream offset exactly', async () => {
    const text = 'My friend Marcus said the thesis about Cleveland was strong.';
    const anchorThesis = text.indexOf('thesis');
    const anchorStrong = text.indexOf('strong');
    const res = await runDeidPrepass(text, scorerForWords(['Marcus', 'Cleveland']), { enabled: true });

    expect(res.text.length).toBe(text.length);
    expect(res.text.indexOf('thesis')).toBe(anchorThesis);
    expect(res.text.indexOf('strong')).toBe(anchorStrong);
  });
});

describe('runDeidPrepass — flag OFF is a strict no-op', () => {
  it('returns the base text unchanged and never calls the scorer when disabled', async () => {
    const text = 'My friend Marcus is here.';
    const scorer = vi.fn(scorerForWords(['Marcus']));
    const res = await runDeidPrepass(text, scorer, { enabled: false });

    expect(res.outcome).toBe('disabled');
    expect(res.maskedSpans).toBe(0);
    expect(res.text).toBe(text);
    expect(scorer).not.toHaveBeenCalled();
  });

  it('treats omitted options as disabled (off by default)', async () => {
    const text = 'My friend Marcus is here.';
    const scorer = vi.fn(scorerForWords(['Marcus']));
    const res = await runDeidPrepass(text, scorer);

    expect(res.outcome).toBe('disabled');
    expect(scorer).not.toHaveBeenCalled();
    expect(res.text).toBe(text);
  });
});

describe('runDeidPrepass — FAIL OPEN on scorer failure', () => {
  it('returns the base-masked text and logs when the scorer throws (never blocks grading)', async () => {
    const baseMasked = 'Student #### wrote about #### and a classmate named Lena.';
    const log = vi.fn();
    const res = await runDeidPrepass(
      baseMasked,
      async () => {
        throw new Error('Gemini timeout');
      },
      { enabled: true, log },
    );

    expect(res.outcome).toBe('failed_open');
    expect(res.maskedSpans).toBe(0);
    expect(res.text).toBe(baseMasked); // fall back to what roster/extras already masked
    expect(log).toHaveBeenCalledOnce();
    expect(log.mock.calls[0][0]).toMatch(/fail-open/i);
  });

  it('also fails open when the scorer rejects with a non-Error value', async () => {
    const baseMasked = 'Some essay text.';
    const res = await runDeidPrepass(baseMasked, async () => Promise.reject('boom'), {
      enabled: true,
      log: () => {},
    });
    expect(res.outcome).toBe('failed_open');
    expect(res.text).toBe(baseMasked);
  });
});

describe('runDeidPrepass — no spans found', () => {
  it('returns the text unchanged when the scorer finds nothing', async () => {
    const text = 'The green light symbolizes the American Dream in Fitzgerald.';
    const res = await runDeidPrepass(text, async () => [], { enabled: true });
    expect(res.outcome).toBe('no_spans');
    expect(res.maskedSpans).toBe(0);
    expect(res.text).toBe(text);
  });

  it('handles null/empty base text without calling masking', async () => {
    const res = await runDeidPrepass(null, scorerForWords(['x']), { enabled: true });
    expect(res.outcome).toBe('no_spans');
    expect(res.text).toBe('');
  });
});

describe('runDeidPrepass — does not double-mask already-masked roster names', () => {
  it('leaves an existing redaction block intact and adds only the new residual span', async () => {
    // "Sofia" already masked by the roster pass -> "#####". A classmate "Lena" remains in cleartext.
    const baseMasked = '##### wrote that her friend Lena gave feedback.';
    const before = baseMasked;
    const res = await runDeidPrepass(baseMasked, scorerForWords(['Lena']), { enabled: true });

    expect(res.outcome).toBe('applied');
    expect(res.text).not.toMatch(/Lena/);
    expect(res.text.length).toBe(before.length);
    // The original roster redaction block is untouched (still exactly 5 #).
    expect(res.text.startsWith('#####')).toBe(true);
    expect(res.text.indexOf('feedback')).toBe(before.indexOf('feedback'));
  });

  it('is a no-op if the scorer returns spans that fall inside an already-masked block', async () => {
    const baseMasked = 'Student ##### finished the essay.';
    // Scorer mistakenly returns a span over the existing #### block — masking it changes nothing.
    const blockStart = baseMasked.indexOf('#####');
    const res = await runDeidPrepass(
      baseMasked,
      async () => [{ start: blockStart, end: blockStart + 5, category: 'PERSON' }],
      { enabled: true },
    );
    expect(res.text).toBe(baseMasked); // re-masking '#####' with '#####' is a no-op
  });
});

describe('normalizeSpans — boundary validation + overlap merge', () => {
  it('drops out-of-bounds, inverted, zero-width, and non-integer spans', () => {
    const spans = [
      { start: -1, end: 3 }, // negative start
      { start: 5, end: 4 }, // inverted
      { start: 2, end: 2 }, // zero width
      { start: 0, end: 100 }, // end past text length (textLength = 10)
      { start: 1.5, end: 3 } as unknown as PiiSpan, // non-integer
      { start: 2, end: 5 }, // valid
    ];
    const out = normalizeSpans(spans as PiiSpan[], 10);
    expect(out).toEqual([{ start: 2, end: 5 }]);
  });

  it('merges overlapping and adjacent spans into single non-overlapping blocks', () => {
    const spans: PiiSpan[] = [
      { start: 0, end: 4 },
      { start: 2, end: 7 }, // overlaps previous
      { start: 7, end: 9 }, // adjacent to merged block
      { start: 12, end: 15 }, // separate
    ];
    const out = normalizeSpans(spans, 20);
    expect(out).toEqual([
      { start: 0, end: 9 },
      { start: 12, end: 15 },
    ]);
  });

  it('returns [] for empty/garbage input', () => {
    expect(normalizeSpans([], 10)).toEqual([]);
    expect(normalizeSpans(undefined as unknown as PiiSpan[], 10)).toEqual([]);
  });
});

describe('applySpansPreservingOffsets — pure offset-preserving masking', () => {
  it('replaces each span with an equal-length redaction block', () => {
    const text = 'abcdefghij';
    const out = applySpansPreservingOffsets(text, [{ start: 2, end: 5 }]);
    expect(out).toBe('ab###fghij');
    expect(out.length).toBe(text.length);
  });

  it('returns the text unchanged for no spans', () => {
    const text = 'abcdefghij';
    expect(applySpansPreservingOffsets(text, [])).toBe(text);
  });
});
