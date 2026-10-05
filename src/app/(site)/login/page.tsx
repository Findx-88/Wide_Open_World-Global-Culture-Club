import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { WOWLogo } from '@/components/brand';
import { getMember, hasAuthSession, memberLoginConfigured } from '@/server/member-auth';
import { getSettings } from '@/server/queries';

export const metadata: Metadata = { title: 'Log in', robots: { index: false } };

const ERRORS: Record<string, string> = {
  'not-a-member': 'That account isn’t linked to a Wide Open World member yet (or its email isn’t verified). Ask an admin to add your email to your membership, then try again.',
  cancelled: 'Sign-in was cancelled. You can try again whenever you like.',
  failed: 'Something went wrong while signing in. Please try again.',
  'not-configured': 'Member sign-in is being set up and will be available soon.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getMember()) redirect('/me');
  const { error: queryError } = await searchParams;
  // Signed in to Auth0 but no matching active member: offer to switch accounts.
  const notMember = await hasAuthSession();
  const error = notMember ? 'not-a-member' : queryError;
  const settings = await getSettings();
  const ready = memberLoginConfigured();
  return (
    <div className="container-page grid min-h-[80vh] place-items-center pt-28">
      <div className="card w-full max-w-md p-8 text-center">
        <WOWLogo size={84} color="var(--gold)" className="mx-auto" />
        <h1 className="mt-5 font-display text-4xl">Welcome back, explorer</h1>
        <p className="mt-3 text-ink-soft">Log in to see your Cultural Passport, your visas, upcoming sessions and your email preferences.</p>
        {error && (
          <p role="alert" className="mt-5 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            {ERRORS[error] ?? ERRORS.failed}
          </p>
        )}
        {!ready ? (
          <p className="mt-7 rounded-xl border border-line-strong p-4 text-sm text-ink-soft">Member sign-in isn’t switched on yet. It will appear here as soon as the club connects it.</p>
        ) : notMember ? (
          <a href="/auth/logout" className="btn btn-ghost mt-7 w-full !py-3.5">
            Sign out and use another account
          </a>
        ) : (
          <a href="/auth/login?returnTo=/me" className="btn btn-primary mt-7 w-full !py-3.5">
            Log in or sign up
          </a>
        )}
        <p className="mt-6 text-xs text-ink-faint">
          New here? Members are added by the club — then you can log in with the email you gave us.
          {settings.contact_email ? ` Questions: ${settings.contact_email}` : ''}
        </p>
      </div>
    </div>
  );
}
