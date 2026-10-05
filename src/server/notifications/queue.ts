import 'server-only';
import { randomBytes } from 'node:crypto';
import { and, asc, eq, lte } from 'drizzle-orm';
import { db, schema } from '../db';
import { getSite } from '../queries';
import { isOn } from '@/lib/settings';
import { emailProviderConfigured, sendEmail } from './email';
import { isNotificationKey, NOTIFICATION_TYPES, type NotificationKey } from './registry';
import { render, type RenderInput } from './templates';

const { emailOutbox, notificationPrefs, members } = schema;

export const newToken = () => randomBytes(24).toString('base64url');

export async function siteUrl() {
  const s = (await getSite()).settings;
  return (process.env.SITE_URL || s.site_url || 'http://localhost:3100').replace(/\/$/, '');
}

/** Returns (creating on first use) the member's preferences row. */
export async function ensurePrefs(memberId: number) {
  const [row] = await db.select().from(notificationPrefs).where(eq(notificationPrefs.memberId, memberId));
  if (row) return row;
  await db.insert(notificationPrefs).values({ memberId, token: newToken() }).onConflictDoNothing();
  const [created] = await db.select().from(notificationPrefs).where(eq(notificationPrefs.memberId, memberId));
  return created;
}

export async function prefsByToken(token: string) {
  const [row] = await db.select().from(notificationPrefs).where(eq(notificationPrefs.token, token));
  return row ?? null;
}

export const wantsType = (prefs: { unsubscribedAll: boolean; disabledTypes: string[] }, type: NotificationKey) =>
  !prefs.unsubscribedAll && !prefs.disabledTypes.includes(type);

export type EnqueueResult = 'queued' | 'duplicate' | 'no-email' | 'opted-out';

/**
 * Queue one email for one member. Idempotent on `dedupeKey` — scheduling the same reminder twice is harmless.
 * Respects the member's preferences and silently skips members with no email address.
 */
export async function enqueue<K extends NotificationKey>(o: {
  memberId: number;
  type: K;
  dedupeKey: string;
  input: (links: { siteUrl: string; prefsUrl: string }) => RenderInput[K];
  sendAt?: Date;
}): Promise<EnqueueResult> {
  if (!isNotificationKey(o.type)) throw new Error(`Unknown notification type: ${o.type}`);
  const [m] = await db.select({ id: members.id, name: members.name, email: members.email, status: members.status }).from(members).where(eq(members.id, o.memberId));
  if (!m || m.status !== 'active' || !m.email) return 'no-email';
  const prefs = await ensurePrefs(m.id);
  if (!wantsType(prefs, o.type)) return 'opted-out';

  const base = await siteUrl();
  const links = { siteUrl: base, prefsUrl: `${base}/preferences/${prefs.token}` };
  const r = render(o.type, { ...links, firstName: m.name.split(' ')[0] }, o.input(links));
  const inserted = await db
    .insert(emailOutbox)
    .values({ memberId: m.id, toEmail: m.email, type: o.type, dedupeKey: o.dedupeKey, subject: r.subject, bodyHtml: r.html, bodyText: r.text, sendAt: (o.sendAt ?? new Date()).toISOString() })
    .onConflictDoNothing()
    .returning({ id: emailOutbox.id });
  return inserted.length ? 'queued' : 'duplicate';
}

/** Emails older than this are dropped instead of sent, so switching email on never floods members with stale mail. */
const STALE_AFTER_MS = 3 * 24 * 3600_000;

export async function sendDue(limit = 25) {
  const s = (await getSite()).settings;
  const enabled = isOn(s.email_enabled);
  const result = { enabled, providerConfigured: emailProviderConfigured(), sent: 0, failed: 0, skipped: 0, waiting: 0 };
  const due = await db
    .select()
    .from(emailOutbox)
    .where(and(eq(emailOutbox.status, 'queued'), lte(emailOutbox.sendAt, new Date().toISOString())))
    .orderBy(asc(emailOutbox.sendAt))
    .limit(limit);
  if (!enabled || !result.providerConfigured) {
    result.waiting = due.length;
    return result;
  }
  const from = s.email_from || process.env.EMAIL_FROM || '';
  if (!from) return { ...result, waiting: due.length };

  for (const mail of due) {
    if (Date.now() - new Date(mail.sendAt).getTime() > STALE_AFTER_MS) {
      await db.update(emailOutbox).set({ status: 'skipped', error: 'Too old to send (was queued while email was off).' }).where(eq(emailOutbox.id, mail.id));
      result.skipped++;
      continue;
    }
    const r = await sendEmail({ from, to: mail.toEmail, subject: mail.subject, html: mail.bodyHtml, text: mail.bodyText });
    if (r.ok) {
      await db.update(emailOutbox).set({ status: 'sent', sentAt: new Date().toISOString(), attempts: mail.attempts + 1, error: null }).where(eq(emailOutbox.id, mail.id));
      result.sent++;
    } else {
      const giveUp = !r.retryable || mail.attempts + 1 >= 4;
      await db.update(emailOutbox).set({ status: giveUp ? 'failed' : 'queued', attempts: mail.attempts + 1, error: r.error }).where(eq(emailOutbox.id, mail.id));
      result.failed++;
    }
  }
  return result;
}

export { NOTIFICATION_TYPES };
