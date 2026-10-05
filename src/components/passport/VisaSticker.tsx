'use client';

import { useId, useRef, type CSSProperties } from 'react';

export type VisaKind = 'book' | 'movie' | 'class' | 'legacy';

const THEME: Record<VisaKind, { a: string; b: string; name: string; sub: string }> = {
  book: { a: '#0b8f7c', b: '#12c2a3', name: 'BOOK VISA', sub: 'READING' },
  movie: { a: '#c2185b', b: '#ff5d8f', name: 'MOVIE VISA', sub: 'CINEMA' },
  class: { a: '#3f51d6', b: '#7c8cff', name: 'CLASS VISA', sub: 'ATTENDANCE' },
  legacy: { a: '#59606b', b: '#8c95a3', name: 'LEGACY VISA', sub: 'UNVERIFIED' },
};

const ICON: Record<VisaKind, React.ReactNode> = {
  book: <path d="M4 5h6a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H4zM22 5h-6a3 3 0 0 0-3 3v11a2 2 0 0 1 2-2h7z" />,
  movie: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 6l2 4M12 6l2 4M17 6l2 4" />
    </>
  ),
  class: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 21h8M12 16v5M9 9l3-2 3 2-3 2z" />
    </>
  ),
  legacy: <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.3 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z" />,
};

/**
 * A visa as a physical sticker: gradient foil, guilloché lines, an embossed seal, and a holographic patch.
 * It tilts in 3D toward the pointer and the hologram sheen follows it.
 */
export function VisaSticker({
  kind,
  country,
  number,
  workTitle,
  awardedOn,
  holder,
  passportNumber,
  active = true,
  delay = 0,
}: {
  kind: VisaKind;
  country: string;
  number: number;
  workTitle?: string | null;
  awardedOn: string;
  holder: string;
  passportNumber: string;
  active?: boolean;
  delay?: number;
}) {
  const t = THEME[kind];
  const id = useId().replace(/:/g, '');
  const ref = useRef<HTMLDivElement>(null);
  const title = workTitle ?? (kind === 'movie' ? 'Cinema of ' + country : kind === 'class' ? 'Live sessions' : country);
  const mrz = `V<WOW<<${country.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10)}<<${String(number).padStart(2, '0')}<<${kind.toUpperCase()}`.padEnd(34, '<');

  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', x.toFixed(3));
    el.style.setProperty('--my', y.toFixed(3));
    el.style.transform = `perspective(520px) rotateX(${((0.5 - y) * 16).toFixed(2)}deg) rotateY(${((x - 0.5) * 20).toFixed(2)}deg) translateZ(6px)`;
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
    el.style.setProperty('--mx', '0.5');
    el.style.setProperty('--my', '0.5');
  };

  const wrap: CSSProperties = {
    opacity: active ? undefined : 0,
    animation: active ? `sticker-peel 0.6s ${delay}ms cubic-bezier(0.2, 0.8, 0.25, 1) both` : undefined,
  };

  return (
    <div style={wrap} className="w-full">
      <div
        ref={ref}
        onPointerMove={move}
        onPointerLeave={leave}
        className="visa-sticker relative w-full overflow-hidden rounded-[10px] text-white transition-transform duration-200 ease-out will-change-transform"
        style={{
          ['--mx' as string]: 0.5,
          ['--my' as string]: 0.5,
          height: 84,
          background: `linear-gradient(135deg, ${t.a} 0%, ${t.b} 100%)`,
          boxShadow: '0 1px 0 rgb(255 255 255 / .35) inset, 0 -1px 0 rgb(0 0 0 / .25) inset, 0 6px 14px -4px rgb(0 0 0 / .45)',
        }}
      >
        {/* guilloché lines */}
        <svg className="absolute inset-0 h-full w-full opacity-25" aria-hidden="true">
          <defs>
            <pattern id={`g${id}`} width="18" height="18" patternUnits="userSpaceOnUse">
              <path d="M0 9 Q4.5 0 9 9 T18 9" fill="none" stroke="#fff" strokeWidth=".7" />
              <path d="M0 14 Q4.5 5 9 14 T18 14" fill="none" stroke="#fff" strokeWidth=".5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#g${id})`} />
        </svg>
        {/* moving specular band */}
        <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(105deg, transparent calc(var(--mx) * 100% - 24%), rgb(255 255 255 / .38) calc(var(--mx) * 100%), transparent calc(var(--mx) * 100% + 24%))', mixBlendMode: 'soft-light' }} />

        <div className="relative flex h-full items-center gap-3 px-3">
          {/* embossed seal */}
          <div className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, rgb(255 255 255 / .45), rgb(255 255 255 / .08) 60%)', boxShadow: '0 1px 2px rgb(0 0 0 / .4), inset 0 1px 1px rgb(255 255 255 / .6), inset 0 -2px 3px rgb(0 0 0 / .25)' }}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 1px 0 rgb(0 0 0 / .35))' }} aria-hidden="true">
              {ICON[kind]}
            </svg>
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="flex items-center gap-2 text-[7.5px] font-bold tracking-[0.22em] text-white/85">
              <span>{t.name}</span>
              <span className="text-white/50">·</span>
              <span className="font-medium">Nº {String(number).padStart(2, '0')}</span>
            </div>
            <div className="mt-0.5 truncate font-logo text-[15px] font-bold" style={{ textShadow: '0 1px 0 rgb(0 0 0 / .25)' }}>{title}</div>
            <div className="truncate text-[8.5px] tracking-[0.06em] text-white/85">
              {country} · {kind === 'legacy' ? 'not confirmed' : `issued ${awardedOn}`}
            </div>
            <div className="mt-1 truncate font-type text-[6.2px] tracking-[0.08em] text-white/65">{mrz}</div>
            <div className="truncate font-type text-[6.2px] tracking-[0.08em] text-white/65">{passportNumber.replace(/-/g, '')}&lt;{holder.toUpperCase().replace(/[^A-Z]+/g, '<').slice(0, 20)}</div>
          </div>
          {/* hologram patch */}
          <div
            className="relative h-[58px] w-[38px] shrink-0 overflow-hidden rounded-md border border-white/40"
            style={{
              background: 'conic-gradient(from calc(var(--mx) * 360deg) at calc(var(--mx) * 100%) calc(var(--my) * 100%), #ff6ec7, #ffe66e, #6effc4, #6eb5ff, #c76eff, #ff6ec7)',
              opacity: 0.85,
              boxShadow: 'inset 0 0 8px rgb(255 255 255 / .5)',
            }}
          >
            <svg viewBox="0 0 40 60" className="absolute inset-0 h-full w-full mix-blend-overlay" aria-hidden="true">
              <circle cx="20" cy="30" r="14" fill="none" stroke="#fff" strokeWidth="1" />
              <ellipse cx="20" cy="30" rx="14" ry="5" fill="none" stroke="#fff" strokeWidth=".8" />
              <ellipse cx="20" cy="30" rx="5" ry="14" fill="none" stroke="#fff" strokeWidth=".8" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
