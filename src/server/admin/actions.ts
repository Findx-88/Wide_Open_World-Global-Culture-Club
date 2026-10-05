'use server';

import { and, eq, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db, schema } from '../db';
import { invalidateCache } from '../cache';
import { findCover } from '../covers';
import {
  clearFailures,
  createSession,
  destroySession,
  findAdminByEmail,
  hashPassword,
  loginBlocked,
  recordFailure,
  requireAdmin,
  verifyPassword,
} from '../auth';
import { zonedToUtc } from '@/lib/time';
import { slugify } from '@/lib/format';
import type { ActionState } from '@/lib/action-state';
import { SETTING_DEFAULTS, numberList, type SettingKey } from '@/lib/settings';

const { expeditions, works, expeditionWorks, friends, expeditionFriends, events, members, settings, recommendations, auditLog, admins } = schema;

// ── helpers ────────────────────────────────────────────────────────────────

const ok = (message: string, data?: Record<string, unknown>): ActionState => ({ ok: true, message, data, at: Date.now() });
const fail = (message: string): ActionState => ({ ok: false, message, at: Date.now() });

const optional = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .optional()
  .transform((v) => v ?? null);
const optionalInt = z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().int().nullable());
const checkbox = z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean());
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a full date');
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex colour like #C9A052');

function parse<T extends z.ZodType>(schemaDef: T, form: FormData): { data: z.infer<T> } | { error: string } {
  const r = schemaDef.safeParse(Object.fromEntries(form.entries()));
  if (r.success) return { data: r.data };
  const issue = r.error.issues[0];
  return { error: `${issue.path.join('.') || 'Form'}: ${issue.message}` };
}

async function audit(adminId: number, action: string, entity: string, entityId: string | number | null, detail?: unknown) {
  await db.insert(auditLog).values({ adminId, action, entity, entityId: entityId == null ? null : String(entityId), detail: detail ? JSON.stringify(detail) : null });
}

function refresh() {
  invalidateCache();
  revalidatePath('/', 'layout');
}

async function siteOrigin() {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

const errorMessage = (e: unknown) => {
  const m = e instanceof Error ? e.message : String(e);
  if (m.includes('UNIQUE')) return 'That already exists (a unique field is duplicated).';
  return m.replace(/^D1 query failed: /, '');
};

// ── auth ───────────────────────────────────────────────────────────────────

export async function login(_: ActionState | null, form: FormData): Promise<ActionState> {
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0] ?? 'local';
  const key = `${email}|${ip}`;
  if (loginBlocked(key)) return fail('Too many attempts. Try again in 15 minutes.');

  const admin = email ? await findAdminByEmail(email) : null;
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    recordFailure(key);
    return fail('Incorrect email or password.');
  }
  clearFailures(key);
  await db.update(admins).set({ lastLoginAt: new Date().toISOString() }).where(eq(admins.id, admin.id));
  await createSession(admin);
  redirect('/admin');
}

export async function logout() {
  await destroySession();
  redirect('/admin/login');
}

export async function changePassword(_: ActionState | null, form: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const current = String(form.get('current') ?? '');
  const next = String(form.get('next') ?? '');
  if (next.length < 12) return fail('New password must be at least 12 characters.');
  const admin = await findAdminByEmail(me.email);
  if (!admin || !(await verifyPassword(current, admin.passwordHash))) return fail('Current password is incorrect.');
  await db.update(admins).set({ passwordHash: await hashPassword(next) }).where(eq(admins.id, admin.id));
  await audit(me.id, 'change_password', 'admin', me.id);
  return ok('Password updated.');
}

// ── expeditions ───────────────────────────────────────────────────────────

const expeditionSchema = z.object({
  id: optionalInt,
  number: z.coerce.number().int().positive(),
  countryIso2: z.string().length(2).toLowerCase(),
  slug: optional,
  tagline: optional,
  description: optional,
  startsOn: isoDate,
  endsOn: isoDate,
  heroImageUrl: optional,
  heroTitle: optional,
  heroCaption: optional,
  heroCredit: optional,
  accentColor: hexColor,
  pattern: z.enum(['stars', 'lattice', 'waves', 'diamonds', 'none']),
  published: checkbox,
});

export async function saveExpedition(_: ActionState | null, form: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const p = parse(expeditionSchema, form);
  if ('error' in p) return fail(p.error);
  const { id, ...values } = p.data;
  if (values.endsOn < values.startsOn) return fail('The end date must be after the start date.');

  let createdId: number;
  try {
    if (id) {
      const slug = values.slug ? slugify(values.slug) : undefined;
      await db.update(expeditions).set({ ...values, slug }).where(eq(expeditions.id, id));
      await audit(me.id, 'update', 'expedition', id, values);
      refresh();
      return ok('Expedition saved.');
    }
    const [country] = await db.select().from(schema.countries).where(eq(schema.countries.iso2, values.countryIso2));
    if (!country) return fail('Unknown country.');
    const slug = slugify(values.slug || country.name);
    const [row] = await db.insert(expeditions).values({ ...values, slug }).returning({ id: expeditions.id });
    createdId = row.id;
    await audit(me.id, 'create', 'expedition', row.id, values);
  } catch (e) {
    return fail(errorMessage(e));
  }
  refresh();
  redirect(`/admin/expeditions/${createdId}?created=1`);
}

export async function deleteExpedition(form: FormData) {
  const me = await requireAdmin();
  const id = Number(form.get('id'));
  await db.delete(expeditions).where(eq(expeditions.id, id));
  await audit(me.id, 'delete', 'expedition', id);
  refresh();
  redirect('/admin/expeditions');
}

/** value = expedition id, or "auto" to let dates decide. */
export async function setCurrentExpedition(form: FormData) {
  const me = await requireAdmin();
  const value = String(form.get('expeditionId') ?? 'auto');
  if (value === 'auto') await db.delete(settings).where(eq(settings.key, 'current_expedition_id'));
  else
    await db
      .insert(settings)
      .values({ key: 'current_expedition_id', value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  await audit(me.id, 'set_current', 'expedition', value);
  refresh();
}

// ── books & films ─────────────────────────────────────────────────────────

const workSchema = z.object({
  expeditionId: z.coerce.number().int(),
  linkId: optionalInt,
  workId: optionalInt,
  kind: z.enum(['book', 'film']),
  title: z.string().trim().min(1, 'Title is required'),
  creator: z.string().trim().min(1, 'Author/director is required'),
  year: optionalInt,
  length: optionalInt,
  genre: optional,
  description: optional,
  coverUrl: optional,
  awards: optional,
  role: z.enum(['primary', 'additional']),
  category: optional,
  whyChosen: optional,
  quote: optional,
  sortOrder: z.coerce.number().int().default(0),
  awardsVisa: checkbox,
});

export async function saveExpeditionWork(_: ActionState | null, form: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const p = parse(workSchema, form);
  if ('error' in p) return fail(p.error);
  const d = p.data;
  const [exp] = await db.select().from(expeditions).where(eq(expeditions.id, d.expeditionId));
  if (!exp) return fail('Expedition not found.');

  let coverUrl = d.coverUrl;
  if (!coverUrl) coverUrl = await findCover(d.kind, d.title, d.creator, d.year);

  const workValues = {
    kind: d.kind,
    title: d.title,
    creator: d.creator,
    year: d.year,
    length: d.length,
    genre: d.genre,
    description: d.description,
    coverUrl,
    awards: (d.awards ?? '').split('\n').map((s) => s.trim()).filter(Boolean),
    countryIso2: exp.countryIso2,
  };
  const linkValues = { role: d.role, category: d.category, whyChosen: d.whyChosen, quote: d.quote, sortOrder: d.sortOrder, awardsVisa: d.kind === 'film' ? true : d.awardsVisa };

  try {
    if (d.workId && d.linkId) {
      await db.batch([
        db.update(works).set(workValues).where(eq(works.id, d.workId)),
        db.update(expeditionWorks).set(linkValues).where(eq(expeditionWorks.id, d.linkId)),
      ]);
      await audit(me.id, 'update', 'work', d.workId, { ...workValues, ...linkValues });
    } else {
      // Reuse an existing catalogue entry (e.g. a Library book) when the same title/creator exists.
      const [existing] = await db
        .select({ id: works.id })
        .from(works)
        .where(and(eq(works.kind, d.kind), eq(works.title, d.title), eq(works.creator, d.creator)));
      let workId = existing?.id;
      if (workId) await db.update(works).set(workValues).where(eq(works.id, workId));
      else [{ id: workId }] = await db.insert(works).values({ ...workValues, inLibrary: d.kind === 'book' }).returning({ id: works.id });
      await db.insert(expeditionWorks).values({ expeditionId: d.expeditionId, workId: workId!, ...linkValues });
      await audit(me.id, 'add', 'work', workId!, { expeditionId: d.expeditionId, title: d.title });
    }
  } catch (e) {
    return fail(errorMessage(e));
  }
  refresh();
  return ok(`${d.kind === 'book' ? 'Book' : 'Film'} saved${!d.coverUrl && coverUrl ? ' — cover found automatically' : ''}.`);
}

export async function removeExpeditionWork(form: FormData) {
  const me = await requireAdmin();
  const linkId = Number(form.get('linkId'));
  await db.delete(expeditionWorks).where(eq(expeditionWorks.id, linkId));
  await audit(me.id, 'remove', 'expedition_work', linkId);
  refresh();
}

export async function lookupCover(kind: 'book' | 'film', title: string, creator: string, year?: number | null) {
  await requireAdmin();
  if (!title.trim()) return null;
  return findCover(kind, title, creator, year);
}

// ── friends ───────────────────────────────────────────────────────────────

const friendSchema = z.object({
  expeditionId: z.coerce.number().int(),
  friendId: optionalInt,
  name: z.string().trim().min(1, 'Name is required'),
  title: optional,
  bio: optional,
  photoUrl: optional,
  location: optional,
  quote: optional,
  sortOrder: z.coerce.number().int().default(0),
});

export async function saveFriend(_: ActionState | null, form: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const p = parse(friendSchema, form);
  if ('error' in p) return fail(p.error);
  const d = p.data;
  const [exp] = await db.select().from(expeditions).where(eq(expeditions.id, d.expeditionId));
  if (!exp) return fail('Expedition not found.');
  const values = { name: d.name, title: d.title, bio: d.bio, photoUrl: d.photoUrl, location: d.location, countryIso2: exp.countryIso2 };
  try {
    if (d.friendId) {
      await db.batch([
        db.update(friends).set(values).where(eq(friends.id, d.friendId)),
        db
          .update(expeditionFriends)
          .set({ quote: d.quote, sortOrder: d.sortOrder })
          .where(and(eq(expeditionFriends.friendId, d.friendId), eq(expeditionFriends.expeditionId, d.expeditionId))),
      ]);
      await audit(me.id, 'update', 'friend', d.friendId, values);
    } else {
      let slug = slugify(d.name);
      const [clash] = await db.select({ id: friends.id }).from(friends).where(eq(friends.slug, slug));
      if (clash) slug = `${slug}-${exp.slug}`;
      const [row] = await db.insert(friends).values({ ...values, slug }).returning({ id: friends.id });
      await db.insert(expeditionFriends).values({ expeditionId: d.expeditionId, friendId: row.id, quote: d.quote, sortOrder: d.sortOrder });
      await audit(me.id, 'add', 'friend', row.id, values);
    }
  } catch (e) {
    return fail(errorMessage(e));
  }
  refresh();
  return ok('Friend saved.');
}

export async function removeFriend(form: FormData) {
  const me = await requireAdmin();
  const expeditionId = Number(form.get('expeditionId'));
  const friendId = Number(form.get('friendId'));
  await db.delete(expeditionFriends).where(and(eq(expeditionFriends.expeditionId, expeditionId), eq(expeditionFriends.friendId, friendId)));
  await audit(me.id, 'remove', 'expedition_friend', `${expeditionId}:${friendId}`);
  refresh();
}

// ── events / calendar ─────────────────────────────────────────────────────

const eventSchema = z.object({
  id: optionalInt,
  expeditionId: optionalInt,
  kind: z.enum(['meeting', 'class', 'social', 'other']),
  title: z.string().trim().min(1, 'Title is required'),
  description: optional,
  localStart: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'Pick a date and time'),
  hostTimezone: z.string().min(1),
  durationMin: z.coerce.number().int().min(5).max(24 * 60),
  joinUrl: optional,
  recordingUrl: optional,
  zoomMeetingId: optional,
  published: checkbox,
});

export async function saveEvent(_: ActionState | null, form: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const p = parse(eventSchema, form);
  if ('error' in p) return fail(p.error);
  const { id, localStart, ...rest } = p.data;
  let startsAt: string;
  try {
    startsAt = zonedToUtc(localStart, rest.hostTimezone);
  } catch {
    return fail('Unknown time zone.');
  }
  const values = { ...rest, startsAt };
  try {
    if (id) {
      await db.update(events).set(values).where(eq(events.id, id));
      await audit(me.id, 'update', 'event', id, values);
    } else {
      const [row] = await db.insert(events).values(values).returning({ id: events.id });
      await audit(me.id, 'create', 'event', row.id, values);
    }
  } catch (e) {
    return fail(errorMessage(e));
  }
  refresh();
  return ok(id ? 'Event updated.' : 'Event added to the calendar.');
}

export async function deleteEvent(form: FormData) {
  const me = await requireAdmin();
  const id = Number(form.get('id'));
  await db.delete(events).where(eq(events.id, id));
  await audit(me.id, 'delete', 'event', id);
  refresh();
}

/** Creates the club's usual pair: launch on the first Sunday of the start month, discussion on the last Sunday of the end month. */
export async function createDefaultMeetings(form: FormData) {
  const me = await requireAdmin();
  const expeditionId = Number(form.get('expeditionId'));
  const time = String(form.get('time') || '17:30');
  const tz = String(form.get('timezone') || 'Asia/Kolkata');
  const [exp] = await db.select().from(expeditions).where(eq(expeditions.id, expeditionId));
  if (!exp) return;
  const sunday = (year: number, month: number, which: 'first' | 'last') => {
    const d = which === 'first' ? new Date(Date.UTC(year, month, 1)) : new Date(Date.UTC(year, month + 1, 0));
    while (d.getUTCDay() !== 0) d.setUTCDate(d.getUTCDate() + (which === 'first' ? 1 : -1));
    return d.toISOString().slice(0, 10);
  };
  const s = new Date(`${exp.startsOn}T00:00:00Z`);
  const e = new Date(`${exp.endsOn}T00:00:00Z`);
  const first = sunday(s.getUTCFullYear(), s.getUTCMonth(), 'first');
  const last = sunday(e.getUTCFullYear(), e.getUTCMonth(), 'last');
  await db.insert(events).values([
    { expeditionId, kind: 'meeting', title: 'Meeting 1 · Launch & Introduction', startsAt: zonedToUtc(`${first}T${time}`, tz), hostTimezone: tz, durationMin: 90 },
    { expeditionId, kind: 'meeting', title: 'Meeting 2 · Discussion & Q&A', startsAt: zonedToUtc(`${last}T${time}`, tz), hostTimezone: tz, durationMin: 90 },
  ]);
  await audit(me.id, 'create_default_meetings', 'expedition', expeditionId, { first, last, time, tz });
  refresh();
}

// ── members ───────────────────────────────────────────────────────────────

const memberSchema = z.object({
  id: optionalInt,
  name: z.string().trim().min(2, 'Name is required'),
  email: z.union([z.literal(''), z.email('Invalid email')]).transform((v) => (v ? v.toLowerCase() : null)),
  countryIso2: z.string().length(2, 'Pick a country').toLowerCase(),
  joinedOn: isoDate.optional(),
  isPublic: checkbox,
  notes: optional,
});

async function nextPassportNumber(joinedOn: string) {
  const [row] = await db.select({ max: sql<number>`MAX(CAST(substr(${members.passportNumber}, -4) AS INTEGER))` }).from(members);
  const next = (row?.max ?? 0) + 1;
  return `WOW-${joinedOn.slice(0, 4)}-${String(next).padStart(4, '0')}`;
}

export async function saveMember(_: ActionState | null, form: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const p = parse(memberSchema, form);
  if ('error' in p) return fail(p.error);
  const { id, ...d } = p.data;
  const joinedOn = d.joinedOn ?? new Date().toISOString().slice(0, 10);

  try {
    if (id) {
      await db.update(members).set({ ...d, joinedOn }).where(eq(members.id, id));
      await audit(me.id, 'update', 'member', id, d);
      refresh();
      return ok('Member updated.');
    }

    let created: { id: number; passportNumber: string } | undefined;
    for (let attempt = 0; attempt < 3 && !created; attempt++) {
      const passportNumber = await nextPassportNumber(joinedOn);
      try {
        [created] = await db.insert(members).values({ ...d, joinedOn, passportNumber }).returning({ id: members.id, passportNumber: members.passportNumber });
      } catch (e) {
        if (!errorMessage(e).includes('already exists') || attempt === 2) throw e; // number taken concurrently → retry
      }
    }
    if (!created) return fail('Could not allocate a passport number.');

    await audit(me.id, 'create', 'member', created.id, { ...d, passportNumber: created.passportNumber });
    refresh();
    const inviteUrl = `${await siteOrigin()}/invite?uid=${created.passportNumber}`;
    return ok(`${d.name} joined — passport ${created.passportNumber}.`, { passportNumber: created.passportNumber, inviteUrl, name: d.name });
  } catch (e) {
    return fail(errorMessage(e));
  }
}

export async function setMemberStatus(form: FormData) {
  const me = await requireAdmin();
  const id = Number(form.get('id'));
  const status = form.get('status') === 'inactive' ? 'inactive' : 'active';
  await db.update(members).set({ status }).where(eq(members.id, id));
  await audit(me.id, status === 'active' ? 'restore' : 'deactivate', 'member', id);
  refresh();
}

// ── settings & recommendations ────────────────────────────────────────────

const EDITABLE_SETTINGS = Object.keys(SETTING_DEFAULTS) as SettingKey[];

export async function saveSettings(_: ActionState | null, form: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const values = EDITABLE_SETTINGS.filter((key) => form.has(key) || key === 'email_enabled' || key === 'auto_confirmations').map((key) => ({
    key,
    value: key === 'email_enabled' || key === 'auto_confirmations' ? (form.get(key) === 'on' ? 'true' : 'false') : String(form.get(key) ?? '').trim(),
  }));
  for (const v of values) {
    if (v.key.endsWith('_url') && v.value && !/^https?:\/\//.test(v.value)) return fail(`${v.key.replace(/_/g, ' ')} must start with https://`);
    if ((v.key === 'confirm_reminder_days' || v.key === 'meeting_reminder_hours') && v.value && !/^\d+(\s*,\s*\d+)*$/.test(v.value)) return fail('Use comma-separated numbers, for example: 3,7,14');
    if (v.key === 'confirm_reminder_days' && numberList(v.value).length > 3) return fail('At most 3 reminders (4 emails in total) — we keep it limited on purpose.');
  }
  await db.batch(values.map((v) => db.insert(settings).values(v).onConflictDoUpdate({ target: settings.key, set: { value: v.value } })) as unknown as [never]);
  await audit(me.id, 'update', 'settings', null, Object.fromEntries(values.map((v) => [v.key, v.value])));
  refresh();
  return ok('Settings saved.');
}

export async function setRecommendationStatus(form: FormData) {
  const me = await requireAdmin();
  const id = Number(form.get('id'));
  const status = z.enum(['new', 'shortlisted', 'archived']).parse(form.get('status'));
  await db.update(recommendations).set({ status }).where(eq(recommendations.id, id));
  await audit(me.id, 'set_status', 'recommendation', id, { status });
  refresh();
}

export async function deleteRecommendations(form: FormData) {
  const me = await requireAdmin();
  const ids = form.getAll('id').map(Number);
  if (ids.length) await db.delete(recommendations).where(inArray(recommendations.id, ids));
  await audit(me.id, 'delete', 'recommendation', ids.join(','));
  refresh();
}
