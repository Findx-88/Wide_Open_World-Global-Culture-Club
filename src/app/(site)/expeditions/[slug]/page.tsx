import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Flag } from '@/components/brand';
import { AddToCalendar, SubscribeToCalendar } from '@/components/AddToCalendar';
import { toCalEvent } from '@/lib/calendar';
import { Cover } from '@/components/Cover';
import { FilmShelf } from '@/components/FilmShelf';
import { LocalTime } from '@/components/LocalTime';
import { Pattern } from '@/components/Pattern';
import { expeditionNo, initials, lengthLabel } from '@/lib/format';
import { formatRange } from '@/lib/time';
import { getExpeditionBySlug, getPublicMembers, getSettings, type LinkedWork } from '@/server/queries';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = await getExpeditionBySlug((await params).slug);
  if (!e) return {};
  return {
    title: `Expedition ${expeditionNo(e.number)} · ${e.country.name}`,
    description: e.description ?? undefined,
    openGraph: { images: e.heroImageUrl ? [e.heroImageUrl] : undefined },
  };
}

function WorkMeta({ w }: { w: LinkedWork }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
      {[w.kind === 'film' ? `Directed by ${w.creator}` : w.genre, w.year, lengthLabel(w.kind, w.length)].filter(Boolean).join(' · ')}
    </div>
  );
}

export default async function ExpeditionPage({ params }: Props) {
  const e = await getExpeditionBySlug((await params).slug);
  if (!e) notFound();
  const [members, settings] = await Promise.all([getPublicMembers(), getSettings()]);
  const holders = members.filter((m) => m.visaExpeditionIds.includes(e.id)).length;

  const statusLabel = e.status === 'current' ? 'Current expedition' : e.status === 'completed' ? 'Completed expedition' : 'Upcoming expedition';

  return (
    <div style={{ ['--accent' as string]: e.accentColor }}>
      {/* HERO */}
      <section className="relative isolate flex min-h-[88vh] items-end overflow-hidden pb-16 pt-32">
        {e.heroImageUrl && <img src={e.heroImageUrl} alt={e.heroTitle ?? ''} className="absolute inset-0 -z-20 h-full w-full object-cover" />}
        <div className="hero-veil absolute inset-0 -z-10" />
        <Pattern name={e.pattern} opacity={0.07} className="-z-10" />
        <div className="container-page">
          <div className="flex flex-wrap items-center gap-3">
            <span className="chip !border-accent/60 !bg-bg/75 !text-ink backdrop-blur">
              {e.status === 'current' && <span className="pulse-dot" />} {statusLabel}
            </span>
            <span className="chip !bg-bg/75 backdrop-blur">Expedition {expeditionNo(e.number)}</span>
            <span className="chip !bg-bg/75 backdrop-blur">{formatRange(e.startsOn, e.endsOn)}</span>
          </div>
          <h1 className="display rise mt-6 flex flex-wrap items-center gap-5">
            {e.country.name}
            <Flag iso2={e.countryIso2} name={e.country.name} className="h-10 w-14 sm:h-12 sm:w-[4.5rem]" width={160} />
          </h1>
          {(e.tagline || e.country.epithet) && <p className="rise rise-2 mt-3 font-display text-2xl italic text-ink-soft sm:text-3xl">{e.tagline ?? e.country.epithet}</p>}
          <p className="lede rise rise-3 mt-6 max-w-2xl">{e.description}</p>
          {e.heroTitle && (
            <p className="mt-10 max-w-md border-l border-line-strong pl-4 text-sm text-ink-faint">
              <span className="text-ink-soft">{e.heroTitle}.</span> {e.heroCaption} {e.heroCredit && <em className="block pt-1 text-xs">Photo: {e.heroCredit}</em>}
            </p>
          )}
        </div>
      </section>

      {/* FACT STRIP */}
      <section className="border-y border-line bg-raised">
        <dl className="container-page grid grid-cols-2 gap-6 py-6 text-sm sm:grid-cols-4">
          {[
            ['Capital', e.country.capital],
            ['Languages', e.country.languages],
            ['Currency', e.country.currency],
            ['Visa holders', holders ? `${holders} explorers` : '—'],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-faint">{k}</dt>
              <dd className="mt-1 text-ink-soft">{v ?? '—'}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* BOOKS */}
      {e.books.map((book, i) => (
        <section key={book.id} className="container-page mt-24 grid items-center gap-12 md:grid-cols-[auto_1fr] md:gap-16">
          <div className="relative mx-auto">
            <div className="absolute -inset-10 -z-10 rounded-full opacity-40 blur-3xl" style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)' }} />
            <Cover work={book} className="w-52 sm:w-64" priority={i === 0} />
          </div>
          <div>
            <div className="eyebrow">{i === 0 ? 'The book' : 'Also reading'}</div>
            <h2 className="h-section mt-3">{book.title}</h2>
            <div className="mt-2 font-display text-2xl italic text-ink-soft">{book.creator}</div>
            <div className="mt-4"><WorkMeta w={book} /></div>
            {book.description && <p className="mt-6 max-w-2xl text-ink-soft">{book.description}</p>}
            {book.whyChosen && (
              <div className="mt-6 max-w-2xl rounded-xl border border-line bg-raised p-5">
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-faint">Why we chose it</div>
                <p className="mt-2 text-ink-soft">{book.whyChosen}</p>
              </div>
            )}
            {book.quote && <blockquote className="mt-6 max-w-2xl border-l-2 border-accent pl-5 font-display text-xl italic">{book.quote}</blockquote>}
            {book.awards.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {book.awards.map((a) => <li key={a} className="chip !normal-case !tracking-normal">{a}</li>)}
              </ul>
            )}
          </div>
        </section>
      ))}

      {/* FILMS — every recommendation is equal; same shelf on every country page */}
      {e.films.length > 0 && (
        <section className="relative mt-24 overflow-hidden border-y border-line bg-raised py-16 sm:py-20">
          <Pattern name={e.pattern} opacity={0.05} />
          <div className="container-page relative">
            <FilmShelf
              films={e.films.map((f) => ({ id: f.id, title: f.title, creator: f.creator, year: f.year, length: f.length, description: f.description, coverUrl: f.coverUrl, category: f.category, genre: f.genre, awards: f.awards, whyChosen: f.whyChosen }))}
            />
          </div>
        </section>
      )}

      {/* FRIENDS */}
      {e.friends.length > 0 && (
        <section className="container-page mt-24">
          <div className="eyebrow">{e.friends.length > 1 ? 'Our friends' : 'Our friend'} from {e.country.name}</div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {e.friends.map((f) => (
              <figure key={f.id} className="card flex flex-col gap-6 p-7 sm:flex-row sm:items-start">
                {f.photoUrl ? (
                  <img src={f.photoUrl} alt={f.name} className="h-24 w-24 shrink-0 rounded-full object-cover ring-2 ring-accent" />
                ) : (
                  <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full font-display text-4xl text-gold-ink" style={{ background: 'linear-gradient(135deg, var(--accent), var(--gold))' }}>
                    {initials(f.name)}
                  </div>
                )}
                <div>
                  <figcaption>
                    <div className="font-display text-3xl">{f.name}</div>
                    <div className="text-sm text-ink-faint">{[f.title, f.location].filter(Boolean).join(' · ')}</div>
                  </figcaption>
                  {f.bio && <p className="mt-3 text-ink-soft">{f.bio}</p>}
                  {f.quote && <blockquote className="mt-4 font-display text-xl italic leading-snug">&ldquo;{f.quote}&rdquo;</blockquote>}
                </div>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* TIMETABLE */}
      {e.events.length > 0 && (
        <section className="container-page mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="eyebrow">Timetable</div>
              <h2 className="h-section mt-3">Meet us live</h2>
            </div>
            <SubscribeToCalendar label="Subscribe to all sessions" className="btn btn-ghost" align="right" />
          </div>
          <ol className="mt-10 divide-y divide-line border-y border-line">
            {e.events.map((ev) => {
              const past = new Date(ev.startsAt).getTime() + ev.durationMin * 60_000 < Date.now();
              const d = new Date(ev.startsAt);
              return (
                <li key={ev.id} className={`grid gap-4 py-7 sm:grid-cols-[7rem_1fr_auto] sm:items-center ${past ? 'opacity-60' : ''}`}>
                  <div className="font-display">
                    <div className="num text-5xl leading-none">{d.getUTCDate()}</div>
                    <div className="mt-1 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-accent">{d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })}</div>
                  </div>
                  <div>
                    <div className="font-display text-2xl">{ev.title}</div>
                    <div className="mt-1 text-sm text-ink-faint"><LocalTime iso={ev.startsAt} fallbackZone={ev.hostTimezone} /> · {ev.durationMin} min · Online</div>
                    {ev.description && <p className="mt-2 max-w-2xl text-ink-soft">{ev.description}</p>}
                  </div>
                  {past ? (
                    ev.recordingUrl ? <a href={ev.recordingUrl} className="btn btn-ghost" target="_blank" rel="noreferrer">Watch recording</a> : <span className="chip">Took place</span>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <AddToCalendar event={toCalEvent(ev, settings.default_meet_url, e.country.name + ' · ')} align="right" />
                      <Link href="/join" className="btn btn-primary">Join</Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="container-page mt-24 text-center">
        <Link href="/expeditions" className="text-sm text-ink-soft link-underline">← All expeditions</Link>
      </section>
    </div>
  );
}
