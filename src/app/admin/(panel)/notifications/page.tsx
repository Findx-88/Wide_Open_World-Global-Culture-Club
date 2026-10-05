import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { Panel } from '@/components/admin/forms';
import { db, schema } from '@/server/db';
import { adminSite } from '@/server/admin/data';
import { emailProviderConfigured } from '@/server/notifications/email';
import { NOTIFICATION_TYPES } from '@/server/notifications/registry';
import { isOn } from '@/lib/settings';
import { SchedulerButtons } from './SchedulerButtons';

export const metadata = { title: 'Emails' };

const Check = ({ ok, label, hint }: { ok: boolean; label: string; hint: string }) => (
  <li className="flex gap-3 py-3">
    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs ${ok ? 'bg-ok/20 text-ok' : 'bg-danger/20 text-danger'}`}>{ok ? '✓' : '!'}</span>
    <span>
      <span className="block text-sm font-medium">{label}</span>
      <span className="block text-xs text-ink-faint">{hint}</span>
    </span>
  </li>
);

export default async function EmailsPage() {
  const site = await adminSite();
  const s = site.settings;
  const rows = await db.select().from(schema.emailOutbox).orderBy(desc(schema.emailOutbox.id)).limit(40);
  const counts = { queued: rows.filter((r) => r.status === 'queued').length, sent: rows.filter((r) => r.status === 'sent').length, failed: rows.filter((r) => r.status === 'failed').length };
  const cronReady = (process.env.CRON_SECRET?.length ?? 0) >= 16;
  const base = (process.env.SITE_URL || s.site_url || '').replace(/\/$/, '');

  return (
    <div className="grid gap-6">
      <h1 className="font-display text-4xl">Emails</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Is email ready?">
          <ul className="divide-y divide-line">
            <Check ok={emailProviderConfigured()} label="Email provider connected" hint="Set RESEND_API_KEY on the server (resend.com — free for small clubs)." />
            <Check ok={!!(s.email_from || process.env.EMAIL_FROM)} label="“Send from” address set" hint="In Settings → Email. The domain must be verified with the provider." />
            <Check ok={!!(base)} label="Website address set" hint="In Settings → Email, so links in emails point to your real site." />
            <Check ok={isOn(s.email_enabled)} label="Email switched on" hint="Settings → Email → master switch. Until then everything waits in the queue." />
            <Check ok={cronReady} label="Scheduler secret configured" hint="Set CRON_SECRET (16+ characters) on the server so the timer can call the scheduler." />
          </ul>
        </Panel>

        <Panel title="Scheduler" description="Opens confirmations when an expedition ends, sends reminders on your schedule, and delivers queued mail. Safe to run any time.">
          <SchedulerButtons />
          <div className="mt-6 rounded-xl bg-sunken p-4 text-xs text-ink-soft">
            <div className="font-semibold text-ink">Automatic timer</div>
            <p className="mt-1">Have any scheduler call this address every 10 minutes:</p>
            <code className="mt-2 block break-all rounded bg-bg p-2 font-mono">POST {base || 'https://your-site'}/api/cron/tick<br />Authorization: Bearer &lt;CRON_SECRET&gt;</code>
            <p className="mt-2">A free Cloudflare “Cron Trigger” Worker or a Hostinger cron job both work — see README.</p>
          </div>
        </Panel>
      </div>

      <Panel title="What members can be emailed about" description="Each member can switch any of these off from the link in every email.">
        <ul className="grid gap-3 sm:grid-cols-2">
          {NOTIFICATION_TYPES.map((t) => (
            <li key={t.key} className="rounded-xl border border-line bg-bg p-4">
              <div className="font-medium">{t.label}</div>
              <div className="text-sm text-ink-faint">{t.description}</div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink-soft">Timing is set in <Link href="/admin/settings" className="text-accent link-underline">Settings</Link>.</p>
      </Panel>

      <Panel title={`Latest emails (${counts.queued} queued · ${counts.sent} sent · ${counts.failed} failed)`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.1em] text-ink-faint">
              <tr className="border-b border-line"><th className="py-2 pr-3">To</th><th className="py-2 pr-3">Type</th><th className="py-2 pr-3">Subject</th><th className="py-2 pr-3">Status</th><th className="py-2">Date</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line align-top">
                  <td className="py-2.5 pr-3 text-xs">{r.toEmail}</td>
                  <td className="py-2.5 pr-3 text-xs text-ink-faint">{r.type}</td>
                  <td className="py-2.5 pr-3">{r.subject}{r.error && <div className="text-xs text-danger">{r.error}</div>}</td>
                  <td className={`py-2.5 pr-3 text-xs ${r.status === 'sent' ? 'text-ok' : r.status === 'failed' ? 'text-danger' : 'text-gold'}`}>{r.status}</td>
                  <td className="py-2.5 text-xs text-ink-faint">{new Date(r.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="py-4 text-sm text-ink-faint">No emails yet.</p>}
        </div>
      </Panel>
    </div>
  );
}
