import { describe, it, expect } from 'vitest';
// The exemplar renderer is shared with the Deno grading engine (it's dependency-free on purpose) and
// is the heart of Phase 15 Wave 2 (PROOF-02): it turns the teacher's accept/edit/dismiss signal into
// the few-shot block injected into the grading prompt. Covered here under the `npm test` gate.
import {
  renderExemplars,
  type StyleExemplar,
} from '../../supabase/functions/_shared/grading/exemplars';

describe('renderExemplars — Phase 15 binary-signal few-shot block', () => {
  it('returns an empty string for the cold-start (no exemplars) case', () => {
    expect(renderExemplars([])).toBe('');
  });

  it('labels each signal kind distinctly (KEEP / REWRITE / AVOID)', () => {
    const exemplars: StyleExemplar[] = [
      { kind: 'positive', annotationType: 'praise', finalText: 'Strong, specific thesis.' },
      { kind: 'correction', aiText: 'Good job.', finalText: 'Your evidence in ¶2 directly supports the claim.' },
      { kind: 'negative', annotationType: 'suggestion', aiText: 'Consider adding more adjectives.' },
    ];
    const out = renderExemplars(exemplars);
    expect(out).toContain('✓ KEEP');
    expect(out).toContain('Strong, specific thesis.');
    expect(out).toContain('✎ REWRITE');
    expect(out).toContain('"Good job." into "Your evidence in ¶2 directly supports the claim."');
    expect(out).toContain('✗ AVOID');
    expect(out).toContain('Consider adding more adjectives.');
  });

  it('is deterministic — same store renders byte-identically (prompt-cache stability)', () => {
    const exemplars: StyleExemplar[] = [
      { kind: 'positive', finalText: 'Nice close reading.' },
      { kind: 'negative', aiText: 'Vague.' },
    ];
    expect(renderExemplars(exemplars)).toBe(renderExemplars(exemplars));
  });

  it('clips an over-long exemplar so one verbose note cannot blow out the prefix', () => {
    const long = 'x'.repeat(1000);
    const out = renderExemplars([{ kind: 'positive', finalText: long }]);
    expect(out).toContain('…');
    expect(out).not.toContain(long);
  });

  it('skips exemplars whose load-bearing text is empty rather than emitting empty quotes', () => {
    expect(renderExemplars([{ kind: 'positive', finalText: '' }])).toBe('');
    expect(renderExemplars([{ kind: 'negative', aiText: '   ' }])).toBe('');
    // A correction with no final text contributes nothing.
    expect(renderExemplars([{ kind: 'correction', aiText: 'old', finalText: '' }])).toBe('');
  });
});
