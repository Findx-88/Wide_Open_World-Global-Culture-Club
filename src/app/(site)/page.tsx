import Link from 'next/link';
import { Flag } from '@/components/brand';
import { AddToCalendar } from '@/components/AddToCalendar';
import { toCalEvent } from '@/lib/calendar';
import { Countdown } from '@/components/Countdown';
import { Cover } from '@/components/Cover';
import { LocalTime } from '@/components/LocalTime';
import { Pattern } from '@/components/Pattern';
import { Stamp } from '@/components/Stamp';
import { GlobeClient } from '@/components/world/GlobeClient';
import { WorldMapClient } from '@/components/world/WorldMapClient';
import { expeditionNo, pad2 } from '@/lib/format';
import { formatMonthRange } from '@/lib/time';
import { getCurrentExpedition, getHorizonPicks, getLibrary, getNextEvent, getPublicMembers, getPublishedExpeditions, getSettings } from '@/server/queries';
import { getWorldData } from '@/server/view';

export default async function Home() {
  const [current, next, expeditions, members, horizon, library, world, settings] = await Promise.all([
    getCurrentExpedition(),
    getNextEvent(),
    getPublishedExpeditions(),
    getPublicMembers(),
    getHorizonPicks(),
    getLibrary(),
    getWorldData(),
    getSettings(),
  ]);
  const accent = current?.accentColor ?? '#D4AE62';
  const countriesRepresented = new Set(members.map((m) => m.countryIso2)).size;
  const completed = expeditions.filter((e) => e.status === 'completed').length;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden pt-28 md:pt-32" style={{ ['--accent' as string]: accent }}>
        <div className="pointer-events-none absolute -right-40 top-10 h-[38rem] w-[38rem] rounded-full opacity-30 blur-3xl" style={{ background: `radial-gradient(circle, ${accent}55, transparent 65%)` }} />
        <div className="container-page grid items-center gap-6 lg:grid-cols-[1.05fr_1fr]">
          <div className="relative z-10 py-6">
            {current && (
              <Link href={`/expeditions/${current.slug}`} className="rise chip !normal-case !tracking-normal hover:border-accent">
                <span className="pulse-dot" />
                <span className="text-[0.8rem] font-medium">Now exploring · {current.country.name}</span>
                <Flag iso2={current.countryIso2} name={current.country.name} className="h-3.5 w-5" />
              </Link>
            )}
            <h1 className="display rise rise-2 mt-7">
              Read the world,
              <br />
              <span className="italic text-accent">one country</span> at a time.
            </h1>
            <p className="lede rise rise-3 mt-7 max-w-xl">
              Every two months, Wide Open World travels to a new country — through a landmark book, its cinema, and a live conversation with a friend who calls it home.
            </p>
            <div className="rise rise-4 mt-9 flex flex-wrap gap-3">
              {current && (
                <Link href={`/expeditions/${current.slug}`} className="btn btn-primary">
                  Explore {current.country.name}
                </Link>
              )}
              <Link href="#how" className="btn btn-ghost">
                How it works
              </Link>
            </div>
          </div>
          <div className="relative -mx-5 h-[420px] sm:h-[520px] lg:mx-0 lg:h-[620px]">
            <GlobeClient data={world} />
          </div>
        </div>
      </section>

      {/* NEXT MEETING */}
      {next && (
        <section className="container-page relative z-10 mt-8 lg:mt-2">
          <div className="card flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between" style={{ ['--accent' as string]: next.expedition?.accentColor ?? accent }}>
            <div>
              <div className="eyebrow">Next meeting{next.expedition ? ` · ${next.expedition.country.name}` : ''}</div>
              <div className="mt-2 font-display text-3xl sm:text-4xl">{next.event.title}</div>
              <div className="mt-2 text-ink-soft">
                <LocalTime iso={next.event.startsAt} fallbackZone={next.event.hostTimezone} /> · Online
              </div>
            </div>
            <Countdown iso={next.event.startsAt} durationMin={next.event.durationMin} />
            <div className="flex flex-wrap gap-3">
              <AddToCalendar event={toCalEvent(next.event, settings.default_meet_url, next.expedition ? next.expedition.country.name + ' · ' : '')} />
              <Link href="/join" className="btn btn-primary">
                Join the meeting →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CURRENT EXPEDITION SPOTLIGHT */}
      {current && (
        <section className="container-page mt-24" style={{ ['--accent' as string]: accent }}>
          <div className="relative overflow-hidden rounded-[1.75rem] border border-line bg-raised">
            {current.heroImageUrl && (
              <img src={current.heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/90 to-bg/40" />
            <Pattern name={current.pattern} opacity={0.08} />
            <div className="relative grid gap-12 p-7 sm:p-12 lg:grid-cols-[1.1fr_1fr] lg:p-16">
              <div>
                <div className="eyebrow">Expedition {expeditionNo(current.number)} · {formatMonthRange(current.startsOn, current.endsOn)}</div>
                <h2 className="h-section mt-4 flex flex-wrap items-center gap-4">
                  {current.country.name}
                  <Flag iso2={current.countryIso2} name={current.country.name} className="h-7 w-10" width={160} />
                </h2>
                {current.tagline && <p className="mt-2 font-display text-2xl italic text-ink-soft">{current.tagline}</p>}
                <p className="mt-6 max-w-xl text-ink-soft">{current.description}</p>
                {current.friends[0] && (
                  <figure className="mt-8 border-l-2 border-accent pl-5">
                    <blockquote className="font-display text-xl italic leading-snug">&ldquo;{current.friends[0].quote ?? current.friends[0].bio}&rdquo;</blockquote>
                    <figcaption className="mt-3 text-sm text-ink-faint">
                      {current.friends[0].name} · {current.friends[0].title ?? 'Our friend'}
                    </figcaption>
                  </figure>
                )}
                <Link href={`/expeditions/${current.slug}`} className="btn btn-primary mt-10">
                  Open the expedition
                </Link>
              </div>
              <div className="flex items-end justify-center gap-5 sm:gap-8">
                {current.book && (
                  <div className="text-center">
                    <Cover work={current.book} className="w-36 sm:w-48 -rotate-3" priority />
                    <div className="mt-4 text-xs uppercase tracking-[0.2em] text-ink-faint">The book</div>
                    <div className="font-display text-lg">{current.book.title}</div>
                  </div>
                )}
                {current.films.length > 0 && (
                  <div className="text-center">
                    <div className="relative mx-auto h-[13.5rem] w-32 sm:h-[16.5rem] sm:w-40">
                      {current.films.slice(0, 3).map((f, i, arr) => (
                        <div key={f.id} className="absolute inset-0 transition-transform" style={{ transform: `translateX(${(i - (arr.length - 1) / 2) * 26}px) rotate(${(i - (arr.length - 1) / 2) * 6}deg)`, zIndex: i }}>
                          <Cover work={f} className="w-full" />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-xs uppercase tracking-[0.2em] text-ink-faint">Film recommendations</div>
                    <div className="font-display text-lg">{current.films.length === 1 ? current.films[0].title : `${current.films.length} films to choose from`}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section id="how" className="container-page mt-28 scroll-mt-24">
        <div className="max-w-2xl">
          <div className="eyebrow">The WOW cycle</div>
          <h2 className="h-section mt-3">Two months. One country. Four steps.</h2>
        </div>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-[1.25rem] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Read', 'A landmark book chosen with our friend from that country — the story a nation tells about itself.'],
            ['Watch', 'Its cinema: one film or a small season, from classics to the newest releases.'],
            ['Meet', 'Two live sessions: a launch where our friend introduces the country, and a closing discussion & Q&A.'],
            ['Get stamped', 'Complete the expedition and a visa is stamped into your Cultural Passport.'],
          ].map(([title, text], i) => (
            <li key={title} className="bg-bg p-7">
              <div className="num font-display text-5xl text-accent">{pad2(i + 1)}</div>
              <div className="mt-6 font-display text-2xl">{title}</div>
              <p className="mt-2 text-[0.95rem] text-ink-soft">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* JOURNEY */}
      <section className="container-page mt-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="eyebrow">Our journey so far</div>
            <h2 className="h-section mt-3">Stamps in the club passport</h2>
          </div>
          <Link href="/expeditions" className="btn btn-ghost">All expeditions</Link>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {expeditions.map((e) => (
            <Link key={e.id} href={`/expeditions/${e.slug}`} className="group card relative flex flex-col items-center overflow-hidden bg-paper p-6 text-paper-ink transition hover:-translate-y-1">
              <Stamp country={e.country.name} number={e.number} dateLabel={formatMonthRange(e.startsOn, e.endsOn)} color={e.accentColor} faded={e.status === 'upcoming'} label={e.status === 'completed' ? 'Visa granted' : e.status === 'current' ? 'In progress' : 'Coming soon'} />
              <div className="mt-4 text-center">
                <div className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] opacity-60">{e.status === 'current' ? 'Now' : e.status}</div>
                <div className="font-display text-xl">{e.book?.title ?? e.country.name}</div>
              </div>
            </Link>
          ))}
          <div className="flex min-h-48 flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-line-strong p-6 text-center text-ink-faint">
            <div className="font-display text-2xl">Where next?</div>
            <p className="mt-2 text-sm">Help choose our next country.</p>
            <Link href="/recommend" className="mt-4 text-sm text-accent link-underline">Recommend one →</Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="container-page mt-24">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.25rem] border border-line bg-line lg:grid-cols-4">
          {[
            [members.length, 'Explorers', '/members'],
            [countriesRepresented, 'Home countries', '/members'],
            [completed, completed === 1 ? 'Expedition completed' : 'Expeditions completed', '/expeditions'],
            [library.length, 'Books in the Library', '/library'],
          ].map(([n, label, href]) => (
            <Link key={String(label)} href={String(href)} className="bg-bg p-7 transition hover:bg-raised">
              <div className="num font-display text-5xl sm:text-6xl">{n}</div>
              <div className="mt-2 text-sm uppercase tracking-[0.16em] text-ink-faint">{label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* WORLD MAP */}
      <section className="container-page mt-28">
        <div className="max-w-2xl">
          <div className="eyebrow">The world, so far</div>
          <h2 className="h-section mt-3">Where we have been — and where explorers call home</h2>
          <p className="mt-4 text-ink-soft">Tap any country for a fact, its capital and a way into the Library. Gold outlines mark our expeditions; golden bubbles show where our explorers live.</p>
        </div>
        <div className="mt-10">
          <WorldMapClient data={world} />
        </div>
      </section>

      {/* HORIZON */}
      {horizon.length > 0 && (
        <section className="container-page mt-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="eyebrow">On our horizon</div>
              <h2 className="h-section mt-3">Books we&rsquo;re dreaming of reading together</h2>
            </div>
            <Link href="/library" className="btn btn-ghost">Browse the Library</Link>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {horizon.map((w) => (
              <div key={w.id}>
                <Cover work={w} className="w-full" />
                <div className="mt-3 flex items-center gap-2 text-xs text-ink-faint">
                  <Flag iso2={w.countryIso2!} name={w.countryName} className="h-3 w-4" /> {w.countryName}
                </div>
                <div className="mt-1 font-display text-lg leading-tight">{w.title}</div>
                <div className="text-sm text-ink-soft">{w.creator}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
