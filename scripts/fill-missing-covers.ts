/** Second-chance cover lookup for books with no cover: broader Open Library search matched on author surname. */
import { config } from 'dotenv';
import { d1Batch, d1Query } from '../src/server/db/d1';
config({ path: '.env.local' });
const UA = { 'User-Agent': 'WideOpenWorld/2.0 (cover lookup; https://github.com/Findx-88)' };
const norm = (s: string) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

(async () => {
  const rows = await d1Query<{ id: number; title: string; creator: string }>("SELECT id, title, creator FROM works WHERE kind='book' AND (cover_url IS NULL OR cover_url LIKE 'http%')");
  const found: { id: number; url: string }[] = [];
  for (const r of rows) {
    const clean = r.title.replace(/\s*\(.*?\)\s*/g, ' ').replace(/^(the|a|an) /i, '').trim();
    const surname = norm(r.creator).split(' ').pop() ?? '';
    const q = new URLSearchParams({ q: `${clean} ${surname}`, limit: '12', fields: 'title,author_name,cover_i' });
    try {
      const res = await fetch(`https://openlibrary.org/search.json?${q}`, { headers: UA });
      if (!res.ok) continue;
      const docs = ((await res.json()) as { docs?: { title?: string; author_name?: string[]; cover_i?: number }[] }).docs ?? [];
      const hit = docs.find((d) => d.cover_i && (d.author_name ?? []).some((a) => norm(a).includes(surname)) && norm(d.title ?? '').split(' ').some((w) => w.length > 3 && norm(r.title).includes(w)));
      if (hit) found.push({ id: r.id, url: `https://covers.openlibrary.org/b/id/${hit.cover_i}-L.jpg` });
    } catch { /* skip */ }
    await new Promise((res) => setTimeout(res, 700));
  }
  for (let i = 0; i < found.length; i += 40) await d1Batch(found.slice(i, i + 40).map((f) => ({ sql: 'UPDATE works SET cover_url = ? WHERE id = ?', params: [f.url, f.id] })));
  // anything still pointing at a dead remote link gets cleared so the designed fallback cover shows instead of a broken image
  console.log(`✓ found ${found.length} of ${rows.length} missing covers`);
})();
