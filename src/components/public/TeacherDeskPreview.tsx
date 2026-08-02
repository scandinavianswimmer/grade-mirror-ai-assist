import { useId, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  FileCheck2,
  Pencil,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type PreviewTab = 'rubric' | 'feedback';
type Decision = 'pending' | 'accepted' | 'edited' | 'dismissed';

const rubric = [
  { name: 'Thesis & focus', detail: 'Clear, arguable, and well focused', score: '4 / 4' },
  { name: 'Evidence & support', detail: 'Relevant and sufficient evidence', score: '3 / 4' },
  { name: 'Organization', detail: 'Logical structure and flow', score: '3 / 4' },
  { name: 'Analysis & reasoning', detail: 'Explains why the evidence matters', score: '3 / 4' },
  { name: 'Style & conventions', detail: 'Effective style; clear mechanics', score: '3 / 4' },
];

const notes = [
  { id: 1, label: 'Strong claim and preview.', tone: 'praise' },
  { id: 2, label: 'Good example. Add a source?', tone: 'question' },
  { id: 3, label: 'Insightful connection.', tone: 'praise' },
  { id: 4, label: 'Clear conclusion. Consider a specific next step.', tone: 'suggestion' },
] as const;

const noteToneClass = {
  praise: 'bg-praise-soft text-praise',
  question: 'bg-question-soft text-question',
  suggestion: 'bg-suggestion-soft text-suggestion',
};

const highlightClass = (active: boolean) => (
  `rounded-[3px] border-b-2 border-suggestion bg-suggestion-soft px-0.5 text-left transition-colors ${
    active ? 'outline outline-2 outline-offset-2 outline-ring' : 'hover:bg-suggestion-soft/70'
  }`
);

export const TeacherDeskPreview = () => {
  const tabsId = useId();
  const [activeTab, setActiveTab] = useState<PreviewTab>('rubric');
  const [activeNote, setActiveNote] = useState(1);
  const [previewMessage, setPreviewMessage] = useState('');

  return (
    <section
      id="sample-assignment"
      aria-labelledby="sample-assignment-title"
      className="scroll-mt-24 overflow-hidden rounded-lg border border-border bg-card shadow-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/80 px-3 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p id="sample-assignment-title" className="truncate font-semibold">
            Argument essay <span className="font-normal text-muted-foreground">· English 10</span>
          </p>
        </div>

        <div className="order-3 flex w-full items-center justify-between gap-2 sm:order-none sm:w-auto sm:justify-center">
          <Button variant="outline" size="icon" aria-label="Previous fictional paper" className="h-11 w-11">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="metric text-xs text-muted-foreground sm:text-sm">18 of 27 reviewed</span>
          <Button variant="outline" size="icon" aria-label="Next fictional paper" className="h-11 w-11">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <Button
          size="sm"
          className="min-h-11"
          onClick={() => setPreviewMessage('Preview only: nothing was exported and no student data was used.')}
        >
          Approve &amp; export
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-2 text-xs text-muted-foreground sm:px-6">
        <span>Fictional sample · public preview</span>
        <span className="inline-flex items-center gap-1.5 font-medium text-suggestion">
          <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
          3 need a closer look
        </span>
      </div>

      {previewMessage && (
        <p className="border-b border-border/70 bg-primary/5 px-4 py-3 text-sm text-foreground" role="status">
          {previewMessage}
        </p>
      )}

      <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.8fr)]">
        <article className="min-w-0 border-b border-border bg-card px-5 py-7 lg:border-b-0 lg:border-r sm:px-8 sm:py-9">
          <header className="mb-7 border-b border-border/60 pb-5">
            <h3 className="font-display text-2xl font-semibold">The Price of Convenience</h3>
            <p className="mt-1 text-sm text-muted-foreground">Jordan Lee · fictional student</p>
          </header>

          <div className="manuscript max-w-3xl space-y-5 text-[1rem] leading-8">
            <p>
              Convenience is so common that it is easy to ignore its cost. Each small choice to save time
              or effort often shifts the burden somewhere else.{' '}
              <button
                type="button"
                className={highlightClass(activeNote === 1)}
                aria-pressed={activeNote === 1}
                onClick={() => setActiveNote(1)}
              >
                If we want a better future, we need to slow down long enough to see what we are paying for.
                <sup className="metric ml-1 text-[0.65em]">1</sup>
              </button>
            </p>
            <p>
              Consider single-use plastics. They are light and cheap, but after a few minutes of use they
              can remain in landfills and oceans for years.{' '}
              <button
                type="button"
                className={highlightClass(activeNote === 2)}
                aria-pressed={activeNote === 2}
                onClick={() => setActiveNote(2)}
              >
                The ease of throwing something away becomes someone else&apos;s problem to clean up.
                <sup className="metric ml-1 text-[0.65em]">2</sup>
              </button>
            </p>
            <p>
              Technology works the same way. Streaming and overnight shipping feel effortless, while the
              energy and labor behind them stay out of sight.{' '}
              <button
                type="button"
                className={highlightClass(activeNote === 3)}
                aria-pressed={activeNote === 3}
                onClick={() => setActiveNote(3)}
              >
                The hidden costs are built into the systems we use every day.
                <sup className="metric ml-1 text-[0.65em]">3</sup>
              </button>
            </p>
            <p>
              Progress is not only about making life easier for us.{' '}
              <button
                type="button"
                className={highlightClass(activeNote === 4)}
                aria-pressed={activeNote === 4}
                onClick={() => setActiveNote(4)}
              >
                It is also about making life better for more people, for longer.
                <sup className="metric ml-1 text-[0.65em]">4</sup>
              </button>
            </p>
          </div>

          <p className="metric mt-8 border-t border-border/60 pt-4 text-xs text-muted-foreground">487 words</p>
        </article>

        <aside aria-label="Fictional rubric and feedback" className="min-w-0 bg-background/55">
          <div role="tablist" aria-label="Preview details" className="grid grid-cols-2 border-b border-border">
            {(['rubric', 'feedback'] as const).map((tab) => {
              const selected = activeTab === tab;
              const label = tab === 'rubric' ? 'Rubric' : 'Draft feedback';
              return (
                <button
                  key={tab}
                  id={`${tabsId}-${tab}-tab`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`${tabsId}-${tab}-panel`}
                  className={`min-h-12 border-b-2 px-4 text-sm font-semibold transition-colors ${
                    selected
                      ? 'border-primary bg-card text-primary'
                      : 'border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {activeTab === 'rubric' ? (
            <div
              id={`${tabsId}-rubric-panel`}
              role="tabpanel"
              aria-labelledby={`${tabsId}-rubric-tab`}
              className="p-5"
            >
              <div className="divide-y divide-border/70">
                {rubric.map((criterion) => (
                  <div key={criterion.name} className="grid grid-cols-[1fr_auto] gap-3 py-3 first:pt-0">
                    <div>
                      <p className="text-sm font-semibold">{criterion.name}</p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{criterion.detail}</p>
                    </div>
                    <span className="metric self-center rounded-md border border-border bg-card px-2.5 py-1.5 text-sm">
                      {criterion.score}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-baseline justify-between border-t border-foreground/20 pt-4">
                <span className="font-display text-lg font-semibold">Total</span>
                <span className="metric text-xl font-semibold text-primary">16 / 20</span>
              </div>
              <div className="mt-5 border-t border-border/70 pt-4">
                <p className="text-sm font-semibold">Draft summary</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  A clear argument with relevant examples. The final paragraph could give readers a more
                  specific action to consider.
                </p>
              </div>
            </div>
          ) : (
            <div
              id={`${tabsId}-feedback-panel`}
              role="tabpanel"
              aria-labelledby={`${tabsId}-feedback-tab`}
              className="p-5"
            >
              <p className="text-sm font-semibold">Margin notes</p>
              <ul className="mt-3 space-y-2">
                {notes.map((note) => (
                  <li key={note.id}>
                    <button
                      type="button"
                      aria-pressed={activeNote === note.id}
                      onClick={() => setActiveNote(note.id)}
                      className={`flex min-h-11 w-full items-start gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                        activeNote === note.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/70'
                      }`}
                    >
                      <span className={`metric mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${noteToneClass[note.tone]}`}>
                        {note.id}
                      </span>
                      <span>{note.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-5 rounded-md border border-border bg-card p-3 text-xs leading-5 text-muted-foreground">
                Each note points back to a passage in the paper. The teacher can accept, edit, or dismiss it.
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
};

export const TeacherControlProof = () => {
  const [decision, setDecision] = useState<Decision>('pending');
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState('Strong opening that establishes the issue and its stakes.');
  const [draft, setDraft] = useState(comment);

  const saveEdit = () => {
    const nextComment = draft.trim();
    if (!nextComment) return;
    setComment(nextComment);
    setDecision('edited');
    setEditing(false);
  };

  const decisionLabel = {
    pending: 'Waiting for your decision',
    accepted: 'Accepted by you',
    edited: 'Edited by you',
    dismissed: 'Dismissed by you',
  }[decision];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border/70 bg-background/70 px-5 py-4">
        <p className="text-sm font-semibold">Margin note 1</p>
        <p className="mt-1 text-xs text-muted-foreground">Fictional paper · Thesis &amp; focus</p>
      </div>

      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(17rem,0.72fr)]">
        <div className="border-b border-border/70 p-5 md:border-b-0 md:border-r sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-muted-foreground">Passage in the paper</p>
          <blockquote className="mt-4 border-l-2 border-suggestion pl-4 font-display text-xl leading-8 text-foreground/90">
            “If we want a better future, we need to slow down long enough to see what we are paying for.”
          </blockquote>
          <div className="mt-5 flex items-start gap-3 rounded-md bg-suggestion-soft p-4 text-sm leading-6 text-foreground">
            <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-suggestion" aria-hidden="true" />
            <p><strong>Why this draft:</strong> the note is tied to the assignment, the thesis criterion, and this highlighted sentence.</p>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-muted-foreground">Draft note</p>
            <span className="text-xs font-medium text-primary" aria-live="polite">{decisionLabel}</span>
          </div>

          {editing ? (
            <div className="mt-4">
              <label htmlFor="public-note-edit" className="sr-only">Edit the fictional margin note</label>
              <Textarea
                id="public-note-edit"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="min-h-28 bg-background text-sm leading-6"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" className="min-h-11" onClick={saveEdit}>Save change</Button>
                <Button size="sm" variant="ghost" className="min-h-11" onClick={() => { setDraft(comment); setEditing(false); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <p className={`mt-4 text-base leading-7 ${decision === 'dismissed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                {comment}
              </p>
              <div
                className="mt-6 flex flex-wrap gap-2"
                role="group"
                aria-label="Decide what to do with the fictional note"
              >
                <Button
                  size="sm"
                  className="min-h-11"
                  variant={decision === 'accepted' ? 'default' : 'outline'}
                  onClick={() => setDecision('accepted')}
                >
                  <Check className="h-4 w-4" aria-hidden="true" /> Accept
                </Button>
                <Button
                  size="sm"
                  className="min-h-11"
                  variant="outline"
                  onClick={() => { setDraft(comment); setEditing(true); }}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="min-h-11 text-muted-foreground"
                  onClick={() => setDecision('dismissed')}
                >
                  <X className="h-4 w-4" aria-hidden="true" /> Dismiss
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
