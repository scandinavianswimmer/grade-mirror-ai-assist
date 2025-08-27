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
      
      // Add pulse effect
      element.classList.add('animate-pulse');
      setTimeout(() => element.classList.remove('animate-pulse'), 1500);
    }
  };

  return (
    <aside className="sticky top-20 space-y-3 max-h-[calc(100vh-5rem)] overflow-y-auto">
      {anchors.map(a => (
        <div
          id={`note-${a.id}`}
          key={a.id}
          role="note"
          className={`rounded-lg border p-3 text-sm break-inside-avoid transition-all cursor-pointer ${
            active === a.id
              ? 'border-red-500 ring-1 ring-red-200 bg-red-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => scrollTo(a.id)}
        >
          <div className="mb-2 font-mono text-red-600 font-bold">[{a.n}]</div>
          <div className="line-clamp-2 italic text-gray-600 text-xs mb-2 border-l-2 border-gray-200 pl-2">
            "{a.text.length > 60 ? a.text.slice(0, 60) + '...' : a.text}"
          </div>
          <div className="text-gray-800">{a.comment}</div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              scrollTo(a.id);
            }}
            className="mt-2 text-xs text-blue-600 underline hover:text-blue-800"
          >
            Jump to text
          </button>
        </div>
      ))}
    </aside>
  );
}