import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { ActionButton, Panel, Submit } from '@/components/admin/forms';
import { LocalTime } from '@/components/LocalTime';
import { db, schema } from '@/server/db';
import { adminSite } from '@/server/admin/data';
import { assignAttendance, deleteAttendance } from '@/server/admin/verification-actions';
import { ImportForm, ManualForm } from './AttendanceForms';

export const metadata = { title: 'Attendance' };

export default async function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const site = await adminSite();
  const ev = site.allEvents.find((e) => e.id === id);
  if (!ev) notFound();
  const exp = ev.expeditionId ? site.expeditions.find((e) => e.id === ev.expeditionId) : null;
  const threshold = Number(site.settings.attendance_min_minutes) || 30;

  const [rows, mem] = await Promise.all([
    db.select().from(schema.attendance).where(eq(schema.attendance.eventId, id)).orderBy(asc(schema.attendance.displayName)),
    db.select({ id: schema.members.id, name: schema.members.name }).from(schema.members).where(eq(schema.members.status, 'active')).orderBy(asc(schema.members.name)),
  ]);
  const names = new Map(mem.map((m) => [m.id, m.name]));
  const unmatched = rows.filter((r) => !r.memberId);
  const perMember = new Map<number, number>();
  for (const r of rows) if (r.memberId) perMember.set(r.memberId, (perMember.get(r.memberId) ?? 0) + r.minutes);
  const summary = [...perMember.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/admin/calendar" className="text-sm text-ink-faint hover:text-accent">← Calendar</Link>
        <h1 className="font-display text-4xl">Attendance</h1>
      </div>
      <p className="-mt-3 text-ink-soft">
        {exp ? `${exp.country.name} · ` : ''}{ev.title} · <LocalTime iso={ev.startsAt} fallbackZone={ev.hostTimezone} />. Counts as attended at <strong>{threshold}+ minutes</strong> (change in Settings).
      </p>

      <Panel title="Import from Zoom" description="Zoom only reports a participant’s email if they signed in or registered; others appear by display name and may need matching below.">
        <ImportForm eventId={id} />
      </Panel>

      {unmatched.length > 0 && (
        <Panel title={`Needs matching (${unmatched.length})`} description="These participants couldn’t be matched to a member automatically. Choose who they are — or ignore guests and friends.">
          <ul className="divide-y divide-line">
            {unmatched.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{r.displayName}</div>
                  <div className="text-xs text-ink-faint">{r.email ?? 'no email'} · {r.minutes} min</div>
                </div>
                <form action={assignAttendance} className="flex gap-2">
                  <input type="hidden" name="attendanceId" value={r.id} />
                  <select name="memberId" className="field !w-52 !py-1.5 text-sm" aria-label={`Match ${r.displayName}`} defaultValue="">
                    <option value="">Match to member…</option>
                    {mem.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <Submit className="btn btn-ghost !px-3 !py-1.5 !text-[0.7rem]">Match</Submit>
                </form>
                <ActionButton action={deleteAttendance} fields={{ attendanceId: r.id }}>Ignore</ActionButton>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title={`Matched members (${summary.length})`}>
        {summary.length === 0 ? (
          <p className="text-sm text-ink-faint">No attendance recorded yet.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {summary.map(([mid, minutes]) => (
              <li key={mid} className="flex items-center justify-between py-2.5">
                <Link href={`/admin/members/${mid}`} className="hover:text-accent">{names.get(mid) ?? `Member ${mid}`}</Link>
                <span className={minutes >= threshold ? 'text-ok' : 'text-ink-faint'}>{minutes} min {minutes >= threshold ? '✓ attended' : '· below threshold'}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Mark someone as attended" description="For people who joined by phone, shared a screen, or whom Zoom couldn’t identify.">
        <ManualForm eventId={id} members={mem} />
      </Panel>
    </div>
  );
}
