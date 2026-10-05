'use client';

import { ActionForm, Submit, TextArea } from '@/components/admin/forms';
import { importMemberEmails } from '@/server/admin/verification-actions';

export function EmailImportForm() {
  return (
    <ActionForm action={importMemberEmails} resetOnSuccess className="grid gap-4">
      <TextArea
        label="One member per line"
        name="lines"
        rows={6}
        placeholder={'WOW-2026-0002, someone@example.com\nSanju Baral, sanju@example.com'}
        hint="Passport number (or exact name), then a comma, then the email. Emails let us send reminders and visa confirmations."
      />
      <div>
        <Submit>Save emails</Submit>
      </div>
    </ActionForm>
  );
}
