import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Feather,
  Globe2,
  MailQuestion,
  Scale,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import PublicFooter from '@/components/public/PublicFooter';
import { cn } from '@/lib/utils';

export interface LegalPageSection {
  id: string;
  title: string;
}

interface LegalPreviewLayoutProps {
  currentPath: '/privacy' | '/terms' | '/accessibility';
  eyebrow: string;
  title: string;
  summary: string;
  sections: LegalPageSection[];
  noticeBadge?: string;
  noticeTitle?: string;
  noticeBody?: string;
  noticeIcon?: LucideIcon;
  details?: Array<{
    title: string;
    value: ReactNode;
    icon: LucideIcon;
  }>;
  children: ReactNode;
}

interface LegalSectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

const launchDetails = [
  {
    title: 'Effective date',
    value: 'Pending final legal review',
    icon: CalendarClock,
  },
  {
    title: 'Legal entity',
    value: 'To be confirmed before launch',
    icon: Building2,
  },
  {
    title: 'Privacy & support contact',
    value: 'To be published before launch',
    icon: MailQuestion,
  },
  {
    title: 'Public site',
    value: 'mrselby.app · Public preview live',
    icon: Globe2,
  },
];

const navLinkClass = (active: boolean) =>
  cn(
    'inline-flex min-h-11 items-center rounded-md border px-3 text-sm font-medium underline-offset-4 transition-colors hover:text-foreground hover:underline',
    active
      ? 'border-border bg-secondary text-foreground underline decoration-2 shadow-sm'
      : 'border-transparent text-muted-foreground',
  );

export const LegalSection = ({ id, title, children }: LegalSectionProps) => (
  <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24 border-b border-border/70 pb-10 last:border-0 last:pb-0">
    <h2 id={`${id}-heading`} className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
      {title}
    </h2>
    <div className="mt-4 space-y-4 text-[1.03rem] leading-7 text-muted-foreground">
      {children}
    </div>
  </section>
);

const LegalPreviewLayout = ({
  currentPath,
  eyebrow,
  title,
  summary,
  sections,
  noticeBadge = 'Launch preview',
  noticeTitle = 'A useful preview, not final legal text',
  noticeBody = 'This page documents the product\'s current launch approach in plain language. It must be reviewed by qualified counsel and completed with the final entity, effective date, and contact details before anyone is asked to rely on it as a legal agreement or policy.',
  noticeIcon: NoticeIcon = Scale,
  details = launchDetails,
  children,
}: LegalPreviewLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a href="#legal-main" className="skip-link">Skip to main content</a>

      <header className="border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <nav aria-label="Primary" className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to="/" className="flex min-h-11 items-center gap-2.5 rounded-md" aria-label="Mr Selby overview">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Feather className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight">Mr Selby</span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              to="/privacy"
              className={navLinkClass(currentPath === '/privacy')}
              aria-current={currentPath === '/privacy' ? 'page' : undefined}
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className={navLinkClass(currentPath === '/terms')}
              aria-current={currentPath === '/terms' ? 'page' : undefined}
            >
              Terms
            </Link>
            <Link
              to="/accessibility"
              className={navLinkClass(currentPath === '/accessibility')}
              aria-current={currentPath === '/accessibility' ? 'page' : undefined}
            >
              Accessibility
            </Link>
          </div>
        </nav>
      </header>

      <main id="legal-main" tabIndex={-1} className="flex-1">
        <section className="border-b border-border/70 px-4 py-14 sm:py-20">
          <div className="container mx-auto max-w-5xl">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to the Mr Selby overview
            </Link>

            <div className="mt-7 max-w-3xl animate-fade-up">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="border border-border/80">{noticeBadge}</Badge>
                <span className="text-sm font-medium uppercase tracking-[0.16em] text-primary">{eyebrow}</span>
              </div>
              <h1
                tabIndex={-1}
                className="mt-5 font-display text-4xl font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-6xl"
              >
                {title}
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
                {summary}
              </p>
            </div>

            <aside
              aria-labelledby="preview-notice-heading"
              className="mt-10 rounded-xl border border-accent/50 bg-accent/10 p-5 shadow-sm sm:p-6"
            >
              <div className="flex gap-4">
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/20 text-foreground">
                  <NoticeIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 id="preview-notice-heading" className="font-display text-xl font-semibold">{noticeTitle}</h2>
                  <p className="mt-2 leading-7 text-muted-foreground">
                    {noticeBody}
                  </p>
                </div>
              </div>
            </aside>

            <section aria-labelledby="launch-details-heading" className="mt-8">
              <h2 id="launch-details-heading" className="sr-only">Launch details still to be completed</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {details.map((detail) => {
                  const Icon = detail.icon;
                  return (
                    <Card key={detail.title} className="border-border/80 bg-card/90 p-5 shadow-sm">
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                      <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
                        {detail.title}
                      </h3>
                      <p className="mt-2 leading-6 text-muted-foreground">{detail.value}</p>
                    </Card>
                  );
                })}
              </div>
            </section>
          </div>
        </section>

        <div className="container mx-auto grid max-w-5xl gap-10 px-4 py-14 lg:grid-cols-[14rem_minmax(0,1fr)] lg:py-20">
          <aside aria-labelledby="contents-heading" className="lg:sticky lg:top-6 lg:self-start">
            <h2 id="contents-heading" className="font-display text-lg font-semibold">On this page</h2>
            <nav aria-label={`${title} contents`} className="mt-3">
              <ol className="space-y-1 border-l border-border pl-4">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="inline-flex min-h-9 items-center py-1 text-sm leading-5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      <span className="mr-2 font-mono text-xs text-primary" aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="min-w-0 space-y-10" aria-label={title}>
            {children}
          </article>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default LegalPreviewLayout;
