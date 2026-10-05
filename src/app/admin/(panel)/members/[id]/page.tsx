import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { Flag } from '@/components/brand';
import { eq } from 'drizzle-orm';
import { ActionButton, CopyButton, Panel } from '@/components/admin/forms';
import { db, schema } from '@/server/db';
import { activitiesFor } from '@/server/verification/rules';
import type { ParticipationStatus } from '@/lib/participation';
import { VisaManager } from './VisaManager';
import { setMemberStatus } from '@/server/admin/actions';
import { adminCountries, adminMember, adminSite } from '@/server/admin/data';
import { EditMemberForm } from './EditMemberForm';

type Props = { params: Promise<{ id: string }> };

export default async function AdminMember({ params }: Props) {
  const id = Number((await params).id);
  const [m, countries, site] = await Promise.all([adminMember(id), adminCountries(), adminSite()]);
  if (!m) notFound();
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? '';
  const origin = `${h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')}://${host}`;
  const invite = `${origin}/invite?uid=${m.passportNumber}`;
  const [parts, awards] = await Promise.all([
    db.select().from(schema.participation).where(eq(schema.participation.memberId, m.id)),
    db.select().from(schema.visaAwards).where(eq(schema.visaAwards.memberId, m.id)),
  ]);
  const managerData = site.expeditions
    .filter((e) => e.number > 0)
    .reverse()
    .map((e) => ({
      id: e.id,
      country: e.country.name,
      books: e.books.map((b) => ({ id: b.id, title: b.title })),
      activities: activitiesFor(e).map((a) => ({ targetKey: a.targetKey, kind: a.kind, label: a.label, status: (parts.find((p) => p.targetKey === a.targetKey)?.status ?? 'unconfirmed') as ParticipationStatus })),
      awards: awards.filter((a) => a.expeditionId === e.id).map((a) => ({ id: a.id, kind: a.kind, reason: a.reason, source: a.source, awardedAt: a.awardedAt, revokedAt: a.revokedAt, revokedReason: a.revokedReason })),
    }));

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/admin/members" className="text-sm text-ink-faint hover:text-accent">← Members</Link>
        <Flag iso2={m.countryIso2} name={m.countryName} className="h-6 w-9" />
        <h1 className="font-display text-4xl">{m.name}</h1>
        <span className="font-mono text-sm text-gold">{m.passportNumber}</span>
        {m.status !== 'active' && <span className="chip !text-danger">inactive</span>}
      </div>

      <Panel title="Invitation & passport">
        <div className="break-all rounded-lg bg-sunken p-3 font-mono text-xs text-ink-soft">{invite}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton text={invite} label="Copy invite link" />
          <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hi ${m.name.split(' ')[0]}! Your Wide Open World invitation: ${invite}`)}`} target="_blank" rel="noreferrer" className="btn btn-primary !px-3 !py-1.5 !text-[0.7rem]">Send on WhatsApp</a>
          <Link href={`/passport/${m.passportNumber}`} target="_blank" className="btn btn-ghost !px-3 !py-1.5 !text-[0.7rem]">Open passport ↗</Link>
        </div>
      </Panel>

      <Panel title="Participation & visas" description="Every visa shows why it exists. Corrections here are recorded with your reason.">
        <VisaManager memberId={m.id} expeditions={managerData} />
      </Panel>

      <Panel title="Details">
        <EditMemberForm member={m} countries={countries.map((c) => ({ iso2: c.iso2, name: c.name }))} />
      </Panel>

      <Panel title="Membership">
        <ActionButton
          action={setMemberStatus}
          fields={{ id: m.id, status: m.status === 'active' ? 'inactive' : 'active' }}
          confirm={m.status === 'active' ? `Deactivate ${m.name}? They disappear from the site but keep their passport and can be restored.` : undefined}
        >
          {m.status === 'active' ? 'Deactivate member' : 'Restore member'}
        </ActionButton>
      </Panel>
    </div>
  );
}
