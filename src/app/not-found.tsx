import Link from 'next/link';
import { WOWLogo } from '@/components/brand';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <WOWLogo size={110} color="var(--gold)" className="mx-auto opacity-80" />
        <h1 className="mt-8 font-display text-5xl">This page is off the map.</h1>
        <p className="mt-3 text-ink-soft">The link may be old, or the page has moved.</p>
        <Link href="/" className="btn btn-primary mt-8">Back to Wide Open World</Link>
      </div>
    </main>
  );
}
