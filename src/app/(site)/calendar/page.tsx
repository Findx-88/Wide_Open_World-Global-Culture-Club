import type { Metadata } from 'next';
import Link from 'next/link';
import { AddToCalendar, SubscribeToCalendar } from '@/components/AddToCalendar';
import { toCalEvent } from '@/lib/calendar';
import { Flag } from '@/components/brand';
import { LocalTime } from '@/components/LocalTime';
import { getSite } from '@/server/queries';

export const metadata: Metadata = { title: 'Calendar', description: 'Every Wide Open World meeting, class and gathering — in your own time zone.' };

const KIND_LABEL = { meeting: 'Meeting', class: 'Class', social: 'Social', other: 'Event' } as const;

export default async function CalendarPage() {
  const site = await getSite();
  const now = Date.now();
  const byId = new Map(site.expeditions.map((e) => [e.id, e]));
  const upcoming = site.events.filter((e) => new Date(e.startsAt).getTime() + e.durationMin * 60_000 > now);
  const past = site.events.filter((e) => new Date(e.startsAt).getTime() + e.durationMin * 60_000 <= now).reverse();

  const groups = new Map<string, typeof upcoming>();
  for (const ev of upcoming) {
    const key = new Date(ev.startsAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: ev.hostTimezone });
    groups.set(key, [...(groups.get(key) ?? []), ev]);
  }

  return (
    <div className="container-page pt-36">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <div className="eyebrow">Calendar</div>
          <h1 className="display mt-4">See you there.</h1>
          <p className="lede mt-6">All times are shown in your own time zone. Add a single session with its Add button, or subscribe once and every new session appears in your calendar automatically.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <SubscribeToCalendar align="right" />
          <Link href="/join" className="btn btn-ghost">Join links</Link>
        </div>
      </div>

      {upcoming.length === 0 && <p className="mt-16 text-ink-soft">No sessions are scheduled yet — check back soon.</p>}

      {[...groups.entries()].map(([month, list]) => (
        <section key={month} className="mt-16">
          <h2 className="font-display text-3xl">{month}</h2>
          <ol className="mt-6 grid gap-4">
            {list.map((ev) => {
              const exp = ev.expeditionId ? byId.get(ev.expeditionId) : null;
              return (
                <li key={ev.id} className="card grid gap-4 p-6 sm:grid-cols-[auto_1fr_auto] sm:items-center" style={{ ['--accent' as string]: exp?.accentColor }}>
                  <div className="w-20 font-display">
                    <div className="num text-5xl leading-none">{new Date(ev.startsAt).toLocaleDateString('en-GB', { day: 'numeric', timeZone: ev.hostTimezone })}</div>
                    <div className="mt-1 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-accent">{new Date(ev.startsAt).toLocaleDateString('en-GB', { weekday: 'short', timeZone: ev.hostTimezone })}</div>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                      <span className="chip !py-0.5">{KIND_LABEL[ev.kind]}</span>
                      {exp && (
                        <Link href={`/expeditions/${exp.slug}`} className="inline-flex items-center gap-1.5 hover:text-accent">
                          <Flag iso2={exp.countryIso2} name={exp.country.name} className="h-3 w-4" /> {exp.country.name}
                        </Link>
                      )}
                    </div>
                    <div className="mt-2 font-display text-2xl">{ev.title}</div>
                    <div className="mt-1 text-sm text-ink-soft"><LocalTime iso={ev.startsAt} fallbackZone={ev.hostTimezone} /> · {ev.durationMin} min</div>
                    {ev.description && <p className="mt-2 text-sm text-ink-soft">{ev.description}</p>}
                  </div>
                  <div className="flex flex-wrap gap-3 sm:justify-end">
                    <AddToCalendar event={toCalEvent(ev, site.settings.default_meet_url, exp ? exp.country.name + ' · ' : '')} align="right" label="Add" />
                    <Link href="/join" className="btn btn-primary">Join</Link>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      {past.length > 0 && (
        <section className="mt-20">
          <h2 className="eyebrow !text-ink-faint">Past sessions</h2>
          <ul className="mt-5 divide-y divide-line border-y border-line text-sm">
            {past.map((ev) => {
              const exp = ev.expeditionId ? byId.get(ev.expeditionId) : null;
              return (
                <li key={ev.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <span className="flex items-center gap-3">
                    {exp && <Flag iso2={exp.countryIso2} name={exp.country.name} className="h-3 w-4" />}
                    <span>{ev.title}</span>
                  </span>
                  <span className="flex items-center gap-4 text-ink-faint">
                    <LocalTime iso={ev.startsAt} fallbackZone={ev.hostTimezone} mode="date" />
                    {ev.recordingUrl && <a href={ev.recordingUrl} className="text-accent link-underline" target="_blank" rel="noreferrer">Recording</a>}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
