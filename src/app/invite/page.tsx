import type { Metadata } from 'next';
import Link from 'next/link';
import WOWInvitation from '@/components/invite/WOWInvitation';
import { getPassport, getSettings } from '@/server/queries';

export const metadata: Metadata = { title: 'Your invitation', robots: { index: false } };

type Props = { searchParams: Promise<{ uid?: string }> };

/** Personal invitation sent to each new member: /invite?uid=WOW-2026-0042 (URL format must not change). */
export default async function InvitePage({ searchParams }: Props) {
  const { uid } = await searchParams;
  const [passport, settings] = await Promise.all([uid ? getPassport(uid) : null, getSettings()]);

  if (!passport) {
    return (
      <main className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <div className="eyebrow">Invitation</div>
          <h1 className="mt-3 font-display text-4xl">We couldn&rsquo;t find that invitation.</h1>
          <p className="mt-3 text-ink-soft">Check the link you were sent, or ask the club for a new one.</p>
          <Link href="/" className="btn btn-primary mt-8">Visit Wide Open World</Link>
        </div>
      </main>
    );
  }

  const { member } = passport;
  return (
    <WOWInvitation
      name={member.name}
      countryCode={member.country.iso2.toUpperCase()}
      countryName={member.country.name}
      countryFlag=""
      passportNumber={member.passportNumber}
      whatsappUrl={settings.whatsapp_url}
    />
  );
}
