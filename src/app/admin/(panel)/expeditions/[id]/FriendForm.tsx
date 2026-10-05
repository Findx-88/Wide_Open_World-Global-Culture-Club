'use client';

import { ActionForm, Field, Submit, TextArea } from '@/components/admin/forms';
import { saveFriend } from '@/server/admin/actions';
import type { LinkedFriend } from '@/server/queries';

export function FriendForm({ expeditionId, friend, countryName }: { expeditionId: number; friend?: LinkedFriend; countryName: string }) {
  const f = friend;
  return (
    <ActionForm action={saveFriend} resetOnSuccess={!f} className="grid gap-4">
      <input type="hidden" name="expeditionId" value={expeditionId} />
      {f && <input type="hidden" name="friendId" value={f.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" required defaultValue={f?.name} />
        <Field label="Title" name="title" defaultValue={f?.title ?? `Friend from ${countryName}`} />
        <Field label="Location" name="location" defaultValue={f?.location ?? ''} placeholder={`City, ${countryName}`} />
        <Field label="Photo URL" name="photoUrl" defaultValue={f?.photoUrl ?? ''} placeholder="Optional — initials are shown otherwise" />
      </div>
      <TextArea label="Short bio" name="bio" rows={2} defaultValue={f?.bio ?? ''} />
      <TextArea label="Their quote about the book/films" name="quote" rows={3} defaultValue={f?.quote ?? ''} />
      <input type="hidden" name="sortOrder" value="0" />
      <div>
        <Submit>{f ? 'Save friend' : 'Add friend'}</Submit>
      </div>
    </ActionForm>
  );
}
