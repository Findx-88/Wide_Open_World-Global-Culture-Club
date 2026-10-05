import { Panel } from '@/components/admin/forms';
import { adminCountries, adminMembers, adminSite } from '@/server/admin/data';
import { AddMemberForm } from './AddMemberForm';
import { MemberTable } from './MemberTable';
import { EmailImportForm } from './EmailImportForm';

export const metadata = { title: 'Members' };

export default async function AdminMembers() {
  const [members, countries, site] = await Promise.all([adminMembers(), adminCountries(), adminSite()]);
  const names = new Map(site.expeditions.map((e) => [e.id, e.country.name]));
  return (
    <div className="grid gap-6">
      <h1 className="font-display text-4xl">Members</h1>
      <div id="add">
        <Panel title="Add a member" description="Creates their Cultural Passport and a personal invitation link.">
          <AddMemberForm countries={countries.map((c) => ({ iso2: c.iso2, name: c.name }))} />
        </Panel>
      </div>
      <Panel title={`Members without an email (${members.filter((m) => m.status === 'active' && !m.email).length})`} description="They can’t receive reminders or confirmation emails until an email is added. Paste them here in bulk, or edit a member individually.">
        <EmailImportForm />
      </Panel>
      <Panel title={`All members (${members.filter((m) => m.status === 'active').length} active)`}>
        <MemberTable
          rows={members.map((m) => ({
            id: m.id,
            name: m.name,
            passportNumber: m.passportNumber,
            countryIso2: m.countryIso2,
            countryName: m.countryName,
            status: m.status,
            email: m.email,
            isPublic: m.isPublic,
            visas: m.visaExpeditionIds.map((id) => names.get(id) ?? '?'),
            visaCount: m.visaCount,
          }))}
        />
      </Panel>
    </div>
  );
}
