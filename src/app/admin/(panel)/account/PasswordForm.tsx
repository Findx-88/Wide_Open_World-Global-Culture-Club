'use client';

import { ActionForm, Field, Submit } from '@/components/admin/forms';
import { changePassword } from '@/server/admin/actions';

export function PasswordForm() {
  return (
    <ActionForm action={changePassword} resetOnSuccess className="grid max-w-md gap-4">
      <Field label="Current password" name="current" type="password" autoComplete="current-password" required />
      <Field label="New password (12+ characters)" name="next" type="password" autoComplete="new-password" minLength={12} required />
      <div>
        <Submit>Update password</Submit>
      </div>
    </ActionForm>
  );
}
