'use client';

import { ActionForm, Field, Select, Submit } from '@/components/admin/forms';
import { awardVisaAdmin, revokeVisaAdmin, setParticipationAdmin } from '@/server/admin/verification-actions';
import { STATUS_LABEL, STATUS_TONE, VISA_LABEL, type ParticipationStatus } from '@/lib/participation';

export type ManagerExpedition = {
  id: number;
  country: string;
  activities: { targetKey: string; kind: 'book' | 'movie' | 'class'; label: string; status: ParticipationStatus }[];
  books: { id: number; title: string }[];
  awards: { id: number; kind: 'book' | 'movie' | 'class' | 'legacy'; reason: string; source: string; awardedAt: string; revokedAt: string | null; revokedReason: string | null }[];
};

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export function VisaManager({ memberId, expeditions }: { memberId: number; expeditions: ManagerExpedition[] }) {
  return (
    <div className="grid gap-6">
      {expeditions.map((e) => (
        <details key={e.id} className="rounded-xl border border-line bg-bg" open={e.awards.length > 0 || e.activities.some((a) => a.status !== 'unconfirmed')}>
          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4">
            <span className="font-display text-xl">{e.country}</span>
            <span className="flex flex-wrap gap-1">
              {e.awards.filter((a) => !a.revokedAt).map((a) => <span key={a.id} className="chip !px-2 !py-0 !text-[0.65rem] !border-ok/50 !text-ok">{VISA_LABEL[a.kind]}</span>)}
            </span>
            <span className="ml-auto text-xs text-ink-faint">Open ▾</span>
          </summary>

          <div className="grid gap-8 border-t border-line p-4">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">What they did</h3>
              <ul className="grid gap-2">
                {e.activities.map((a) => (
                  <li key={a.targetKey}>
                    <ActionForm action={setParticipationAdmin} className="flex flex-wrap items-center gap-3">
                      <input type="hidden" name="memberId" value={memberId} />
                      <input type="hidden" name="expeditionId" value={e.id} />
                      <input type="hidden" name="targetKey" value={a.targetKey} />
                      <span className="min-w-0 flex-1 text-sm">{a.kind === 'book' ? '📖' : a.kind === 'movie' ? '🎬' : '🎥'} {a.label}</span>
                      <span className={`text-xs ${STATUS_TONE[a.status]}`}>{STATUS_LABEL[a.status]}</span>
                      <select name="status" defaultValue={['awaiting', 'expired'].includes(a.status) ? 'unconfirmed' : a.status} className="field !w-44 !py-1.5 text-sm" aria-label={`Set status for ${a.label}`}>
                        <option value="unconfirmed">Unconfirmed</option>
                        <option value="confirmed">Confirmed (read / watched / attended)</option>
                        <option value="declined">Not completed</option>
                        {a.kind === 'class' && <option value="verified">Attended — verified</option>}
                      </select>
                      <Submit className="btn btn-ghost !px-3 !py-1.5 !text-[0.7rem]">Set</Submit>
                    </ActionForm>
                  </li>
                ))}
                {e.activities.length === 0 && <li className="text-sm text-ink-faint">This expedition has no activities yet.</li>}
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Visa history</h3>
              <ul className="grid gap-3">
                {e.awards.map((a) => (
                  <li key={a.id} className={`rounded-lg border p-3 ${a.revokedAt ? 'border-line opacity-60' : 'border-line'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{VISA_LABEL[a.kind]} {a.revokedAt && <span className="text-xs text-danger">· revoked {fmt(a.revokedAt)}</span>}</span>
                      <span className="text-xs text-ink-faint">{fmt(a.awardedAt)} · {a.source}</span>
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">{a.reason}</p>
                    {a.revokedReason && <p className="mt-1 text-sm text-danger">Revoked: {a.revokedReason}</p>}
                    {!a.revokedAt && (
                      <ActionForm action={revokeVisaAdmin} className="mt-3 flex flex-wrap gap-2">
                        <input type="hidden" name="awardId" value={a.id} />
                        <input name="reason" required minLength={3} placeholder="Reason for revoking" className="field !w-64 !py-1.5 text-sm" aria-label="Reason for revoking" />
                        <Submit className="btn btn-ghost !px-3 !py-1.5 !text-[0.7rem]">Revoke</Submit>
                      </ActionForm>
                    )}
                  </li>
                ))}
                {e.awards.length === 0 && <li className="text-sm text-ink-faint">No visas yet.</li>}
              </ul>
            </div>

            <ActionForm action={awardVisaAdmin} resetOnSuccess className="grid gap-3 rounded-xl border border-dashed border-line-strong p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Award a visa manually</h3>
              <input type="hidden" name="memberId" value={memberId} />
              <input type="hidden" name="expeditionId" value={e.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Visa" name="kind" options={[['class', 'Class Visa'], ['movie', 'Movie Visa'], ['book', 'Book Visa']]} />
                <Select label="Book (for Book Visa)" name="workId" options={[['', '—'], ...e.books.map((b) => [String(b.id), b.title] as [string, string])]} />
              </div>
              <Field label="Reason (stored on the visa)" name="reason" required minLength={3} placeholder="e.g. Attended by phone; confirmed on the WhatsApp group" />
              <div>
                <Submit>Award visa</Submit>
              </div>
            </ActionForm>
          </div>
        </details>
      ))}
    </div>
  );
}
