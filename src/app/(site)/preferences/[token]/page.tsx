import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { NOTIFICATION_TYPES } from '@/server/notifications/registry';
import { prefsByToken } from '@/server/notifications/queue';
import { PreferencesForm } from './PreferencesForm';

export const metadata: Metadata = { title: 'Email preferences', robots: { index: false, follow: false } };

export default async function PreferencesPage({ params }: { params: Promise<{ token: string }> }) {
  const prefs = await prefsByToken((await params).token);
  if (!prefs) notFound();
  const [m] = await db.select({ name: schema.members.name, email: schema.members.email }).from(schema.members).where(eq(schema.members.id, prefs.memberId));
  return (
    <div className="container-page max-w-2xl pt-32">
      <div className="eyebrow">Email preferences</div>
      <h1 className="display mt-3 !text-[clamp(2.2rem,6vw,3.6rem)]">Only what’s useful.</h1>
      <p className="lede mt-4">{m?.name}{m?.email ? ` · ${m.email}` : ''}. We keep emails few — choose which ones you want.</p>
      <PreferencesForm token={prefs.token} unsubscribedAll={prefs.unsubscribedAll} disabled={prefs.disabledTypes} types={NOTIFICATION_TYPES.map((t) => ({ key: t.key, label: t.label, description: t.description }))} />
    </div>
  );
}
