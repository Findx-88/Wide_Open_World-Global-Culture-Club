'use client';

import { useEffect, useState } from 'react';

const UNITS = [
  ['Days', 86_400_000],
  ['Hours', 3_600_000],
  ['Mins', 60_000],
  ['Secs', 1000],
] as const;

export function Countdown({ iso, durationMin = 90, compact = false }: { iso: string; durationMin?: number; compact?: boolean }) {
  const target = new Date(iso).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start the clock only on the client
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (now !== null && now >= target && now < target + durationMin * 60_000) {
    return (
      <div className="flex items-center gap-3 text-lg font-semibold text-accent">
        <span className="pulse-dot" /> Happening now
      </div>
    );
  }

  let left = Math.max(0, target - (now ?? target));
  const values = UNITS.map(([label, ms]) => {
    const v = Math.floor(left / ms);
    left -= v * ms;
    return [label, String(v).padStart(2, '0')] as const;
  });

  return (
    <div className={`flex ${compact ? 'gap-3' : 'gap-4 sm:gap-6'}`} aria-label="Time until the next meeting">
      {values.map(([label, v]) => (
        <div key={label} className="text-center">
          <div className={`num font-display ${compact ? 'text-3xl' : 'text-4xl sm:text-5xl'} leading-none text-ink`}>{now === null ? '--' : v}</div>
          <div className="mt-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-ink-faint">{label}</div>
        </div>
      ))}
    </div>
  );
}
