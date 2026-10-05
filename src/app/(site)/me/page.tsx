import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { AddToCalendar } from '@/components/AddToCalendar';
import { Flag } from '@/components/brand';
import { LocalTime } from '@/components/LocalTime';
import { toCalEvent } from '@/lib/calendar';
import { VISA_LABEL } from '@/lib/participation';
import { db, schema } from '@/server/db';
import { getMember } from '@/server/member-auth';
import { ensurePrefs } from '@/server/notifications/queue';
import { getPassport, getSite, getUpcomingEvents } from '@/server/queries';

export const metadata: Metadata = { title: 'My passport', robots: { index: false } };

export default async function MePage() {
  const m = await getMember();
  if (!m) redirect('/login');
  const [passport, site, events, requests, prefs] = await Promise.all([
    getPassport(m.passportNumber),
    getSite(),
    getUpcomingEvents(3),
    db.select().from(schema.confirmationRequests).where(and(eq(schema.confirmationRequests.memberId, m.id), eq(schema.confirmationRequests.status, 'open'))),
    ensurePrefs(m.id),
  ]);
  const stamps = passport?.stamps ?? [];
  const totalVisas = stamps.reduce((n, s) => n + s.visas.length, 0);
  const current = site.expeditions.find((e) => e.status === 'current');
  const pending = requests.map((r) => ({ r, exp: site.expeditions.find((e) => e.id === r.expeditionId) })).filter((x) => x.exp);

  return (
    <div className="container-page pt-28 sm:pt-36">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">My passport · {m.passportNumber}</div>
          <h1 className="display mt-3 !text-[clamp(2.4rem,6vw,4.6rem)]">Hello, {m.name.split(' ')[0]}.</h1>
        </div>
        <a href="/auth/logout" className="btn btn-ghost">
          Log out
        </a>
      </div>

      {pending.length > 0 && (
        <section className="mt-10 grid gap-3">
          {pending.map(({ r, exp }) => (
            <Link key={r.id} href={`/confirm/${r.token}`} className="card flex flex-wrap items-center justify-between gap-4 !border-gold p-5 transition hover:bg-raised">
              <span>
                <span className="eyebrow">Action needed</span>
                <span className="mt-1 block font-display text-2xl">Confirm what you read, watched &amp; attended — {exp!.country.name}</span>
              </span>
              <span className="btn btn-primary">Confirm now →</span>
            </Link>
          ))}
        </section>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="card p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl">Your Cultural Passport</h2>
              <p className="text-ink-soft">
                {totalVisas} visa{totalVisas === 1 ? '' : 's'} across {stamps.length} countr{stamps.length === 1 ? 'y' : 'ies'}
              </p>
            </div>
            <Link href={`/passport/${m.passportNumber}`} className="btn btn-primary">Open</Link>
          </div>
          <ul className="mt-6 grid gap-3">
            {stamps.map((s) => (
              <li key={s.expedition.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
                <Flag iso2={s.expedition.countryIso2} name={s.expedition.country.name} className="h-5 w-7" />
                <span className="font-display text-xl">{s.expedition.country.name}</span>
                <span className="ml-auto flex flex-wrap gap-1.5">
                  {s.visas.map((v, i) => (
                    <span key={i} className={`chip !py-0.5 ${v.kind === 'legacy' ? '' : '!border-ok/60 !text-ok'}`}>{VISA_LABEL[v.kind]}</span>
                  ))}
                </span>
              </li>
            ))}
            {stamps.length === 0 && <li className="text-ink-soft">Your first stamp is waiting — join a session and confirm what you read and watched.</li>}
          </ul>
          {current && (
            <p className="mt-5 text-sm text-ink-soft">
              Now exploring <Link className="link-underline" href={`/expeditions/${current.slug}`}>{current.country.name}</Link>.
            </p>
          )}
        </section>

        <section className="card p-6 sm:p-8">
          <h2 className="font-display text-3xl">Upcoming sessions</h2>
          <ul className="mt-5 grid gap-4">
            {events.map((ev) => (
              <li key={ev.id} className="rounded-xl border border-line p-4">
                <div className="font-medium">{ev.title}</div>
                <div className="text-sm text-ink-faint"><LocalTime iso={ev.startsAt} fallbackZone={ev.hostTimezone} /></div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <AddToCalendar event={toCalEvent(ev, site.settings.default_meet_url)} className="btn btn-ghost !px-4 !py-2 !text-[0.7rem]" />
                  <Link href="/join" className="btn btn-primary !px-4 !py-2 !text-[0.7rem]">Join</Link>
                </div>
              </li>
            ))}
            {events.length === 0 && <li className="text-ink-soft">Nothing scheduled yet.</li>}
          </ul>
          <Link href={`/preferences/${prefs.token}`} className="mt-6 inline-block text-sm text-accent link-underline">Email preferences →</Link>
        </section>
      </div>
    </div>
  );
}
