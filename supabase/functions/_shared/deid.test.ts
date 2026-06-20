// Tests for the de-identification helpers shared by the grading path + retention cron.
// deid.ts is a PURE module (no Deno-specific imports), so it runs unchanged under vitest.
// Run via the root vitest config (this path is added to its `include` globs).
import { describe, it, expect } from 'vitest';

import { maskNamesPreservingOffsets, scrubNames } from './deid.ts';

describe('maskNamesPreservingOffsets — roster names', () => {
  it('masks the student name everywhere, case-insensitively', () => {
    const text = 'Jane wrote this. jane is thorough. JANE concludes well.';
    const out = maskNamesPreservingOffsets(text, ['Jane'])!;
    expect(out).not.toMatch(/jane/i);
    expect(out).toContain('####'); // 4-char redaction block
  });

  it('preserves the original text length exactly (offset-safe)', () => {
    const text = 'Jane Doe argued that Jane Doe was right about everything.';
    const out = maskNamesPreservingOffsets(text, ['Jane Doe'])!;
    expect(out.length).toBe(text.length);
  });

  it('preserves the index of text AFTER a masked name', () => {
    const text = 'Jane said: the thesis holds.';
    const anchor = text.indexOf('thesis');
    const out = maskNamesPreservingOffsets(text, ['Jane'])!;
    expect(out.indexOf('thesis')).toBe(anchor);
  });

  it('ignores names shorter than 2 chars (too ambiguous to scrub)', () => {
    const text = 'A is a letter.';
    const out = maskNamesPreservingOffsets(text, ['A'])!;
    expect(out).toBe(text);
  });

  it('returns null/empty input unchanged', () => {
    expect(maskNamesPreservingOffsets(null, ['Jane'])).toBeNull();
    expect(maskNamesPreservingOffsets('', ['Jane'])).toBe('');
  });
});

describe('maskNamesPreservingOffsets — extra identifiers (HIGH-7 expansion)', () => {
  it('masks a caller-supplied teacher name in addition to the roster', () => {
    const text = 'My teacher Ms. Patel and my friend Sofia both helped me.';
    const out = maskNamesPreservingOffsets(text, ['Sofia'], ['Ms. Patel'])!;
    expect(out).not.toMatch(/Patel/i);
    expect(out).not.toMatch(/Sofia/i);
    expect(out.length).toBe(text.length);
  });

  it('masks a caller-supplied school name', () => {
    const text = 'I attend Lincoln High School in the valley.';
    const out = maskNamesPreservingOffsets(text, [], ['Lincoln High School'])!;
    expect(out).not.toMatch(/Lincoln High School/i);
    expect(out.length).toBe(text.length);
  });

  it('masks both roster + extras and preserves every downstream offset', () => {
    const text = 'Diego wrote about Riverside Prep for Mr. Alvarez. The thesis is clear.';
    const anchor = text.indexOf('thesis');
    const out = maskNamesPreservingOffsets(
      text,
      ['Diego'],
      ['Riverside Prep', 'Mr. Alvarez'],
    )!;
    expect(out).not.toMatch(/Diego/);
    expect(out).not.toMatch(/Riverside Prep/);
    expect(out).not.toMatch(/Alvarez/);
    expect(out.length).toBe(text.length);
    expect(out.indexOf('thesis')).toBe(anchor); // offsets after the masks unchanged
  });

  it('skips blank / too-short extra identifiers without throwing', () => {
    const text = 'Sofia gave An Account of it.';
    const out = maskNamesPreservingOffsets(text, ['Sofia'], ['', ' ', 'A'])!;
    expect(out).not.toMatch(/Sofia/);
    // The single-char "A" must NOT be masked (would corrupt every essay containing the letter A).
    expect(out).toContain('An Account'); // single-char "A" was skipped, surrounding text intact
    expect(out.length).toBe(text.length);
  });

  it('does NOT over-mask a clean essay with no roster/extra terms in it', () => {
    const essay =
      'The green light symbolizes an unreachable American Dream. Fitzgerald uses it to ' +
      'show how aspiration recedes the closer one gets.';
    const out = maskNamesPreservingOffsets(essay, ['Sofia Reyes'], ['Lincoln High', 'Ms. Patel'])!;
    expect(out).toBe(essay); // nothing matched → text untouched, character-for-character
  });

  it('treats undefined extras as the no-extras roster-only case', () => {
    const text = 'Sofia is here.';
    const out = maskNamesPreservingOffsets(text, ['Sofia'])!;
    expect(out).not.toMatch(/Sofia/);
    expect(out.length).toBe(text.length);
  });
});

describe('scrubNames — retention-cron token replacement (unchanged contract)', () => {
  it('replaces each name with an indexed Student_N token', () => {
    const text = 'Jane and John worked together.';
    const out = scrubNames(text, ['Jane', 'John'])!;
    expect(out).toBe('Student_1 and Student_2 worked together.');
  });

  it('returns null input unchanged', () => {
    expect(scrubNames(null, ['Jane'])).toBeNull();
  });
});
