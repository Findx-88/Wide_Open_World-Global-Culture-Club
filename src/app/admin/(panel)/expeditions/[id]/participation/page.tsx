import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { ActionButton, Panel } from '@/components/admin/forms';
import { db, schema } from '@/server/db';
import { reopenRequest } from '@/server/admin/verification-actions';
import { adminSite } from '@/server/admin/data';
import { STATUS_LABEL, STATUS_TONE, VISA_LABEL, type ParticipationStatus } from '@/lib/participation';
import { activitiesFor, expeditionProgress, keys } from '@/server/verification/rules';

export const metadata = { title: 'Participation' };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ show?: string }> };

export default async function ParticipationPage({ params, searchParams }: Props) {
  const id = Number((await params).id);
  const { show = 'all' } = await searchParams;
  const site = await adminSite();
  const e = site.expeditions.find((x) => x.id === id);
  if (!e) notFound();

  const [active, progress] = await Promise.all([db.select().from(schema.members).where(eq(schema.members.status, 'active')).orderBy(schema.members.name), expeditionProgress(id)]);
  const acts = activitiesFor(e);
  const books = acts.filter((a) => a.kind === 'book');
  const films = acts.filter((a) => a.kind === 'movie');
  const hasClass = acts.some((a) => a.kind === 'class');

  const rows = active.map((m) => {
    const parts = progress.participation.filter((p) => p.memberId === m.id);
    const st = (key: string): ParticipationStatus => parts.find((p) => p.targetKey === key)?.status ?? 'unconfirmed';
    const req = progress.requests.find((r) => r.memberId === m.id);
    const awards = progress.awards.filter((a) => a.memberId === m.id);
    const watched = films.filter((f) => ['confirmed', 'verified'].includes(st(f.targetKey))).length;
    const needsAttention = !awards.some((a) => a.kind !== 'legacy') && (!req || req.status === 'open');
    return { m, st, req, awards, watched, needsAttention };
  });
  const shown = show === 'pending' ? rows.filter((r) => r.needsAttention) : rows;

  const Cell = ({ s }: { s: ParticipationStatus }) => <span className={`whitespace-nowrap text-xs font-medium ${STATUS_TONE[s]}`}>{STATUS_LABEL[s]}</span>;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link href={`/admin/expeditions/${id}`} className="text-sm text-ink-faint hover:text-accent">← {e.country.name}</Link>
        <h1 className="font-display text-4xl">Participation</h1>
        <div className="ml-auto flex gap-2 text-sm">
          <Link href="?show=all" className={`chip ${show === 'all' ? '!border-gold !text-gold' : ''}`}>Everyone</Link>
          <Link href="?show=pending" className={`chip ${show === 'pending' ? '!border-gold !text-gold' : ''}`}>No verified visa yet</Link>
        </div>
      </div>

      <Panel title={`${e.country.name} — ${shown.length} member${shown.length === 1 ? '' : 's'}`} description="Click a member to confirm, correct or award anything by hand. Statuses update as members answer and attendance is imported.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.1em] text-ink-faint">
              <tr className="border-b border-line">
                <th className="py-2 pr-3">Member</th>
                <th className="py-2 pr-3">Request</th>
                {books.map((b) => <th key={b.targetKey} className="py-2 pr-3">📖 {b.label}</th>)}
                {films.length > 0 && <th className="py-2 pr-3">🎬 Films ({films.length})</th>}
                {hasClass && <th className="py-2 pr-3">🎥 Sessions</th>}
                <th className="py-2">Visas</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(({ m, st, req, awards, watched }) => (
                <tr key={m.id} className="border-b border-line align-top">
                  <td className="py-3 pr-3">
                    <Link href={`/admin/members/${m.id}`} className="font-medium hover:text-accent">{m.name}</Link>
                    <div className="text-xs text-ink-faint">{m.email ?? 'no email'}</div>
                  </td>
                  <td className="py-3 pr-3 text-xs">
                    {req ? (
                      <>
                        <span className={req.status === 'expired' ? 'text-danger' : req.status === 'answered' ? 'text-ok' : 'text-gold'}>{req.status}</span>
                        <div className="text-ink-faint">{req.sentCount} email{req.sentCount === 1 ? '' : 's'}</div>
                        {req.status === 'expired' && <ActionButton action={reopenRequest} fields={{ requestId: req.id }} className="mt-1 text-accent link-underline">Reopen</ActionButton>}
                        {req.status !== 'answered' && <Link href={`/confirm/${req.token}`} target="_blank" className="mt-1 block text-accent link-underline">their link ↗</Link>}
                      </>
                    ) : (
                      <span className="text-ink-faint">not asked</span>
                    )}
                  </td>
                  {books.map((b) => <td key={b.targetKey} className="py-3 pr-3"><Cell s={st(b.targetKey)} /></td>)}
                  {films.length > 0 && (
                    <td className="py-3 pr-3 text-xs">
                      <span className={watched ? 'text-ok' : 'text-ink-faint'}>{watched}/{films.length} watched</span>
                    </td>
                  )}
                  {hasClass && <td className="py-3 pr-3"><Cell s={st(keys.class(e.id))} /></td>}
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {awards.map((a) => (
                        <span key={a.id} title={a.reason} className={`chip !px-2 !py-0 !text-[0.65rem] ${a.kind === 'legacy' ? '!text-ink-faint' : '!border-ok/50 !text-ok'}`}>{VISA_LABEL[a.kind]}</span>
                      ))}
                      {awards.length === 0 && <span className="text-ink-faint">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
