/**
 * Fills in missing cover images. Expedition picks and featured books first, then the library.
 * Usage: npx tsx scripts/fetch-covers.ts [--all] [--reset-books]
 */
import { config } from 'dotenv';
import { d1Batch, d1Query } from '../src/server/db/d1';
import { findCover } from '../src/server/covers';

config({ path: '.env.local' });

type Row = { id: number; kind: 'book' | 'film'; title: string; creator: string; year: number | null };

async function main() {
  const all = process.argv.includes('--all');
  if (process.argv.includes('--reset-books')) {
    await d1Batch([{ sql: "UPDATE works SET cover_url = NULL WHERE kind = 'book'" }]);
    console.log('Cleared existing book covers.');
  }
  const rows = await d1Query<Row>(
    `SELECT w.id, w.kind, w.title, w.creator, w.year FROM works w
     WHERE w.cover_url IS NULL ${all ? '' : 'AND (w.featured = 1 OR EXISTS (SELECT 1 FROM expedition_works ew WHERE ew.work_id = w.id))'}
     ORDER BY w.featured DESC, w.id`,
  );
  console.log(`Looking up ${rows.length} covers…`);
  let found = 0;
  const pending: { sql: string; params: (string | number)[] }[] = [];
  const queue = [...rows];
  await Promise.all(
    Array.from({ length: 1 }, async () => {
      for (let r = queue.shift(); r; r = queue.shift()) {
        const url = await findCover(r.kind, r.title, r.creator, r.year);
        if (url) {
          found++;
          pending.push({ sql: 'UPDATE works SET cover_url = ? WHERE id = ?', params: [url, r.id] });
          if (pending.length >= 25) await d1Batch(pending.splice(0));
        }
        await new Promise((res) => setTimeout(res, r.kind === "film" ? 2500 : 600));
      }
    }),
  );
  await d1Batch(pending);
  console.log(`✓ found ${found}/${rows.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
