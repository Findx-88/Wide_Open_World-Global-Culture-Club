'use client';

import Link from 'next/link';
import { ActionForm, Field, Select, Submit } from '@/components/admin/forms';
import { openConfirmationsNow, recheckExpedition, saveVisaRules } from '@/server/admin/verification-actions';

export type Stats = {
  activeMembers: number;
  withEmail: number;
  requestsOpen: number;
  requestsAnswered: number;
  requestsExpired: number;
  awards: { book: number; movie: number; class: number; legacy: number };
};

export function VerificationPanel({
  expeditionId,
  rules,
  opened,
  stats,
  hasActivities,
}: {
  expeditionId: number;
  rules: { classVisaEvidence: 'any' | 'verified'; classVisaMinSessions: number; movieVisaMinFilms: number };
  opened: string | null;
  stats: Stats;
  hasActivities: boolean;
}) {
  return (
    <div className="grid gap-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [stats.awards.book, 'Book visas'],
          [stats.awards.movie, 'Movie visas'],
          [stats.awards.class, 'Class visas'],
          [stats.awards.legacy, 'Legacy (unverified)'],
          [stats.requestsOpen, 'Waiting for an answer'],
          [stats.requestsAnswered, 'Answered'],
          [stats.requestsExpired, 'Expired'],
          [`${stats.withEmail}/${stats.activeMembers}`, 'Members with email'],
        ].map(([n, l]) => (
          <div key={String(l)} className="rounded-xl border border-line bg-bg p-4">
            <div className="num font-display text-3xl">{n}</div>
            <div className="text-xs uppercase tracking-[0.12em] text-ink-faint">{l}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <ActionForm action={saveVisaRules} className="grid gap-4">
          <h3 className="font-display text-xl">Visa rules</h3>
          <input type="hidden" name="expeditionId" value={expeditionId} />
          <Select
            label="Class visa needs…"
            name="classVisaEvidence"
            defaultValue={rules.classVisaEvidence}
            options={[
              ['any', 'Verified attendance, or the member’s own confirmation'],
              ['verified', 'Verified attendance only (Zoom report / admin)'],
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sessions to attend" name="classVisaMinSessions" type="number" min={1} defaultValue={rules.classVisaMinSessions} />
            <Field label="Films to watch (Movie Visa)" name="movieVisaMinFilms" type="number" min={1} defaultValue={rules.movieVisaMinFilms} />
          </div>
          <p className="text-xs text-ink-faint">Each book marked “earns its own Book Visa” (in the book’s settings above) gets a separate visa. One Movie Visa covers all films.</p>
          <div>
            <Submit>Save rules</Submit>
          </div>
        </ActionForm>

        <div className="grid content-start gap-6">
          <ActionForm action={openConfirmationsNow} className="grid gap-3">
            <h3 className="font-display text-xl">Confirmations</h3>
            <p className="text-sm text-ink-soft">
              {opened
                ? `Opened on ${new Date(opened).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}. Members are asked what they read, watched and attended; reminders follow your schedule in Settings.`
                : 'Not opened yet. It opens automatically after the last session ends, or you can open it now.'}
            </p>
            <input type="hidden" name="expeditionId" value={expeditionId} />
            <div className="flex flex-wrap gap-3">
              <Submit className="btn btn-primary" >{opened ? 'Send to anyone not yet asked' : 'Open confirmations now'}</Submit>
            </div>
            {!hasActivities && <p className="text-xs text-danger">Add a book, a film or a session first — there is nothing to confirm yet.</p>}
          </ActionForm>

          <ActionForm action={recheckExpedition} className="grid gap-2">
            <input type="hidden" name="expeditionId" value={expeditionId} />
            <p className="text-sm text-ink-soft">Changed a rule? Re-check everyone against it. This only ever adds visas.</p>
            <div>
              <Submit className="btn btn-ghost">Re-check all members</Submit>
            </div>
          </ActionForm>

          <Link href={`/admin/expeditions/${expeditionId}/participation`} className="btn btn-ghost w-fit">See who confirmed what →</Link>
        </div>
      </div>
    </div>
  );
}
