import type { Metadata } from 'next';
import Link from 'next/link';
import { Flag } from '@/components/brand';
import { Cover } from '@/components/Cover';
import { Pattern } from '@/components/Pattern';
import { expeditionNo } from '@/lib/format';
import { formatMonthRange } from '@/lib/time';
import { getPublishedExpeditions, type ExpeditionView } from '@/server/queries';

export const metadata: Metadata = { title: 'Expeditions', description: 'Every country Wide Open World has visited, is visiting, and will visit next.' };

const STATUS = {
  current: { label: 'Happening now', tone: 'border-accent bg-accent/15 text-accent' },
  upcoming: { label: 'Coming up', tone: 'border-line-strong text-ink-soft' },
  completed: { label: 'Completed', tone: 'border-line-strong text-ink-faint' },
} as const;

function ExpeditionCard({ e }: { e: ExpeditionView }) {
  const status = STATUS[e.status];
  const films = e.films.slice(0, 3);
  return (
    <Link
      href={`/expeditions/${e.slug}`}
      style={{ ['--accent' as string]: e.accentColor }}
      className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-line bg-raised transition hover:-translate-y-0.5 hover:border-accent md:grid md:grid-cols-[1fr_1.15fr]"
    >
      <div className="relative aspect-[16/10] md:aspect-auto md:min-h-72">
        {e.heroImageUrl ? <img src={e.heroImageUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" /> : <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 35%, #0b1310), #0b1310)' }}><Pattern name={e.pattern} opacity={0.25} /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-raised/60" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="chip !border-white/30 !bg-black/50 !text-white backdrop-blur">Expedition {expeditionNo(e.number)}</span>
        </div>
      </div>
      <div className="flex flex-col justify-between gap-6 p-6 sm:p-9">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`chip ${status.tone}`}>{e.status === 'current' && <span className="pulse-dot" />} {status.label}</span>
            <span className="text-sm text-ink-faint">{formatMonthRange(e.startsOn, e.endsOn)}</span>
          </div>
          <h2 className="mt-4 flex items-center gap-3 font-display text-4xl sm:text-5xl">
            {e.country.name} <Flag iso2={e.countryIso2} name={e.country.name} className="h-5 w-8" />
          </h2>
          {e.tagline && <p className="mt-1 font-display text-xl italic text-ink-soft">{e.tagline}</p>}
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex items-end gap-3">
            {e.book && <Cover work={e.book} className="w-20" />}
            {films.map((f) => <Cover key={f.id} work={f} className="w-14" />)}
          </div>
          <div className="min-w-0 text-sm text-ink-soft sm:ml-auto sm:text-right">
            {e.book && <div className="truncate"><em>{e.book.title}</em></div>}
            {e.films.length > 0 && <div>{e.films.length === 1 ? <em>{e.films[0].title}</em> : `${e.films.length} film recommendations`}</div>}
            {e.friends[0] && <div className="truncate text-ink-faint">with {e.friends.map((f) => f.name).join(' & ')}</div>}
            <div className="mt-2 text-accent">{e.status === 'completed' ? 'Revisit' : 'Explore'} →</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function ExpeditionsPage() {
  const all = await getPublishedExpeditions();
  // One list, every country equal: what's happening now first, then what's next, then the archive (newest first).
  const order = { current: 0, upcoming: 1, completed: 2 } as const;
  const sorted = [...all].sort((a, b) => order[a.status] - order[b.status] || (a.status === 'completed' ? b.number - a.number : a.number - b.number));
  const counts = { current: all.filter((e) => e.status === 'current').length, upcoming: all.filter((e) => e.status === 'upcoming').length, completed: all.filter((e) => e.status === 'completed').length };

  return (
    <div className="container-page pt-28 sm:pt-36">
      <div className="max-w-3xl">
        <div className="eyebrow">Expeditions</div>
        <h1 className="display mt-4">Every country, a chapter.</h1>
        <p className="lede mt-6">Each expedition lasts about two months: one country, its literature and cinema, and a friend who lives there to guide us.</p>
        <p className="mt-4 text-sm text-ink-faint">
          {all.length} in total · {counts.completed} completed{counts.current ? ` · ${counts.current} happening now` : ''}{counts.upcoming ? ` · ${counts.upcoming} coming up` : ''}
        </p>
      </div>
      <div className="mt-10 grid gap-6">
        {sorted.map((e) => <ExpeditionCard key={e.id} e={e} />)}
      </div>
      <div className="mt-10 rounded-[1.5rem] border border-dashed border-line-strong p-8 text-center">
        <div className="font-display text-3xl">Where should we go next?</div>
        <p className="mt-2 text-ink-soft">Recommend a country’s book or film for a future expedition.</p>
        <Link href="/recommend" className="btn btn-ghost mt-5">Make a recommendation</Link>
      </div>
    </div>
  );
}
