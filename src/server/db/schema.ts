/**
 * WOW database schema — the single source of truth for every table.
 * Change this file, then `npm run db:generate` + `npm run db:migrate`.
 */
import { sql } from 'drizzle-orm';
import { integer, primaryKey, real, sqliteTable, text, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

const createdAt = () => text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ','now'))`);

/** Reference data for every country (seeded once, editable). */
export const countries = sqliteTable('countries', {
  iso2: text('iso2').primaryKey(), // lowercase, e.g. "ir"
  iso3: text('iso3').notNull(),
  name: text('name').notNull(),
  capital: text('capital'),
  currency: text('currency'),
  languages: text('languages'),
  continent: text('continent').notNull(), // Africa | Asia | Europe | North America | South America | Caribbean | Oceania | Antarctica
  lat: real('lat'),
  lng: real('lng'),
  utcOffset: real('utc_offset'),
  epithet: text('epithet'),
  funFact: text('fun_fact'),
});

export const members = sqliteTable(
  'members',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    passportNumber: text('passport_number').notNull().unique(), // WOW-2026-0001 — printed on shared invites, never change
    name: text('name').notNull(),
    email: text('email').unique(),
    countryIso2: text('country_iso2').notNull().references(() => countries.iso2),
    status: text('status', { enum: ['active', 'inactive'] }).notNull().default('active'),
    joinedOn: text('joined_on').notNull(), // YYYY-MM-DD
    isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(true),
    notes: text('notes'),
    createdAt: createdAt(),
  },
  (t) => [index('members_status_idx').on(t.status)],
);

export const expeditions = sqliteTable('expeditions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(), // /expeditions/<slug> — public URL, avoid changing
  number: integer('number').notNull().unique(),
  countryIso2: text('country_iso2').notNull().references(() => countries.iso2),
  tagline: text('tagline'),
  description: text('description'),
  startsOn: text('starts_on').notNull(), // YYYY-MM-DD
  endsOn: text('ends_on').notNull(),
  heroImageUrl: text('hero_image_url'),
  heroTitle: text('hero_title'),
  heroCaption: text('hero_caption'),
  heroCredit: text('hero_credit'),
  accentColor: text('accent_color').notNull().default('#C9A052'),
  pattern: text('pattern', { enum: ['stars', 'lattice', 'waves', 'diamonds', 'none'] }).notNull().default('none'),
  published: integer('published', { mode: 'boolean' }).notNull().default(true),
  // ── Visa rules (editable per expedition in the admin) ──
  classVisaEvidence: text('class_visa_evidence', { enum: ['any', 'verified'] }).notNull().default('any'), // 'verified' = Zoom/admin-verified attendance only
  classVisaMinSessions: integer('class_visa_min_sessions').notNull().default(1),
  movieVisaMinFilms: integer('movie_visa_min_films').notNull().default(1),
  confirmationsOpenedAt: text('confirmations_opened_at'), // set when the "did you read/watch/attend?" emails go out
  createdAt: createdAt(),
});

/** Global catalogue of books and films — expedition picks and the Library both live here. */
export const works = sqliteTable(
  'works',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    kind: text('kind', { enum: ['book', 'film'] }).notNull(),
    title: text('title').notNull(),
    creator: text('creator').notNull(), // author or director
    year: integer('year'),
    length: integer('length'), // pages (book) or minutes (film)
    genre: text('genre'),
    description: text('description'),
    coverUrl: text('cover_url'),
    awards: text('awards', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
    countryIso2: text('country_iso2').references(() => countries.iso2),
    inLibrary: integer('in_library', { mode: 'boolean' }).notNull().default(true),
    featured: integer('featured', { mode: 'boolean' }).notNull().default(false), // "On our horizon" picks
    note: text('note'), // why it's on the horizon
    createdAt: createdAt(),
  },
  (t) => [index('works_country_idx').on(t.countryIso2), uniqueIndex('works_identity_idx').on(t.kind, t.title, t.creator)],
);

export const expeditionWorks = sqliteTable(
  'expedition_works',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    expeditionId: integer('expedition_id').notNull().references(() => expeditions.id, { onDelete: 'cascade' }),
    workId: integer('work_id').notNull().references(() => works.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['primary', 'additional'] }).notNull().default('primary'),
    category: text('category'), // e.g. "Historical & Political" — groups films on the country page
    whyChosen: text('why_chosen'),
    quote: text('quote'),
    sortOrder: integer('sort_order').notNull().default(0),
    awardsVisa: integer('awards_visa', { mode: 'boolean' }).notNull().default(true), // books: each flagged book earns its own Book Visa
  },
  (t) => [uniqueIndex('expedition_work_idx').on(t.expeditionId, t.workId)],
);

/** The "friends": guests from each country who guide an expedition. */
export const friends = sqliteTable('friends', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(), // /guest-invite?id=<slug>
  name: text('name').notNull(),
  title: text('title'), // e.g. "Friend from Iran"
  bio: text('bio'),
  photoUrl: text('photo_url'),
  location: text('location'),
  countryIso2: text('country_iso2').references(() => countries.iso2),
  createdAt: createdAt(),
});

export const expeditionFriends = sqliteTable(
  'expedition_friends',
  {
    expeditionId: integer('expedition_id').notNull().references(() => expeditions.id, { onDelete: 'cascade' }),
    friendId: integer('friend_id').notNull().references(() => friends.id, { onDelete: 'cascade' }),
    quote: text('quote'),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.expeditionId, t.friendId] })],
);

/** Meetings, classes and any other dated happening. Times are UTC ISO strings. */
export const events = sqliteTable(
  'events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    expeditionId: integer('expedition_id').references(() => expeditions.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['meeting', 'class', 'social', 'other'] }).notNull().default('meeting'),
    title: text('title').notNull(),
    description: text('description'),
    startsAt: text('starts_at').notNull(), // 2026-10-25T12:00:00.000Z
    durationMin: integer('duration_min').notNull().default(90),
    hostTimezone: text('host_timezone').notNull().default('Asia/Kolkata'),
    joinUrl: text('join_url'), // falls back to settings.default_meet_url
    zoomMeetingId: text('zoom_meeting_id'), // for Zoom attendance reports
    recordingUrl: text('recording_url'),
    published: integer('published', { mode: 'boolean' }).notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index('events_starts_idx').on(t.startsAt)],
);

/**
 * What a member has (or hasn't) done for one expedition activity.
 * targetKey: "book:<workId>" | "movie:<workId>" | "class:<expeditionId>"
 * status:    unconfirmed (never asked/answered) → awaiting (asked, reminders running) → confirmed | declined
 *            verified (attendance proven by Zoom/admin) · expired (reminders exhausted, never answered)
 */
export const participation = sqliteTable(
  'participation',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    memberId: integer('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
    expeditionId: integer('expedition_id').notNull().references(() => expeditions.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['book', 'movie', 'class'] }).notNull(),
    workId: integer('work_id').references(() => works.id, { onDelete: 'set null' }),
    targetKey: text('target_key').notNull(),
    status: text('status', { enum: ['unconfirmed', 'awaiting', 'confirmed', 'declined', 'verified', 'expired'] }).notNull().default('unconfirmed'),
    source: text('source', { enum: ['member', 'zoom', 'admin', 'import'] }).notNull().default('member'),
    note: text('note'),
    answeredAt: text('answered_at'),
    updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ','now'))`),
  },
  (t) => [uniqueIndex('participation_member_target_idx').on(t.memberId, t.targetKey), index('participation_expedition_idx').on(t.expeditionId)],
);

/** Who joined a session (Zoom report import/API or manual). memberId is null until matched. */
export const attendance = sqliteTable(
  'attendance',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    memberId: integer('member_id').references(() => members.id, { onDelete: 'set null' }),
    displayName: text('display_name').notNull(),
    email: text('email'),
    joinedAt: text('joined_at'),
    leftAt: text('left_at'),
    minutes: integer('minutes').notNull().default(0),
    source: text('source', { enum: ['zoom_csv', 'zoom_api', 'admin'] }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('attendance_event_idx').on(t.eventId), index('attendance_member_idx').on(t.memberId)],
);

/**
 * A visa in a member's Cultural Passport. Every row records WHY it exists.
 * targetKey: same scheme as participation, or "legacy:<expeditionId>" for the pre-verification visas.
 * Revoking keeps the row (revokedAt) so history is never lost.
 */
export const visaAwards = sqliteTable(
  'visa_awards',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    memberId: integer('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
    expeditionId: integer('expedition_id').notNull().references(() => expeditions.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['book', 'movie', 'class', 'legacy'] }).notNull(),
    workId: integer('work_id').references(() => works.id, { onDelete: 'set null' }),
    targetKey: text('target_key').notNull(),
    reason: text('reason').notNull(),
    source: text('source', { enum: ['auto', 'admin', 'legacy'] }).notNull(),
    awardedAt: text('awarded_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ','now'))`),
    awardedBy: integer('awarded_by').references(() => admins.id, { onDelete: 'set null' }),
    revokedAt: text('revoked_at'),
    revokedReason: text('revoked_reason'),
  },
  (t) => [uniqueIndex('visa_award_member_target_idx').on(t.memberId, t.targetKey), index('visa_award_expedition_idx').on(t.expeditionId)],
);

/** One "did you read / watch / attend?" request per member per expedition, with reminder bookkeeping. */
export const confirmationRequests = sqliteTable(
  'confirmation_requests',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    memberId: integer('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
    expeditionId: integer('expedition_id').notNull().references(() => expeditions.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    status: text('status', { enum: ['open', 'answered', 'expired'] }).notNull().default('open'),
    sentCount: integer('sent_count').notNull().default(0),
    firstSentAt: text('first_sent_at'),
    lastSentAt: text('last_sent_at'),
    answeredAt: text('answered_at'),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('confirmation_member_expedition_idx').on(t.memberId, t.expeditionId)],
);

/** Per-member email preferences. `token` powers the no-login preferences/unsubscribe links in every email. */
export const notificationPrefs = sqliteTable('notification_prefs', {
  memberId: integer('member_id').primaryKey().references(() => members.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  unsubscribedAll: integer('unsubscribed_all', { mode: 'boolean' }).notNull().default(false),
  // One flag per notification type key (see src/server/notifications/registry.ts) stored as JSON: { "meeting_reminder": false }
  disabledTypes: text('disabled_types', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ','now'))`),
});

/** Every email we send or plan to send. `dedupeKey` makes scheduling idempotent. */
export const emailOutbox = sqliteTable(
  'email_outbox',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    memberId: integer('member_id').references(() => members.id, { onDelete: 'set null' }),
    toEmail: text('to_email').notNull(),
    type: text('type').notNull(),
    dedupeKey: text('dedupe_key').notNull().unique(),
    subject: text('subject').notNull(),
    bodyHtml: text('body_html').notNull(),
    bodyText: text('body_text').notNull(),
    sendAt: text('send_at').notNull(),
    status: text('status', { enum: ['queued', 'sent', 'failed', 'skipped'] }).notNull().default('queued'),
    attempts: integer('attempts').notNull().default(0),
    error: text('error'),
    sentAt: text('sent_at'),
    createdAt: createdAt(),
  },
  (t) => [index('outbox_status_idx').on(t.status, t.sendAt)],
);

export const admins = sqliteTable('admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  lastLoginAt: text('last_login_at'),
  createdAt: createdAt(),
});

/** Simple typed key/value settings (links, defaults, current-expedition override). */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const recommendations = sqliteTable('recommendations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  country: text('country').notNull(),
  bookTitle: text('book_title'),
  bookAuthor: text('book_author'),
  filmTitle: text('film_title'),
  filmDirector: text('film_director'),
  submitterName: text('submitter_name'),
  why: text('why'),
  status: text('status', { enum: ['new', 'shortlisted', 'archived'] }).notNull().default('new'),
  createdAt: createdAt(),
});

export const auditLog = sqliteTable('audit_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  adminId: integer('admin_id').references(() => admins.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id'),
  detail: text('detail'),
  createdAt: createdAt(),
});

export type Country = typeof countries.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Expedition = typeof expeditions.$inferSelect;
export type Work = typeof works.$inferSelect;
export type ExpeditionWork = typeof expeditionWorks.$inferSelect;
export type Friend = typeof friends.$inferSelect;
export type Event = typeof events.$inferSelect;
export type VisaAward = typeof visaAwards.$inferSelect;
export type Participation = typeof participation.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Recommendation = typeof recommendations.$inferSelect;
