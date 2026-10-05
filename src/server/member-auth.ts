import 'server-only';
import { and, eq, sql } from 'drizzle-orm';
import { auth0, auth0Configured } from '@/lib/auth0';
import { db, schema } from './db';

/**
 * Member sign-in (Auth0). Completely separate from admin auth: a member session can never open /admin.
 * An Auth0 login counts only if its *verified* email matches an active member (admins add emails under
 * Members) — otherwise anyone could sign up with a member's address and claim their passport.
 */
export const memberLoginConfigured = auth0Configured;

export async function findMemberByEmail(email: string) {
  const [m] = await db.select().from(schema.members).where(and(eq(sql`lower(${schema.members.email})`, email.toLowerCase()), eq(schema.members.status, 'active')));
  return m ?? null;
}

/** The signed-in Auth0 user's verified email, or null (no session, unverified, or Auth0 not configured). */
export async function getVerifiedEmail() {
  if (!auth0Configured()) return null;
  const session = await auth0.getSession();
  const u = session?.user;
  return u?.email_verified === true && typeof u.email === 'string' ? u.email.toLowerCase() : null;
}

/** Whether someone is signed in to Auth0 at all (member or not). */
export async function hasAuthSession() {
  return auth0Configured() && !!(await auth0.getSession());
}

export async function getMember() {
  const email = await getVerifiedEmail();
  return email ? findMemberByEmail(email) : null;
}
