import 'server-only';
import { and, eq, inArray, isNotNull, like } from 'drizzle-orm';
import { db, insertChunked, schema } from '../db';
import { invalidateCache } from '../cache';
import { getSite, type ExpeditionView } from '../queries';
import { isOn, numberList } from '@/lib/settings';
import { enqueue, newToken, sendDue, siteUrl } from '../notifications/queue';
import { activitiesFor, evaluate, isDone, setParticipation, syncClassAttendance, type NewAward } from './rules';

const { confirmationRequests, participation, members, expeditions, emailOutbox } = schema;
const DAY = 86_400_000;

export const awardLabel = (kind: NewAward['kind'], exp: ExpeditionView, workId: number | null) =>
  kind === 'book' ? `Book Visa — ${exp.books.find((b) => b.id === workId)?.title ?? exp.country.name}` : kind === 'movie' ? 'Movie Visa' : kind === 'class' ? 'Class Visa' : 'Legacy visa';

/** Evaluates one member and sends the visa email if anything new was earned. */
export async function evaluateAndNotify(memberId: number, expeditionId: number, adminId: number | null = null) {
  const site = await getSite();
  const exp = site.expeditions.find((e) => e.id === expeditionId);
  if (!exp) return [];
  const fresh = await evaluate(memberId, expeditionId, adminId);
  if (fresh.length) {
    const [m] = await db.select({ passportNumber: members.passportNumber }).from(members).where(eq(members.id, memberId));
    await enqueue({
      memberId,
      type: 'visa_awarded',
      dedupeKey: `visa:${memberId}:${fresh.map((a) => a.targetKey).sort().join('|')}`,
      input: ({ siteUrl: base }) => ({ countryName: exp.country.name, visas: fresh.map((a) => awardLabel(a.kind, exp, a.workId)), passportUrl: `${base}/passport/${m.passportNumber}` }),
    });
  }
  invalidateCache();
  return fresh;
}

/** Re-runs attendance → class verification → visas for an expedition, emailing new awards. */
export async function applyAttendance(expeditionId: number, adminId: number | null) {
  const r = await syncClassAttendance(expeditionId, adminId);
  const site = await getSite();
  const exp = site.expeditions.find((e) => e.id === expeditionId);
  if (exp) {
    for (const { memberId, awards } of r.awards) {
      const [m] = await db.select({ passportNumber: members.passportNumber }).from(members).where(eq(members.id, memberId));
      await enqueue({
        memberId,
        type: 'visa_awarded',
        dedupeKey: `visa:${memberId}:${awards.map((a) => a.targetKey).sort().join('|')}`,
        input: ({ siteUrl: base }) => ({ countryName: exp.country.name, visas: awards.map((a) => awardLabel(a.kind, exp, a.workId)), passportUrl: `${base}/passport/${m.passportNumber}` }),
      });
    }
  }
  invalidateCache();
  return r;
}

// ── Opening confirmations ──────────────────────────────────────────────────

/**
 * Starts the "did you read / watch / attend?" process for an expedition: every active member who still has
 * an unanswered activity gets a request (and, via the scheduler, the first email). Nobody is awarded anything here.
 */
export async function openConfirmations(expeditionId: number) {
  const site = await getSite();
  const exp = site.expeditions.find((e) => e.id === expeditionId);
  if (!exp) throw new Error('Expedition not found');
  const acts = activitiesFor(exp);
  if (!acts.length) {
    await db.update(expeditions).set({ confirmationsOpenedAt: new Date().toISOString() }).where(eq(expeditions.id, expeditionId));
    return { requests: 0, members: 0, activities: 0 };
  }

  const active = await db.select({ id: members.id }).from(members).where(eq(members.status, 'active'));
  const existingParts = await db.select().from(participation).where(eq(participation.expeditionId, expeditionId));
  const byMember = new Map<number, typeof existingParts>();
  for (const p of existingParts) byMember.set(p.memberId, [...(byMember.get(p.memberId) ?? []), p]);

  const needAsk = active.filter((m) => {
    const rows = byMember.get(m.id) ?? [];
    return acts.some((a) => {
      const row = rows.find((r) => r.targetKey === a.targetKey);
      return !row || row.status === 'unconfirmed' || row.status === 'awaiting' || row.status === 'expired';
    });
  });

  const chunk = <T,>(arr: T[], n: number) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
  await insertChunked(confirmationRequests, needAsk.map((m) => ({ memberId: m.id, expeditionId, token: newToken() })), (rows) => db.insert(confirmationRequests).values(rows).onConflictDoNothing());
  await insertChunked(
    participation,
    needAsk.flatMap((m) => acts.map((a) => ({ memberId: m.id, expeditionId, kind: a.kind, workId: a.workId, targetKey: a.targetKey, status: 'awaiting' as const, source: 'member' as const }))),
    (rows) => db.insert(participation).values(rows).onConflictDoNothing(),
  );
  // Rows that existed as plain "unconfirmed" are now being asked about.
  const ids = needAsk.map((m) => m.id);
  for (const part of chunk(ids, 40)) {
    await db
      .update(participation)
      .set({ status: 'awaiting', updatedAt: new Date().toISOString() })
      .where(and(eq(participation.expeditionId, expeditionId), inArray(participation.memberId, part), inArray(participation.status, ['unconfirmed', 'expired'])));
  }
  await db.update(expeditions).set({ confirmationsOpenedAt: new Date().toISOString() }).where(eq(expeditions.id, expeditionId));
  invalidateCache();
  return { requests: needAsk.length, members: active.length, activities: acts.length };
}

// ── Member answers ─────────────────────────────────────────────────────────

export type Answers = { books: Record<number, boolean>; filmsWatched: number[]; attended: boolean | null };

export async function submitAnswers(token: string, answers: Answers) {
  const [req] = await db.select().from(confirmationRequests).where(eq(confirmationRequests.token, token));
  if (!req) return { ok: false as const, error: 'This link isn’t valid.' };
  if (req.status === 'expired') return { ok: false as const, error: 'This confirmation window has closed. Please contact the club if you’d still like a visa.' };

  const site = await getSite();
  const exp = site.expeditions.find((e) => e.id === req.expeditionId);
  if (!exp) return { ok: false as const, error: 'Expedition not found.' };

  for (const a of activitiesFor(exp)) {
    let yes: boolean | null = null;
    if (a.kind === 'book') yes = answers.books[a.workId!] ?? null;
    else if (a.kind === 'movie') yes = answers.filmsWatched.includes(a.workId!);
    else yes = answers.attended;
    if (yes === null) continue;
    await setParticipation({ memberId: req.memberId, expeditionId: exp.id, kind: a.kind, workId: a.workId, targetKey: a.targetKey, status: yes ? 'confirmed' : 'declined', source: 'member' });
  }
  await db.update(confirmationRequests).set({ status: 'answered', answeredAt: new Date().toISOString() }).where(eq(confirmationRequests.id, req.id));
  const fresh = await evaluateAndNotify(req.memberId, exp.id);
  return { ok: true as const, awards: fresh.map((a) => awardLabel(a.kind, exp, a.workId)) };
}

// ── The scheduler ──────────────────────────────────────────────────────────

async function sendConfirmationEmail(r: typeof confirmationRequests.$inferSelect, n: number, maxSends: number, exp: ExpeditionView, parts: (typeof participation.$inferSelect)[]) {
  const acts = activitiesFor(exp).filter((a) => !isDone(parts.find((p) => p.targetKey === a.targetKey)?.status ?? 'unconfirmed'));
  if (!acts.length) return 'duplicate' as const;
  const res = await enqueue({
    memberId: r.memberId,
    type: 'participation_request',
    dedupeKey: `confirm:${r.id}:${n}`,
    input: ({ siteUrl: base }) => ({ countryName: exp.country.name, activities: acts.map((a) => ({ kind: a.kind, label: a.label })), url: `${base}/confirm/${r.token}`, reminderNo: n, lastReminder: n > 0 && n === maxSends - 1 }),
  });
  if (res === 'no-email') return res;
  const now = new Date().toISOString();
  await db.update(confirmationRequests).set({ sentCount: n + 1, lastSentAt: now, firstSentAt: r.firstSentAt ?? now }).where(eq(confirmationRequests.id, r.id));
  return res;
}

async function expireRequest(r: typeof confirmationRequests.$inferSelect) {
  await db.update(confirmationRequests).set({ status: 'expired' }).where(eq(confirmationRequests.id, r.id));
  await db
    .update(participation)
    .set({ status: 'expired', updatedAt: new Date().toISOString() })
    .where(and(eq(participation.memberId, r.memberId), eq(participation.expeditionId, r.expeditionId), eq(participation.status, 'awaiting')));
}

export type TickReport = {
  opened: string[];
  confirmationEmails: number;
  expired: number;
  meetingReminders: number;
  expeditionReminders: number;
  email: Awaited<ReturnType<typeof sendDue>>;
};

/**
 * Called every few minutes by the scheduler (and by "Run now" in the admin). Fully idempotent: running it twice
 * changes nothing. It never awards a visa — awards only happen from confirmations, attendance or an admin.
 */
export async function tick(opts: { maxEmails?: number } = {}): Promise<TickReport> {
  invalidateCache(); // a scheduled job must act on the latest data, never a cached copy
  const site = await getSite();
  const s = site.settings;
  const now = Date.now();
  let budget = opts.maxEmails ?? 20;
  const report: TickReport = { opened: [], confirmationEmails: 0, expired: 0, meetingReminders: 0, expeditionReminders: 0, email: { enabled: false, providerConfigured: false, sent: 0, failed: 0, skipped: 0, waiting: 0 } };

  // 1. Open confirmations once an expedition's last session has ended.
  if (isOn(s.auto_confirmations)) {
    for (const exp of site.expeditions.filter((e) => e.published && !e.confirmationsOpenedAt)) {
      const ends = exp.events.length ? Math.max(...exp.events.map((e) => new Date(e.startsAt).getTime() + e.durationMin * 60_000)) : new Date(`${exp.endsOn}T23:59:59Z`).getTime();
      if (now > ends && activitiesFor(exp).length) {
        await openConfirmations(exp.id);
        report.opened.push(exp.country.name);
      }
    }
  }

  // 2. Initial emails, reminders and expiry for open requests.
  const days = numberList(s.confirm_reminder_days);
  const maxSends = 1 + days.length;
  const lastDay = days.length ? Math.max(...days) : 0;
  const grace = Number(s.confirm_expire_grace_days) || 7;
  const open = await db
    .select({ r: confirmationRequests, email: members.email })
    .from(confirmationRequests)
    .innerJoin(members, eq(members.id, confirmationRequests.memberId))
    .where(eq(confirmationRequests.status, 'open'));
  const partsAll = open.length ? await db.select().from(participation).where(inArray(participation.expeditionId, [...new Set(open.map((o) => o.r.expeditionId))])) : [];

  for (const { r, email } of open) {
    const exp = site.expeditions.find((e) => e.id === r.expeditionId);
    if (!exp) continue;
    const parts = partsAll.filter((p) => p.memberId === r.memberId && p.expeditionId === r.expeditionId);
    const baseline = new Date(r.firstSentAt ?? exp.confirmationsOpenedAt ?? r.createdAt).getTime();
    const expireAt = baseline + (lastDay + grace) * DAY;

    if (r.sentCount === 0) {
      if (email && budget > 0 && (await sendConfirmationEmail(r, 0, maxSends, exp, parts)) !== 'no-email') {
        budget--;
        report.confirmationEmails++;
      } else if (!email && now >= expireAt) {
        await expireRequest(r);
        report.expired++;
      }
    } else if (r.sentCount < maxSends) {
      const dueAt = new Date(r.firstSentAt!).getTime() + days[r.sentCount - 1] * DAY;
      if (now >= dueAt && budget > 0) {
        await sendConfirmationEmail(r, r.sentCount, maxSends, exp, parts);
        budget--;
        report.confirmationEmails++;
      }
    } else if (now >= expireAt) {
      await expireRequest(r);
      report.expired++;
    }
  }

  // 3. Meeting reminders.
  const withEmail = await db.select({ id: members.id }).from(members).where(and(eq(members.status, 'active'), isNotNull(members.email)));
  const hours = numberList(s.meeting_reminder_hours);
  for (const ev of site.events) {
    const start = new Date(ev.startsAt).getTime();
    if (start <= now) continue;
    const exp = ev.expeditionId ? site.expeditions.find((e) => e.id === ev.expeditionId) : null;
    for (const h of hours) {
      if (now < start - h * 3600_000) continue;
      const done = new Set((await db.select({ k: emailOutbox.dedupeKey }).from(emailOutbox).where(like(emailOutbox.dedupeKey, `meeting:${ev.id}:%:${h}`))).map((x) => x.k));
      for (const m of withEmail) {
        if (budget <= 0) break;
        const key = `meeting:${ev.id}:${m.id}:${h}`;
        if (done.has(key)) continue;
        const res = await enqueue({
          memberId: m.id,
          type: 'meeting_reminder',
          dedupeKey: key,
          input: ({ siteUrl: base }) => ({
            event: {
              id: ev.id,
              title: `${exp ? `${exp.country.name} · ` : ''}${ev.title}`,
              description: ev.description,
              startsAt: ev.startsAt,
              durationMin: ev.durationMin,
              joinUrl: ev.joinUrl || s.default_meet_url || null,
              pageUrl: `${base}/join`,
              whenText: new Date(ev.startsAt).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZone: ev.hostTimezone, timeZoneName: 'short' }),
            },
            countryName: exp?.country.name,
            hours: h,
          }),
        });
        if (res === 'queued') {
          report.meetingReminders++;
          budget--;
        }
      }
    }
  }

  // 4. "Expedition begins soon".
  const aheadDays = Number(s.expedition_reminder_days) || 0;
  if (aheadDays > 0) {
    const base = await siteUrl();
    for (const exp of site.expeditions.filter((e) => e.published)) {
      const start = new Date(`${exp.startsOn}T00:00:00Z`).getTime();
      if (start <= now || now < start - aheadDays * DAY) continue;
      const done = new Set((await db.select({ k: emailOutbox.dedupeKey }).from(emailOutbox).where(like(emailOutbox.dedupeKey, `expedition:${exp.id}:%`))).map((x) => x.k));
      for (const m of withEmail) {
        if (budget <= 0) break;
        const key = `expedition:${exp.id}:${m.id}`;
        if (done.has(key)) continue;
        const res = await enqueue({
          memberId: m.id,
          type: 'expedition_reminder',
          dedupeKey: key,
          input: () => ({ countryName: exp.country.name, startsOn: new Date(`${exp.startsOn}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' }), book: exp.book?.title, film: exp.film?.title, friend: exp.friends[0]?.name, pageUrl: `${base}/expeditions/${exp.slug}` }),
        });
        if (res === 'queued') {
          report.expeditionReminders++;
          budget--;
        }
      }
    }
  }

  // 5. Deliver whatever is due.
  report.email = await sendDue();
  invalidateCache();
  return report;
}
