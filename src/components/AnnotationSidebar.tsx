'use client';
import { useEffect, useState } from 'react';
import type { AnchorRange } from '@/lib/annotations/resolveAnchors';

export default function AnnotationSidebar({ anchors }: { anchors: AnchorRange[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const t = e.target as HTMLElement;
      const id = t.getAttribute('data-id') || t.closest('[data-id]')?.getAttribute('data-id');
      if (id) setActive(id);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.querySelector(`[data-id="${id}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setActive(id);
      element.classList.add('animate-pulse');
      setTimeout(() => element.classList.remove('animate-pulse'), 1500);
    }
  };

  return (
    <aside className="sticky top-20 max-h-[calc(100vh-5rem)] space-y-3 overflow-y-auto pr-1">
      <h3 className="px-1 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Margin notes
      </h3>
      {anchors.map((a) => (
        <div
          id={`note-${a.id}`}
          key={a.id}
          role="note"
          onClick={() => scrollTo(a.id)}
          className={`cursor-pointer break-inside-avoid rounded-lg border p-3 text-sm transition-all ${
            active === a.id
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm'
              : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
          }`}
        >
          <div className="mb-2 inline-flex h-5 min-w-5 items-center justify-center rounded bg-accent/15 px-1.5 metric text-xs font-semibold text-accent-foreground">
            {a.n}
          </div>
          <div className="mb-2 border-l-2 border-accent/60 pl-2 text-xs italic text-muted-foreground line-clamp-2">
            “{a.text.length > 60 ? a.text.slice(0, 60) + '…' : a.text}”
          </div>
          <div className="leading-relaxed text-foreground/90">{a.comment}</div>
          <button
            onClick={(e) => { e.stopPropagation(); scrollTo(a.id); }}
            className="mt-2 text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Jump to text →
          </button>
        </div>
      ))}
    </aside>
  );
}
