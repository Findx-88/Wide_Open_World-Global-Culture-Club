/**
 * One-time import of WOW's existing content into D1 (countries, members, expeditions, works, events…).
 * Safe to re-run: every insert is INSERT OR IGNORE on a natural unique key.
 * Usage: npm run db:seed
 */
import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import countriesData from 'world-countries';
import { d1Batch, d1Query, type Statement } from '../src/server/db/d1';

config({ path: '.env.local' });

const dataDir = path.join(process.cwd(), 'scripts', 'seed-data');
const readJson = <T>(f: string): T => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8').replace(/^﻿/, ''));

async function run(statements: Statement[], chunk = 40) {
  for (let i = 0; i < statements.length; i += chunk) await d1Batch(statements.slice(i, i + chunk));
}

function continentOf(region: string, subregion: string) {
  if (region === 'Americas') return subregion === 'South America' ? 'South America' : subregion === 'Caribbean' ? 'Caribbean' : 'North America';
  if (region === 'Antarctic') return 'Antarctica';
  return region;
}

async function seedCountries() {
  // Epithets + UTC offsets from the old site, keyed by the globe's country names → ISO via the geojson.
  const info = readJson<Record<string, { utcOffset: number; epithet: string }>>('country-info.json');
  const geo = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'countries.geojson'), 'utf8').replace(/^﻿/, ''));
  const nameToIso: Record<string, string> = { France: 'fr', Norway: 'no' };
  for (const f of geo.features) if (f.properties.ISO_A2 && f.properties.ISO_A2 !== '-99') nameToIso[f.properties.NAME] = f.properties.ISO_A2.toLowerCase();
  const extra: Record<string, { utcOffset: number; epithet: string }> = {};
  for (const [name, v] of Object.entries(info)) if (nameToIso[name]) extra[nameToIso[name]] = v;

  const statements: Statement[] = countriesData.map((c) => {
    const iso2 = c.cca2.toLowerCase();
    return {
      sql: `INSERT OR IGNORE INTO countries (iso2, iso3, name, capital, currency, languages, continent, lat, lng, utc_offset, epithet)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      params: [
        iso2,
        c.cca3,
        c.name.common,
        c.capital?.join(', ') || null,
        Object.values(c.currencies ?? {}).map((x) => (x as { name: string }).name).join(', ') || null,
        Object.values(c.languages ?? {}).join(', ') || null,
        continentOf(c.region, c.subregion),
        c.latlng?.[0] ?? null,
        c.latlng?.[1] ?? null,
        extra[iso2]?.utcOffset ?? null,
        extra[iso2]?.epithet || null,
      ],
    };
  });
  await run(statements);
  console.log(`✓ ${statements.length} countries`);
}

const ISO_MONTHS: Record<string, string> = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
const toIsoDate = (d: string) => {
  const [day, mon, year] = d.split(' ');
  return `${year}-${ISO_MONTHS[mon]}-${day.padStart(2, '0')}`;
};

async function seedSettings() {
  const settings: Record<string, string> = {
    whatsapp_url: 'https://chat.whatsapp.com/JYHDYANTQTG9UH71kIvLbe',
    default_meet_url: 'https://meet.google.com/uhd-sbys-kes',
    default_timezone: 'Asia/Kolkata',
    reading_assistant_url: 'https://ivory-lyrebird-434187.hostingersite.com/',
    instagram_url: '',
    contact_email: '',
  };
  await run(Object.entries(settings).map(([k, v]) => ({ sql: 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', params: [k, v] })));
  console.log('✓ settings');
}

type WorkSeed = {
  kind: 'book' | 'film';
  title: string;
  creator: string;
  year?: number;
  length?: number;
  genre?: string;
  description?: string;
  awards?: string[];
  country: string;
  featured?: boolean;
  note?: string;
};

const insertWork = (w: WorkSeed): Statement => ({
  sql: `INSERT OR IGNORE INTO works (kind, title, creator, year, length, genre, description, awards, country_iso2, in_library, featured, note)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  params: [w.kind, w.title, w.creator, w.year ?? null, w.length ?? null, w.genre ?? null, w.description ?? null, JSON.stringify(w.awards ?? []), w.country, w.kind === 'book' ? 1 : 0, w.featured ? 1 : 0, w.note ?? null],
});

const EXPEDITIONS = [
  {
    slug: 'iran', number: 1, country: 'ir', startsOn: '2026-07-01', endsOn: '2026-08-30',
    tagline: 'Into the heart of Persia',
    description:
      "A two-month immersion into the heart of Persia. Through Shahrnush Parsipur's magic-realist prose and Asghar Farhadi's intense realist cinema, we discover the beauty, contradictions, and spirit of modern Iranian society.",
    heroImageUrl: '/iran_hero.png', heroTitle: 'Nasir al-Mulk Mosque',
    heroCaption: 'Known as the Pink Mosque, this 19th-century masterpiece in Shiraz is famous for stained glass that turns its interior into a kaleidoscope of light.',
    heroCredit: 'Wide Open World Travel Archive (Shiraz, Iran)', accentColor: '#3CAEA3', pattern: 'stars',
  },
  {
    slug: 'south-korea', number: 2, country: 'kr', startsOn: '2026-09-01', endsOn: '2026-10-25',
    tagline: 'The Land of the Morning Calm',
    description:
      "A two-month immersion into the Land of the Morning Calm. Through Min Jin Lee's sweeping generational saga and some of Korean cinema's most beloved films, we discover resilience, identity, and the enduring weight of history on a people.",
    heroImageUrl: '/korea_hero.jpg', heroTitle: 'Gyeongbokgung Palace',
    heroCaption: 'Built in 1395, the "Palace Greatly Blessed by Heaven" was the main royal palace of the Joseon dynasty — a symbol of Korean sovereignty and cultural continuity across six centuries.',
    heroCredit: 'Wide Open World Travel Archive (Seoul, South Korea)', accentColor: '#D2474E', pattern: 'lattice',
  },
];

const EXPEDITION_WORKS: Record<string, (WorkSeed & { role: 'primary' | 'additional'; category?: string; why?: string; quote?: string })[]> = {
  iran: [
    {
      kind: 'book', role: 'primary', title: 'Touba and the Meaning of Night', creator: 'Shahrnush Parsipur', year: 1989, length: 368, genre: 'Fiction', country: 'ir',
      description:
        'Weaving history and magical realism, the novel follows Touba over eighty years as she seeks spiritual independence in a male-dominated Tehran. From the Qajar dynasty to the 1979 Revolution, her household becomes a sanctuary for political dissenters, mystics, and outcasts.',
      why: 'We chose this masterwork because it interweaves the personal resilience of a female protagonist with the historical forces that shaped modern Iran, offering a deep cultural and spiritual perspective.',
      quote: "Parsipur presents a courageous critique of class divisions, religious authority, and patriarchy in 20th-century Iran, using Touba's household as a mirror for a changing nation.",
    },
    {
      kind: 'film', role: 'primary', title: 'A Separation', creator: 'Asghar Farhadi', year: 2011, length: 123, genre: 'Drama', country: 'ir',
      description:
        "A middle-class couple separates when the wife wants to leave Iran to secure better opportunities for their daughter, while the husband must stay in Tehran to care for his father suffering from Alzheimer's.",
      awards: ['Academy Award — Best Foreign Language Film (2012)', 'Golden Bear, Berlin (2011)'],
    },
  ],
  'south-korea': [
    {
      kind: 'book', role: 'primary', title: 'Pachinko', creator: 'Min Jin Lee', year: 2017, length: 485, genre: 'Historical Fiction', country: 'kr',
      description:
        'A sweeping multi-generational saga beginning in early 1900s Korea, following one family across four generations as they navigate Japanese colonization, wartime, migration to Japan, and modern identity.',
      why: 'We chose Pachinko because it holds within its pages an entire century of Korean history — not told through dates or battles, but through the quiet resilience of one family caught between two worlds.',
      quote: '“History has failed us, but no matter.” — the opening line of Pachinko',
      awards: ['National Book Award Finalist (2017)', 'New York Times 10 Best Books of 2017'],
    },
    { kind: 'film', role: 'primary', category: 'Nostalgia & Coming-of-Age', title: 'Sunny', creator: 'Kang Hyeong-cheol', year: 2011, country: 'kr', genre: 'Comedy-drama',
      description: "A woman reconnects with her long-lost high school friends from the 1980s to grant a dying friend's final wish. A deeply moving film about friendship, time, and the bittersweet nostalgia of youth." },
    { kind: 'film', role: 'additional', category: 'Nostalgia & Coming-of-Age', title: 'The Way Home', creator: 'Lee Jeong-hyang', year: 2002, country: 'kr', genre: 'Drama',
      description: 'A spoiled seven-year-old city boy is left with his elderly, mute grandmother in a remote village. A quiet, deeply affecting film about patience, love, and what we owe to those who raised us.' },
    { kind: 'film', role: 'additional', category: 'Nostalgia & Coming-of-Age', title: 'Little Forest', creator: 'Yim Soon-rye', year: 2018, country: 'kr', genre: 'Drama',
      description: "A young woman retreats from the pressure of city life to her rural hometown. Through foraging and cooking the seasons' harvest, she slowly rediscovers who she is." },
    { kind: 'film', role: 'additional', category: 'Historical & Political', title: 'Ode to My Father', creator: 'Yoon Je-kyoon', year: 2014, country: 'kr', genre: 'Drama',
      description: "An epic spanning six decades of modern Korean history, told through one man's lifelong promise to find his family separated during the Korean War." },
    { kind: 'film', role: 'additional', category: 'Historical & Political', title: '1987: When the Day Comes', creator: 'Jang Joon-hwan', year: 2017, country: 'kr', genre: 'Historical drama',
      description: "The true story of the pro-democracy uprising that ended South Korea's military dictatorship. Sparked by a student's death covered up by the regime, ordinary citizens risked everything for freedom." },
    { kind: 'film', role: 'additional', category: 'Historical & Political', title: 'Joint Security Area', creator: 'Park Chan-wook', year: 2000, country: 'kr', genre: 'Thriller',
      description: "Soldiers from North and South Korea form a secret friendship across the DMZ — until a deadly incident exposes their bond. A tense, humanistic thriller on the tragedy of Korean division." },
    { kind: 'film', role: 'additional', category: 'Contemporary', title: 'No Other Choice', creator: 'Park Chan-wook', year: 2025, country: 'kr', genre: 'Black comedy thriller',
      description: 'After decades at a paper company, a laid-off family man decides the only way back into work is to eliminate the competition. A darkly funny, unsettling portrait of modern precarity.' },
  ],
};

const FRIENDS = [
  { slug: 'shafagh-kazemi', expedition: 'iran', name: 'Shafagh Kazemi', title: 'Friend from Iran', location: 'Tehran, Iran', country: 'ir',
    bio: 'Iranian cultural advocate and literary guide for the WOW Iran expedition.',
    quote: 'These two stories capture the two dimensions of Iran: the deep historical, spiritual roots of our past (Touba), and the complex, raw dilemmas of our modern urban life (A Separation).' },
  { slug: 'hana-jo', expedition: 'south-korea', name: 'Hana Jo', title: 'Friend from South Korea', location: 'Seoul, South Korea', country: 'kr',
    bio: 'Korean cultural guide and literary advocate for the WOW South Korea expedition.',
    quote: "Pachinko tells the story we don't talk about enough — the Koreans who built lives in Japan, caught between two worlds. It is a book about us, and about everyone who has ever had to choose between roots and survival." },
];

const EVENTS = [
  { expedition: 'iran', title: 'Meeting 1 · Launch & Introduction', startsAt: '2026-07-05T12:00:00.000Z',
    description: 'Shafagh Kazemi introduces Iran, its historical backdrop, and opens our reading and film focus.' },
  { expedition: 'iran', title: 'Meeting 2 · Discussion & Q&A', startsAt: '2026-08-30T12:00:00.000Z',
    description: 'Group discussion on the themes of the book and film, with a live Q&A with Shafagh Kazemi.' },
  { expedition: 'south-korea', title: 'Meeting 1 · Launch & Introduction', startsAt: '2026-09-06T12:00:00.000Z',
    description: "Hana Jo introduces South Korea's modern history and cultural context, and guides our dive into Pachinko and the films." },
  { expedition: 'south-korea', title: 'Meeting 2 · Discussion & Q&A', startsAt: '2026-10-25T12:00:00.000Z',
    description: 'Group discussion on Pachinko and the films — identity, sacrifice, resilience, and belonging — with a live Q&A with Hana Jo.' },
];

async function seedExpeditions() {
  await run(
    EXPEDITIONS.map((e) => ({
      sql: `INSERT OR IGNORE INTO expeditions (slug, number, country_iso2, tagline, description, starts_on, ends_on, hero_image_url, hero_title, hero_caption, hero_credit, accent_color, pattern)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      params: [e.slug, e.number, e.country, e.tagline, e.description, e.startsOn, e.endsOn, e.heroImageUrl, e.heroTitle, e.heroCaption, e.heroCredit, e.accentColor, e.pattern],
    })),
  );
  const exp = Object.fromEntries((await d1Query<{ id: number; slug: string }>('SELECT id, slug FROM expeditions')).map((r) => [r.slug, r.id]));

  const all = Object.entries(EXPEDITION_WORKS).flatMap(([slug, list]) => list.map((w, i) => ({ ...w, slug, sort: i })));
  await run(all.map(insertWork));
  await run(
    all.map((w) => ({
      sql: `INSERT OR IGNORE INTO expedition_works (expedition_id, work_id, role, category, why_chosen, quote, sort_order)
            SELECT ?, id, ?, ?, ?, ?, ? FROM works WHERE kind = ? AND title = ? AND creator = ?`,
      params: [exp[w.slug], w.role, w.category ?? null, w.why ?? null, w.quote ?? null, w.sort, w.kind, w.title, w.creator],
    })),
  );

  await run(
    FRIENDS.flatMap((f) => [
      { sql: 'INSERT OR IGNORE INTO friends (slug, name, title, bio, location, country_iso2) VALUES (?,?,?,?,?,?)', params: [f.slug, f.name, f.title, f.bio, f.location, f.country] },
      { sql: 'INSERT OR IGNORE INTO expedition_friends (expedition_id, friend_id, quote) SELECT ?, id, ? FROM friends WHERE slug = ?', params: [exp[f.expedition], f.quote, f.slug] },
    ]),
  );

  const existingEvents = await d1Query<{ n: number }>('SELECT COUNT(*) AS n FROM events');
  if (existingEvents[0].n === 0) {
    await run(
      EVENTS.map((e) => ({
        sql: 'INSERT INTO events (expedition_id, kind, title, description, starts_at, duration_min, host_timezone) VALUES (?,?,?,?,?,?,?)',
        params: [exp[e.expedition], 'meeting', e.title, e.description, e.startsAt, 90, 'Asia/Kolkata'],
      })),
    );
  }
  console.log('✓ expeditions, works, friends, events');
}

async function seedLibrary() {
  const valid = new Set((await d1Query<{ iso2: string }>('SELECT iso2 FROM countries')).map((r) => r.iso2));
  const featured = readJson<{ title: string; author: string; code: string; genre: string; year: number; pages: number; desc: string; why: string }[]>('featured-books.json');
  const library = readJson<{ code: string; books: { title: string; author: string }[] }[]>('library.json');

  const statements: Statement[] = [];
  for (const b of featured) {
    const country = b.code.toLowerCase();
    statements.push(insertWork({ kind: 'book', title: b.title, creator: b.author, year: b.year, length: b.pages, genre: b.genre, description: b.desc, country, featured: !['ir', 'kr'].includes(country), note: b.why }));
  }
  let skipped = 0;
  for (const c of library) {
    const country = c.code.toLowerCase();
    if (!valid.has(country)) { skipped++; continue; }
    for (const b of c.books) statements.push(insertWork({ kind: 'book', title: b.title, creator: b.author, country }));
  }
  await run(statements);
  console.log(`✓ library (${statements.length} books${skipped ? `, ${skipped} unknown countries skipped` : ''})`);
}

async function seedMembers() {
  const members = readJson<{ passport_number: string; member_name: string; country_code: string; issue_date: string; visas: string[] }[]>('members.json');
  const exp = Object.fromEntries((await d1Query<{ id: number; slug: string }>('SELECT id, slug FROM expeditions')).map((r) => [r.slug, r.id]));
  await run(
    members.flatMap((m) => [
      { sql: 'INSERT OR IGNORE INTO members (passport_number, name, country_iso2, joined_on) VALUES (?,?,?,?)', params: [m.passport_number, m.member_name, m.country_code.toLowerCase(), toIsoDate(m.issue_date)] },
      ...m.visas.map((slug) => ({
        sql: `INSERT OR IGNORE INTO visas (member_id, expedition_id, source, issued_at) SELECT id, ?, 'import', ? FROM members WHERE passport_number = ?`,
        params: [exp[slug], '2026-08-30T14:00:00Z', m.passport_number],
      })),
    ]),
  );
  console.log(`✓ ${members.length} members + visas`);
}

async function main() {
  await seedCountries();
  await seedSettings();
  await seedExpeditions();
  await seedLibrary();
  await seedMembers();
  console.log('\n🌏 Seed complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
