'use client';

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { lookupCover } from '@/server/admin/actions';
import type { ActionState } from '@/lib/action-state';

type Action = (prev: ActionState | null, form: FormData) => Promise<ActionState>;

/** Form bound to a server action; shows the result message. `onDone` sees successful results. */
export function ActionForm({
  action,
  children,
  className = 'grid gap-4',
  resetOnSuccess = false,
  onDone,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onDone?: (s: ActionState) => void;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    if (!state?.ok) return;
    if (resetOnSuccess) ref.current?.reset();
    done.current?.(state);
  }, [state, resetOnSuccess]);
  // Submitting via onSubmit (not the `action` prop) stops React 19 from clearing the inputs
  // after every submission — a failed save keeps what the admin typed.
  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
      {state && (
        <p role="status" className={`text-sm ${state.ok ? 'text-ok' : 'text-danger'}`}>
          {state.ok ? '✓ ' : '⚠ '}
          {state.message}
        </p>
      )}
    </form>
  );
}

const PendingContext = createContext<boolean | null>(null);

export function Submit({ children, className = 'btn btn-primary' }: { children: ReactNode; className?: string }) {
  const actionPending = useContext(PendingContext);
  const status = useFormStatus();
  const pending = actionPending ?? status.pending;
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-60`}>
      {pending ? 'Saving…' : children}
    </button>
  );
}

/** A one-click form (delete, toggle…) with an optional confirm prompt. */
export function ActionButton({
  action,
  fields,
  confirm,
  children,
  className = 'btn btn-ghost !px-3 !py-1.5 !text-[0.7rem]',
}: {
  action: (form: FormData) => Promise<void>;
  fields: Record<string, string | number>;
  confirm?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className="inline"
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <Submit className={className}>{children}</Submit>
    </form>
  );
}

export function Field({ label, name, hint, className = '', ...props }: { label: string; name: string; hint?: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} className="field" {...props} />
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

export function TextArea({ label, name, hint, className = '', ...props }: { label: string; name: string; hint?: string; className?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>{label}</label>
      <textarea id={name} name={name} rows={3} className="field" {...props} />
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

export function Select({ label, name, options, className = '', ...props }: { label: string; name: string; options: [string, string][]; className?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>{label}</label>
      <select id={name} name={name} className="field" {...props}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}

export function Check({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-soft">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-[var(--gold)]" />
      {label}
    </label>
  );
}

/** Cover URL input with an automatic "Find cover" lookup (Open Library / Wikipedia) and preview. */
export function CoverField({ kind, defaultValue, getQuery }: { kind: 'book' | 'film'; defaultValue?: string | null; getQuery: () => { title: string; creator: string; year?: number } }) {
  const [url, setUrl] = useState(defaultValue ?? '');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const find = async () => {
    const q = getQuery();
    if (!q.title) return setNote('Enter the title first.');
    setBusy(true);
    setNote('');
    const found = await lookupCover(kind, q.title, q.creator, q.year);
    setBusy(false);
    if (found) setUrl(found);
    else setNote('No cover found — paste an image URL instead.');
  };
  return (
    <div className="flex gap-4">
      <div className="aspect-[2/3] w-16 shrink-0 overflow-hidden rounded bg-sunken ring-1 ring-line">{url && <img src={url} alt="" className="h-full w-full object-cover" />}</div>
      <div className="flex-1">
        <label className="label" htmlFor={`cover-${kind}`}>{kind === 'book' ? 'Cover image URL' : 'Poster image URL'}</label>
        <div className="flex gap-2">
          <input id={`cover-${kind}`} name="coverUrl" value={url} onChange={(e) => setUrl(e.target.value)} className="field" placeholder="Leave empty to find automatically" />
          <button type="button" onClick={find} disabled={busy} className="btn btn-ghost !px-3 !text-[0.7rem]">{busy ? '…' : 'Find'}</button>
        </div>
        {note && <p className="mt-1 text-xs text-ink-faint">{note}</p>}
      </div>
    </div>
  );
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost !px-3 !py-1.5 !text-[0.7rem]"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      }}
    >
      {done ? 'Copied ✓' : label}
    </button>
  );
}

export function Panel({ title, description, children, actions }: { title: string; description?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="card p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">{title}</h2>
          {description && <p className="mt-1 text-sm text-ink-faint">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
