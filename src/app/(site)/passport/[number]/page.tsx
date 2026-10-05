import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Flag } from '@/components/brand';
import { PassportBook } from '@/components/passport/PassportBook';
import { ShareCard } from '@/components/passport/ShareCard';
import { getPassportData } from '@/server/passport';

type Props = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getPassportData(decodeURIComponent((await params).number));
  return data ? { title: `${data.name}’s Cultural Passport`, robots: { index: false } } : { title: 'Passport not found' };
}

export default async function PassportPage({ params }: Props) {
  const data = await getPassportData(decodeURIComponent((await params).number));
  if (!data) notFound();
  const totalVisas = data.stamps.reduce((n, s) => n + s.visas.length, 0);
  return (
    <div className="container-page pt-32">
      <div className="text-center">
        <div className="eyebrow">Cultural Passport · {data.passportNumber}</div>
        <h1 className="mt-3 flex flex-wrap items-center justify-center gap-4 font-display text-5xl sm:text-6xl">
          {data.name} <Flag iso2={data.country.iso2} name={data.country.name} className="h-7 w-10" />
        </h1>
        <p className="mt-3 text-ink-soft">
          {totalVisas} visa{totalVisas === 1 ? '' : 's'} earned across {data.stamps.length} countr{data.stamps.length === 1 ? 'y' : 'ies'}{data.inProgress ? ` · now exploring ${data.inProgress.country}` : ''}
        </p>
      </div>
      <div className="mt-12 overflow-x-clip pb-4">
        <PassportBook data={data} />
      </div>
      <div className="mx-auto mt-16 max-w-md">
        <ShareCard data={data} />
      </div>
      <div className="mt-10 text-center">
        <Link href="/members" className="text-sm text-ink-soft link-underline">← All explorers</Link>
      </div>
    </div>
  );
}
