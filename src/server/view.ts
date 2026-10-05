import 'server-only';
import type { WorldCountry, WorldData } from '@/lib/world';
import { getLibrary, getPublicMembers, getSite } from './queries';

/** Everything the globe, the world map and the country card need — one object, built from the database. */
export async function getWorldData(): Promise<WorldData> {
  const [site, members, library] = await Promise.all([getSite(), getPublicMembers(), getLibrary()]);
  const memberCount = new Map<string, number>();
  for (const m of members) memberCount.set(m.countryIso2, (memberCount.get(m.countryIso2) ?? 0) + 1);
  const bookCount = new Map<string, number>();
  for (const b of library) if (b.countryIso2) bookCount.set(b.countryIso2, (bookCount.get(b.countryIso2) ?? 0) + 1);
  const expeditions = new Map(site.expeditions.filter((e) => e.published).map((e) => [e.countryIso2, e]));

  const countries: Record<string, WorldCountry> = {};
  for (const c of site.countries) {
    const e = expeditions.get(c.iso2);
    countries[c.iso2] = {
      iso2: c.iso2,
      name: c.name,
      continent: c.continent,
      capital: c.capital,
      epithet: c.epithet,
      funFact: c.funFact,
      languages: c.languages,
      currency: c.currency,
      lat: c.lat,
      lng: c.lng,
      members: memberCount.get(c.iso2) ?? 0,
      books: bookCount.get(c.iso2) ?? 0,
      expedition: e ? { slug: e.slug, status: e.status, number: e.number, book: e.book?.title ?? null, film: e.film?.title ?? null, friend: e.friends[0]?.name ?? null } : null,
    };
  }
  return { countries };
}
