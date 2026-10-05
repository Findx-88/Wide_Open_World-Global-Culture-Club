/**
 * Calendar helpers. All times are UTC instants, so every provider shows the correct local time
 * (the event's host time zone is only used for how the admin typed it in).
 */
export type CalEvent = {
  id: number;
  title: string;
  description?: string | null;
  startsAt: string; // UTC ISO
  durationMin: number;
  joinUrl?: string | null; // meeting link (Zoom/Meet); also used as the location
  pageUrl?: string | null; // link back to the website
};

const compact = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
export const endsAt = (e: CalEvent) => new Date(new Date(e.startsAt).getTime() + e.durationMin * 60_000).toISOString();

/** The text that goes into every calendar's description box — includes the join link so it's one tap away. */
export function describe(e: CalEvent) {
  return [e.description, e.joinUrl && `Join the meeting: ${e.joinUrl}`, e.pageUrl && `Details: ${e.pageUrl}`].filter(Boolean).join('\n\n');
}

export function googleCalendarUrl(e: CalEvent) {
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${compact(e.startsAt)}/${compact(endsAt(e))}`,
    details: describe(e),
    ...(e.joinUrl ? { location: e.joinUrl } : {}),
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

/** Outlook on the web. `host` picks personal (outlook.live.com) or work/school (outlook.office.com) accounts. */
export function outlookCalendarUrl(e: CalEvent, host: 'live' | 'office' = 'live') {
  const q = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: e.title,
    startdt: new Date(e.startsAt).toISOString(),
    enddt: endsAt(e),
    body: describe(e),
    ...(e.joinUrl ? { location: e.joinUrl } : {}),
  });
  return `https://outlook.${host === 'live' ? 'live' : 'office'}.com/calendar/0/deeplink/compose?${q}`;
}

/** `webcal://` hands the feed to the device's calendar app (Apple Calendar) instead of downloading a file. */
export const webcalUrl = (httpUrl: string) => httpUrl.replace(/^https?:/, 'webcal:');

/** Links that subscribe a calendar app to a live .ics feed — new sessions then appear on their own. */
export function subscribeUrls(feedUrl: string, name = 'Wide Open World') {
  const httpsFeed = feedUrl.replace(/^http:/, 'https:');
  const outlook = (host: 'live' | 'office') => `https://outlook.${host}.com/calendar/0/addfromweb?${new URLSearchParams({ url: httpsFeed, name })}`;
  return {
    google: `https://calendar.google.com/calendar/render?${new URLSearchParams({ cid: webcalUrl(feedUrl) })}`,
    apple: webcalUrl(feedUrl),
    outlook: outlook('live'),
    office: outlook('office'),
  };
}

// ── iCalendar (.ics): Apple Calendar, desktop Outlook, and anything else ──

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/[,;]/g, (m) => `\\${m}`);

/** RFC 5545 requires lines <= 75 octets; fold longer ones. */
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (Buffer.byteLength(rest) > 74) {
    let cut = 74;
    while (Buffer.byteLength(rest.slice(0, cut)) > 74) cut--;
    out.push(rest.slice(0, cut));
    rest = ` ${rest.slice(cut)}`;
  }
  out.push(rest);
  return out.join('\r\n');
}

export function buildIcs(events: CalEvent[], opts: { name?: string; method?: 'PUBLISH' | 'REQUEST'; alarmMinutes?: number } = {}) {
  const { name = 'Wide Open World', method = 'PUBLISH', alarmMinutes = 30 } = opts;
  const now = compact(new Date().toISOString());
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wide Open World//Calendar//EN', 'CALSCALE:GREGORIAN', `METHOD:${method}`, `X-WR-CALNAME:${esc(name)}`, 'REFRESH-INTERVAL;VALUE=DURATION:PT6H'];
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:wow-event-${e.id}@wideopenworld`,
      `DTSTAMP:${now}`,
      `DTSTART:${compact(e.startsAt)}`,
      `DTEND:${compact(endsAt(e))}`,
      `SUMMARY:${esc(e.title)}`,
      `DESCRIPTION:${esc(describe(e))}`,
      ...(e.joinUrl ? [`LOCATION:${esc(e.joinUrl)}`, `URL:${e.joinUrl}`] : e.pageUrl ? [`URL:${e.pageUrl}`] : []),
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(e.title)}`,
      `TRIGGER:-PT${alarmMinutes}M`,
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n');
}

/** Shapes a database event into what the calendar helpers need (server- and client-safe). */
export function toCalEvent(ev: { id: number; title: string; description: string | null; startsAt: string; durationMin: number; joinUrl: string | null }, defaultJoinUrl: string, prefix = ''): CalEvent {
  return { id: ev.id, title: prefix + ev.title, description: ev.description, startsAt: ev.startsAt, durationMin: ev.durationMin, joinUrl: ev.joinUrl || defaultJoinUrl || null };
}
