import Link from 'next/link';
import { WOWLogo } from '@/components/brand';
import { getSettings } from '@/server/queries';

export async function Footer() {
  const s = await getSettings();
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex items-start gap-5">
          <WOWLogo size={76} color="var(--gold)" className="shrink-0" />
          <div>
            <div className="font-display text-2xl">Wide Open World</div>
            <p className="mt-2 max-w-xs text-sm text-ink-soft">Two months. One country. A book, a film, a friend — read and watched together, all around the world.</p>
          </div>
        </div>
        <div>
          <div className="eyebrow mb-4 !text-ink-faint">Explore</div>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link className="hover:text-accent" href="/expeditions">Expeditions</Link></li>
            <li><Link className="hover:text-accent" href="/members">Explorers &amp; passports</Link></li>
            <li><Link className="hover:text-accent" href="/library">The Library</Link></li>
            <li><Link className="hover:text-accent" href="/calendar">Calendar</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-4 !text-ink-faint">Take part</div>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link className="hover:text-accent" href="/join">Join the next meeting</Link></li>
            <li><Link className="hover:text-accent" href="/recommend">Recommend a book or film</Link></li>
            {s.whatsapp_url && <li><a className="hover:text-accent" href={s.whatsapp_url} target="_blank" rel="noreferrer">WhatsApp community</a></li>}
            {s.instagram_url && <li><a className="hover:text-accent" href={s.instagram_url} target="_blank" rel="noreferrer">Instagram</a></li>}
            {s.contact_email && <li><a className="hover:text-accent" href={`mailto:${s.contact_email}`}>{s.contact_email}</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-6 text-xs text-ink-faint">
          <span>© {new Date().getFullYear()} Wide Open World · A global culture club</span>
          <span>&ldquo;The world is a book, and those who do not travel read only one page.&rdquo;</span>
        </div>
      </div>
    </footer>
  );
}
