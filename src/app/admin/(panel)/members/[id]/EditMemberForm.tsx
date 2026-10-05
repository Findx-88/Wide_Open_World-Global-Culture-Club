'use client';

import { ActionForm, Check, Field, Select, Submit, TextArea } from '@/components/admin/forms';
import { saveMember } from '@/server/admin/actions';
import type { Member } from '@/server/db/schema';

export function EditMemberForm({ member, countries }: { member: Member; countries: { iso2: string; name: string }[] }) {
  return (
    <ActionForm action={saveMember} className="grid gap-4">
      <input type="hidden" name="id" value={member.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name" required defaultValue={member.name} />
        <Select label="Home country" name="countryIso2" defaultValue={member.countryIso2} options={countries.map((c) => [c.iso2, c.name] as [string, string])} />
        <Field label="Email" name="email" type="email" defaultValue={member.email ?? ''} />
        <Field label="Joined on" name="joinedOn" type="date" defaultValue={member.joinedOn} />
      </div>
      <TextArea label="Private notes" name="notes" rows={2} defaultValue={member.notes ?? ''} />
      <Check label="Show on the public Explorers page" name="isPublic" defaultChecked={member.isPublic} />
      <div>
        <Submit>Save member</Submit>
      </div>
    </ActionForm>
  );
}
