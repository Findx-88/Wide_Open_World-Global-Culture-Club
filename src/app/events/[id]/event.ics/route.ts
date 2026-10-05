import { buildIcs } from '@/lib/calendar';
import { getSite } from '@/server/queries';

export const dynamic = 'force-dynamic';

/** One event as an .ics feed — opened via webcal:// by Apple Calendar, so it is never downloaded. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const site = await getSite();
  const ev = site.events.find((e) => e.id === id);
  if (!ev) return new Response('Not found', { status: 404 });
  const exp = ev.expeditionId ? site.expeditions.find((e) => e.id === ev.expeditionId) : null;
  const ics = buildIcs(
    [
      {
        id: ev.id,
        title: `WOW${exp ? ` · ${exp.country.name}` : ''} — ${ev.title}`,
        description: ev.description,
        startsAt: ev.startsAt,
        durationMin: ev.durationMin,
        joinUrl: ev.joinUrl || site.settings.default_meet_url || null,
        pageUrl: `${new URL(req.url).origin}/join`,
      },
    ],
    { name: ev.title },
  );
  return new Response(ics, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': `inline; filename="wow-session-${ev.id}.ics"` },
  });
}
