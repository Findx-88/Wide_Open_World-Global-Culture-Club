import { timingSafeEqual } from 'node:crypto';
import { tick } from '@/server/verification/workflow';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Scheduler entry point. Call every 5–15 minutes with:  Authorization: Bearer <CRON_SECRET>
 * (a free Cloudflare Cron Trigger or a Hostinger cron job both work — see README).
 */
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  const given = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const ok = !!secret && secret.length >= 16 && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) return new Response('Unauthorized', { status: 401 });
  try {
    return Response.json({ ok: true, report: await tick() });
  } catch (e) {
    console.error('[cron/tick]', e);
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
