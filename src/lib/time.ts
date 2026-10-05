/** Time helpers shared by server and client. All stored times are UTC ISO strings. */

function partsInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}

/** Offset of `timeZone` from UTC at `date`, in milliseconds. */
function zoneOffset(date: Date, timeZone: string) {
  const p = partsInZone(date, timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(date.getTime() / 1000) * 1000;
}

/** "2026-10-25T17:30" as wall-clock time in `timeZone` → UTC ISO string. */
export function zonedToUtc(local: string, timeZone: string): string {
  const [d, t = '00:00'] = local.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [hh, mm] = t.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, day, hh, mm);
  let utc = guess - zoneOffset(new Date(guess), timeZone);
  utc = guess - zoneOffset(new Date(utc), timeZone); // second pass settles DST edges
  return new Date(utc).toISOString();
}

/** UTC ISO → "YYYY-MM-DDTHH:mm" wall-clock in `timeZone` (for <input type="datetime-local">). */
export function utcToZonedInput(iso: string, timeZone: string): string {
  const p = partsInZone(new Date(iso), timeZone);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}, timeZone?: string) {
  return new Date(iso).toLocaleString('en-GB', { timeZone, ...opts });
}

/** "1 Sep – 25 Oct 2026" from two YYYY-MM-DD dates. */
export function formatRange(startsOn: string, endsOn: string) {
  const s = new Date(`${startsOn}T00:00:00Z`);
  const e = new Date(`${endsOn}T00:00:00Z`);
  const sameYear = s.getUTCFullYear() === e.getUTCFullYear();
  const start = s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: sameYear ? undefined : 'numeric', timeZone: 'UTC' });
  const end = e.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return `${start} – ${end}`;
}

export function formatMonthRange(startsOn: string, endsOn: string) {
  const f = (d: string, y: boolean) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: y ? 'numeric' : undefined, timeZone: 'UTC' });
  return `${f(startsOn, false)} – ${f(endsOn, true)}`;
}

export const todayUtc = () => new Date().toISOString().slice(0, 10);

export const COMMON_TIMEZONES = [
  'UTC',
  'Asia/Kolkata',
  'Asia/Kathmandu',
  'Asia/Tehran',
  'Asia/Seoul',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'Asia/Ho_Chi_Minh',
  'Asia/Dubai',
  'Australia/Sydney',
  'Europe/London',
  'Europe/Rome',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Skopje',
  'Africa/Lagos',
  'Africa/Nairobi',
  'America/New_York',
  'America/Chicago',
  'America/Mexico_City',
  'America/Santo_Domingo',
  'America/Sao_Paulo',
  'America/Los_Angeles',
];
