'use client';

import { startTransition, useActionState } from 'react';
import { savePreferences } from '@/server/public-actions';

export function PreferencesForm({ token, unsubscribedAll, disabled, types }: { token: string; unsubscribedAll: boolean; disabled: string[]; types: { key: string; label: string; description: string }[] }) {
  const [state, action, pending] = useActionState(savePreferences, null);
  return (
    <form
      className="mt-10 grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <input type="hidden" name="token" value={token} />
      {types.map((t) => (
        <label key={t.key} className="card flex cursor-pointer items-start gap-4 p-5">
          <input type="checkbox" name={`type-${t.key}`} defaultChecked={!disabled.includes(t.key)} className="mt-1 h-5 w-5 accent-[var(--gold)]" />
          <span>
            <span className="block font-medium">{t.label}</span>
            <span className="block text-sm text-ink-faint">{t.description}</span>
          </span>
        </label>
      ))}
      <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-danger/40 p-5">
        <input type="checkbox" name="pauseAll" defaultChecked={unsubscribedAll} className="h-5 w-5 accent-[var(--danger)]" />
        <span>
          <span className="block font-medium">Unsubscribe from all WOW emails</span>
          <span className="block text-sm text-ink-faint">You can still confirm your activities from the passport page at any time.</span>
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button className="btn btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Save preferences'}</button>
        {state && <p role="status" className={state.ok ? 'text-ok' : 'text-danger'}>{state.message}</p>}
      </div>
    </form>
  );
}
