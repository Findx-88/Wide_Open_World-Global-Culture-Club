'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { db, schema } from './db';
import type { ActionState } from '@/lib/action-state';

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
    .optional()
    .transform((v) => v ?? null);

const recommendationSchema = z
  .object({
    country: z.string().trim().min(2, 'Tell us the country').max(80),
    bookTitle: text(200),
    bookAuthor: text(120),
    filmTitle: text(200),
    filmDirector: text(120),
    submitterName: text(80),
    why: text(1500),
  })
  .refine((d) => d.bookTitle || d.filmTitle, { message: 'Add at least a book or a film' });

const recent = new Map<string, number[]>();

export async function submitRecommendation(_: ActionState | null, form: FormData): Promise<ActionState> {
  // Honeypot: real people never fill this hidden field.
  if (form.get('website')) return { ok: true, message: 'Thank you!', at: Date.now() };

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0] ?? 'local';
  const times = (recent.get(ip) ?? []).filter((t) => t > Date.now() - 3600_000);
  if (times.length >= 5) return { ok: false, message: 'Thanks for all the ideas! Please try again in an hour.', at: Date.now() };

  const parsed = recommendationSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message, at: Date.now() };

  await db.insert(schema.recommendations).values(parsed.data);
  recent.set(ip, [...times, Date.now()]);
  return { ok: true, message: 'Thank you! Our curators will read your suggestion.', at: Date.now() };
}

// ── Member confirmations & preferences (secured by the private link token) ──

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { invalidateCache } from './cache';
import { NOTIFICATION_TYPES } from './notifications/registry';
import { submitAnswers } from './verification/workflow';

export async function submitConfirmation(_: ActionState | null, form: FormData): Promise<ActionState> {
  const token = String(form.get('token') ?? '');
  const books: Record<number, boolean> = {};
  for (const [k, v] of form.entries()) {
    if (k.startsWith('book-')) {
      if (v !== 'yes' && v !== 'no') continue;
      books[Number(k.slice(5))] = v === 'yes';
    }
  }
  const expectedBooks = form.getAll('expectBook').map(Number);
  if (expectedBooks.some((id) => !(id in books))) return { ok: false, message: 'Please answer Yes or No for each book.', at: Date.now() };
  const attendedRaw = form.get('attended');
  if (form.get('expectClass') && attendedRaw !== 'yes' && attendedRaw !== 'no') return { ok: false, message: 'Please tell us whether you attended the sessions.', at: Date.now() };

  const result = await submitAnswers(token, {
    books,
    filmsWatched: form.getAll('film').map(Number),
    attended: attendedRaw === 'yes' ? true : attendedRaw === 'no' ? false : null,
  });
  if (!result.ok) return { ok: false, message: result.error, at: Date.now() };
  revalidatePath('/', 'layout');
  return {
    ok: true,
    message: result.awards.length ? `Thank you! Stamped: ${result.awards.join(', ')}.` : 'Thank you — your answers are saved. No new visas this time.',
    data: { awards: result.awards },
    at: Date.now(),
  };
}

export async function savePreferences(_: ActionState | null, form: FormData): Promise<ActionState> {
  const token = String(form.get('token') ?? '');
  const { prefsByToken } = await import('./notifications/queue');
  const prefs = await prefsByToken(token);
  if (!prefs) return { ok: false, message: 'This link isn’t valid.', at: Date.now() };
  const unsubscribedAll = form.get('pauseAll') === 'on';
  const disabledTypes = NOTIFICATION_TYPES.filter((t) => form.get(`type-${t.key}`) !== 'on').map((t) => t.key as string);
  await db.update(schema.notificationPrefs).set({ unsubscribedAll, disabledTypes, updatedAt: new Date().toISOString() }).where(eq(schema.notificationPrefs.memberId, prefs.memberId));
  invalidateCache();
  return { ok: true, message: unsubscribedAll ? 'You’re unsubscribed from all WOW emails.' : 'Preferences saved.', at: Date.now() };
}
