import 'server-only';
import { and, eq, inArray } from 'drizzle-orm';
import { db, schema } from '../db';
import { getSite, type ExpeditionView, type LinkedWork } from '../queries';
import type { Participation, VisaAward } from '../db/schema';

const { participation, visaAwards, attendance, members } = schema;

/**
 * THE rules of the Cultural Passport — one place, nothing hardcoded per country.
 *
 *  Book Visa   one per book flagged `awards_visa`, when the member confirmed (or admin verified) reading it.
 *  Movie Visa  one per expedition, when the member confirmed watching at least `movie_visa_min_films` of its films.
 *  Class Visa  one per expedition: attendance verified (Zoom/admin) at >= `class_visa_min_sessions` sessions,
 *              or — only when the expedition's evidence rule is 'any' — the member confirmed attending.
 *
 * A visa is never awarded for being a member. A revoked visa is never silently re-awarded.
 */

export type ActivityKind = 'book' | 'movie' | 'class';
export type Activity = { kind: ActivityKind; targetKey: string; workId: number | null; label: string; work?: LinkedWork };

export const keys = {
  book: (workId: number) => `book:${workId}`,
  movie: (workId: number) => `movie:${workId}`,
  class: (expeditionId: number) => `class:${expeditionId}`,
  movieVisa: (expeditionId: number) => `movies:${expeditionId}`,
};

/** The things a member can do on an expedition — derived from its data, never configured twice. */
export function activitiesFor(exp: ExpeditionView): Activity[] {
  const list: Activity[] = [];
  for (const b of exp.books) if (b.awardsVisa) list.push({ kind: 'book', targetKey: keys.book(b.id), workId: b.id, label: b.title, work: b });
  for (const f of exp.films) list.push({ kind: 'movie', targetKey: keys.movie(f.id), workId: f.id, label: f.title, work: f });
  if (exp.events.some((e) => e.kind === 'meeting' || e.kind === 'class')) {
    list.push({ kind: 'class', targetKey: keys.class(exp.id), workId: null, label: `${exp.country.name} sessions` });
  }
  return list;
}

export const isDone = (s: Participation['status']) => s === 'confirmed' || s === 'verified';

type SetOpts = {
  memberId: number;
  expeditionId: number;
  kind: ActivityKind;
  workId?: number | null;
  targetKey: string;
  status: Participation['status'];
  source: Participation['source'];
  note?: string | null;
};

/** Upsert one participation row. Members can never downgrade something that was verified. */
export async function setParticipation(o: SetOpts, opts: { force?: boolean } = {}) {
  const [existing] = await db.select().from(participation).where(and(eq(participation.memberId, o.memberId), eq(participation.targetKey, o.targetKey)));
  const now = new Date().toISOString();
  const answered = ['confirmed', 'declined', 'verified'].includes(o.status);
  if (existing) {
    if (existing.status === 'verified' && !opts.force && o.status !== 'verified') return existing;
    await db
      .update(participation)
      .set({ status: o.status, source: o.source, note: o.note ?? existing.note, answeredAt: answered ? now : existing.answeredAt, updatedAt: now })
      .where(eq(participation.id, existing.id));
    return { ...existing, status: o.status };
  }
  await db.insert(participation).values({
    memberId: o.memberId,
    expeditionId: o.expeditionId,
    kind: o.kind,
    workId: o.workId ?? null,
    targetKey: o.targetKey,
    status: o.status,
    source: o.source,
    note: o.note ?? null,
    answeredAt: answered ? now : null,
  });
  return null;
}

export type NewAward = { kind: VisaAward['kind']; targetKey: string; workId: number | null; reason: string };

/**
 * Re-checks one member against one expedition and awards whatever they now qualify for.
 * Idempotent: safe to call after every change. Returns only the awards created by this call.
 */
export async function evaluate(memberId: number, expeditionId: number, awardedBy: number | null = null): Promise<NewAward[]> {
  const site = await getSite();
  const exp = site.expeditions.find((e) => e.id === expeditionId);
  if (!exp) return [];

  const [parts, existing] = await db.batch([
    db.select().from(participation).where(and(eq(participation.memberId, memberId), eq(participation.expeditionId, expeditionId))),
    db.select().from(visaAwards).where(and(eq(visaAwards.memberId, memberId), eq(visaAwards.expeditionId, expeditionId))),
  ]);
  const have = new Set(existing.map((a) => a.targetKey)); // includes revoked → never re-awarded automatically
  const done = new Map(parts.filter((p) => isDone(p.status)).map((p) => [p.targetKey, p]));
  const verb = (p: Participation) => (p.status === 'verified' ? 'verified' : p.source === 'admin' ? 'confirmed by an admin' : 'member confirmed "Yes"');
  const country = exp.country.name;
  const awards: NewAward[] = [];

  // Book Visas
  for (const b of exp.books.filter((b) => b.awardsVisa)) {
    const p = done.get(keys.book(b.id));
    if (p) awards.push({ kind: 'book', targetKey: keys.book(b.id), workId: b.id, reason: `Book Visa → ${country} → ${b.title} → ${verb(p)}` });
  }

  // Movie Visa (one per expedition)
  const watched = exp.films.filter((f) => done.has(keys.movie(f.id)));
  const minFilms = Math.max(1, Math.min(exp.movieVisaMinFilms, exp.films.length || 1));
  if (exp.films.length > 0 && watched.length >= minFilms) {
    awards.push({ kind: 'movie', targetKey: keys.movieVisa(exp.id), workId: null, reason: `Movie Visa → ${country} → ${watched.map((f) => f.title).join(', ')} → member confirmed "Yes"` });
  }

  // Class Visa
  const cls = done.get(keys.class(exp.id));
  if (cls) {
    if (cls.status === 'verified') awards.push({ kind: 'class', targetKey: keys.class(exp.id), workId: null, reason: `Class Visa → ${country} → attendance verified (${cls.source === 'zoom' ? 'Zoom' : cls.source === 'admin' ? 'admin' : 'imported'})${cls.note ? ` · ${cls.note}` : ''}` });
    else if (exp.classVisaEvidence === 'any') awards.push({ kind: 'class', targetKey: keys.class(exp.id), workId: null, reason: `Class Visa → ${country} → member confirmed attending (self-reported)` });
  }

  const fresh = awards.filter((a) => !have.has(a.targetKey));
  if (fresh.length) {
    await db
      .insert(visaAwards)
      .values(fresh.map((a) => ({ memberId, expeditionId, kind: a.kind, workId: a.workId, targetKey: a.targetKey, reason: a.reason, source: 'auto' as const, awardedBy })))
      .onConflictDoNothing();
  }
  return fresh;
}

/** Manual award by an admin, with a mandatory reason. Re-activates a previously revoked award. */
export async function awardManually(o: { memberId: number; expeditionId: number; kind: 'book' | 'movie' | 'class'; workId?: number | null; reason: string; adminId: number }) {
  const targetKey = o.kind === 'book' ? keys.book(o.workId!) : o.kind === 'movie' ? keys.movieVisa(o.expeditionId) : keys.class(o.expeditionId);
  const reason = `Awarded manually by an admin: ${o.reason}`;
  const [existing] = await db.select().from(visaAwards).where(and(eq(visaAwards.memberId, o.memberId), eq(visaAwards.targetKey, targetKey)));
  if (existing) {
    await db.update(visaAwards).set({ revokedAt: null, revokedReason: null, reason, source: 'admin', awardedBy: o.adminId, awardedAt: new Date().toISOString() }).where(eq(visaAwards.id, existing.id));
    return existing.id;
  }
  const [row] = await db
    .insert(visaAwards)
    .values({ memberId: o.memberId, expeditionId: o.expeditionId, kind: o.kind, workId: o.workId ?? null, targetKey, reason, source: 'admin', awardedBy: o.adminId })
    .returning({ id: visaAwards.id });
  return row.id;
}

export async function revokeVisa(awardId: number, reason: string) {
  await db.update(visaAwards).set({ revokedAt: new Date().toISOString(), revokedReason: reason }).where(eq(visaAwards.id, awardId));
}

/**
 * Turns attendance rows into verified class participation: a member "attended" a session when
 * their minutes (summed over rejoins) reach the configured threshold; they are verified for the
 * expedition once they attended >= classVisaMinSessions sessions. Returns members newly verified.
 */
export async function syncClassAttendance(expeditionId: number, adminId: number | null = null) {
  const site = await getSite();
  const exp = site.expeditions.find((e) => e.id === expeditionId);
  if (!exp) return { verified: 0, awards: [] as { memberId: number; awards: NewAward[] }[] };
  const threshold = Number(site.settings.attendance_min_minutes) || 30;
  const eventIds = exp.events.map((e) => e.id);
  if (!eventIds.length) return { verified: 0, awards: [] };

  const rows = await db
    .select({ eventId: attendance.eventId, memberId: attendance.memberId, minutes: attendance.minutes })
    .from(attendance)
    .where(inArray(attendance.eventId, eventIds));
  const perMemberEvent = new Map<string, number>();
  for (const r of rows) if (r.memberId) perMemberEvent.set(`${r.memberId}:${r.eventId}`, (perMemberEvent.get(`${r.memberId}:${r.eventId}`) ?? 0) + r.minutes);

  const sessionsByMember = new Map<number, { count: number; minutes: number }>();
  for (const [k, minutes] of perMemberEvent) {
    const memberId = Number(k.split(':')[0]);
    const cur = sessionsByMember.get(memberId) ?? { count: 0, minutes: 0 };
    if (minutes >= threshold) cur.count++;
    cur.minutes += minutes;
    sessionsByMember.set(memberId, cur);
  }

  const out: { memberId: number; awards: NewAward[] }[] = [];
  let verified = 0;
  for (const [memberId, s] of sessionsByMember) {
    if (s.count < exp.classVisaMinSessions) continue;
    await setParticipation({ memberId, expeditionId, kind: 'class', targetKey: keys.class(expeditionId), status: 'verified', source: 'zoom', note: `${s.count} session${s.count === 1 ? '' : 's'}, ${s.minutes} min` });
    verified++;
    const awards = await evaluate(memberId, expeditionId, adminId);
    if (awards.length) out.push({ memberId, awards });
  }
  return { verified, awards: out };
}

/** Quick per-expedition numbers for the admin screens. */
export async function expeditionProgress(expeditionId: number) {
  const [parts, awards, reqs, mem] = await db.batch([
    db.select().from(participation).where(eq(participation.expeditionId, expeditionId)),
    db.select().from(visaAwards).where(eq(visaAwards.expeditionId, expeditionId)),
    db.select().from(schema.confirmationRequests).where(eq(schema.confirmationRequests.expeditionId, expeditionId)),
    db.select({ id: members.id, email: members.email }).from(members).where(eq(members.status, 'active')),
  ]);
  return { participation: parts, awards: awards.filter((a) => !a.revokedAt), requests: reqs, activeMembers: mem.length, withEmail: mem.filter((m) => m.email).length };
}

