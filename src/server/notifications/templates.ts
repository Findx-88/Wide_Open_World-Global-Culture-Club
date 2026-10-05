import { googleCalendarUrl, outlookCalendarUrl, webcalUrl, type CalEvent } from '@/lib/calendar';
import { formatDate } from '@/lib/time';
import type { NotificationKey } from './registry';

export type Rendered = { subject: string; html: string; text: string };
type Ctx = { siteUrl: string; prefsUrl: string; firstName: string };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const button = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;background:#C9A052;color:#1a1208;text-decoration:none;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:13px;padding:14px 26px;border-radius:999px">${esc(label)}</a>`;

function shell(c: Ctx, title: string, inner: string) {
  return `<!doctype html><html><body style="margin:0;background:#0b1310;padding:24px 12px;font-family:Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#f7f0e1;color:#1b2a21;border-radius:16px;overflow:hidden">
  <div style="background:#0d2618;color:#C9A052;padding:22px 28px;font-size:12px;letter-spacing:.3em;text-transform:uppercase">Wide Open World</div>
  <div style="padding:28px">
    <h1 style="font-family:Georgia,serif;font-weight:500;font-size:28px;line-height:1.2;margin:0 0 16px">${esc(title)}</h1>
    ${inner}
  </div>
  <div style="padding:18px 28px;background:#ebe3d2;font-size:12px;color:#5a5f52">
    You’re receiving this because you’re a member of Wide Open World.
    <a href="${esc(c.prefsUrl)}" style="color:#5a5f52">Email preferences or unsubscribe</a>
  </div>
</div></body></html>`;
}

const p = (s: string) => `<p style="font-size:16px;line-height:1.6;margin:0 0 14px">${s}</p>`;
const textFooter = (c: Ctx) => `\n\n—\nEmail preferences / unsubscribe: ${c.prefsUrl}`;

export type RenderInput = {
  meeting_reminder: { event: CalEvent & { whenText: string }; countryName?: string | null; hours: number };
  expedition_reminder: { countryName: string; startsOn: string; book?: string | null; film?: string | null; friend?: string | null; pageUrl: string };
  participation_request: { countryName: string; activities: { kind: string; label: string }[]; url: string; reminderNo: number; lastReminder: boolean };
  visa_awarded: { countryName: string; visas: string[]; passportUrl: string };
};

const RENDERERS: { [K in NotificationKey]: (c: Ctx, i: RenderInput[K]) => Rendered } = {
  meeting_reminder: (c, { event, countryName, hours }) => {
    const when = hours >= 24 ? 'tomorrow' : 'soon';
    const links = `<a href="${esc(googleCalendarUrl(event))}" style="color:#8a6a2a">Google</a> · <a href="${esc(webcalUrl(`${c.siteUrl}/events/${event.id}/event.ics`))}" style="color:#8a6a2a">Apple</a> · <a href="${esc(outlookCalendarUrl(event))}" style="color:#8a6a2a">Outlook</a>`;
    return {
      subject: `${event.title} — ${when}${countryName ? ` (${countryName})` : ''}`,
      html: shell(c, event.title, p(`Hi ${esc(c.firstName)}, our next session starts <strong>${esc(event.whenText)}</strong>.`) + (event.joinUrl ? `<p style="margin:20px 0">${button(event.joinUrl, 'Join the meeting')}</p>` : '') + p(`Add it to your calendar: ${links}`)),
      text: `Hi ${c.firstName}, ${event.title} starts ${event.whenText}.\n${event.joinUrl ? `Join: ${event.joinUrl}\n` : ''}Add to calendar: ${c.siteUrl}/calendar${textFooter(c)}`,
    };
  },
  expedition_reminder: (c, i) => ({
    subject: `${i.countryName} begins soon`,
    html: shell(c, `${i.countryName} begins ${i.startsOn}`, p(`Hi ${esc(c.firstName)}! Our next expedition starts soon.`) + (i.book ? p(`📖 <strong>${esc(i.book)}</strong>`) : '') + (i.film ? p(`🎬 <strong>${esc(i.film)}</strong>`) : '') + (i.friend ? p(`With our friend ${esc(i.friend)}.`) : '') + `<p style="margin:20px 0">${button(i.pageUrl, 'See the expedition')}</p>`),
    text: `${i.countryName} begins ${i.startsOn}.${i.book ? `\nBook: ${i.book}` : ''}${i.film ? `\nFilm: ${i.film}` : ''}\n${i.pageUrl}${textFooter(c)}`,
  }),
  participation_request: (c, i) => {
    const list = i.activities.map((a) => `<li style="margin:4px 0">${a.kind === 'book' ? '📖 Read' : a.kind === 'movie' ? '🎬 Watched' : '🎥 Attended'}: <strong>${esc(a.label)}</strong></li>`).join('');
    const intro =
      i.reminderNo === 0
        ? `The ${esc(i.countryName)} expedition has finished — thank you for travelling with us! Tell us what you did so we can stamp your Cultural Passport.`
        : i.lastReminder
          ? `This is the last reminder about ${esc(i.countryName)}. After this we won’t email you about it again, and any visas you haven’t confirmed won’t be stamped.`
          : `A gentle reminder: we’d love to stamp your ${esc(i.countryName)} visas. It takes less than a minute.`;
    return {
      subject: i.reminderNo === 0 ? `Did you read, watch & attend? — ${i.countryName}` : i.lastReminder ? `Last reminder — your ${i.countryName} visas` : `Reminder — confirm your ${i.countryName} visas`,
      html: shell(c, i.reminderNo === 0 ? `How was ${i.countryName}?` : `Your ${i.countryName} visas`, p(`Hi ${esc(c.firstName)},`) + p(intro) + `<ul style="font-size:16px;line-height:1.5;padding-left:20px;margin:0 0 18px">${list}</ul>` + `<p style="margin:22px 0">${button(i.url, 'Confirm in one minute')}</p>` + p('<span style="color:#5a5f52;font-size:14px">Answer honestly — a visa is only stamped for what you confirm.</span>')),
      text: `Hi ${c.firstName},\n\n${intro.replace(/<[^>]+>/g, '')}\n\n${i.activities.map((a) => `- ${a.label}`).join('\n')}\n\nConfirm here: ${i.url}${textFooter(c)}`,
    };
  },
  visa_awarded: (c, i) => ({
    subject: `New ${i.visas.length > 1 ? 'visas' : 'visa'} in your passport — ${i.countryName}`,
    html: shell(c, 'Passport stamped ✦', p(`Hi ${esc(c.firstName)}! Your Cultural Passport has new ${i.visas.length > 1 ? 'visas' : 'a visa'} for <strong>${esc(i.countryName)}</strong>:`) + `<ul style="font-size:16px;line-height:1.6;padding-left:20px">${i.visas.map((v) => `<li>${esc(v)}</li>`).join('')}</ul>` + `<p style="margin:22px 0">${button(i.passportUrl, 'Open my passport')}</p>`),
    text: `New ${i.countryName} visa${i.visas.length > 1 ? 's' : ''}:\n${i.visas.map((v) => `- ${v}`).join('\n')}\n\nYour passport: ${i.passportUrl}${textFooter(c)}`,
  }),
};

export function render<K extends NotificationKey>(type: K, ctx: Ctx, input: RenderInput[K]): Rendered {
  return RENDERERS[type](ctx, input);
}

export { formatDate };
