import Link from 'next/link';
import { ActionButton, Panel } from '@/components/admin/forms';
import { EventForm } from '@/components/admin/EventForm';
import { LocalTime } from '@/components/LocalTime';
import { deleteEvent } from '@/server/admin/actions';
import { adminSite } from '@/server/admin/data';

export const metadata = { title: 'Calendar' };

export default async function AdminCalendar() {
  const site = await adminSite();
  const tz = site.settings.default_timezone || 'Asia/Kolkata';
  const expeditions = site.expeditions.map((e) => ({ id: e.id, name: `${String(e.number).padStart(2, '0')} · ${e.country.name}` }));
  const names = new Map(site.expeditions.map((e) => [e.id, e.country.name]));
  const now = Date.now();
  const upcoming = site.allEvents.filter((e) => new Date(e.startsAt).getTime() + e.durationMin * 60_000 > now);
  const past = site.allEvents.filter((e) => new Date(e.startsAt).getTime() + e.durationMin * 60_000 <= now).reverse();

  const Row = ({ ev }: { ev: (typeof site.allEvents)[number] }) => (
    <li>
      <details className="rounded-xl border border-line bg-bg">
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-3">
          <span className="flex-1">
            <span className="font-medium">{ev.title}</span>
            <span className="ml-2 text-xs text-ink-faint">{ev.expeditionId ? names.get(ev.expeditionId) : 'Club-wide'} · {ev.kind}</span>
            {!ev.published && <span className="ml-2 chip !py-0">hidden</span>}
            <span className="block text-sm text-ink-faint"><LocalTime iso={ev.startsAt} fallbackZone={ev.hostTimezone} /></span>
          </span>
          <span className="text-xs text-ink-faint">Edit ▾</span>
        </summary>
        <div className="border-t border-line p-4">
          <EventForm event={ev} expeditions={expeditions} defaultTimezone={tz} />
          <div className="mt-4 border-t border-line pt-4">
            <div className="flex flex-wrap gap-3">
              <Link href={`/admin/calendar/${ev.id}/attendance`} className="btn btn-ghost !px-3 !py-1.5 !text-[0.7rem]">Attendance</Link>
              <ActionButton action={deleteEvent} fields={{ id: ev.id }} confirm={`Delete “${ev.title}”?`}>Delete</ActionButton>
            </div>
          </div>
        </div>
      </details>
    </li>
  );

  return (
    <div className="grid gap-6">
      <h1 className="font-display text-4xl">Calendar</h1>
      <div id="add">
        <Panel title="Schedule a session" description="Meetings, classes, socials — linked to an expedition or club-wide. They appear on the site, the countdown and the .ics feed automatically.">
          <EventForm expeditions={expeditions} expeditionId={site.expeditions.find((e) => e.status === 'current')?.id} defaultTimezone={tz} />
        </Panel>
      </div>
      <Panel title={`Upcoming (${upcoming.length})`}>
        <ul className="grid gap-3">{upcoming.map((ev) => <Row key={ev.id} ev={ev} />)}</ul>
        {upcoming.length === 0 && <p className="text-sm text-ink-faint">Nothing scheduled.</p>}
      </Panel>
      <Panel title={`Past (${past.length})`} description="Add recording links to past sessions here.">
        <ul className="grid gap-3">{past.map((ev) => <Row key={ev.id} ev={ev} />)}</ul>
      </Panel>
    </div>
  );
}
