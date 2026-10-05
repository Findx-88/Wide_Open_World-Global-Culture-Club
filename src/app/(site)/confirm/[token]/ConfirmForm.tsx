'use client';

import Link from 'next/link';
import { startTransition, useActionState } from 'react';
import { Cover } from '@/components/Cover';
import { submitConfirmation } from '@/server/public-actions';

type Work = { id: number; title: string; creator: string; year: number | null; coverUrl: string | null; kind: 'book' | 'film'; current: 'yes' | 'no' | null; locked: boolean };

function YesNo({ name, current, locked }: { name: string; current: 'yes' | 'no' | null; locked?: boolean }) {
  if (locked) return <span className="chip !border-ok !text-ok">✓ Verified</span>;
  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup">
      {(['yes', 'no'] as const).map((v) => (
        <label key={v} className="cursor-pointer">
          <input type="radio" name={name} value={v} defaultChecked={current === v} className="peer sr-only" required />
          <span className="flex min-h-12 items-center justify-center rounded-xl border border-line-strong px-4 text-sm font-semibold uppercase tracking-[0.1em] text-ink-soft transition peer-checked:border-accent peer-checked:bg-accent peer-checked:text-gold-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
            {v === 'yes' ? 'Yes' : 'No'}
          </span>
        </label>
      ))}
    </div>
  );
}

export function ConfirmForm({ token, books, films, hasClass, classCurrent, classLocked, passportNumber }: { token: string; books: Work[]; films: Work[]; hasClass: boolean; classCurrent: 'yes' | 'no' | null; classLocked: boolean; passportNumber: string }) {
  const [state, action, pending] = useActionState(submitConfirmation, null);

  if (state?.ok) {
    return (
      <div className="card p-8 text-center">
        <div className="text-5xl">✦</div>
        <h2 className="mt-4 font-display text-3xl">Thank you!</h2>
        <p className="mt-3 text-ink-soft">{state.message}</p>
        <Link href={`/passport/${passportNumber}`} className="btn btn-primary mt-8">Open my passport</Link>
      </div>
    );
  }

  return (
    <form
      className="grid gap-8"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <input type="hidden" name="token" value={token} />

      {books.length > 0 && (
        <section className="grid gap-4">
          <h2 className="font-display text-2xl">📖 Did you read the {books.length > 1 ? 'books' : 'book'}?</h2>
          {books.map((b) => (
            <div key={b.id} className="card grid gap-4 p-4 sm:grid-cols-[auto_1fr_14rem] sm:items-center">
              <input type="hidden" name="expectBook" value={b.id} />
              <Cover work={b} className="hidden w-16 sm:block" />
              <div>
                <div className="font-display text-xl leading-tight">{b.title}</div>
                <div className="text-sm text-ink-faint">{b.creator}</div>
              </div>
              <YesNo name={`book-${b.id}`} current={b.current} locked={b.locked} />
            </div>
          ))}
        </section>
      )}

      {films.length > 0 && (
        <section className="grid gap-4">
          <div>
            <h2 className="font-display text-2xl">🎬 Which films did you watch?</h2>
            <p className="text-sm text-ink-faint">Tap every film you watched. Leave all unselected if you didn’t watch any.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {films.map((f) => (
              <label key={f.id} className="group relative cursor-pointer">
                <input type="checkbox" name="film" value={f.id} defaultChecked={f.current === 'yes'} className="peer sr-only" />
                <div className="rounded-xl border border-line p-2 transition peer-checked:border-accent peer-checked:bg-accent/10 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                  <Cover work={f} className="w-full" />
                  <div className="mt-2 text-sm font-medium leading-tight">{f.title}</div>
                  <div className="text-xs text-ink-faint">{f.year}</div>
                </div>
                <span className="absolute right-3 top-3 hidden h-7 w-7 place-items-center rounded-full bg-accent text-gold-ink peer-checked:grid">✓</span>
              </label>
            ))}
          </div>
        </section>
      )}

      {hasClass && (
        <section className="card grid gap-4 p-5 sm:grid-cols-[1fr_14rem] sm:items-center">
          <input type="hidden" name="expectClass" value="1" />
          <h2 className="font-display text-2xl">🎥 Did you attend our live sessions?</h2>
          <YesNo name="attended" current={classCurrent} locked={classLocked} />
        </section>
      )}

      {state && !state.ok && <p role="alert" className="text-danger">⚠ {state.message}</p>}
      <div>
        <button className="btn btn-primary w-full sm:w-auto" disabled={pending}>{pending ? 'Saving…' : 'Save my answers'}</button>
        <p className="mt-3 text-xs text-ink-faint">A visa is only stamped for what you confirm. You can come back to this link until the window closes.</p>
      </div>
    </form>
  );
}
