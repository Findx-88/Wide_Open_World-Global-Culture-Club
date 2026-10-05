import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { WOWLogo } from '@/components/brand';
import { getAdmin } from '@/server/auth';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Admin sign in', robots: { index: false } };

export default async function LoginPage() {
  if (await getAdmin()) redirect('/admin');
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-sm">
        <WOWLogo size={84} color="var(--gold)" className="mx-auto" />
        <h1 className="mt-6 text-center font-display text-3xl">WOW Admin</h1>
        <p className="mt-1 text-center text-sm text-ink-faint">Sign in to manage the club.</p>
        <LoginForm />
      </div>
    </main>
  );
}
