import { Link } from 'react-router-dom';
import {
  Accessibility,
  Check,
  CircleCheckBig,
  FileUp,
  Feather,
  FolderOutput,
  NotebookPen,
  PenLine,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PublicFooter from '@/components/public/PublicFooter';
import { TeacherControlProof, TeacherDeskPreview } from '@/components/public/TeacherDeskPreview';

const workflow = [
  {
    title: 'Add student work',
    description: 'Bring together the assignment, rubric, and student files.',
    icon: FileUp,
  },
  {
    title: 'Review drafts',
    description: 'Inspect proposed rubric scores and the passages behind each margin note.',
    icon: PenLine,
  },
  {
    title: 'Approve',
    description: 'Accept, rewrite, or dismiss each margin note before approval.',
    icon: CircleCheckBig,
  },
  {
    title: 'Export',
    description: 'Download approved feedback for your existing classroom workflow.',
    icon: FolderOutput,
  },
];

const trustPoints = [
  {
    title: 'Fictional by default',
    description: 'Jordan’s paper, rubric, and score on this page are illustrative. No student data is used.',
    icon: NotebookPen,
  },
  {
    title: 'Teacher decisions stay visible',
    description: 'A draft is ready for review. Approved does not mean returned, published, or sent to a student.',
    icon: Check,
  },
  {
    title: 'Launch limits stay visible too',
    description: 'Protected accounts and student-data features remain closed until the production service is verified.',
    icon: ShieldCheck,
  },
];

const anchorClass =
  'inline-flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors hover:bg-muted hover:decoration-foreground';

const Pitch = () => (
  <div className="min-h-screen bg-background">
    <a href="#pitch-main" className="skip-link">Skip to main content</a>

    <header className="sticky top-0 z-50 border-b border-border/80 bg-background">
      <nav aria-label="Primary" className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link
          to="/"
          aria-label="Mr Selby overview"
          className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-md text-primary"
        >
          <Feather className="h-7 w-7" aria-hidden="true" />
          <span className="font-display text-2xl font-semibold tracking-tight text-foreground">Mr Selby</span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <a href="#how-it-works" className={anchorClass}>How it works</a>
          <a href="#teacher-control" className={anchorClass}>Teacher control</a>
          <a href="#the-name" className={anchorClass}>The name</a>
        </div>

        <Button asChild variant="outline" className="hidden min-h-11 shrink-0 bg-card text-sm sm:inline-flex">
          <a href="#sample-assignment">Review a sample assignment</a>
        </Button>
      </nav>
    </header>

    <main id="pitch-main" tabIndex={-1}>
      <section aria-labelledby="pitch-heading" className="pb-14 pt-14 sm:pb-20 sm:pt-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-4xl">
            <h1 id="pitch-heading" className="max-w-4xl font-display text-4xl font-semibold leading-[1.03] tracking-[-0.025em] text-foreground sm:text-6xl lg:text-7xl">
              Get through the essay stack without giving away the part that matters.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Mr Selby drafts rubric scores and margin notes. You review, revise, and approve the work.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="sm:min-w-56">
                <a href="#sample-assignment">Review a sample assignment</a>
              </Button>
              <a href="#teacher-control" className="inline-flex min-h-11 items-center justify-center px-4 font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary">
                See a paper in review
              </a>
            </div>
          </div>

          <div className="mt-12 sm:mt-16">
            <TeacherDeskPreview />
          </div>
        </div>
      </section>

      <section id="how-it-works" aria-labelledby="workflow-heading" className="scroll-mt-20 border-y border-border/80 bg-card/45 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <h2 id="workflow-heading" className="max-w-xl font-display text-3xl font-semibold leading-tight sm:text-5xl">
            A first pass, ready for your review.
          </h2>

          <ol className="mt-12 grid gap-8 md:grid-cols-4 md:gap-6">
            {workflow.map((step, index) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="relative border-t border-border/70 pt-6 md:border-t-0 md:pt-0 md:after:absolute md:after:left-[calc(50%+2.8rem)] md:after:top-[3.2rem] md:after:w-[calc(100%-5.6rem)] md:after:border-t md:after:border-dashed md:after:border-border md:after:content-[''] md:last:after:hidden"
                >
                  <span className="metric text-sm text-muted-foreground">{index + 1}.</span>
                  <span className="mt-3 grid h-14 w-14 place-items-center rounded-md border border-primary/35 bg-background text-primary">
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-sans text-base font-semibold tracking-normal text-primary">{step.title}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{step.description}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section id="teacher-control" aria-labelledby="control-heading" className="scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:items-start lg:gap-14">
            <div className="lg:sticky lg:top-28">
              <h2 id="control-heading" className="font-display text-3xl font-semibold leading-tight sm:text-5xl">
                The draft is a starting point, not the decision.
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Mr Selby shows draft rubric scores beside the paper and points each margin note back to a
                passage. Accept it, rewrite it, or dismiss it before you approve the assignment.
              </p>
              <div className="mt-8 border-l-2 border-primary pl-5 text-sm leading-6 text-muted-foreground">
                <p className="font-semibold text-foreground">Optional automatic approval is off by default.</p>
                <p className="mt-1">
                  If a teacher explicitly turns it on for eligible work, the result is labeled
                  <strong className="font-semibold text-foreground"> Approved automatically</strong> and
                  <strong className="font-semibold text-foreground"> You turned this on</strong>.
                </p>
              </div>
            </div>

            <TeacherControlProof />
          </div>
        </div>
      </section>

      <section id="the-name" aria-labelledby="name-heading" className="scroll-mt-20 border-y border-border/80 bg-card/55 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 md:grid-cols-[14rem_minmax(0,1fr)] md:items-center md:gap-16">
          <div className="flex items-end gap-3 text-suggestion" aria-hidden="true">
            <span className="grid h-28 w-28 -rotate-3 place-items-center rounded-md border border-suggestion/35 bg-background shadow-sm">
              <NotebookPen className="h-14 w-14" strokeWidth={1.35} />
            </span>
            <span className="mb-2 grid h-16 w-16 rotate-6 place-items-center rounded-md border border-primary/30 bg-background text-primary shadow-sm">
              <Feather className="h-8 w-8" strokeWidth={1.35} />
            </span>
          </div>

          <div className="max-w-3xl">
            <h2 id="name-heading" className="font-display text-3xl font-semibold leading-tight sm:text-5xl">
              Named for the standard a good teacher sets.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Mr Selby is named in gratitude for one of the founder&apos;s favorite teachers. The care he
              brought to teaching, assignments, and grading set the standard behind this product.
            </p>
            <p className="mt-4 text-lg leading-8 text-foreground">
              Assignment, feedback, and grade should feel like parts of the same lesson.
            </p>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              The name is a personal tribute, not a claim of affiliation or endorsement.
            </p>
          </div>
        </div>
      </section>

      <section id="trust" aria-labelledby="trust-heading" className="scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <h2 id="trust-heading" className="font-display text-3xl font-semibold leading-tight sm:text-5xl">
              Try the desk without bringing student data.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              This public preview shows the review experience with fictional work. It does not accept
              accounts, classroom records, or student files while the protected service is being verified.
            </p>
          </div>

          <div className="mt-10 divide-y divide-border/80 border-y border-border/80">
            {trustPoints.map((point) => {
              const Icon = point.icon;
              return (
                <div key={point.title} className="grid gap-3 py-6 sm:grid-cols-[2rem_13rem_minmax(0,1fr)] sm:items-start sm:gap-5">
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  <h3 className="font-sans text-base font-semibold tracking-normal">{point.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{point.description}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-6 border-b border-border/80 pb-12 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              <Link to="/privacy" className={anchorClass}>Privacy preview</Link>
              <Link to="/terms" className={anchorClass}>Terms preview</Link>
              <Link to="/accessibility" className={anchorClass}>
                <Accessibility className="mr-2 h-4 w-4" aria-hidden="true" /> Accessibility
              </Link>
            </div>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href="#sample-assignment">Review a sample assignment</a>
            </Button>
          </div>
        </div>
      </section>
    </main>

    <PublicFooter />
  </div>
);

export default Pitch;
