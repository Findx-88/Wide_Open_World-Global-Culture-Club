/**
 * Fills countries.fun_fact: curated facts first (scripts/seed-data/fun-facts.json), then a fact computed from
 * real data (borders, languages, population, island/landlocked) for every other country.
 * Only fills EMPTY facts, so anything you edit later is never overwritten.   Usage: npx tsx scripts/seed-facts.ts
 */
import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import countriesData from 'world-countries';
import { d1Batch, d1Query } from '../src/server/db/d1';

config({ path: '.env.local' });
const read = (f: string) => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));

const curated: Record<string, string> = read(path.join(process.cwd(), 'scripts', 'seed-data', 'fun-facts.json'));
const geo = read(path.join(process.cwd(), 'public', 'countries.geojson'));
const pop = new Map<string, number>();
for (const f of geo.features) if (f.properties.ISO_A2 && f.properties.ISO_A2 !== '-99') pop.set(f.properties.ISO_A2.toLowerCase(), f.properties.POP_EST);
const ranked = [...pop.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);

const num = (n: number) => n.toLocaleString('en-GB');

function computed(c: (typeof countriesData)[number]): string {
  const name = c.name.common;
  const iso2 = c.cca2.toLowerCase();
  const langs = Object.keys(c.languages ?? {}).length;
  const rank = ranked.indexOf(iso2) + 1;
  if (c.landlocked) return `${name} is landlocked — it has no ocean coastline.`;
  if (c.borders.length >= 6) return `${name} shares land borders with ${c.borders.length} other countries.`;
  if (langs >= 3) return `${name} has ${langs} official languages.`;
  if (c.borders.length === 0 && c.area < 100000) return `${name} is an island nation of about ${num(Math.round(c.area))} square kilometres.`;
  if (c.borders.length === 0) return `${name} is an island nation, covering about ${num(Math.round(c.area))} square kilometres.`;
  if (rank > 0 && rank <= 40) return `${name} is home to around ${(pop.get(iso2)! / 1e6).toFixed(pop.get(iso2)! > 1e7 ? 0 : 1)} million people.`;
  return `${name} covers about ${num(Math.round(c.area))} square kilometres.`;
}

(async () => {
  const empty = new Set((await d1Query<{ iso2: string }>("SELECT iso2 FROM countries WHERE fun_fact IS NULL OR fun_fact = ''")).map((r) => r.iso2));
  const statements = countriesData
    .filter((c) => empty.has(c.cca2.toLowerCase()))
    .map((c) => ({ sql: 'UPDATE countries SET fun_fact = ? WHERE iso2 = ?', params: [curated[c.cca2.toLowerCase()] ?? computed(c), c.cca2.toLowerCase()] }));
  for (let i = 0; i < statements.length; i += 40) await d1Batch(statements.slice(i, i + 40));
  console.log(`✓ ${statements.length} facts written (${Object.keys(curated).length} curated)`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
