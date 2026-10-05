'use client';

import { ActionForm, Submit } from '@/components/admin/forms';
import { runSchedulerNow, sendTestEmail } from '@/server/admin/verification-actions';

export function SchedulerButtons() {
  return (
    <div className="grid gap-4">
      <ActionForm action={runSchedulerNow} className="grid gap-2">
        <div>
          <Submit>Run the scheduler now</Submit>
        </div>
      </ActionForm>
      <ActionForm action={sendTestEmail} className="grid gap-2">
        <div>
          <Submit className="btn btn-ghost">Send a test email to me</Submit>
        </div>
      </ActionForm>
    </div>
  );
}
