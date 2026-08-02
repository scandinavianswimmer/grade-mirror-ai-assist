import { CheckCircle2, MinusCircle, ShieldCheck } from 'lucide-react';

import type { ReleaseProof } from '@/lib/releaseProof';

interface ReleaseProofRailProps {
  proof: ReleaseProof;
}

const ReleaseProofRail = ({ proof }: ReleaseProofRailProps) => (
  <aside
    aria-labelledby="release-proof-heading"
    tabIndex={0}
    className="min-w-0 border-t border-border bg-card/65 px-5 py-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:rounded-lg lg:border lg:p-6 lg:shadow-sm"
  >
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-primary/30 bg-primary/5 text-primary">
        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h2 id="release-proof-heading" className="text-2xl font-semibold">Release proof</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {proof.recordedCount} of {proof.totalCount} public fields recorded for this build.
        </p>
      </div>
    </div>

    <p className="mt-5 border-y border-border/80 py-4 text-sm leading-6 text-muted-foreground">
      Values appear only when privacy-safe release metadata is supplied at build time. Missing proof
      stays missing; this rail never fills gaps with fixture values.
    </p>

    <div className="mt-6 space-y-7">
      {proof.groups.map((group) => (
        <section key={group.id} aria-labelledby={`proof-${group.id}-heading`}>
          <h3
            id={`proof-${group.id}-heading`}
            className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground"
          >
            {group.label}
          </h3>
          <dl className="mt-2 divide-y divide-border/75 border-y border-border/75">
            {group.items.map((item) => {
              const recorded = item.state === 'recorded';
              const StatusIcon = recorded ? CheckCircle2 : MinusCircle;

              return (
                <div key={item.id} className="min-w-0 py-3.5">
                  <dt className="flex items-start gap-2 text-sm font-medium text-foreground">
                    <StatusIcon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${recorded ? 'text-praise' : 'text-muted-foreground'}`}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </dt>
                  <dd className="mt-1.5 pl-6">
                    <code className="metric block break-all text-xs leading-5 text-foreground">
                      {item.value}
                    </code>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {recorded ? 'Recorded in this public build.' : 'No public evidence value was supplied.'}
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </div>

    <p className="mt-6 text-xs leading-5 text-muted-foreground">
      Public metadata is a locator, not the primary evidence. Private logs and account details remain
      outside the browser bundle.
    </p>
  </aside>
);

export default ReleaseProofRail;
