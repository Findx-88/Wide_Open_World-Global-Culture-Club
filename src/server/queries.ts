import 'server-only';
import { asc, eq, isNull } from 'drizzle-orm';
import { cache as perRequest } from 'react';
import { db, schema } from './db';
import { cached } from './cache';
import { todayUtc } from '@/lib/time';
import { withDefaults, type SiteSettings } from '@/lib/settings';
import type { Country, Event, Expedition, Friend, Work } from './db/schema';

const { countries, expeditions, expeditionWorks, works, friends, expeditionFriends, events, settings, members, visaAwards } = schema;

const TTL = 60_000;

export type ExpeditionStatus = 'current' | 'upcoming' | 'completed';
export type LinkedWork = Work & { linkId: number; role: 'primary' | 'additional'; category: string | null; whyChosen: string | null; quote: string | null; sortOrder: number; awardsVisa: boolean };
export type LinkedFriend = Friend & { quote: string | null };
export type ExpeditionView = Expedition & {
  country: Country;
  status: ExpeditionStatus;
  books: LinkedWork[];
  films: LinkedWork[];
  book: LinkedWork | null;
  film: LinkedWork | null;
  friends: LinkedFriend[];
  events: Event[];
};
export type { SiteSettings };

/** Everything the public site needs except members and the library, in a single D1 round trip. */
const loadSite = () =>
  cached('site', TTL, async () => {
    const [exps, links, friendRows, eventRows, settingRows, countryRows] = await db.batch([
      db.select().from(expeditions).orderBy(asc(expeditions.number)),
      db.select({ link: expeditionWorks, work: works }).from(expeditionWorks).innerJoin(works, eq(works.id, expeditionWorks.workId)).orderBy(asc(expeditionWorks.sortOrder)),
      db.select({ link: expeditionFriends, friend: friends }).from(expeditionFriends).innerJoin(friends, eq(friends.id, expeditionFriends.friendId)).orderBy(asc(expeditionFriends.sortOrder)),
      db.select().from(events).orderBy(asc(events.startsAt)),
      db.select().from(settings),
      db.select().from(countries),
    ]);

    const settingsMap = withDefaults(Object.fromEntries(settingRows.map((s) => [s.key, s.value])));
    const countryMap = new Map(countryRows.map((c) => [c.iso2, c]));
    const today = todayUtc();
    const published = exps.filter((e) => e.published);

    const override = Number(settingsMap.current_expedition_id);
    const current =
      published.find((e) => e.id === override) ??
      published.find((e) => e.startsOn <= today && today <= e.endsOn) ??
      published.find((e) => e.startsOn > today) ??
      published.at(-1);

    const views: ExpeditionView[] = exps.map((e) => {
      const linked = links
        .filter((l) => l.link.expeditionId === e.id)
        .map(({ link, work }) => ({ ...work, linkId: link.id, role: link.role, category: link.category, whyChosen: link.whyChosen, quote: link.quote, sortOrder: link.sortOrder, awardsVisa: link.awardsVisa }));
      const books = linked.filter((w) => w.kind === 'book');
      const films = linked.filter((w) => w.kind === 'film');
      return {
        ...e,
        country: countryMap.get(e.countryIso2)!,
        status: e.id === current?.id ? 'current' : e.endsOn < today ? 'completed' : 'upcoming',
        books,
        films,
        book: books.find((w) => w.role === 'primary') ?? books[0] ?? null,
        film: films.find((w) => w.role === 'primary') ?? films[0] ?? null,
        friends: friendRows.filter((f) => f.link.expeditionId === e.id).map(({ link, friend }) => ({ ...friend, quote: link.quote })),
        events: eventRows.filter((ev) => ev.expeditionId === e.id && ev.published),
      };
    });

    return { expeditions: views, events: eventRows.filter((e) => e.published), allEvents: eventRows, settings: settingsMap, countries: countryRows };
  });

export const getSite = perRequest(loadSite);

export async function getSettings() {
  return (await getSite()).settings;
}

export async function getPublishedExpeditions() {
  return (await getSite()).expeditions.filter((e) => e.published);
}

export async function getCurrentExpedition() {
  return (await getPublishedExpeditions()).find((e) => e.status === 'current') ?? null;
}

export async function getExpeditionBySlug(slug: string) {
  return (await getPublishedExpeditions()).find((e) => e.slug === slug) ?? null;
}

/** Events that haven't finished yet (a meeting stays "next" while it's live). */
export async function getUpcomingEvents(limit?: number) {
  const now = Date.now();
  const list = (await getSite()).events.filter((e) => new Date(e.startsAt).getTime() + e.durationMin * 60_000 > now);
  return limit ? list.slice(0, limit) : list;
}

export async function getNextEvent() {
  const [next] = await getUpcomingEvents(1);
  if (!next) return null;
  const exp = (await getSite()).expeditions.find((e) => e.id === next.expeditionId) ?? null;
  return { event: next, expedition: exp };
}

export async function getFriendBySlug(slug: string) {
  const site = await getSite();
  for (const e of site.expeditions) {
    const f = e.friends.find((x) => x.slug === slug);
    if (f) return { friend: f, expedition: e };
  }
  return null;
}

// ── Members & passports ────────────────────────────────────────────────────

export type VisaKind = 'book' | 'movie' | 'class' | 'legacy';
export type PublicMember = { id: number; passportNumber: string; name: string; countryIso2: string; countryName: string; joinedOn: string; visaCount: number; visaExpeditionIds: number[] };

const loadMembers = () =>
  cached('members', TTL, async () => {
    const [rows, awardRows] = await db.batch([
      db
        .select({ id: members.id, passportNumber: members.passportNumber, name: members.name, countryIso2: members.countryIso2, countryName: countries.name, joinedOn: members.joinedOn, isPublic: members.isPublic })
        .from(members)
        .innerJoin(countries, eq(countries.iso2, members.countryIso2))
        .where(eq(members.status, 'active'))
        .orderBy(asc(members.passportNumber)),
      // Revoked awards are kept for history but never shown or counted.
      db
        .select({ memberId: visaAwards.memberId, expeditionId: visaAwards.expeditionId, kind: visaAwards.kind, workId: visaAwards.workId, awardedAt: visaAwards.awardedAt })
        .from(visaAwards)
        .where(isNull(visaAwards.revokedAt)),
    ]);
    return rows.map(({ isPublic, ...m }) => ({ ...m, isPublic, awards: awardRows.filter((v) => v.memberId === m.id) }));
  });

/** Members shown on the public Explorers page (no emails, opted-in only). */
export async function getPublicMembers(): Promise<PublicMember[]> {
  return (await loadMembers())
    .filter((m) => m.isPublic)
    .map(({ awards, isPublic: _p, ...m }) => ({ ...m, visaCount: awards.length, visaExpeditionIds: [...new Set(awards.map((x) => x.expeditionId))] }));
}

export async function getMemberCount() {
  return (await loadMembers()).length;
}

export type PassportExpeditionVisas = {
  expedition: ExpeditionView;
  visas: { kind: VisaKind; awardedAt: string; workTitle: string | null }[];
};

/** A single passport, looked up by its number. Works for non-public members too (whoever has the number). */
export async function getPassport(passportNumber: string) {
  const m = (await loadMembers()).find((x) => x.passportNumber.toUpperCase() === passportNumber.trim().toUpperCase());
  if (!m) return null;
  const site = await getSite();
  const country = site.countries.find((c) => c.iso2 === m.countryIso2)!;
  const stamps: PassportExpeditionVisas[] = site.expeditions
    .filter((e) => m.awards.some((a) => a.expeditionId === e.id))
    .map((e) => ({
      expedition: e,
      visas: m.awards
        .filter((a) => a.expeditionId === e.id)
        .map((a) => ({ kind: a.kind, awardedAt: a.awardedAt, workTitle: a.workId ? e.books.find((b) => b.id === a.workId)?.title ?? null : null }))
        .sort((x, y) => x.kind.localeCompare(y.kind)),
    }))
    .sort((a, b) => a.expedition.number - b.expedition.number);
  return { member: { id: m.id, passportNumber: m.passportNumber, name: m.name, joinedOn: m.joinedOn, country }, stamps };
}

// ── Library ────────────────────────────────────────────────────────────────

export const getLibrary = () =>
  cached('library', TTL * 10, async () => {
    const rows = await db
      .select({ work: works, country: countries })
      .from(works)
      .innerJoin(countries, eq(countries.iso2, works.countryIso2))
      .where(eq(works.inLibrary, true))
      .orderBy(asc(countries.name), asc(works.title));
    return rows.map(({ work, country }) => ({ ...work, countryName: country.name, continent: country.continent }));
  });

export async function getHorizonPicks() {
  return (await getLibrary()).filter((w) => w.featured);
}

export type CountryLite = Pick<Country, 'iso2' | 'name' | 'capital' | 'currency' | 'languages' | 'utcOffset' | 'epithet'>;
