'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDeferredValue, useState } from 'react';
import { flagUrl, initials } from '@/lib/format';
import type { PublicMember } from '@/server/queries';

export function ExplorerGrid({ members, expeditionNames }: { members: PublicMember[]; expeditionNames: Record<number, string> }) {
  const [query, setQuery] = useState('');
  const [passport, setPassport] = useState('');
  const router = useRouter();
  const q = useDeferredValue(query.trim().toLowerCase());
  const list = q ? members.filter((m) => `${m.name} ${m.countryName} ${m.passportNumber}`.toLowerCase().includes(q)) : members;

  return (
    <>
      <section className="mt-16 grid gap-6 rounded-[1.5rem] border border-line bg-raised p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="eyebrow">Open a passport</div>
          <p className="mt-2 text-ink-soft">Enter a passport number to see its visas — or pick an explorer below.</p>
        </div>
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (passport.trim()) router.push(`/passport/${encodeURIComponent(passport.trim().toUpperCase())}`);
          }}
        >
          <input value={passport} onChange={(e) => setPassport(e.target.value)} placeholder="WOW-2026-0001" className="field font-mono sm:w-60" aria-label="Passport number" />
          <button className="btn btn-primary">Retrieve passport</button>
        </form>
      </section>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-3xl">All explorers</h2>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or country…" className="field sm:max-w-xs" aria-label="Search explorers" />
      </div>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((m) => (
          <li key={m.id}>
            <Link href={`/passport/${m.passportNumber}`} className="group flex items-center gap-4 rounded-2xl border border-line bg-bg p-4 transition hover:border-gold hover:bg-raised">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line-strong font-display text-lg text-gold">{initials(m.name)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{m.name}</span>
                <span className="mt-0.5 flex items-center gap-2 text-sm text-ink-faint">
                  <img src={flagUrl(m.countryIso2, 40)} alt="" className={`h-3 w-4 rounded-[2px] ${m.countryIso2 === 'np' ? 'object-contain' : 'object-cover'}`} />
                  {m.countryName}
                </span>
              </span>
              <span className="text-right">
                <span className="block font-mono text-[0.7rem] text-ink-faint">{m.passportNumber}</span>
                <span className="mt-1 block text-xs text-gold" title={m.visaExpeditionIds.map((id) => expeditionNames[id]).join(', ')}>
                  {m.visaCount} visa{m.visaCount === 1 ? '' : 's'}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="mt-8 text-ink-soft">No explorer matches “{query}”.</p>}
    </>
  );
}
