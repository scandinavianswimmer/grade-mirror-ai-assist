import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  FICTIONAL_STACK_PROGRESS,
  fictionalPreviewPapers,
  movePreviewPaperIndex,
  PUBLIC_PREVIEW_APPROVAL_MESSAGE,
  PUBLIC_PREVIEW_EXPORT_MESSAGE,
} from './teacherDeskPreviewData';
import { TeacherControlProof, TeacherDeskPreview } from './TeacherDeskPreview';

describe('TeacherDeskPreview fictional paper queue', () => {
  it('ships three complete and distinct fictional paper states', () => {
    expect(fictionalPreviewPapers).toHaveLength(3);
    expect(new Set(fictionalPreviewPapers.map((paper) => paper.student)).size).toBe(3);
    expect(new Set(fictionalPreviewPapers.map((paper) => paper.title)).size).toBe(3);
    expect(fictionalPreviewPapers.map((paper) => paper.reviewStatus)).toEqual([
      'needs-look',
      'ready',
      'needs-look',
    ]);
    expect(
      fictionalPreviewPapers.map((paper) => paper.rubricScores.reduce((total, score) => total + score, 0)),
    ).toEqual([16, 18, 13]);

    for (const paper of fictionalPreviewPapers) {
      expect(paper.paragraphs).toHaveLength(4);
      expect(paper.rubricScores).toHaveLength(5);
      expect(paper.notes).toHaveLength(4);
      expect(paper.draftSummary.length).toBeGreaterThan(40);
    }
  });

  it('moves one paper at a time and stops at the queue boundaries', () => {
    expect(movePreviewPaperIndex(0, -1)).toBe(0);
    expect(movePreviewPaperIndex(0, 1)).toBe(1);
    expect(movePreviewPaperIndex(1, 1)).toBe(2);
    expect(movePreviewPaperIndex(2, 1)).toBe(2);
    expect(movePreviewPaperIndex(2, -1)).toBe(1);
  });

  it('renders an accessible, explicitly fictional initial queue state', () => {
    const markup = renderToStaticMarkup(<TeacherDeskPreview />);

    expect(markup).toContain('aria-roledescription="carousel"');
    expect(markup).toContain('aria-roledescription="slide"');
    expect(markup).toContain('Sample 1 of 3');
    expect(markup).toContain('Fictional stack snapshot · 18 of 27 reviewed');
    expect(markup).toContain('Jordan Lee · fictional student');
    expect(markup).toContain('Next fictional paper: A Better Start to the School Day');
    expect(markup).toContain('Previous fictional paper');
    expect(markup).toContain('disabled=""');
    expect(FICTIONAL_STACK_PROGRESS).toEqual({ reviewed: 18, total: 27 });
    expect(markup).toContain('Approve feedback');
    expect(PUBLIC_PREVIEW_APPROVAL_MESSAGE).toContain('Nothing was sent or exported');
    expect(PUBLIC_PREVIEW_EXPORT_MESSAGE).toContain('No file was created');
  });

  it('does not imply that the fictional margin note stores a rubric-criterion link', () => {
    const markup = renderToStaticMarkup(<TeacherControlProof />);

    expect(markup).toContain('Fictional paper · passage-based draft');
    expect(markup).not.toContain('Fictional paper · Thesis &amp; focus');
  });
});
