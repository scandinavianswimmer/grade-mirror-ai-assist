import { useId, useState } from 'react';
import {
  Check,
  FileCheck2,
  FileWarning,
  Pencil,
  RotateCcw,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { SyntheticDemoSubmission } from '@/fixtures/syntheticDemo';

type TeacherDecision = 'needs_decision' | 'accepted' | 'edited' | 'dismissed';

interface SyntheticProofPairProps {
  assignmentTitle: string;
  strong: SyntheticDemoSubmission;
  offTopic: SyntheticDemoSubmission;
}

const INITIAL_DRAFT_NOTE =
  'You connect the keeper’s choice to uncertainty. Push the idea one step further: explain why waiting for certainty would make responsibility too late.';

const DECISION_LABEL: Record<TeacherDecision, string> = {
  needs_decision: 'Needs your decision',
  accepted: 'Accepted by the teacher',
  edited: 'Edited by the teacher',
  dismissed: 'Dismissed by the teacher',
};

const SyntheticProofPair = ({ assignmentTitle, strong, offTopic }: SyntheticProofPairProps) => {
  const editLabelId = useId();
  const [decision, setDecision] = useState<TeacherDecision>('needs_decision');
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(INITIAL_DRAFT_NOTE);
  const [draft, setDraft] = useState(INITIAL_DRAFT_NOTE);

  const chooseDecision = (nextDecision: Exclude<TeacherDecision, 'edited'>) => {
    setDecision(nextDecision);
    setEditing(false);
  };

  const beginEditing = () => {
    setDraft(note);
    setEditing(true);
  };

  const saveEdit = () => {
    const cleaned = draft.trim();
    if (!cleaned) return;
    setNote(cleaned);
    setDecision('edited');
    setEditing(false);
  };

  const resetDecision = () => {
    setNote(INITIAL_DRAFT_NOTE);
    setDraft(INITIAL_DRAFT_NOTE);
    setDecision('needs_decision');
    setEditing(false);
  };

  return (
    <section id="proof-pair" aria-labelledby="proof-pair-heading" className="scroll-mt-24">
      <div className="border-b border-border pb-4">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Fictional proof pair</p>
        <h2 id="proof-pair-heading" className="mt-2 text-3xl font-semibold sm:text-4xl">
          Useful when it can draft. Honest when it should stop.
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Both examples come from the original “Beacon Ledger” fixture. They demonstrate the intended
          interface and test conditions—not a production Gemini result, customer record, or student submission.
        </p>
      </div>

      <div className="mt-7 grid min-w-0 gap-8 xl:grid-cols-2">
        <article aria-labelledby="strong-proof-heading" className="min-w-0 border border-border bg-card/80 shadow-sm">
          <header className="flex items-start gap-3 border-b border-border bg-primary/5 p-5">
            <FileCheck2 className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-primary">On-topic fixture</p>
              <h3 id="strong-proof-heading" className="mt-1 text-2xl font-semibold">{strong.participantLabel}</h3>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{assignmentTitle}</p>
            </div>
          </header>

          <div className="p-5 sm:p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Fictional submission
            </p>
            <p className="manuscript text-base leading-8">{strong.text}</p>

            <section aria-labelledby="evidence-heading" className="mt-6 border-t border-border pt-5">
              <h4 id="evidence-heading" className="text-lg font-semibold">Evidence to inspect</h4>
              <ul className="mt-3 space-y-3 text-sm leading-6">
                <li className="border-l-2 border-accent pl-3">
                  <q>a promise made before proof</q>
                  <span className="block text-muted-foreground">Supports the claim about acting under uncertainty.</span>
                </li>
                <li className="border-l-2 border-accent pl-3">
                  <q>does not cross out the unanswered promise</q>
                  <span className="block text-muted-foreground">Supports the claim that responsibility continues after one success.</span>
                </li>
              </ul>
            </section>

            <section aria-labelledby="draft-note-heading" className="mt-6 border border-accent/60 bg-accent/10 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 id="draft-note-heading" className="text-lg font-semibold">Illustrative draft note</h4>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Written for this fixture. Not model output.</p>
                </div>
                <p className="text-sm font-semibold text-foreground" role="status" aria-live="polite">
                  {DECISION_LABEL[decision]}
                </p>
              </div>

              {editing ? (
                <div className="mt-4">
                  <label id={editLabelId} htmlFor={`${editLabelId}-field`} className="text-sm font-medium text-foreground">
                    Edit the draft note
                  </label>
                  <Textarea
                    id={`${editLabelId}-field`}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    aria-labelledby={editLabelId}
                    className="mt-2 min-h-32 bg-card text-base leading-6"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" onClick={saveEdit} disabled={!draft.trim()} className="min-h-11">
                      Save edit
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setEditing(false)} className="min-h-11">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className={`mt-4 leading-7 ${decision === 'dismissed' ? 'line-through opacity-60' : 'text-foreground'}`}>
                    {note}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Teacher decision controls">
                    <Button type="button" onClick={() => chooseDecision('accepted')} className="min-h-11 gap-2">
                      <Check className="h-4 w-4" aria-hidden="true" /> Accept
                    </Button>
                    <Button type="button" variant="outline" onClick={beginEditing} className="min-h-11 gap-2">
                      <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => chooseDecision('dismissed')} className="min-h-11 gap-2">
                      <X className="h-4 w-4" aria-hidden="true" /> Dismiss
                    </Button>
                    {decision !== 'needs_decision' ? (
                      <Button type="button" variant="ghost" onClick={resetDecision} className="min-h-11 gap-2 text-muted-foreground">
                        <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset
                      </Button>
                    ) : null}
                  </div>
                </>
              )}

              <p className="mt-4 border-t border-accent/40 pt-3 text-xs leading-5 text-muted-foreground">
                Local interface demonstration only. Reloading resets this fixture. The release rail reports
                production persistence separately.
              </p>
            </section>
          </div>
        </article>

        <article aria-labelledby="off-topic-proof-heading" className="min-w-0 border border-border bg-card/80 shadow-sm">
          <header className="flex items-start gap-3 border-b border-border bg-suggestion-soft/45 p-5">
            <FileWarning className="mt-0.5 h-6 w-6 shrink-0 text-suggestion" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-suggestion">Off-topic fixture</p>
              <h3 id="off-topic-proof-heading" className="mt-1 text-2xl font-semibold">{offTopic.participantLabel}</h3>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">Deliberately unrelated to the assignment.</p>
            </div>
          </header>

          <div className="p-5 sm:p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Fictional submission
            </p>
            <p className="manuscript text-base leading-8">{offTopic.text}</p>

            <section aria-labelledby="withheld-heading" className="mt-6 border-2 border-suggestion/55 bg-suggestion-soft/35 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-suggestion">Needs a closer look</p>
              <h4 id="withheld-heading" className="mt-2 text-2xl font-semibold">No score proposed</h4>
              <p className="mt-3 leading-7 text-foreground">
                The response does not address “The Beacon Ledger,” responsibility under uncertainty, or the
                assignment’s evidence requirement. The safe test disposition is to withhold a score and ask the
                teacher to inspect the work.
              </p>
              <dl className="mt-5 divide-y divide-suggestion/30 border-y border-suggestion/30 text-sm">
                <div className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
                  <dt className="font-medium">Rubric alignment</dt>
                  <dd className="text-muted-foreground">No assignment evidence found in this fictional response.</dd>
                </div>
                <div className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
                  <dt className="font-medium">Teacher action</dt>
                  <dd className="text-muted-foreground">Review the submission before any consequential result.</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Illustrative safe state only. This page does not claim a production grading run.
              </p>
            </section>
          </div>
        </article>
      </div>
    </section>
  );
};

export default SyntheticProofPair;
