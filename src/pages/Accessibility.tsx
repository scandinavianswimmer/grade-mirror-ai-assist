import { Link } from 'react-router-dom';
import { Accessibility as AccessibilityIcon, CalendarCheck2, ClipboardCheck, MessageSquareWarning, ScanSearch } from 'lucide-react';
import LegalPreviewLayout, {
  LegalSection,
  type LegalPageSection,
} from '@/components/public/LegalPreviewLayout';
import { SCHOOL_CONTACT_EMAIL } from '@/lib/pricingPlans';

const REPORT_ACCESSIBILITY_ISSUE_URL =
  'https://github.com/scandinavianswimmer/grade-mirror-ai-assist/issues/new' +
  '?title=%5BAccessibility%5D%20' +
  '&body=Page%20or%20screen%3A%0A%0AAccessibility%20barrier%3A%0A%0AWhat%20you%20were%20trying%20to%20do%3A%0A%0ABrowser%20or%20assistive%20technology%20(optional)%3A';

const sections: LegalPageSection[] = [
  { id: 'commitment', title: 'Our commitment' },
  { id: 'status', title: 'Current status' },
  { id: 'measures', title: 'Accessibility measures' },
  { id: 'testing', title: 'How we test' },
  { id: 'limitations', title: 'Known limitations' },
  { id: 'feedback', title: 'Report a barrier' },
];

const Accessibility = () => {
  const contactHref = SCHOOL_CONTACT_EMAIL
    ? `mailto:${SCHOOL_CONTACT_EMAIL}?subject=${encodeURIComponent('Mr Selby accessibility feedback')}`
    : null;

  return (
    <LegalPreviewLayout
      currentPath="/accessibility"
      eyebrow="Accessibility statement"
      title="Mr Selby should work for every teacher"
      summary="Teachers use different tools to read, navigate, and interact with the web. This page explains the accessibility standard we are working toward, what we test, and how to report a barrier."
      sections={sections}
      noticeBadge="Current public preview"
      noticeTitle="A public commitment, not a compliance badge"
      noticeBody="Mr Selby is working toward WCAG 2.2 Level AA. We do not claim full conformance while the authenticated workspace and hands-on assistive-technology testing are still being completed."
      noticeIcon={AccessibilityIcon}
      details={[
        { title: 'Target standard', value: 'WCAG 2.2 Level AA', icon: ClipboardCheck },
        { title: 'Assessment', value: 'Self-evaluation plus axe-core', icon: ScanSearch },
        { title: 'Last reviewed', value: '1 August 2026', icon: CalendarCheck2 },
        { title: 'Feedback route', value: 'Public issue reporting is open', icon: MessageSquareWarning },
      ]}
    >
      <LegalSection id="commitment" title="Our commitment">
        <p>
          Mr Selby is being designed for teachers who navigate by keyboard, enlarge text, reduce
          motion, use high-contrast settings, or rely on screen readers and other assistive
          technology.
        </p>
        <p>
          Our target is the Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA. We treat
          accessibility as ongoing product work: automated checks help us catch regressions, while
          manual review and feedback from people remain essential.
        </p>
      </LegalSection>

      <LegalSection id="status" title="Current status">
        <p>
          The public preview has been self-evaluated against automated WCAG A and AA checks and a
          focused manual checklist. It is not yet represented as fully conformant or independently
          certified.
        </p>
        <p>
          Last reviewed: <time dateTime="2026-08-01">1 August 2026</time>. This statement covers the
          public pages at <span className="font-medium text-foreground">mrselby.app</span>. The
          protected grading workspace will be added to the scope when its production service is
          enabled.
        </p>
      </LegalSection>

      <LegalSection id="measures" title="Accessibility measures">
        <ul className="list-disc space-y-2 pl-6 marker:text-primary">
          <li>semantic page landmarks, headings, lists, links, buttons, and form labels;</li>
          <li>skip links and visible keyboard focus indicators;</li>
          <li>descriptive link text and accessible names for icon-only controls;</li>
          <li>minimum target sizing and layouts that reflow on narrow screens;</li>
          <li>color contrast checks and status information that is not conveyed by color alone;</li>
          <li>reduced-motion and forced-color support in the shared visual system; and</li>
          <li>accessibility checks in the release workflow so known violations block a release.</li>
        </ul>
      </LegalSection>

      <LegalSection id="testing" title="How we test">
        <p>
          Public routes are scanned in a real Chromium browser with Playwright and axe-core using
          WCAG 2.0, 2.1, and 2.2 Level A and AA rules. We also review keyboard order, footer and
          navigation landmarks, focus visibility, reduced motion, forced colors, 200% text zoom,
          and narrow-screen reflow.
        </p>
        <p>
          Automated tests cannot determine whether every experience is understandable or usable.
          Screen-reader review and task-based testing remain part of the release checklist.
        </p>
      </LegalSection>

      <LegalSection id="limitations" title="Known limitations">
        <ul className="list-disc space-y-2 pl-6 marker:text-primary">
          <li>The protected grading workspace is not available in the current public-only deployment.</li>
          <li>The public preview has had a local VoiceOver spot check; a full task-based retest with representative classroom documents remains open for the protected release.</li>
          <li>Accessibility of teacher-uploaded documents can vary with the source file. Mr Selby cannot repair every issue in an uploaded file automatically.</li>
        </ul>
        <p>
          We will update this statement when those areas are tested or when a known barrier changes.
        </p>
      </LegalSection>

      <LegalSection id="feedback" title="Report a barrier">
        <p>
          If something prevents you from using Mr Selby, tell us the page, what you were trying to
          do, and—only if you are comfortable sharing it—the browser or assistive technology you
          use. Do not include student work or other sensitive classroom information.
        </p>
        <p>
          <a
            href={REPORT_ACCESSIBILITY_ISSUE_URL}
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Report an accessibility issue on GitHub
          </a>
          {contactHref && (
            <>
              {' '}or{' '}
              <a href={contactHref} className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
                email the Mr Selby team
              </a>
            </>
          )}
          .
        </p>
        <p>
          For information about classroom data, read the <Link to="/privacy" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">Privacy preview</Link>.
        </p>
      </LegalSection>
    </LegalPreviewLayout>
  );
};

export default Accessibility;
