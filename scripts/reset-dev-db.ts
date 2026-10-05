/** DANGER: drops every table in the configured D1 database. Only for rebuilding a fresh/dev database. */
import { config } from 'dotenv';
import { d1Batch, d1Query } from '../src/server/db/d1';
config({ path: '.env.local' });
if (process.argv[2] !== '--yes-drop-everything') { console.error('Refusing: pass --yes-drop-everything'); process.exit(1); }
(async () => {
  const order = ['audit_log','visas','events','expedition_friends','expedition_works','recommendations','settings','members','works','friends','expeditions','admins','countries','_migrations'];
  const existing = new Set((await d1Query<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table'")).map((t) => t.name));
  const tables = order.filter((n) => existing.has(n)).map((name) => ({ name }));
  await d1Batch(tables.map((t) => ({ sql: `DROP TABLE IF EXISTS "${t.name}"` })));
  console.log('dropped', tables.map((t) => t.name).join(', '));
})();
