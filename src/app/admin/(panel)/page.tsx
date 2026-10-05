import Link from 'next/link';
import { Flag } from '@/components/brand';
import { ActionButton, Panel } from '@/components/admin/forms';
import { LocalTime } from '@/components/LocalTime';
import { setCurrentExpedition } from '@/server/admin/actions';
import { adminActivity, adminMembers, adminRecommendations, adminSite } from '@/server/admin/data';
import { formatRange } from '@/lib/time';

export const metadata = { title: 'Dashboard' };

export default async function Dashboard() {
  const [site, members, recs, activity] = await Promise.all([adminSite(), adminMembers(), adminRecommendations(), adminActivity()]);
  const current = site.expeditions.find((e) => e.status === 'current');
  const override = site.settings.current_expedition_id;
  const upcoming = site.events.filter((e) => new Date(e.startsAt).getTime() > Date.now()).slice(0, 4);
  const active = members.filter((m) => m.status === 'active');
  const newRecs = recs.filter((r) => r.status === 'new').length;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-4xl">Dashboard</h1>
        <p className="text-ink-faint">Everything the public site shows comes from here.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          [active.length, 'Active members', '/admin/members'],
          [site.expeditions.length, 'Expeditions', '/admin/expeditions'],
          [upcoming.length, 'Upcoming sessions', '/admin/calendar'],
          [newRecs, 'New recommendations', '/admin/recommendations'],
        ].map(([n, l, href]) => (
          <Link key={String(l)} href={String(href)} className="card p-5 transition hover:border-gold">
            <div className="num font-display text-4xl">{n}</div>
            <div className="text-xs uppercase tracking-[0.14em] text-ink-faint">{l}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Current expedition" description={override ? 'Pinned manually.' : 'Chosen automatically from the dates.'}>
          {current ? (
            <div className="flex items-center gap-4">
              <Flag iso2={current.countryIso2} name={current.country.name} className="h-8 w-12" />
              <div className="flex-1">
                <div className="font-display text-2xl">{current.country.name}</div>
                <div className="text-sm text-ink-faint">{formatRange(current.startsOn, current.endsOn)} · {current.book?.title ?? 'no book yet'}</div>
              </div>
              <Link href={`/admin/expeditions/${current.id}`} className="btn btn-ghost !px-3 !py-1.5 !text-[0.7rem]">Edit</Link>
            </div>
          ) : (
            <p className="text-ink-soft">No expedition yet. <Link className="link-underline" href="/admin/expeditions">Create one</Link>.</p>
          )}
          <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
            <span className="w-full text-xs text-ink-faint">Switch the current expedition:</span>
            {site.expeditions.map((e) => (
              <ActionButton key={e.id} action={setCurrentExpedition} fields={{ expeditionId: e.id }} className={`btn !px-3 !py-1.5 !text-[0.7rem] ${String(e.id) === override ? 'btn-primary' : 'btn-ghost'}`}>
                {e.country.name}
              </ActionButton>
            ))}
            <ActionButton action={setCurrentExpedition} fields={{ expeditionId: 'auto' }} className={`btn !px-3 !py-1.5 !text-[0.7rem] ${!override ? 'btn-primary' : 'btn-ghost'}`}>
              Automatic (by dates)
            </ActionButton>
          </div>
        </Panel>

        <Panel title="Next sessions" actions={<Link href="/admin/calendar" className="text-sm text-accent link-underline">Calendar →</Link>}>
          {upcoming.length === 0 ? (
            <p className="text-ink-soft">Nothing scheduled.</p>
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.map((ev) => (
                <li key={ev.id} className="py-3">
                  <div className="font-medium">{ev.title}</div>
                  <div className="text-sm text-ink-faint"><LocalTime iso={ev.startsAt} fallbackZone={ev.hostTimezone} /></div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Quick actions">
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/members#add" className="btn btn-primary">Add a member</Link>
            <Link href="/admin/expeditions#new" className="btn btn-ghost">New expedition</Link>
            <Link href="/admin/calendar#add" className="btn btn-ghost">Schedule a session</Link>
          </div>
        </Panel>

        <Panel title="Recent activity">
          <ul className="grid gap-2 text-sm">
            {activity.map(({ log, adminName }) => (
              <li key={log.id} className="flex justify-between gap-4">
                <span className="text-ink-soft">{adminName ?? 'Someone'} · {log.action.replace(/_/g, ' ')} {log.entity}</span>
                <span className="shrink-0 text-ink-faint">{new Date(log.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
              </li>
            ))}
            {activity.length === 0 && <li className="text-ink-faint">No changes yet.</li>}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
