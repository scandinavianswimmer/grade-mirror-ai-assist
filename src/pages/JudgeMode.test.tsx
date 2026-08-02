import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { buildReleaseProof, NOT_CAPTURED_FOR_RELEASE } from '@/lib/releaseProof';
import JudgeMode from './JudgeMode';

const renderJudgeMode = () => renderToStaticMarkup(
  <MemoryRouter initialEntries={['/judge']}>
    <JudgeMode proof={buildReleaseProof({})} />
  </MemoryRouter>,
);

describe('JudgeMode', () => {
  it('presents all four Teacher\'s Test questions', () => {
    const markup = renderJudgeMode();

    expect(markup).toContain('Does the draft follow the assignment and rubric?');
    expect(markup).toContain('Four questions before you trust a grading draft.');
    expect(markup).toContain('Can it point to evidence in the paper?');
    expect(markup).toContain('Does it stop when the work should not be graded?');
    expect(markup).toContain('Can the teacher revise every margin note before approval?');
  });

  it('labels every example as fictional and separates fixture UI from production proof', () => {
    const markup = renderJudgeMode();

    expect(markup).toContain('SYNTHETIC DEMO');
    expect(markup).toContain('Illustrative draft note');
    expect(markup).toContain('Not model output');
    expect(markup).toContain('No score proposed');
    expect(markup).toContain('does not claim a production grading run');
  });

  it('renders missing production evidence with the exact fail-closed language', () => {
    const markup = renderJudgeMode();

    expect(markup).toContain(NOT_CAPTURED_FOR_RELEASE);
    expect(markup).toContain('0 of 9 public fields recorded for this build');
    expect(markup).not.toContain('customer@example.com');
  });

  it('uses semantic landmarks and native controls in the static surface', () => {
    const markup = renderJudgeMode();

    expect(markup).toContain('<header');
    expect(markup).toContain('<main');
    expect(markup).toContain('<aside');
    expect(markup).toContain('<footer');
    expect(markup).toContain('<button');
    expect(markup).toContain('Teacher decision controls');
    expect(markup).toContain('Edit');
    expect(markup).toContain('Skip to main content');
  });
});
