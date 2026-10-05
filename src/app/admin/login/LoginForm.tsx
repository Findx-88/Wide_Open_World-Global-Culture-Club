'use client';

import { useState } from 'react';
import { ActionForm, Submit } from '@/components/admin/forms';
import { login } from '@/server/admin/actions';

export function LoginForm() {
  const [show, setShow] = useState(false);
  return (
    <ActionForm action={login} className="card mt-8 grid gap-4 p-6">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <div className="relative">
          <input id="password" name="password" type={show ? 'text' : 'password'} autoComplete="current-password" required className="field pr-16" />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-3 text-xs font-semibold uppercase tracking-wider text-ink-faint hover:text-accent">
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      <Submit>Sign in</Submit>
    </ActionForm>
  );
}
