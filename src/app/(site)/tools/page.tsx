import type { Metadata } from 'next';
import { SubscribeToCalendar } from '@/components/AddToCalendar';
import { getSettings } from '@/server/queries';

export const metadata: Metadata = { title: 'Explorer tools' };

export default async function ToolsPage() {
  const s = await getSettings();
  return (
    <div className="container-page pt-36">
      <div className="max-w-2xl">
        <div className="eyebrow">Explorer tools</div>
        <h1 className="display mt-4">Read further, read faster.</h1>
      </div>
      <div className="mt-14 grid gap-6 md:grid-cols-2">
        <article className="card relative overflow-hidden p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
          <div className="grid h-14 w-14 place-items-center rounded-full border border-line-strong text-gold">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" /></svg>
          </div>
          <h2 className="mt-6 font-display text-3xl">VelocityRead — your reading assistant</h2>
          <p className="mt-3 text-ink-soft">Upload your book&rsquo;s PDF and choose how many days you have. VelocityRead splits it into a schedule and gives you guided, distraction-free reading tools to help you finish on time.</p>
          {s.reading_assistant_url ? (
            <a href={s.reading_assistant_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-8">Open the tool →</a>
          ) : (
            <p className="mt-8 text-sm text-ink-faint">Coming soon.</p>
          )}
        </article>
        <article className="card p-8">
          <div className="grid h-14 w-14 place-items-center rounded-full border border-line-strong text-gold">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>
          </div>
          <h2 className="mt-6 font-display text-3xl">Club calendar feed</h2>
          <p className="mt-3 text-ink-soft">Subscribe once in Google Calendar, Apple Calendar or Outlook — every new WOW session appears automatically, in your own time zone.</p>
          <div className="mt-8">
            <SubscribeToCalendar label="Subscribe to the calendar" className="btn btn-ghost" />
          </div>
        </article>
      </div>
    </div>
  );
}
