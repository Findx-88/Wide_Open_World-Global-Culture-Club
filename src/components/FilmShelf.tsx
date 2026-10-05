'use client';

import { useMemo, useRef, useState } from 'react';
import { Cover } from '@/components/Cover';
import { lengthLabel } from '@/lib/format';

export type ShelfFilm = {
  id: number;
  title: string;
  creator: string;
  year: number | null;
  length: number | null;
  description: string | null;
  coverUrl: string | null;
  category: string | null;
  genre: string | null;
  awards: string[];
  whyChosen: string | null;
};

/**
 * "Film Recommendations": every recommended film is equal. A swipeable poster row; tap (mobile) or hover
 * (desktop) to preview, click/tap to pin the details underneath. Same component for every expedition.
 */
export function FilmShelf({ films, title = 'Film recommendations' }: { films: ShelfFilm[]; title?: string }) {
  const categories = useMemo(() => [...new Set(films.map((f) => f.category).filter(Boolean))] as string[], [films]);
  const [category, setCategory] = useState<string>('All');
  const [selectedId, setSelectedId] = useState<number | null>(films[0]?.id ?? null);
  const row = useRef<HTMLDivElement>(null);

  const visible = category === 'All' ? films : films.filter((f) => f.category === category);
  const selected = visible.find((f) => f.id === selectedId) ?? visible[0] ?? null;
  const scroll = (dir: 1 | -1) => row.current?.scrollBy({ left: dir * (row.current.clientWidth * 0.8), behavior: 'smooth' });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">The cinema</div>
          <h2 className="h-section mt-3">{title}</h2>
          <p className="mt-2 text-ink-soft">{films.length === 1 ? 'One film to watch' : `${films.length} films — watch any of them, in any order.`}</p>
        </div>
        <div className="hidden gap-2 md:flex">
          <button onClick={() => scroll(-1)} aria-label="Scroll films left" className="grid h-11 w-11 place-items-center rounded-full border border-line-strong hover:border-accent hover:text-accent">‹</button>
          <button onClick={() => scroll(1)} aria-label="Scroll films right" className="grid h-11 w-11 place-items-center rounded-full border border-line-strong hover:border-accent hover:text-accent">›</button>
        </div>
      </div>

      {categories.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {['All', ...categories].map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`chip !px-4 !py-2 transition ${category === c ? '!border-accent !text-accent' : 'hover:!text-ink'}`}>
              {c}
            </button>
          ))}
        </div>
      )}

      <div ref={row} className="-mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] md:mx-0 md:gap-6 md:px-0 [&::-webkit-scrollbar]:hidden">
        {visible.map((f) => {
          const active = selected?.id === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setSelectedId(f.id)}
              aria-pressed={active}
              className={`group relative w-36 shrink-0 snap-start text-left transition sm:w-44 ${active ? '' : 'opacity-80 hover:opacity-100'}`}
            >
              <div className={`rounded-md transition ${active ? 'ring-2 ring-accent ring-offset-4 ring-offset-bg' : ''}`}>
                <Cover work={{ ...f, kind: 'film' }} className="w-full" />
              </div>
              {/* Desktop hover preview */}
              <div className="pointer-events-none absolute inset-x-0 top-0 hidden aspect-[2/3] flex-col justify-end rounded-md bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 text-white opacity-0 transition group-hover:opacity-100 md:flex">
                <div className="font-display text-lg leading-tight">{f.title}</div>
                <div className="text-xs text-white/75">{f.creator}{f.year ? ` · ${f.year}` : ''}</div>
              </div>
              <div className="mt-3 md:hidden">
                <div className="font-display text-base leading-tight">{f.title}</div>
                <div className="text-xs text-ink-faint">{f.year}</div>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <article key={selected.id} className="rise card mt-4 grid gap-6 p-6 sm:p-8 md:grid-cols-[auto_1fr]" aria-live="polite">
          <Cover work={{ ...selected, kind: 'film' }} className="hidden w-32 md:block" />
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {[selected.category, selected.genre].filter(Boolean).join(' · ') || 'Film'}
            </div>
            <h3 className="mt-2 font-display text-3xl sm:text-4xl">{selected.title}</h3>
            <div className="mt-1 text-ink-soft">Directed by {selected.creator}{selected.year ? ` · ${selected.year}` : ''}{lengthLabel('film', selected.length) ? ` · ${lengthLabel('film', selected.length)}` : ''}</div>
            {selected.description && <p className="mt-4 max-w-2xl text-ink-soft">{selected.description}</p>}
            {selected.whyChosen && <p className="mt-3 max-w-2xl text-sm text-ink-faint">Why we chose it: {selected.whyChosen}</p>}
            {selected.awards.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {selected.awards.map((a) => <li key={a} className="chip !normal-case !tracking-normal !text-accent">★ {a}</li>)}
              </ul>
            )}
          </div>
        </article>
      )}
    </div>
  );
}
