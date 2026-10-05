import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Flag, WOWLogo } from '@/components/brand';
import { expeditionNo } from '@/lib/format';
import { getFriendBySlug } from '@/server/queries';

export const metadata: Metadata = { title: 'Guest invitation', robots: { index: false } };

type Props = { searchParams: Promise<{ id?: string }> };

/** Guest IDs from the v1 site, kept so invitation links already sent keep working. */
const LEGACY_GUEST_IDS: Record<string, string> = { 'WOW-GUEST-0001': 'shafagh-kazemi' };

/** Formal invitation for an expedition's friend: /guest-invite?id=<friend-slug> */
export default async function GuestInvitePage({ searchParams }: Props) {
  const { id } = await searchParams;
  const slug = id ? (LEGACY_GUEST_IDS[id] ?? id) : null;
  const found = slug ? await getFriendBySlug(slug) : null;
  if (!found) notFound();
  const { friend, expedition: e } = found;
  const launch = e.events[0];
  const firstName = friend.name.split(' ')[0];
  const tz = launch?.hostTimezone ?? 'UTC';
  const when = launch ? new Date(launch.startsAt) : null;
  // Show the time where the friend lives when we can infer it, otherwise the host time zone.
  const details = [
    ['Expedition', `${expeditionNo(e.number)} · ${e.country.name}`],
    when && ['Date', when.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: tz })],
    when && ['Time', when.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: tz })],
    ['Format', 'Online · global audience'],
    e.book && ['Book', `${e.book.title} — ${e.book.creator}`],
    e.film && ['Film', `${e.film.title} — ${e.film.creator}`],
  ].filter(Boolean) as [string, string][];

  return (
    <div className="container-page pt-32" style={{ ['--accent' as string]: e.accentColor }}>
      <div className="eyebrow text-center !text-ink-faint">Wide Open World · formal guest invitation</div>
      <article className="mx-auto mt-6 max-w-2xl overflow-hidden rounded-sm bg-paper text-paper-ink shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)] outline outline-4 outline-offset-[6px] outline-gold/15">
        <div className="h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
        <header className="flex items-center gap-4 border-b border-black/10 px-8 py-6 sm:px-10">
          <Flag iso2={e.countryIso2} name={e.country.name} className="h-8 w-12" width={160} />
          <div>
            <div className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-[#8a6a2a]">Guest card</div>
            <div className="font-display text-xl">{e.country.name}</div>
          </div>
          <WOWLogo size={56} color="#8a6a2a" className="ml-auto" />
        </header>
        <div className="px-8 py-10 sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-60">It is our honour to formally invite</p>
          <h1 className="mt-3 font-display text-5xl sm:text-6xl">{friend.name}</h1>
          <div className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#8a6a2a]">{friend.title ?? `Friend from ${e.country.name}`}</div>
          <div className="my-8 h-px bg-gradient-to-r from-transparent via-[#8a6a2a]/50 to-transparent" />
          <div className="space-y-4 font-display text-[1.2rem] leading-relaxed">
            <p>
              Wide Open World — a global book and film club that reads one culture at a time — cordially invites you to join us as our cultural guide for <strong>Expedition {e.country.name}</strong>.
            </p>
            <p>
              {e.book && <>We are reading <em>{e.book.title}</em></>}
              {e.book && e.film && ' and '}
              {e.film && <>watching <em>{e.film.title}</em></>}. Your perspective and stories will bring our members closer to the soul of {e.country.name} than any page or screen ever could.
            </p>
          </div>
          <dl className="mt-8 grid gap-x-6 gap-y-3 rounded-sm border border-[#8a6a2a]/25 bg-[#8a6a2a]/5 p-5 text-sm sm:grid-cols-[auto_1fr]">
            {details.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] opacity-55">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 font-display text-lg italic">With warmth and gratitude, {firstName} — thank you for opening your world to ours.</p>
          <div className="mt-6 font-hand text-3xl">The WOW Club</div>
        </div>
      </article>
      <div className="mt-10 text-center">
        <Link href={`/expeditions/${e.slug}`} className="btn btn-primary">View the {e.country.name} expedition →</Link>
      </div>
    </div>
  );
}
