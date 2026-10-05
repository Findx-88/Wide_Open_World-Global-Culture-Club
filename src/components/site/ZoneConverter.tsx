'use client';

import { useState } from 'react';
import { COMMON_TIMEZONES } from '@/lib/time';

/** "What time is that for my friend in…?" */
export function ZoneConverter({ iso }: { iso: string }) {
  const [zone, setZone] = useState('');
  const d = new Date(iso);
  return (
    <div>
      <label className="label" htmlFor="zone">Check another time zone</label>
      <select id="zone" className="field" value={zone} onChange={(e) => setZone(e.target.value)}>
        <option value="">Choose a city / time zone…</option>
        {COMMON_TIMEZONES.map((z) => (
          <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>
        ))}
      </select>
      {zone && (
        <p className="mt-3 text-ink-soft">
          {d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: zone })} ·{' '}
          <strong className="text-ink">{d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: zone, timeZoneName: 'short' })}</strong>
        </p>
      )}
    </div>
  );
}
