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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  FICTIONAL_STACK_PROGRESS,
  fictionalPreviewPapers,
  movePreviewPaperIndex,
  PUBLIC_PREVIEW_APPROVAL_MESSAGE,
  PUBLIC_PREVIEW_EXPORT_MESSAGE,
  rubricCriteria,
} from './teacherDeskPreviewData';

type PreviewTab = 'rubric' | 'feedback';
type PreviewActionState = 'draft' | 'approved' | 'exported';
type Decision = 'pending' | 'accepted' | 'edited' | 'dismissed';

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
  const paperPanelId = useId();
  const [activeTab, setActiveTab] = useState<PreviewTab>('rubric');
  const [activeNote, setActiveNote] = useState(1);
  const [paperIndex, setPaperIndex] = useState(0);
  const [actionState, setActionState] = useState<PreviewActionState>('draft');
  const [previewMessage, setPreviewMessage] = useState('');
  const paper = fictionalPreviewPapers[paperIndex];
  const totalScore = paper.rubricScores.reduce((total, score) => total + score, 0);
  const previousPaper = fictionalPreviewPapers[paperIndex - 1];
  const nextPaper = fictionalPreviewPapers[paperIndex + 1];

  const movePaper = (direction: -1 | 1) => {
    const nextIndex = movePreviewPaperIndex(paperIndex, direction);
    if (nextIndex === paperIndex) return;
    setPaperIndex(nextIndex);
    setActiveNote(1);
    setActionState('draft');
    setPreviewMessage('');
  };

  const runPreviewAction = () => {
    if (actionState === 'draft') {
      setActionState('approved');
      setPreviewMessage(PUBLIC_PREVIEW_APPROVAL_MESSAGE);
      return;
    }
    setActionState('exported');
    setPreviewMessage(PUBLIC_PREVIEW_EXPORT_MESSAGE);
  };

  const previewActionLabel = actionState === 'draft'
    ? 'Approve feedback'
    : actionState === 'approved'
      ? 'Export feedback'
      : 'Export again';

  return (
    <section
      id="sample-assignment"
      aria-labelledby="sample-assignment-title"
      aria-roledescription="carousel"
      className="scroll-mt-24 overflow-hidden rounded-lg border border-border bg-card shadow-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/80 px-3 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p id="sample-assignment-title" className="truncate font-semibold">
            Argument essay <span className="font-normal text-muted-foreground">· English 10</span>
          </p>
        </div>

        <div
          className="order-3 flex w-full items-center justify-between gap-2 sm:order-none sm:w-auto sm:justify-center"
          role="group"
          aria-label="Fictional sample queue"
        >
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={previousPaper ? `Previous fictional paper: ${previousPaper.title}` : 'Previous fictional paper'}
            aria-controls={paperPanelId}
            className="h-11 w-11"
            disabled={!previousPaper}
            onClick={() => movePaper(-1)}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="metric text-xs text-muted-foreground sm:text-sm" aria-live="polite" aria-atomic="true">
            Sample {paperIndex + 1} of {fictionalPreviewPapers.length}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={nextPaper ? `Next fictional paper: ${nextPaper.title}` : 'Next fictional paper'}
            aria-controls={paperPanelId}
            className="h-11 w-11"
            disabled={!nextPaper}
            onClick={() => movePaper(1)}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <Button
          type="button"
          size="sm"
          className="min-h-11"
          onClick={runPreviewAction}
        >
          {previewActionLabel}
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-2 text-xs text-muted-foreground sm:px-6">
        <span>Fictional stack snapshot · {FICTIONAL_STACK_PROGRESS.reviewed} of {FICTIONAL_STACK_PROGRESS.total} reviewed</span>
        <span className={`inline-flex items-center gap-1.5 font-medium ${actionState === 'draft' && paper.reviewStatus === 'needs-look' ? 'text-suggestion' : 'text-primary'}`}>
          {actionState === 'approved' || actionState === 'exported' ? (
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          ) : paper.reviewStatus === 'needs-look' ? (
            <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {actionState === 'exported'
            ? 'Export simulated'
            : actionState === 'approved'
              ? 'Approved in preview'
              : paper.reviewStatus === 'needs-look'
                ? 'Needs a closer look'
                : 'Ready for review'}
        </span>
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Showing fictional sample {paperIndex + 1} of {fictionalPreviewPapers.length}: {paper.title} by {paper.student}.
      </p>

      {previewMessage && (
        <p className="border-b border-border/70 bg-primary/5 px-4 py-3 text-sm text-foreground" role="status">
          {previewMessage}
        </p>
      )}

      <div
        id={paperPanelId}
        role="group"
        aria-roledescription="slide"
        aria-label={`Fictional paper ${paperIndex + 1} of ${fictionalPreviewPapers.length}`}
        className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.8fr)]"
      >
        <article className="min-w-0 border-b border-border bg-card px-5 py-7 lg:border-b-0 lg:border-r sm:px-8 sm:py-9">
          <header className="mb-7 border-b border-border/60 pb-5">
            <h3 className="font-display text-2xl font-semibold">{paper.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{paper.student} · fictional student</p>
          </header>

          <div className="manuscript max-w-3xl space-y-5 text-[1rem] leading-8">
            {paper.paragraphs.map((paragraph, index) => {
              const noteId = index + 1;
              return (
                <p key={`${paper.id}-paragraph-${noteId}`}>
                  {paragraph.lead}{' '}
                  <button
                    type="button"
                    className={highlightClass(activeNote === noteId)}
                    aria-pressed={activeNote === noteId}
                    onClick={() => setActiveNote(noteId)}
                  >
                    {paragraph.highlight}
                    <sup className="metric ml-1 text-[0.65em]">{noteId}</sup>
                  </button>
                </p>
              );
            })}
          </div>

          <p className="metric mt-8 border-t border-border/60 pt-4 text-xs text-muted-foreground">{paper.wordCount} words</p>
        </article>

        <aside aria-label="Fictional rubric and feedback" className="min-w-0 bg-background/55">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PreviewTab)}>
            <TabsList aria-label="Preview details" className="grid h-auto w-full grid-cols-2 rounded-none border-b border-border bg-transparent p-0">
              <TabsTrigger value="rubric" className="min-h-12 rounded-none border-b-2 border-transparent px-4 text-sm font-semibold shadow-none data-[state=active]:border-primary data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-none">
                Rubric
              </TabsTrigger>
              <TabsTrigger value="feedback" className="min-h-12 rounded-none border-b-2 border-transparent px-4 text-sm font-semibold shadow-none data-[state=active]:border-primary data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-none">
                Draft feedback
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rubric" className="m-0 p-5">
              <div className="divide-y divide-border/70">
                {rubricCriteria.map((criterion, index) => (
                  <div key={criterion.name} className="grid grid-cols-[1fr_auto] gap-3 py-3 first:pt-0">
                    <div>
                      <p className="text-sm font-semibold">{criterion.name}</p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{criterion.detail}</p>
                    </div>
                    <span className="metric self-center rounded-md border border-border bg-card px-2.5 py-1.5 text-sm">
                      {paper.rubricScores[index]} / 4
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-baseline justify-between border-t border-foreground/20 pt-4">
                <span className="font-display text-lg font-semibold">Total</span>
                <span className="metric text-xl font-semibold text-primary">{totalScore} / 20</span>
              </div>
              <div className="mt-5 border-t border-border/70 pt-4">
                <p className="text-sm font-semibold">Draft summary</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {paper.draftSummary}
                </p>
              </div>
            </TabsContent>
            <TabsContent value="feedback" className="m-0 p-5">
              <p className="text-sm font-semibold">Margin notes</p>
              <ul className="mt-3 space-y-2">
                {paper.notes.map((note) => (
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
            </TabsContent>
          </Tabs>
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
        <p className="mt-1 text-xs text-muted-foreground">Fictional paper · passage-based draft</p>
      </div>

      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(17rem,0.72fr)]">
        <div className="border-b border-border/70 p-5 md:border-b-0 md:border-r sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-muted-foreground">Passage in the paper</p>
          <blockquote className="mt-4 border-l-2 border-suggestion pl-4 font-display text-xl leading-8 text-foreground/90">
            “If we want a better future, we need to slow down long enough to see what we are paying for.”
          </blockquote>
          <div className="mt-5 flex items-start gap-3 rounded-md bg-suggestion-soft p-4 text-sm leading-6 text-foreground">
            <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-suggestion" aria-hidden="true" />
            <p><strong>Why this draft:</strong> the note is grounded in the assignment and this highlighted sentence; the proposed rubric scores remain visible beside the paper.</p>
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
