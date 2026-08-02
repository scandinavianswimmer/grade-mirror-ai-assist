import { Feather } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SCHOOL_CONTACT_EMAIL } from '@/lib/pricingPlans';

const REPORT_ISSUE_URL =
  'https://github.com/scandinavianswimmer/grade-mirror-ai-assist/issues/new' +
  '?title=%5BAccessibility%20or%20support%5D%20' +
  '&body=Page%20or%20screen%3A%0A%0AWhat%20happened%3A%0A%0AWhat%20you%20expected%3A%0A%0ABrowser%20or%20assistive%20technology%20(optional)%3A';

const footerLinkClass =
  'inline-flex min-h-11 items-center rounded-md px-2 font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:bg-muted hover:decoration-foreground';

const PublicFooter = () => {
  const contactHref = SCHOOL_CONTACT_EMAIL ? `mailto:${SCHOOL_CONTACT_EMAIL}` : null;

  return (
    <footer className="border-t border-border/80 bg-card/55 px-4 py-10 text-sm">
      <div className="container mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="max-w-xl">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-2.5 rounded-md text-primary"
              aria-label="Mr Selby overview"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Feather className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-display text-xl font-semibold tracking-tight">Mr Selby</span>
            </Link>
            <p className="mt-3 leading-6 text-foreground">
              Teacher-controlled grading support. AI output stays a draft until a teacher reviews it.
            </p>
            <p className="mt-2 leading-6 text-muted-foreground">
              Public preview: account and student-data features remain closed until the production
              service and launch policies are verified.
            </p>
          </div>

          <nav aria-label="Legal and support">
            <ul className="flex flex-wrap gap-x-2 gap-y-1 md:max-w-md md:justify-end">
              <li><Link to="/privacy" className={footerLinkClass}>Privacy</Link></li>
              <li><Link to="/terms" className={footerLinkClass}>Terms</Link></li>
              <li><Link to="/accessibility" className={footerLinkClass}>Accessibility</Link></li>
              {contactHref && (
                <li><a href={contactHref} className={footerLinkClass}>Contact</a></li>
              )}
              <li>
                <a href={REPORT_ISSUE_URL} className={footerLinkClass}>
                  Report a problem
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-border/70 pt-5 text-muted-foreground sm:flex sm:items-start sm:justify-between sm:gap-8">
          <p>Mr Selby · Public preview · 2026</p>
          <p className="mt-2 max-w-xl sm:mt-0 sm:text-right">
            The name is a personal tribute and does not imply affiliation with or endorsement by the
            teacher who inspired it.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
