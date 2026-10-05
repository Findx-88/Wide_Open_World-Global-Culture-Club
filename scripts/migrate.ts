/**
 * Applies SQL migrations in ./drizzle to Cloudflare D1, tracking them in `_migrations`.
 * Usage: npm run db:migrate
 */
import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { d1Batch, d1Query, d1Raw } from '../src/server/db/d1';

config({ path: '.env.local' });

async function main() {
  await d1Raw('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
  const applied = new Set((await d1Query<{ name: string }>('SELECT name FROM _migrations')).map((r) => r.name));
  const dir = path.join(process.cwd(), 'drizzle');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const statements = fs
      .readFileSync(path.join(dir, file), 'utf8')
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((sql) => ({ sql }));
    await d1Batch([...statements, { sql: 'INSERT INTO _migrations (name, applied_at) VALUES (?, ?)', params: [file, new Date().toISOString()] }]);
    console.log(`✓ applied ${file} (${statements.length} statements)`);
  }
  console.log('Migrations up to date.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
