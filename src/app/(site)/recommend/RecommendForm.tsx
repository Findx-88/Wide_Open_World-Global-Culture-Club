'use client';

import { startTransition, useActionState, useEffect, useRef } from 'react';
import { submitRecommendation } from '@/server/public-actions';

export function RecommendForm({ defaultCountry = '' }: { defaultCountry?: string }) {
  const [state, action, pending] = useActionState(submitRecommendation, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);

  return (
    <form
      ref={form}
      className="card grid gap-5 p-6 sm:p-8"
      onSubmit={(e) => {
        // Keep what the visitor typed if validation fails (a plain `action` prop clears the form).
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <div>
        <label className="label" htmlFor="country">Country *</label>
        <input id="country" name="country" required defaultValue={defaultCountry} className="field" placeholder="e.g. Japan" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="bookTitle">Book title</label>
          <input id="bookTitle" name="bookTitle" className="field" placeholder="Norwegian Wood" />
        </div>
        <div>
          <label className="label" htmlFor="bookAuthor">Author</label>
          <input id="bookAuthor" name="bookAuthor" className="field" placeholder="Haruki Murakami" />
        </div>
        <div>
          <label className="label" htmlFor="filmTitle">Film title</label>
          <input id="filmTitle" name="filmTitle" className="field" placeholder="Tokyo Story" />
        </div>
        <div>
          <label className="label" htmlFor="filmDirector">Director</label>
          <input id="filmDirector" name="filmDirector" className="field" placeholder="Yasujirō Ozu" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="why">Why this one?</label>
        <textarea id="why" name="why" rows={4} className="field" placeholder="What did it teach you about the country?" />
      </div>
      <div>
        <label className="label" htmlFor="submitterName">Your name (optional)</label>
        <input id="submitterName" name="submitterName" className="field" />
      </div>
      {/* honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="flex flex-wrap items-center gap-4">
        <button className="btn btn-primary" disabled={pending}>{pending ? 'Sending…' : 'Send recommendation'}</button>
        {state && <p role="status" className={state.ok ? 'text-ok' : 'text-danger'}>{state.message}</p>}
      </div>
    </form>
  );
}
