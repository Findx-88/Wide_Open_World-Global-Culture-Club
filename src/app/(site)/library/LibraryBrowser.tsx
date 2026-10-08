'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { Cover } from '@/components/Cover';
import { continentColor } from '@/lib/world';
import { flagUrl } from '@/lib/format';

export type LibraryBook = {
  id: number;
  title: string;
  creator: string;
  year: number | null;
  coverUrl: string | null;
  country: string;
  iso2: string;
  continent: string;
  featured: boolean;
  expeditionSlug: string | null;
};

const CONTINENTS = ['All', 'Africa', 'Asia', 'Europe', 'North America', 'Caribbean', 'South America', 'Oceania'];

export function LibraryBrowser({ books }: { books: LibraryBook[] }) {
  const [query, setQuery] = useState('');
  const [continent, setContinent] = useState('All');
  const q = useDeferredValue(query.trim().toLowerCase());

  const grouped = useMemo(() => {
    const map = new Map<string, LibraryBook[]>();
    for (const b of books) {
      if (continent !== 'All' && b.continent !== continent) continue;
      if (q && !`${b.title} ${b.creator} ${b.country}`.toLowerCase().includes(q)) continue;
      map.set(b.country, [...(map.get(b.country) ?? []), b]);
    }
    return [...map.entries()];
  }, [books, continent, q]);

  return (
    <>
      <div className="sticky top-[4.5rem] z-20 -mx-5 mt-12 border-y border-line bg-bg/90 px-5 py-4 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a title, author or country…" className="field lg:max-w-sm" aria-label="Search the library" />
          <div className="flex flex-wrap gap-2">
            {CONTINENTS.map((c) => (
              <button key={c} onClick={() => setContinent(c)} className={`chip transition ${continent === c ? '!border-accent !text-accent' : 'hover:!text-ink'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {grouped.length === 0 && <p className="mt-16 text-ink-soft">Nothing found. Try another search — or <Link href="/recommend" className="link-underline">recommend it</Link>.</p>}

      <div className="mt-10 space-y-14">
        {grouped.map(([country, list]) => (
          <section key={country} id={list[0].iso2} className="scroll-mt-44">
            <h2 className="flex items-center gap-3 font-display text-3xl">
              <img src={flagUrl(list[0].iso2, 80)} alt="" className={`h-5 w-7 rounded-sm ${list[0].iso2 === 'np' ? 'object-contain' : 'object-cover'}`} />
              {country}
              <span className="font-sans text-sm text-ink-faint">{list.length}</span>
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {list.map((b) => {
                const body = (
                  <>
                    <div style={{ ['--accent' as string]: continentColor(b.continent) }}><Cover work={{ ...b, kind: 'book' }} className="w-full" /></div>
                    <div className="mt-3 font-display text-lg leading-tight">{b.title}</div>
                    <div className="text-sm text-ink-soft">{b.creator}</div>
                    {b.expeditionSlug && <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">WOW expedition pick</div>}
                    {!b.expeditionSlug && b.featured && <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">On our horizon</div>}
                  </>
                );
                return b.expeditionSlug ? (
                  <Link key={b.id} href={`/expeditions/${b.expeditionSlug}`} className="group">{body}</Link>
                ) : (
                  <div key={b.id}>{body}</div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
