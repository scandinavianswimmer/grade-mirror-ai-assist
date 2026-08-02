import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Check, Feather, FileText, Loader2, PenLine } from 'lucide-react';

import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { loadSampleEssays } from '@/lib/sampleEssaysApi';
import { supabase } from '@/lib/supabase';

interface TeacherOnboardingProps {
  onComplete: () => void;
}

type StartingPath = 'sample' | 'own' | null;

/**
 * The first-run experience starts with grading value, not a profile survey. Optional teacher,
 * school, referral, and research questions belong in Profile after a teacher has seen the product.
 */
const TeacherOnboarding = ({ onComplete }: TeacherOnboardingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [startingPath, setStartingPath] = useState<StartingPath>(null);

  const markOnboardingComplete = async (path: Exclude<StartingPath, null>) => {
    if (!user) throw new Error('Your sign-in session is not available. Please sign in again.');

    const { error: profileError } = await supabase
      .from('users')
      .update({ onboarding_complete: true })
      .eq('id', user.id);

    if (profileError) throw profileError;

    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        onboarding_complete: true,
        onboarding_starting_path: path,
      },
    });

    if (metadataError) {
      // The database value is canonical. Keep the teacher moving and let the auth listener refresh
      // metadata on the next session instead of turning a completed setup into a dead end.
      console.error('Could not mirror onboarding completion to auth metadata:', metadataError);
    }
  };

  const startWithSample = async () => {
    if (!user || startingPath) return;
    setStartingPath('sample');

    try {
      const { assignmentId, created } = await loadSampleEssays(user.id);
      await markOnboardingComplete('sample');
      toast({
        title: 'Your sample assignment is ready',
        description: created
          ? 'Five fictional responses are waiting for a first pass—no student data needed.'
          : 'Opening the fictional assignment already in your workspace.',
      });
      onComplete();
      navigate(`/assignment/${assignmentId}`);
    } catch (error) {
      console.error('Could not open the sample assignment:', error);
      toast({
        title: 'The sample did not open',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      setStartingPath(null);
    }
  };

  const startWithOwnAssignment = async () => {
    if (!user || startingPath) return;
    setStartingPath('own');

    try {
      await markOnboardingComplete('own');
      onComplete();
      navigate('/create-assignment');
    } catch (error) {
      console.error('Could not complete first-run setup:', error);
      toast({
        title: 'Setup did not finish',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      setStartingPath(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#onboarding-main" className="skip-link">Skip to setup</a>
      <header className="border-b border-border/80 bg-card/60">
        <div className="container mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Feather className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight">Mr Selby</span>
        </div>
      </header>

      <main id="onboarding-main" tabIndex={-1} className="container mx-auto max-w-6xl px-4 py-10 sm:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(32rem,1.1fr)]">
          <section aria-labelledby="onboarding-heading">
            <p className="text-sm font-semibold text-primary">Start with one paper</p>
            <h1 id="onboarding-heading" className="mt-3 max-w-xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              See the first pass before setting anything up.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Open a fictional assignment, check a drafted score and margin note, then change or
              approve it. Your decisions—not a setup survey—are what teach Mr Selby your feedback style.
            </p>

            <ol className="mt-8 space-y-5" aria-label="Sample review steps">
              {[
                ['1', 'Open the assignment', 'The passage, rubric, and five responses are already included.'],
                ['2', 'Review a first pass', 'Check the score, evidence, and wording against the paper.'],
                ['3', 'Keep the last word', 'Accept, edit, or dismiss each note before you approve the result.'],
              ].map(([number, title, detail]) => (
                <li key={number} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-primary/30 font-mono text-sm font-semibold text-primary">
                    {number}
                  </span>
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="mt-1 block leading-6 text-muted-foreground">{detail}</span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button className="min-h-12 gap-2 px-5" onClick={startWithSample} disabled={startingPath !== null}>
                {startingPath === 'sample' ? (
                  <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Opening sample…</>
                ) : (
                  <><BookOpen className="h-4 w-4" aria-hidden="true" /> Review the sample assignment</>
                )}
              </Button>
              <Button
                variant="outline"
                className="min-h-12 px-5"
                onClick={startWithOwnAssignment}
                disabled={startingPath !== null}
              >
                {startingPath === 'own' ? 'Opening…' : 'Start with my own assignment'}
              </Button>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground" role="status" aria-live="polite">
              The sample is original fictional material. It does not contain student, school, or contact data.
            </p>
          </section>

          <Card className="overflow-hidden border-border bg-card shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <p className="text-sm font-semibold">Responsibility in “The Beacon Ledger”</p>
                <p className="mt-0.5 text-sm text-muted-foreground">Fictional sample · 1 of 5 papers</p>
              </div>
              <span className="rounded-md bg-suggestion-soft px-2.5 py-1 text-xs font-semibold text-suggestion">
                Ready for review
              </span>
            </div>
            <CardContent className="grid gap-0 p-0 md:grid-cols-[minmax(0,1.25fr)_minmax(15rem,0.75fr)]">
              <article className="border-b border-border p-6 md:border-b-0 md:border-r">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Synthetic learner 01
                </div>
                <h2 className="mt-5 font-display text-2xl font-semibold">A promise made before proof</h2>
                <p className="mt-5 font-serif text-[1.02rem] leading-8 text-foreground/90">
                  The beacon and ledger show that responsibility begins before anyone can promise a
                  good outcome. The keeper rejects the council&apos;s demand for certainty by calling
                  the signal “a promise made before proof.”
                </p>
                <p className="mt-4 border-l-2 border-accent bg-suggestion-soft/60 py-2 pl-4 font-serif text-[1.02rem] leading-8">
                  The empty line prevents one success from erasing the boat that is still missing.
                </p>
              </article>

              <aside aria-label="Example drafted feedback" className="bg-background/45 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <PenLine className="h-4 w-4" aria-hidden="true" /> Draft margin note
                </div>
                <p className="mt-4 leading-7">
                  You connect the ledger&apos;s empty line to responsibility that continues after a visible success.
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Evidence: the keeper closes the ledger without crossing out the unanswered promise.
                </p>
                <div className="mt-5 flex flex-wrap gap-2" aria-label="Example teacher decisions">
                  <span className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" /> Accept
                  </span>
                  <span className="inline-flex min-h-9 items-center rounded-md border border-border bg-card px-3 py-2 text-sm font-medium">Edit</span>
                  <span className="inline-flex min-h-9 items-center rounded-md border border-border bg-card px-3 py-2 text-sm font-medium">Dismiss</span>
                </div>
              </aside>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TeacherOnboarding;
