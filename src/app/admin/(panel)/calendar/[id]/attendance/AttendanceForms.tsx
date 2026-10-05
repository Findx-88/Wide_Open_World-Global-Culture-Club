'use client';

import { ActionForm, Field, Select, Submit } from '@/components/admin/forms';
import { addManualAttendance, importAttendance } from '@/server/admin/verification-actions';

export function ImportForm({ eventId }: { eventId: number }) {
  return (
    <ActionForm action={importAttendance} className="grid gap-4">
      <input type="hidden" name="eventId" value={eventId} />
      <div>
        <label className="label" htmlFor="file">Zoom participants report (.csv)</label>
        <input id="file" name="file" type="file" accept=".csv,text/csv" className="field" />
        <p className="mt-1 text-xs text-ink-faint">In Zoom: Account → Reports → Usage → click the meeting’s participant count → Export. Importing again replaces the previous import for this session (manual entries are kept).</p>
      </div>
      <div>
        <label className="label" htmlFor="csv">…or paste the contents</label>
        <textarea id="csv" name="csv" rows={4} className="field font-mono text-xs" />
      </div>
      <div>
        <Submit>Import attendance</Submit>
      </div>
    </ActionForm>
  );
}

export function ManualForm({ eventId, members }: { eventId: number; members: { id: number; name: string }[] }) {
  return (
    <ActionForm action={addManualAttendance} resetOnSuccess className="grid gap-4 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
      <input type="hidden" name="eventId" value={eventId} />
      <Select label="Member" name="memberId" options={[['', 'Choose a member…'], ...members.map((m) => [String(m.id), m.name] as [string, string])]} />
      <Field label="Minutes" name="minutes" type="number" min={1} defaultValue={60} />
      <Submit>Mark attended</Submit>
    </ActionForm>
  );
}
