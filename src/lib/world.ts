/** Data shape shared by the globe, the 2D map and the country card (built on the server, see server/view.ts). */
export type WorldExpedition = {
  slug: string;
  status: 'current' | 'completed' | 'upcoming';
  number: number;
  book: string | null;
  film: string | null;
  friend: string | null;
};

export type WorldCountry = {
  iso2: string;
  name: string;
  continent: string;
  capital: string | null;
  epithet: string | null;
  funFact: string | null;
  languages: string | null;
  currency: string | null;
  lat: number | null;
  lng: number | null;
  members: number; // explorers whose home country this is
  books: number; // books in the Library from this country
  expedition: WorldExpedition | null;
};

export type WorldData = { countries: Record<string, WorldCountry> };

export const CONTINENTS = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Caribbean', 'Oceania'] as const;
export const continentVar = (c: string) => `--c-${c.toLowerCase().replace(/\s+/g, '-')}`;
export const continentColor = (c: string) => `var(${continentVar(c)})`;
