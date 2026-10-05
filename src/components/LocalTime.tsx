'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * Renders a UTC instant in the *viewer's* time zone ("Sunday, 25 October · 5:30 pm IST").
 * The server render uses the host time zone so the first paint is already meaningful.
 */
export function LocalTime({
  iso,
  fallbackZone = 'UTC',
  mode = 'datetime',
}: {
  iso: string;
  fallbackZone?: string;
  mode?: 'datetime' | 'date' | 'time';
}) {
  const zone = useSyncExternalStore(
    subscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => fallbackZone,
  );
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: zone });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: zone, timeZoneName: 'short' });
  const text = mode === 'date' ? date : mode === 'time' ? time : `${date} · ${time}`;
  return <time dateTime={iso}>{text}</time>;
}
