/**
 * Downloads every remote cover/poster once and serves it from the site itself (public/covers/<id>.jpg),
 * then points works.cover_url at the local copy. Third-party image hosts rate-limit and are slow when a page
 * asks for hundreds of covers, so the Library must not depend on them at view time.
 *
 * Library books use the medium size (small, fast); expedition picks and films keep the larger image.
 * Safe to re-run: already-cached covers are skipped.   Usage: npx tsx scripts/cache-covers.ts
 */
import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { d1Batch, d1Query } from '../src/server/db/d1';

config({ path: '.env.local' });
const dir = path.join(process.cwd(), 'public', 'covers');
fs.mkdirSync(dir, { recursive: true });

type Row = { id: number; kind: string; cover_url: string; picked: number };
const UA = { 'User-Agent': 'WideOpenWorld/2.0 (cover cache; https://github.com/Findx-88)' };

async function download(url: string, file: string) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: UA, redirect: 'follow' });
      if (res.ok && (res.headers.get('content-type') ?? '').startsWith('image/')) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 2500) {
          fs.writeFileSync(file, buf);
          return true;
        }
        return false; // a placeholder pixel, not a real cover
      }
      if (res.status !== 429 && res.status < 500) return false;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
  }
  return false;
}

async function main() {
  const rows = await d1Query<Row>(
    `SELECT w.id, w.kind, w.cover_url,
            EXISTS (SELECT 1 FROM expedition_works ew WHERE ew.work_id = w.id) AS picked
     FROM works w WHERE w.cover_url LIKE 'http%' ORDER BY picked DESC, w.id`,
  );
  console.log(`${rows.length} remote covers to cache`);
  const done: { id: number; local: string }[] = [];
  const failed: number[] = [];
  const queue = [...rows];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let r = queue.shift(); r; r = queue.shift()) {
        // Library books: medium cover (~15 KB). Expedition picks / films: keep full size.
        const url = r.picked || r.kind === 'film' ? r.cover_url : r.cover_url.replace(/-L\.jpg$/, '-M.jpg');
        const file = path.join(dir, `${r.id}.jpg`);
        if (fs.existsSync(file) || (await download(url, file)) || (url !== r.cover_url && (await download(r.cover_url, file)))) done.push({ id: r.id, local: `/covers/${r.id}.jpg` });
        else failed.push(r.id);
        if ((done.length + failed.length) % 40 === 0) console.log(`  ${done.length + failed.length}/${rows.length}`);
        await new Promise((res) => setTimeout(res, 150));
      }
    }),
  );
  for (let i = 0; i < done.length; i += 40) await d1Batch(done.slice(i, i + 40).map((d) => ({ sql: 'UPDATE works SET cover_url = ? WHERE id = ?', params: [d.local, d.id] })));
  const mb = fs.readdirSync(dir).reduce((n, f) => n + fs.statSync(path.join(dir, f)).size, 0) / 1e6;
  console.log(`✓ cached ${done.length}, failed ${failed.length}${failed.length ? ` (ids: ${failed.join(', ')})` : ''} · ${mb.toFixed(1)} MB in public/covers`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
