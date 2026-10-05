'use client';

import { ActionForm, Check, Field, Select, Submit, TextArea } from '@/components/admin/forms';
import { saveExpedition } from '@/server/admin/actions';
import type { Expedition } from '@/server/db/schema';

const PATTERNS: [string, string][] = [
  ['none', 'None'],
  ['stars', 'Eight-point stars (girih)'],
  ['lattice', 'Window lattice'],
  ['waves', 'Waves'],
  ['diamonds', 'Diamonds'],
];

export function ExpeditionForm({ expedition, countries, nextNumber }: { expedition?: Expedition; countries: { iso2: string; name: string }[]; nextNumber: number }) {
  const e = expedition;
  return (
    <ActionForm action={saveExpedition} className="grid gap-5">
      {e && <input type="hidden" name="id" value={e.id} />}
      <div className="grid gap-4 sm:grid-cols-[6rem_1fr_1fr]">
        <Field label="No." name="number" type="number" min={1} required defaultValue={e?.number ?? nextNumber} />
        <Select label="Country" name="countryIso2" required defaultValue={e?.countryIso2 ?? ''} options={[['', 'Choose…'], ...countries.map((c) => [c.iso2, c.name] as [string, string])]} />
        <Field label="URL slug" name="slug" defaultValue={e?.slug ?? ''} placeholder="auto from country" hint={e ? 'Changing this breaks shared links.' : undefined} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts on" name="startsOn" type="date" required defaultValue={e?.startsOn} />
        <Field label="Ends on" name="endsOn" type="date" required defaultValue={e?.endsOn} />
      </div>
      <Field label="Tagline" name="tagline" defaultValue={e?.tagline ?? ''} placeholder="The Land of the Morning Calm" />
      <TextArea label="Description" name="description" rows={4} defaultValue={e?.description ?? ''} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Hero image URL" name="heroImageUrl" defaultValue={e?.heroImageUrl ?? ''} placeholder="https://… or /image-in-public.jpg" />
        <Field label="Hero image title" name="heroTitle" defaultValue={e?.heroTitle ?? ''} placeholder="Gyeongbokgung Palace" />
        <TextArea label="Hero caption" name="heroCaption" rows={2} defaultValue={e?.heroCaption ?? ''} />
        <Field label="Photo credit" name="heroCredit" defaultValue={e?.heroCredit ?? ''} />
      </div>
      <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-end">
        <div>
          <label className="label" htmlFor="accentColor">Accent colour</label>
          <input id="accentColor" name="accentColor" type="color" defaultValue={e?.accentColor ?? '#C9A052'} className="h-11 w-24 cursor-pointer rounded-lg border border-line-strong bg-sunken p-1" />
        </div>
        <Select label="Background pattern" name="pattern" defaultValue={e?.pattern ?? 'none'} options={PATTERNS} />
      </div>
      <Check label="Published (visible on the website)" name="published" defaultChecked={e?.published ?? true} />
      <div>
        <Submit>{e ? 'Save expedition' : 'Create expedition'}</Submit>
      </div>
    </ActionForm>
  );
}
