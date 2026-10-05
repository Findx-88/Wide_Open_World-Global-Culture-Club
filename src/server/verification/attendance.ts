import 'server-only';
import { and, eq, ne } from 'drizzle-orm';
import { db, insertChunked, schema } from '../db';
import { parseCsv } from '@/lib/csv';

const { attendance, members } = schema;

export type ParsedRow = { name: string; email: string | null; joinedAt: string | null; leftAt: string | null; minutes: number };

const norm = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toIso = (s: string | undefined) => {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
};

/**
 * Reads the CSV Zoom produces under Reports → Usage → (meeting) → Export, which has a short summary
 * block above the participant table. We locate the participant header row by its column names.
 */
export function parseZoomReport(text: string): ParsedRow[] {
  const rows = parseCsv(text);
  const h = rows.findIndex((r) => r.some((c) => /^name/i.test(c.trim())) && r.some((c) => /join/i.test(c)));
  if (h < 0) throw new Error('Couldn’t find the participant table. Export the “Participants” report from Zoom (Reports → Usage → Meeting → Export).');
  const head = rows[h].map((c) => c.trim().toLowerCase());
  const col = (re: RegExp) => head.findIndex((c) => re.test(c));
  const nameC = col(/^name/);
  const emailC = col(/e-?mail/);
  const joinC = col(/join/);
  const leaveC = col(/leave/);
  const durC = col(/duration/);

  const out: ParsedRow[] = [];
  for (const r of rows.slice(h + 1)) {
    const name = (r[nameC] ?? '').trim();
    if (!name) continue;
    const joinedAt = toIso(r[joinC]);
    const leftAt = toIso(r[leaveC]);
    let minutes = durC >= 0 ? Number((r[durC] ?? '').replace(/[^\d.]/g, '')) : NaN;
    if (!Number.isFinite(minutes) && joinedAt && leftAt) minutes = Math.round((Date.parse(leftAt) - Date.parse(joinedAt)) / 60000);
    out.push({ name, email: (r[emailC] ?? '').trim().toLowerCase() || null, joinedAt, leftAt, minutes: Number.isFinite(minutes) ? Math.round(minutes) : 0 });
  }
  if (!out.length) throw new Error('The participant table is empty.');
  return out;
}

/** Matches participant rows to members: email first, then an unambiguous full-name match. */
export async function importRows(eventId: number, rows: ParsedRow[], source: 'zoom_csv' | 'zoom_api') {
  const all = await db.select({ id: members.id, name: members.name, email: members.email }).from(members).where(eq(members.status, 'active'));
  const byEmail = new Map(all.filter((m) => m.email).map((m) => [m.email!.toLowerCase(), m.id]));
  const byName = new Map<string, number[]>();
  for (const m of all) byName.set(norm(m.name), [...(byName.get(norm(m.name)) ?? []), m.id]);

  // Re-importing replaces the previous automatic import for this session (manual entries are kept).
  await db.delete(attendance).where(and(eq(attendance.eventId, eventId), ne(attendance.source, 'admin')));
  let matched = 0;
  const values = rows.map((r) => {
    const byMail = r.email ? byEmail.get(r.email) : undefined;
    const candidates = byName.get(norm(r.name)) ?? [];
    const memberId = byMail ?? (candidates.length === 1 ? candidates[0] : null);
    if (memberId) matched++;
    return { eventId, memberId, displayName: r.name, email: r.email, joinedAt: r.joinedAt, leftAt: r.leftAt, minutes: r.minutes, source };
  });
  await insertChunked(attendance, values, (rows) => db.insert(attendance).values(rows));
  return { total: rows.length, matched, unmatched: rows.length - matched };
}
