import { getTableColumns } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { d1Batch, d1Raw } from './d1';
import * as schema from './schema';

/**
 * Drizzle over D1's HTTP API. Use `db.batch([...])` whenever several writes must succeed together —
 * D1 runs a batch as one transaction (interactive transactions are not available over HTTP).
 */
export const db = drizzle(
  async (sql, params, method) => {
    const r = await d1Raw(sql, params);
    const rows = r.results.rows;
    if (method === 'get') return { rows: (rows[0] ?? undefined) as unknown as unknown[] };
    return { rows };
  },
  async (queries) => {
    const results = await d1Batch(queries.map((q) => ({ sql: q.sql, params: q.params as never })));
    return results.map((r, i) =>
      queries[i].method === 'get' ? { rows: (r.results.rows[0] ?? undefined) as unknown as unknown[] } : { rows: r.results.rows },
    );
  },
  { schema },
);

export { schema };

/**
 * Cloudflare D1 allows at most 100 bound values in one statement, and Drizzle binds every column
 * (including ones with defaults). Chunks are sized from the table's full column count to stay safely below it.
 */
export async function insertChunked<T extends Record<string, unknown>>(table: SQLiteTable, rows: T[], run: (chunk: T[]) => Promise<unknown>) {
  if (!rows.length) return;
  const size = Math.max(1, Math.floor(90 / Object.keys(getTableColumns(table)).length));
  for (let i = 0; i < rows.length; i += size) await run(rows.slice(i, i + size));
}
