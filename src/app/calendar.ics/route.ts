import { buildIcs } from '@/lib/calendar';
import { getSite } from '@/server/queries';

export const dynamic = 'force-dynamic';

/** Subscribable iCalendar feed of every published event. */
export async function GET(req: Request) {
  const site = await getSite();
  const origin = new URL(req.url).origin;
  const byId = new Map(site.expeditions.map((e) => [e.id, e]));
  const ics = buildIcs(
    site.events.map((ev) => {
      const exp = ev.expeditionId ? byId.get(ev.expeditionId) : null;
      return {
        id: ev.id,
        title: `WOW${exp ? ` · ${exp.country.name}` : ''} — ${ev.title}`,
        description: ev.description,
        startsAt: ev.startsAt,
        durationMin: ev.durationMin,
        joinUrl: ev.joinUrl || site.settings.default_meet_url || null,
        pageUrl: `${origin}/join`,
      };
    }),
  );
  return new Response(ics, { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'inline; filename="wide-open-world.ics"' } });
}
