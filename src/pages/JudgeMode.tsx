import { ArrowLeft, Clock3, Feather, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import PublicFooter from '@/components/public/PublicFooter';
import ReleaseProofRail from '@/components/judge/ReleaseProofRail';
import SyntheticProofPair from '@/components/judge/SyntheticProofPair';
import TeacherTestQuestion from '@/components/judge/TeacherTestQuestion';
import { SYNTHETIC_DEMO_FIXTURE } from '@/fixtures/syntheticDemo';
import { buildReleaseProof, type ReleaseProof } from '@/lib/releaseProof';

interface JudgeModeProps {
  proof?: ReleaseProof;
}

const DEFAULT_RELEASE_PROOF = buildReleaseProof();

const TEACHERS_TEST_QUESTIONS = [
  {
    title: 'Does the draft follow the assignment and rubric?',
    inspection: 'Compare the strong response with the assignment’s claim, evidence, and reasoning requirements.',
  },
  {
    title: 'Can it point to evidence in the paper?',
    inspection: 'Inspect the two exact passages and the illustrative margin note attached to the strong response.',
  },
  {
    title: 'Does it stop when the work should not be graded?',
    inspection: 'Open the deliberately off-topic response and confirm that the interface proposes no score.',
  },
  {
    title: 'Can the teacher revise every margin note before approval?',
    inspection: 'Accept, edit, or dismiss the fictional draft note; then compare that demo with the release proof rail.',
  },
] as const;

const JudgeMode = ({ proof = DEFAULT_RELEASE_PROOF }: JudgeModeProps) => {
  const strong = SYNTHETIC_DEMO_FIXTURE.submissions.find(
    (submission) => submission.scenario === 'strong_analysis',
  );
  const offTopic = SYNTHETIC_DEMO_FIXTURE.submissions.find(
    (submission) => submission.scenario === 'off_topic',
  );

  if (!strong || !offTopic) {
    throw new Error('The Teacher\'s Test requires the canonical strong and off-topic fixtures.');
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a href="#judge-main" className="skip-link">Skip to main content</a>

      <header className="border-b border-border/80 bg-background/95">
        <nav aria-label="Judge Mode" className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to="/" className="flex min-h-11 items-center gap-2.5 rounded-md" aria-label="Mr Selby overview">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <Feather className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight">Mr Selby</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Judge Mode</span>
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-foreground underline-offset-4 hover:bg-muted hover:underline"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Product overview
            </Link>
          </div>
        </nav>
      </header>

      <main id="judge-main" tabIndex={-1} className="flex-1">
        <section className="border-b border-border px-4 py-12 sm:py-16">
          <div className="container mx-auto max-w-6xl">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                The Teacher’s Test
              </p>
              <h1 tabIndex={-1} className="mt-3 text-5xl font-semibold tracking-tight sm:text-7xl">
                Four questions before you trust a grading draft.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">
                This public path shows how Mr Selby is meant to support teacher judgment. The student work,
                assignment, and draft note below are fictional. Production facts appear only in the release rail.
              </p>
            </div>

            <aside
              aria-labelledby="synthetic-boundary-heading"
              className="mt-8 flex max-w-4xl items-start gap-4 border border-primary/35 bg-primary/5 p-5"
            >
              <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h2 id="synthetic-boundary-heading" className="text-xl font-semibold">Original fictional fixture</h2>
                <p className="mt-2 leading-7 text-muted-foreground">
                  {SYNTHETIC_DEMO_FIXTURE.marker}. It contains no real learner, school, contact detail, account,
                  backend identifier, customer result, or production trace.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <div className="container mx-auto grid min-w-0 max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:py-14">
          <div className="min-w-0 space-y-14">
            <section aria-labelledby="questions-heading">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <Clock3 className="h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <h2 id="questions-heading" className="text-3xl font-semibold">A 90-second inspection path</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    The interface demonstrates the questions. The release rail states what production proof was captured.
                  </p>
                </div>
              </div>
              <ol className="mt-6">
                {TEACHERS_TEST_QUESTIONS.map((question, index) => (
                  <TeacherTestQuestion
                    key={question.title}
                    number={index + 1}
                    title={question.title}
                    inspection={question.inspection}
                  />
                ))}
              </ol>
            </section>

            <SyntheticProofPair
              assignmentTitle={SYNTHETIC_DEMO_FIXTURE.assignment.title}
              strong={strong}
              offTopic={offTopic}
            />

            <section aria-labelledby="boundary-heading" className="border-y border-border py-7">
              <h2 id="boundary-heading" className="text-3xl font-semibold">What this public page can—and cannot—show</h2>
              <div className="mt-5 grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold text-primary">It can show</h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground marker:text-primary">
                    <li>the intended rubric, evidence, withholding, and teacher-control interface;</li>
                    <li>the exact original fixture used for a privacy-safe judge walkthrough; and</li>
                    <li>allow-listed release metadata deliberately embedded in this public build.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-suggestion">It cannot substitute for</h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground marker:text-suggestion">
                    <li>a working protected judge account;</li>
                    <li>production Gemini, Google Cloud, trace, persistence, user, or revenue evidence; or</li>
                    <li>the private source records used to verify a submission claim.</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>

          <ReleaseProofRail proof={proof} />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default JudgeMode;
