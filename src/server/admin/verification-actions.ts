'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, schema } from '../db';
import { invalidateCache } from '../cache';
import { requireAdmin } from '../auth';
import { getSite } from '../queries';
import { emailProviderConfigured, sendEmail } from '../notifications/email';
import { enqueue } from '../notifications/queue';
import { importRows, parseZoomReport } from '../verification/attendance';
import { activitiesFor, awardManually, revokeVisa, setParticipation } from '../verification/rules';
import { applyAttendance, awardLabel, evaluateAndNotify, openConfirmations, tick } from '../verification/workflow';
import { numberList } from '@/lib/settings';
import type { ActionState } from '@/lib/action-state';

const { expeditions, attendance, members, confirmationRequests, participation, auditLog } = schema;

const ok = (message: string, data?: Record<string, unknown>): ActionState => ({ ok: true, message, data, at: Date.now() });
const fail = (message: string): ActionState => ({ ok: false, message, at: Date.now() });
const refresh = () => {
  invalidateCache();
  revalidatePath('/', 'layout');
};
async function audit(adminId: number, action: string, entity: string, entityId: string | number | null, detail?: unknown) {
  await db.insert(auditLog).values({ adminId, action, entity, entityId: entityId == null ? null : String(entityId), detail: detail ? JSON.stringify(detail) : null });
}
const int = (v: FormDataEntryValue | null) => Number(v);

// ── Visa rules ─────────────────────────────────────────────────────────────

const rulesSchema = z.object({
  expeditionId: z.coerce.number().int(),
  classVisaEvidence: z.enum(['any', 'verified']),
  classVisaMinSessions: z.coerce.number().int().min(1).max(20),
  movieVisaMinFilms: z.coerce.number().int().min(1).max(20),
});

export async function saveVisaRules(_: ActionState | null, form: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const p = rulesSchema.safeParse(Object.fromEntries(form.entries()));
  if (!p.success) return fail(p.error.issues[0].message);
  const { expeditionId, ...rules } = p.data;
  await db.update(expeditions).set(rules).where(eq(expeditions.id, expeditionId));
  await audit(me.id, 'update_visa_rules', 'expedition', expeditionId, rules);
  refresh();
  return ok('Visa rules saved. They apply to future confirmations and when you re-check members.');
}

/** Re-runs the rules for everyone on an expedition (e.g. after changing a rule). Never removes visas. */
export async function recheckExpedition(_: ActionState | null, form: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const expeditionId = int(form.get('expeditionId'));
  const rows = await db.selectDistinct({ memberId: participation.memberId }).from(participation).where(eq(participation.expeditionId, expeditionId));
  let awarded = 0;
  for (const r of rows) awarded += (await evaluateAndNotify(r.memberId, expeditionId, me.id)).length;
  await audit(me.id, 'recheck', 'expedition', expeditionId, { members: rows.length, awarded });
  refresh();
  return ok(`Checked ${rows.length} members — ${awarded} new visa${awarded === 1 ? '' : 's'} awarded.`);
}

// ── Confirmations & scheduler ──────────────────────────────────────────────

export async function openConfirmationsNow(_: ActionState | null, form: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const expeditionId = int(form.get('expeditionId'));
  const r = await openConfirmations(expeditionId);
  const t = await tick({ maxEmails: 60 });
  await audit(me.id, 'open_confirmations', 'expedition', expeditionId, r);
  refresh();
  const emailNote = t.email.enabled && t.email.providerConfigured ? `${t.email.sent} email(s) sent.` : 'Emails are queued but not sent yet (email is switched off or no provider is configured).';
  return ok(`Confirmations opened for ${r.requests} member(s). ${emailNote}`);
}

export async function reopenRequest(form: FormData) {
  const me = await requireAdmin();
  const id = int(form.get('requestId'));
  const [req] = await db.select().from(confirmationRequests).where(eq(confirmationRequests.id, id));
  if (!req) return;
  const site = await getSite();
  const days = numberList(site.settings.confirm_reminder_days);
  const lastDay = days.length ? Math.max(...days) : 0;
  // No more emails; the member gets a fresh grace period to answer from the link.
  await db
    .update(confirmationRequests)
    .set({ status: 'open', sentCount: 1 + days.length, firstSentAt: new Date(Date.now() - lastDay * 86_400_000).toISOString(), answeredAt: null })
    .where(eq(confirmationRequests.id, id));
  await db
    .update(participation)
    .set({ status: 'awaiting', updatedAt: new Date().toISOString() })
    .where(and(eq(participation.memberId, req.memberId), eq(participation.expeditionId, req.expeditionId), eq(participation.status, 'expired')));
  await audit(me.id, 'reopen_request', 'confirmation_request', id);
  refresh();
}

export async function runSchedulerNow(_: ActionState | null): Promise<ActionState> {
  const me = await requireAdmin();
  const r = await tick({ maxEmails: 60 });
  await audit(me.id, 'run_scheduler', 'system', null, r);
  refresh();
  return ok(
    `Opened: ${r.opened.join(', ') || 'none'} · confirmation emails queued: ${r.confirmationEmails} · expired: ${r.expired} · meeting reminders: ${r.meetingReminders} · expedition reminders: ${r.expeditionReminders} · ` +
      (r.email.enabled && r.email.providerConfigured ? `sent ${r.email.sent}, failed ${r.email.failed}` : `waiting to send: ${r.email.waiting} (email off or no provider)`),
  );
}

export async function sendTestEmail(_: ActionState | null): Promise<ActionState> {
  const me = await requireAdmin();
  const s = (await getSite()).settings;
  const from = s.email_from || process.env.EMAIL_FROM || '';
  if (!emailProviderConfigured()) return fail('No email provider: set RESEND_API_KEY on the server first.');
  if (!from) return fail('Set “Email from” in Settings first (for example: Wide Open World <hello@yourdomain.com>).');
  const r = await sendEmail({ from, to: me.email, subject: 'Wide Open World — test email', html: '<p>It works! Email delivery for Wide Open World is configured correctly.</p>', text: 'It works! Email delivery for Wide Open World is configured correctly.' });
  return r.ok ? ok(`Test email sent to ${me.email}.`) : fail(r.error);
}

// ── Participation & visas (admin overrides) ───────────────────────────────

export async function setParticipationAdmin(_: ActionState | null, form: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const memberId = int(form.get('memberId'));
  const expeditionId = int(form.get('expeditionId'));
  const targetKey = String(form.get('targetKey'));
  const status = z.enum(['unconfirmed', 'confirmed', 'declined', 'verified']).parse(form.get('status'));
  const site = await getSite();
  const exp = site.expeditions.find((e) => e.id === expeditionId);
  const act = exp && activitiesFor(exp).find((a) => a.targetKey === targetKey);
  if (!exp || !act) return fail('Unknown activity.');
  await setParticipation({ memberId, expeditionId, kind: act.kind, workId: act.workId, targetKey, status, source: 'admin', note: 'Set by an admin' }, { force: true });
  const fresh = status === 'confirmed' || status === 'verified' ? await evaluateAndNotify(memberId, expeditionId, me.id) : [];
  await audit(me.id, 'set_participation', 'member', memberId, { targetKey, status });
  refresh();
  return ok(fresh.length ? `Saved — awarded: ${fresh.map((a) => awardLabel(a.kind, exp, a.workId)).join(', ')}.` : 'Saved.');
}

const manualSchema = z.object({
  memberId: z.coerce.number().int(),
  expeditionId: z.coerce.number().int(),
  kind: z.enum(['book', 'movie', 'class']),
  workId: z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().int().nullable()),
  reason: z.string().trim().min(3, 'Please give a short reason — it is stored on the visa.'),
});

export async function awardVisaAdmin(_: ActionState | null, form: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const p = manualSchema.safeParse(Object.fromEntries(form.entries()));
  if (!p.success) return fail(p.error.issues[0].message);
  const d = p.data;
  if (d.kind === 'book' && !d.workId) return fail('Choose which book.');
  const site = await getSite();
  const exp = site.expeditions.find((e) => e.id === d.expeditionId);
  if (!exp) return fail('Expedition not found.');
  const id = await awardManually({ ...d, adminId: me.id });
  await enqueue({
    memberId: d.memberId,
    type: 'visa_awarded',
    dedupeKey: `visa-manual:${id}:${Date.now()}`,
    input: ({ siteUrl }) => ({ countryName: exp.country.name, visas: [awardLabel(d.kind, exp, d.workId)], passportUrl: `${siteUrl}/members` }),
  });
  await audit(me.id, 'award_visa', 'member', d.memberId, d);
  refresh();
  return ok('Visa awarded and recorded with your reason.');
}

export async function revokeVisaAdmin(_: ActionState | null, form: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const id = int(form.get('awardId'));
  const reason = String(form.get('reason') ?? '').trim();
  if (reason.length < 3) return fail('Please give a reason for revoking.');
  await revokeVisa(id, reason);
  await audit(me.id, 'revoke_visa', 'visa_award', id, { reason });
  refresh();
  return ok('Visa revoked. The history is kept.');
}

// ── Attendance ─────────────────────────────────────────────────────────────

export async function importAttendance(_: ActionState | null, form: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const eventId = int(form.get('eventId'));
  const file = form.get('file');
  const pasted = String(form.get('csv') ?? '');
  const text = file instanceof File && file.size > 0 ? await file.text() : pasted;
  if (!text.trim()) return fail('Choose a Zoom report file or paste its contents.');
  try {
    const rows = parseZoomReport(text);
    const r = await importRows(eventId, rows, 'zoom_csv');
    const [ev] = await db.select({ expeditionId: schema.events.expeditionId }).from(schema.events).where(eq(schema.events.id, eventId));
    let extra = '';
    if (ev?.expeditionId) {
      const a = await applyAttendance(ev.expeditionId, me.id);
      extra = ` ${a.verified} member(s) now meet the attendance rule.`;
    }
    await audit(me.id, 'import_attendance', 'event', eventId, r);
    refresh();
    return ok(`Imported ${r.total} rows: ${r.matched} matched to members, ${r.unmatched} need matching.${extra}`);
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Could not read that file.');
  }
}

export async function assignAttendance(form: FormData) {
  const me = await requireAdmin();
  const id = int(form.get('attendanceId'));
  const memberId = int(form.get('memberId'));
  if (!memberId) return;
  const [row] = await db.update(attendance).set({ memberId }).where(eq(attendance.id, id)).returning({ eventId: attendance.eventId });
  const [ev] = row ? await db.select({ expeditionId: schema.events.expeditionId }).from(schema.events).where(eq(schema.events.id, row.eventId)) : [];
  if (ev?.expeditionId) await applyAttendance(ev.expeditionId, me.id);
  await audit(me.id, 'assign_attendance', 'attendance', id, { memberId });
  refresh();
}

export async function addManualAttendance(_: ActionState | null, form: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const eventId = int(form.get('eventId'));
  const memberId = int(form.get('memberId'));
  const minutes = Math.max(1, int(form.get('minutes')) || 60);
  if (!memberId) return fail('Choose a member.');
  const [m] = await db.select({ name: members.name, email: members.email }).from(members).where(eq(members.id, memberId));
  if (!m) return fail('Member not found.');
  await db.insert(attendance).values({ eventId, memberId, displayName: m.name, email: m.email, minutes, source: 'admin' });
  const [ev] = await db.select({ expeditionId: schema.events.expeditionId }).from(schema.events).where(eq(schema.events.id, eventId));
  if (ev?.expeditionId) await applyAttendance(ev.expeditionId, me.id);
  await audit(me.id, 'manual_attendance', 'event', eventId, { memberId, minutes });
  refresh();
  return ok(`${m.name} marked as attended.`);
}

export async function deleteAttendance(form: FormData) {
  const me = await requireAdmin();
  const id = int(form.get('attendanceId'));
  await db.delete(attendance).where(eq(attendance.id, id));
  await audit(me.id, 'delete_attendance', 'attendance', id);
  refresh();
}

// ── Member emails (bulk) ───────────────────────────────────────────────────

export async function importMemberEmails(_: ActionState | null, form: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const lines = String(form.get('lines') ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return fail('Paste one member per line: passport number (or name), then email.');
  const all = await db.select({ id: members.id, name: members.name, passportNumber: members.passportNumber }).from(members);
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  let updated = 0;
  const problems: string[] = [];
  for (const line of lines) {
    const parts = line.split(/[,\t;]+/).map((p) => p.trim()).filter(Boolean);
    const email = parts.find((p) => p.includes('@'))?.toLowerCase();
    const key = parts.find((p) => !p.includes('@'));
    if (!email || !key || !z.email().safeParse(email).success) {
      problems.push(`“${line}” — need a member and a valid email`);
      continue;
    }
    const m = all.find((x) => x.passportNumber.toLowerCase() === key.toLowerCase()) ?? all.find((x) => norm(x.name) === norm(key));
    if (!m) {
      problems.push(`“${key}” — no matching member`);
      continue;
    }
    try {
      await db.update(members).set({ email }).where(eq(members.id, m.id));
      updated++;
    } catch {
      problems.push(`${email} — already used by another member`);
    }
  }
  await audit(me.id, 'import_member_emails', 'member', null, { updated });
  refresh();
  return updated > 0 || !problems.length ? ok(`Saved ${updated} email${updated === 1 ? '' : 's'}.${problems.length ? ` Problems: ${problems.join(' · ')}` : ''}`) : fail(problems.join(' · '));
}

