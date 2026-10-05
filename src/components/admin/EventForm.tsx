'use client';

import { ActionForm, Check, Field, Select, Submit, TextArea } from '@/components/admin/forms';
import { saveEvent } from '@/server/admin/actions';
import { COMMON_TIMEZONES, utcToZonedInput } from '@/lib/time';
import type { Event } from '@/server/db/schema';

export function EventForm({
  event,
  expeditions,
  expeditionId,
  defaultTimezone,
}: {
  event?: Event;
  expeditions?: { id: number; name: string }[];
  expeditionId?: number;
  defaultTimezone: string;
}) {
  const tz = event?.hostTimezone ?? defaultTimezone;
  const zones = COMMON_TIMEZONES.includes(tz) ? COMMON_TIMEZONES : [tz, ...COMMON_TIMEZONES];
  return (
    <ActionForm action={saveEvent} resetOnSuccess={!event} className="grid gap-4">
      {event && <input type="hidden" name="id" value={event.id} />}
      {expeditions ? (
        <Select label="Expedition" name="expeditionId" defaultValue={String(event?.expeditionId ?? expeditionId ?? '')} options={[['', '— Club-wide (no expedition) —'], ...expeditions.map((e) => [String(e.id), e.name] as [string, string])]} />
      ) : (
        <input type="hidden" name="expeditionId" value={expeditionId ?? event?.expeditionId ?? ''} />
      )}
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <Select label="Type" name="kind" defaultValue={event?.kind ?? 'meeting'} options={[['meeting', 'Meeting'], ['class', 'Class'], ['social', 'Social'], ['other', 'Other']]} />
        <Field label="Title" name="title" required defaultValue={event?.title} placeholder="Meeting 1 · Launch & Introduction" />
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_8rem]">
        <Field label="Date & time" name="localStart" type="datetime-local" required defaultValue={event ? utcToZonedInput(event.startsAt, tz) : ''} />
        <Select label="…in time zone" name="hostTimezone" defaultValue={tz} options={zones.map((z) => [z, z.replace(/_/g, ' ')] as [string, string])} />
        <Field label="Minutes" name="durationMin" type="number" min={5} defaultValue={event?.durationMin ?? 90} />
      </div>
      <TextArea label="Description" name="description" rows={2} defaultValue={event?.description ?? ''} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Meeting link (Zoom)" name="joinUrl" defaultValue={event?.joinUrl ?? ''} placeholder="https://zoom.us/j/… — empty = the default link in Settings" />
        <Field label="Zoom meeting ID" name="zoomMeetingId" defaultValue={event?.zoomMeetingId ?? ''} placeholder="For attendance reports" />
        <Field label="Recording link" name="recordingUrl" defaultValue={event?.recordingUrl ?? ''} placeholder="Add after the session" />
      </div>
      <Check label="Published" name="published" defaultChecked={event?.published ?? true} />
      <div>
        <Submit>{event ? 'Save session' : 'Add session'}</Submit>
      </div>
    </ActionForm>
  );
}
