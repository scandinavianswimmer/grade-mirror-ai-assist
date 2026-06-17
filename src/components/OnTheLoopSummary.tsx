import { Bot, Inbox, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import type { OnTheLoopSummary } from '@/lib/onTheLoop';

// The headline "monitoring console" surface: aiTA grades on-the-loop — it publishes the
// high-confidence work unattended and only routes exceptions to the teacher. This calm strip
// makes that story legible on camera: "N graded · M auto-finalized by aiTA · K need review".

interface Props {
  summary: OnTheLoopSummary | null;
  loading?: boolean;
  className?: string;
  // Optional deep-link target for the "need review" stat (e.g. a filtered list).
  reviewHref?: string;
}

const Stat = ({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Bot;
  value: string | number;
  label: string;
  tone: string;
}) => (
  <div className="flex items-center gap-3">
    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="leading-tight">
      <div className="metric text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  </div>
);

const OnTheLoopSummary = ({ summary, loading = false, className = '', reviewHref }: Props) => {
  if (loading) {
    return <Skeleton className={`h-28 w-full rounded-2xl ${className}`} />;
  }
  if (!summary || summary.graded === 0) return null;

  const pct = summary.autoFinalizedPct != null ? Math.round(summary.autoFinalizedPct) : null;
  const needsReview = summary.needsReview;

  return (
    <section
      className={`rounded-2xl border border-border bg-card px-6 py-5 shadow-sm ${className}`}
      aria-label="On-the-Loop grading summary"
      data-tour="on-the-loop-summary"
    >
      <div className="mb-4 flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          aiTA on-the-loop
        </span>
        {pct != null && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {pct}% handled unattended
          </span>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Stat
          icon={CheckCircle2}
          value={summary.graded}
          label="Graded"
          tone="bg-muted text-foreground/70"
        />
        <Stat
          icon={Bot}
          value={summary.autoFinalized}
          label="Auto-finalized by aiTA"
          tone="bg-primary/10 text-primary"
        />
        {needsReview > 0 && reviewHref ? (
          <Link to={reviewHref} className="rounded-xl transition-colors hover:bg-question-soft/40">
            <Stat
              icon={Inbox}
              value={needsReview}
              label="Need your review"
              tone="bg-question/10 text-question"
            />
          </Link>
        ) : (
          <Stat
            icon={Inbox}
            value={needsReview}
            label="Need your review"
            tone={needsReview > 0 ? 'bg-question/10 text-question' : 'bg-muted text-foreground/40'}
          />
        )}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        aiTA published {summary.autoFinalized} high-confidence grade{summary.autoFinalized === 1 ? '' : 's'} unattended.
        {needsReview > 0
          ? ` You only need to touch the ${needsReview} exception${needsReview === 1 ? '' : 's'} below.`
          : ' Nothing is waiting on you.'}
      </p>
    </section>
  );
};

export default OnTheLoopSummary;
