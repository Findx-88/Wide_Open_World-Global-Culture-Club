'use client';

import { useState } from 'react';
import { ActionForm, Check, CopyButton, Field, Select, Submit } from '@/components/admin/forms';
import { saveMember } from '@/server/admin/actions';

type Created = { name: string; passportNumber: string; inviteUrl: string };

export function AddMemberForm({ countries }: { countries: { iso2: string; name: string }[] }) {
  const [created, setCreated] = useState<Created | null>(null);
  const message = created ? `Hi ${created.name.split(' ')[0]}! 🌍 Welcome to Wide Open World — your Cultural Passport (${created.passportNumber}) is ready. Open your invitation: ${created.inviteUrl}` : '';

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <ActionForm action={saveMember} resetOnSuccess onDone={(s) => setCreated(s.data as Created)} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" name="name" required placeholder="First Last" />
          <Select label="Home country" name="countryIso2" required defaultValue="" options={[['', 'Choose…'], ...countries.map((c) => [c.iso2, c.name] as [string, string])]} />
          <Field label="Email (optional)" name="email" type="email" />
          <Field label="Joined on" name="joinedOn" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>
        <div className="grid gap-2">
          <Check label="Show on the public Explorers page" name="isPublic" defaultChecked />
        </div>
        <div>
          <Submit>Create passport</Submit>
        </div>
      </ActionForm>

      <div className="rounded-xl border border-dashed border-line-strong p-5">
        {created ? (
          <div className="grid gap-3">
            <div className="eyebrow">Invitation ready</div>
            <div className="font-display text-2xl">{created.name}</div>
            <div className="font-mono text-sm text-gold">{created.passportNumber}</div>
            <div className="break-all rounded-lg bg-sunken p-3 font-mono text-xs text-ink-soft">{created.inviteUrl}</div>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={created.inviteUrl} label="Copy link" />
              <CopyButton text={message} label="Copy message" />
              <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="btn btn-primary !px-3 !py-1.5 !text-[0.7rem]">Send on WhatsApp</a>
              <a href={created.inviteUrl} target="_blank" rel="noreferrer" className="btn btn-ghost !px-3 !py-1.5 !text-[0.7rem]">Preview ↗</a>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-faint">After you create a passport, the member&rsquo;s personal invitation link appears here — ready to copy or send on WhatsApp.</p>
        )}
      </div>
    </div>
  );
}
