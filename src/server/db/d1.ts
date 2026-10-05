/**
 * Minimal Cloudflare D1 client over the HTTP API, so the app can run on any Node host (Hostinger).
 *
 * Auth (first match wins):
 *   CLOUDFLARE_D1_TOKEN                        — scoped API token with D1 Edit (use this in production)
 *   CLOUDFLARE_API_KEY + CLOUDFLARE_EMAIL      — global API key (local scripts only)
 */

type Param = string | number | null;
export type Statement = { sql: string; params?: Param[] };
type RawResult = { results: { columns: string[]; rows: unknown[][] }; meta: { changes: number; last_row_id: number } };

function config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  if (!accountId || !databaseId) {
    throw new Error('Database is not configured: set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_D1_DATABASE_ID.');
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.CLOUDFLARE_D1_TOKEN) {
    headers.Authorization = `Bearer ${process.env.CLOUDFLARE_D1_TOKEN}`;
  } else if (process.env.CLOUDFLARE_API_KEY && process.env.CLOUDFLARE_EMAIL) {
    headers['X-Auth-Key'] = process.env.CLOUDFLARE_API_KEY;
    headers['X-Auth-Email'] = process.env.CLOUDFLARE_EMAIL;
  } else {
    throw new Error('Database is not configured: set CLOUDFLARE_D1_TOKEN.');
  }
  return { url: `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/raw`, headers };
}

const normalise = (params: unknown[] = []): Param[] =>
  params.map((p) => (p === undefined ? null : typeof p === 'boolean' ? (p ? 1 : 0) : (p as Param)));

async function post(body: unknown, attempt = 0): Promise<RawResult[]> {
  const { url, headers } = config();
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), cache: 'no-store' });
  if ((res.status === 429 || res.status >= 500) && attempt < 2) {
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    return post(body, attempt + 1);
  }
  const json = (await res.json().catch(() => null)) as { success: boolean; result: RawResult[]; errors: { message: string }[] } | null;
  if (!json?.success) {
    const msg = json?.errors?.map((e) => e.message).join('; ') || `HTTP ${res.status}`;
    throw new Error(`D1 query failed: ${msg}`);
  }
  return json.result;
}

/** Run one statement; returns rows as arrays (column order) plus metadata. */
export async function d1Raw(sql: string, params: unknown[] = []) {
  const [r] = await post({ sql, params: normalise(params) });
  return r;
}

/** Run several statements in one round trip. D1 executes a batch as a single transaction. */
export async function d1Batch(statements: Statement[]) {
  if (statements.length === 0) return [];
  return post({ batch: statements.map((s) => ({ sql: s.sql, params: normalise(s.params) })) });
}

/** Convenience for scripts: rows as objects. */
export async function d1Query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const r = await d1Raw(sql, params);
  return r.results.rows.map((row) => Object.fromEntries(r.results.columns.map((c, i) => [c, row[i]])) as T);
}
