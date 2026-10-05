import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getPublicMembers, getPublishedExpeditions } from '@/server/queries';
import { ExplorerGrid } from './ExplorerGrid';

export const metadata: Metadata = { title: 'Explorers', description: 'The members of Wide Open World and their Cultural Passports.' };

type Props = { searchParams: Promise<{ uid?: string }> };

export default async function MembersPage({ searchParams }: Props) {
  // Old share links: /members?uid=WOW-2026-0001
  const { uid } = await searchParams;
  if (uid) redirect(`/passport/${encodeURIComponent(uid)}`);

  const [members, expeditions] = await Promise.all([getPublicMembers(), getPublishedExpeditions()]);
  const byCountry = new Map<string, { name: string; iso2: string; n: number }>();
  for (const m of members) {
    const c = byCountry.get(m.countryIso2) ?? { name: m.countryName, iso2: m.countryIso2, n: 0 };
    c.n++;
    byCountry.set(m.countryIso2, c);
  }
  const top = [...byCountry.values()].sort((a, b) => b.n - a.n);
  const max = top[0]?.n ?? 1;
  const stampsIssued = members.reduce((n, m) => n + m.visaCount, 0);
  const expeditionNames = Object.fromEntries(expeditions.map((e) => [e.id, e.country.name]));

  return (
    <div className="container-page pt-36">
      <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <div className="eyebrow">The crew</div>
          <h1 className="display mt-4">Explorers</h1>
          <p className="lede mt-6 max-w-xl">Readers and film-lovers from {byCountry.size} countries, travelling together one culture at a time. Every explorer carries a Cultural Passport.</p>
        </div>
        <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line text-center">
          {[
            [members.length, 'Explorers'],
            [byCountry.size, 'Countries'],
            [stampsIssued, 'Visas issued'],
          ].map(([n, l]) => (
            <div key={String(l)} className="bg-bg p-5">
              <dd className="num font-display text-4xl sm:text-5xl">{n}</dd>
              <dt className="mt-1 text-[0.7rem] uppercase tracking-[0.18em] text-ink-faint">{l}</dt>
            </div>
          ))}
        </dl>
      </div>

      <section className="mt-14">
        <h2 className="eyebrow !text-ink-faint">Where we read from</h2>
        <ul className="mt-5 grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {top.map((c) => (
            <li key={c.iso2} className="flex items-center gap-3 text-sm">
              <img src={`https://flagcdn.com/w40/${c.iso2}.png`} alt="" className={`h-3.5 w-5 rounded-sm ${c.iso2 === 'np' ? 'object-contain' : 'object-cover'}`} />
              <span className="w-36 truncate text-ink-soft">{c.name}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <span className="block h-full rounded-full bg-gold" style={{ width: `${(c.n / max) * 100}%` }} />
              </span>
              <span className="num w-6 text-right text-ink-faint">{c.n}</span>
            </li>
          ))}
        </ul>
      </section>

      <ExplorerGrid members={members} expeditionNames={expeditionNames} />
    </div>
  );
}
