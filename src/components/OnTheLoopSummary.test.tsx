import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import OnTheLoopSummary from './OnTheLoopSummary';

describe('OnTheLoopSummary approval language', () => {
  it('describes auto-finalize as automatic approval rather than publication', () => {
    const markup = renderToStaticMarkup(
      <OnTheLoopSummary
        summary={{ graded: 2, autoFinalized: 1, needsReview: 0, pending: 1, autoFinalizedPct: 50 }}
      />,
    );

    expect(markup).toContain('Mr Selby approved 1 high-confidence grade automatically.');
    expect(markup).not.toMatch(/publish/i);
  });
});
