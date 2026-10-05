'use client';

import { useRef } from 'react';
import { ActionForm, Check, CoverField, Field, Select, Submit, TextArea } from '@/components/admin/forms';
import { saveExpeditionWork } from '@/server/admin/actions';
import type { LinkedWork } from '@/server/queries';

export function WorkForm({ expeditionId, kind, work, nextSort }: { expeditionId: number; kind: 'book' | 'film'; work?: LinkedWork; nextSort: number }) {
  const box = useRef<HTMLDivElement>(null);
  const val = (name: string) => (box.current?.querySelector(`[name="${name}"]`) as HTMLInputElement | null)?.value ?? '';
  const w = work;
  return (
    <ActionForm action={saveExpeditionWork} resetOnSuccess={!w} className="grid gap-4">
      <div ref={box} className="grid gap-4">
        <input type="hidden" name="expeditionId" value={expeditionId} />
        <input type="hidden" name="kind" value={kind} />
        {w && <input type="hidden" name="workId" value={w.id} />}
        {w && <input type="hidden" name="linkId" value={w.linkId} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" name="title" required defaultValue={w?.title} />
          <Field label={kind === 'book' ? 'Author' : 'Director'} name="creator" required defaultValue={w?.creator} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Year" name="year" type="number" defaultValue={w?.year ?? ''} />
          <Field label={kind === 'book' ? 'Pages' : 'Minutes'} name="length" type="number" defaultValue={w?.length ?? ''} />
          <Field label="Genre" name="genre" defaultValue={w?.genre ?? ''} />
          <Field label="Order" name="sortOrder" type="number" defaultValue={w?.sortOrder ?? nextSort} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Role" name="role" defaultValue={w?.role ?? (nextSort === 0 ? 'primary' : 'additional')} options={[['primary', kind === 'book' ? 'Main book' : 'Featured film'], ['additional', 'Additional']]} />
          {kind === 'film' && <Field label="Category (groups films)" name="category" defaultValue={w?.category ?? ''} placeholder="e.g. Historical & Political" />}
        </div>
        {kind === 'book' && <Check label="Reading this book earns its own Book Visa" name="awardsVisa" defaultChecked={w?.awardsVisa ?? true} />}
        <CoverField kind={kind} defaultValue={w?.coverUrl} getQuery={() => ({ title: val('title'), creator: val('creator'), year: Number(val('year')) || undefined })} />
        <TextArea label="Description" name="description" defaultValue={w?.description ?? ''} />
        <TextArea label="Why we chose it" name="whyChosen" defaultValue={w?.whyChosen ?? ''} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextArea label="Quote (optional)" name="quote" rows={2} defaultValue={w?.quote ?? ''} />
          <TextArea label="Awards (one per line)" name="awards" rows={2} defaultValue={w?.awards.join('\n') ?? ''} />
        </div>
      </div>
      <div>
        <Submit>{w ? 'Save' : `Add ${kind}`}</Submit>
      </div>
    </ActionForm>
  );
}
