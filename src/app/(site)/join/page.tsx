import type { Metadata } from 'next';
import Link from 'next/link';
import { Flag } from '@/components/brand';
import { AddToCalendar } from '@/components/AddToCalendar';
import { toCalEvent } from '@/lib/calendar';
import { Countdown } from '@/components/Countdown';
import { Cover } from '@/components/Cover';
import { LocalTime } from '@/components/LocalTime';
import { ZoneConverter } from '@/components/site/ZoneConverter';
import { getNextEvent, getSettings } from '@/server/queries';

export const metadata: Metadata = { title: 'Join the next meeting' };

export default async function JoinPage() {
  const [next, settings] = await Promise.all([getNextEvent(), getSettings()]);
  const exp = next?.expedition;
  const meetUrl = next?.event.joinUrl || settings.default_meet_url;

  return (
    <div className="container-page pt-36" style={{ ['--accent' as string]: exp?.accentColor }}>
      {!next ? (
        <div className="max-w-2xl">
          <div className="eyebrow">Next meeting</div>
          <h1 className="display mt-4">The next session is being planned.</h1>
          <p className="lede mt-6">Join the community chat to hear first when it&rsquo;s announced.</p>
          {settings.whatsapp_url && <a href={settings.whatsapp_url} className="btn btn-primary mt-8" target="_blank" rel="noreferrer">Join the WhatsApp community</a>}
        </div>
      ) : (
        <div className="grid gap-14 lg:grid-cols-[1.3fr_1fr]">
          <div>
            {exp && (
              <div className="eyebrow flex items-center gap-2">
                Expedition {String(exp.number).padStart(2, '0')} · {exp.country.name}
                <Flag iso2={exp.countryIso2} name={exp.country.name} className="h-3.5 w-5" />
              </div>
            )}
            <h1 className="display mt-4 !text-[clamp(2.5rem,6vw,5rem)]">{next.event.title}</h1>
            <p className="mt-5 font-display text-2xl text-ink-soft sm:text-3xl">
              <LocalTime iso={next.event.startsAt} fallbackZone={next.event.hostTimezone} />
            </p>
            {next.event.description && <p className="lede mt-5 max-w-xl">{next.event.description}</p>}

            <div className="mt-10">
              <Countdown iso={next.event.startsAt} durationMin={next.event.durationMin} />
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {meetUrl && (
                <a href={meetUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" /></svg>
                  Join the meeting
                </a>
              )}
              {settings.whatsapp_url && (
                <a href={settings.whatsapp_url} target="_blank" rel="noreferrer" className="btn btn-ghost">
                  WhatsApp community
                </a>
              )}
              <AddToCalendar event={toCalEvent(next.event, settings.default_meet_url, exp ? exp.country.name + ' · ' : '')} />
            </div>

            <div className="mt-12 max-w-md">
              <ZoneConverter iso={next.event.startsAt} />
            </div>
          </div>

          {exp && (
            <aside className="card h-fit p-7">
              <div className="eyebrow">Before you come</div>
              <p className="mt-3 text-ink-soft">Read a little, watch a little — and bring your questions for {exp.friends[0]?.name ?? 'our friend'}.</p>
              <div className="mt-6 flex gap-5">
                {exp.book && <Cover work={exp.book} className="w-28" />}
                {exp.film && <Cover work={exp.film} className="w-24" />}
              </div>
              <Link href={`/expeditions/${exp.slug}`} className="btn btn-ghost mt-7 w-full">
                Open the {exp.country.name} expedition
              </Link>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
