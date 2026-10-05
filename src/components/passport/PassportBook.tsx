'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { WOWLogo } from '@/components/brand';
import { Stamp } from '@/components/Stamp';
import { flagUrl, initials } from '@/lib/format';
import { shade } from '@/lib/geo';
import { VisaSticker, type VisaKind } from './VisaSticker';

export type PassportVisa = { kind: VisaKind; workTitle: string | null; awardedOn: string };
export type PassportStamp = {
  number: number;
  country: string;
  iso2: string;
  accent: string;
  dateLabel: string;
  issuedOn: string;
  visas: PassportVisa[];
  book?: { title: string; creator: string } | null;
  film?: { title: string; creator: string } | null;
  friend?: string | null;
  silhouette: string | null;
};
export type PassportData = {
  name: string;
  passportNumber: string;
  joinedOn: string; // YYYY-MM-DD
  country: { iso2: string; iso3: string; name: string };
  stamps: PassportStamp[];
  inProgress: PassportStamp | null; // current expedition without any visa yet
};

const PW = 290;
const PH = 420;
const GAP = 8;
const FLIP_MS = 900;

// Every passport gets its own leather colour, derived from its number, so a crowd of passports is a colourful crowd.
const COVERS = [
  { name: 'Emerald', a: '#06301f', b: '#1f8f64' },
  { name: 'Burgundy', a: '#3e0b20', b: '#b02a58' },
  { name: 'Sapphire', a: '#0a1c46', b: '#3267e0' },
  { name: 'Lagoon', a: '#043540', b: '#22b0c2' },
  { name: 'Amethyst', a: '#2a0f45', b: '#9556e0' },
  { name: 'Terracotta', a: '#4a1707', b: '#e0703a' },
] as const;
type Cover = (typeof COVERS)[number];
const coverFor = (n: string): Cover => COVERS[[...n].reduce((s, c) => s + c.charCodeAt(0), 0) % COVERS.length];

const tiny: CSSProperties = { fontFamily: 'var(--font-jost), sans-serif', fontSize: 7, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(40,30,15,0.55)' };
const typed: CSSProperties = { fontFamily: 'var(--font-special-elite), monospace' };

type Ctx = { n: number; left: boolean; active: boolean };
type PageFn = (c: Ctx) => ReactNode;

// ── page furniture ─────────────────────────────────────────────────────────

function Guilloche({ color }: { color: string }) {
  return (
    <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.11 }}>
      <defs>
        <pattern id={`gl-${color.replace('#', '')}`} width="46" height="46" patternUnits="userSpaceOnUse">
          {[6, 11, 16, 21].map((r) => <circle key={r} cx="23" cy="23" r={r} fill="none" stroke={color} strokeWidth=".6" />)}
          <path d="M0 23h46M23 0v46" stroke={color} strokeWidth=".3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#gl-${color.replace('#', '')})`} />
    </svg>
  );
}

function Paper({ children, left, tint = '#8a6a2a' }: { children: ReactNode; left?: boolean; tint?: string }) {
  return (
    <div className={left ? 'paper-spine-l' : 'paper-spine-r'} style={{ width: PW, height: PH, position: 'relative', overflow: 'hidden', color: '#1d1a14', background: 'linear-gradient(135deg, #fcf6e7 0%, #f1e6cb 100%)' }}>
      <Guilloche color={tint} />
      {children}
      <div className="page-shade" />
    </div>
  );
}

function Leather({ cover, children, face = 'front' }: { cover: Cover; children?: ReactNode; face?: 'front' | 'inside' | 'back' }) {
  return (
    <div
      style={{
        width: PW,
        height: PH,
        position: 'relative',
        overflow: 'hidden',
        background: `radial-gradient(120% 90% at 28% 18%, ${cover.b} 0%, ${cover.a} 72%)`,
        boxShadow: face === 'front' ? 'inset 0 0 40px rgb(0 0 0 / .6), inset 3px 0 6px rgb(0 0 0 / .5)' : 'inset 0 0 40px rgb(0 0 0 / .55)',
        color: '#e8c872',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* leather grain */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.35, backgroundImage: 'radial-gradient(rgb(0 0 0 / .55) 1px, transparent 1.2px), radial-gradient(rgb(255 255 255 / .12) 1px, transparent 1.2px)', backgroundSize: '4px 4px, 4px 4px', backgroundPosition: '0 0, 2px 2px' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 9, border: '1.5px solid rgb(232 200 114 / .6)', borderRadius: 3 }} />
      <div aria-hidden style={{ position: 'absolute', inset: 13, border: '.6px solid rgb(232 200 114 / .35)', borderRadius: 2 }} />
      {([[10, 10, 0], [PW - 10, 10, 90], [PW - 10, PH - 10, 180], [10, PH - 10, 270]] as const).map(([x, y, r], i) => (
        <svg key={i} width="26" height="26" viewBox="0 0 26 26" aria-hidden style={{ position: 'absolute', left: x - 13, top: y - 13, transform: `rotate(${r}deg)` }}>
          <path d="M3 13 Q3 3 13 3 M7 13 Q7 7 13 7 M3 3 L10 10" fill="none" stroke="rgb(232 200 114 / .8)" strokeWidth="1" />
        </svg>
      ))}
      {face === 'front' && <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-3" style={{ background: 'linear-gradient(to right, rgb(0 0 0 / .55), transparent)' }} />}
      {children}
    </div>
  );
}

function PageNo({ n, left }: { n: number; left?: boolean }) {
  return <span style={{ position: 'absolute', bottom: 9, [left ? 'left' : 'right']: 14, ...tiny, letterSpacing: '0.05em' }}>{String(n).padStart(2, '0')}</span>;
}

function mrz(d: PassportData) {
  const parts = d.name.trim().split(/\s+/);
  const surname = (parts.length > 1 ? parts.at(-1)! : parts[0]).toUpperCase().replace(/[^A-Z]/g, '');
  const given = (parts.length > 1 ? parts.slice(0, -1).join('<') : '').toUpperCase().replace(/[^A-Z<]/g, '');
  return [`P<WOW${surname}<<${given}`.padEnd(44, '<').slice(0, 44), `${d.passportNumber.replace(/-/g, '')}<${d.country.iso3}${d.joinedOn.replace(/-/g, '').slice(2)}<<<<<<<<<<<<<<<<<`.padEnd(44, '<').slice(0, 44)];
}
function Mrz({ lines }: { lines: string[] }) {
  return (
    <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, textAlign: 'center', ...typed, fontSize: 5.6, color: 'rgba(0,0,0,0.36)', lineHeight: 1.4, whiteSpace: 'nowrap' }}>
      {lines.map((l) => <div key={l}>{l}</div>)}
    </div>
  );
}

// ── the page list ──────────────────────────────────────────────────────────

function buildPages(data: PassportData, cover: Cover): PageFn[] {
  const lines = mrz(data);
  const issued = new Date(`${data.joinedOn}T00:00:00Z`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
  const names = data.name.trim().split(/\s+/);
  const surname = names.length > 1 ? names.at(-1)! : names[0];
  const given = names.length > 1 ? names.slice(0, -1).join(' ') : '';
  const totalVisas = data.stamps.reduce((n, s) => n + s.visas.length, 0);
  const pages: PageFn[] = [];

  // 0 — outer cover
  pages.push(() => (
    <Leather cover={cover}>
      <div style={{ position: 'absolute', top: 30, textAlign: 'center', fontFamily: 'var(--font-jost)', fontSize: 7, letterSpacing: '0.46em', fontWeight: 600 }} className="foil">
        WIDE OPEN WORLD
        <div style={{ fontSize: 5.6, letterSpacing: '0.34em', opacity: 0.8, marginTop: 3 }}>A GLOBAL CULTURE CLUB</div>
      </div>
      <div style={{ filter: 'drop-shadow(0 1px 0 rgb(255 255 255 / .22)) drop-shadow(0 -1px 1px rgb(0 0 0 / .6))' }}>
        <WOWLogo size={134} color="url(#wow-foil)" />
      </div>
      <div className="foil" style={{ fontFamily: 'var(--font-jost)', fontSize: 15, fontWeight: 700, letterSpacing: '0.44em', textAlign: 'center', lineHeight: 1.55, marginTop: 8 }}>
        CULTURAL
        <br />
        PASSPORT
      </div>
      {/* biometric-passport chip symbol */}
      <svg width="30" height="20" viewBox="0 0 30 20" aria-hidden style={{ marginTop: 10, filter: 'drop-shadow(0 1px 0 rgb(0 0 0 / .5))' }}>
        <rect x="1" y="1" width="28" height="18" rx="3" fill="none" stroke="url(#wow-foil)" strokeWidth="1.4" />
        <circle cx="15" cy="10" r="3.6" fill="none" stroke="url(#wow-foil)" strokeWidth="1.4" />
        <path d="M15 4v-2M15 18v-2M7 10H5M25 10h-2" stroke="url(#wow-foil)" strokeWidth="1.2" />
      </svg>
      <div style={{ position: 'absolute', bottom: 30, textAlign: 'center', display: 'grid', justifyItems: 'center', gap: 5 }}>
        <img src={flagUrl(data.country.iso2, 80)} alt={data.country.name} style={{ width: data.country.iso2 === 'np' ? 20 : 38, height: 25, objectFit: 'contain', borderRadius: 2, boxShadow: '0 0 0 1px rgb(232 200 114 / .6), 0 2px 6px rgb(0 0 0 / .5)' }} />
        <div className="foil" style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: 19, fontWeight: 700 }}>{data.name}</div>
        <div style={{ fontFamily: 'monospace', fontSize: 7, letterSpacing: '0.16em', opacity: 0.75 }}>{data.passportNumber}</div>
      </div>
      {/* a glint sweeps across the foil every few seconds */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '38%', background: 'linear-gradient(100deg, transparent, rgb(255 255 255 / .28), transparent)', animation: 'cover-shine 6s ease-in-out infinite' }} />
      </div>
    </Leather>
  ));

  // 1 — inside front cover
  pages.push(() => (
    <Leather cover={cover} face="inside">
      <WOWLogo size={64} color="rgb(232 200 114 / .85)" />
      <div style={{ fontFamily: 'var(--font-jost)', fontSize: 8.5, fontWeight: 600, letterSpacing: '0.24em', textAlign: 'center', lineHeight: 2, maxWidth: 190, marginTop: 20, opacity: 0.88 }}>
        THE WORLD IS A BOOK, AND THOSE WHO DO NOT TRAVEL READ ONLY ONE PAGE.
      </div>
      <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 9.5, opacity: 0.6, marginTop: 8 }}>— attributed to St. Augustine</div>
      <div style={{ fontFamily: 'var(--font-jost)', fontSize: 7, letterSpacing: '0.2em', textAlign: 'center', lineHeight: 2.1, marginTop: 24, opacity: 0.6 }}>
        VALID FOR ALL COUNTRIES
        <br />
        ISSUED BY WIDE OPEN WORLD
      </div>
    </Leather>
  ));

  // 2 — holder's page
  pages.push(({ n, left }) => (
    <Paper left={left} tint={cover.b}>
      <img src={flagUrl(data.country.iso2, 320)} alt="" aria-hidden style={{ position: 'absolute', right: -40, top: 140, width: 230, opacity: 0.1, mixBlendMode: 'multiply', transform: 'rotate(-8deg)', filter: 'saturate(1.4)' }} />
      <div style={{ height: 40, background: `linear-gradient(100deg, ${cover.a}, ${cover.b})`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px' }}>
        <span style={{ ...tiny, color: '#f3dd9a' }}>Cultural Passport</span>
        <span style={{ ...tiny, color: '#f3dd9a' }}>Type CP · {data.country.iso3}</span>
      </div>
      <div style={{ padding: '18px 18px 0' }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 78, height: 96, flexShrink: 0, borderRadius: 4, border: `2px solid ${cover.b}`, background: `linear-gradient(160deg, ${shade(cover.b, 0.55)}, ${shade(cover.b, 0.2)})`, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-playfair)', fontSize: 28, fontWeight: 900, color: cover.a, boxShadow: '0 4px 10px -4px rgb(0 0 0 / .5)' }}>
            {initials(data.name)}
          </div>
          <div style={{ display: 'grid', gap: 9, alignContent: 'center' }}>
            <div><div style={tiny}>Surname</div><div style={{ ...typed, fontSize: 14, fontWeight: 700 }}>{surname}</div></div>
            {given && <div><div style={tiny}>Given names</div><div style={{ ...typed, fontSize: 14, fontWeight: 700 }}>{given}</div></div>}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={tiny}>Home country</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
            <img src={flagUrl(data.country.iso2, 40)} alt="" style={{ width: 24, height: 16, objectFit: data.country.iso2 === 'np' ? 'contain' : 'cover', borderRadius: 2, boxShadow: '0 1px 3px rgb(0 0 0 / .3)' }} />
            <span style={{ ...typed, fontSize: 13, fontWeight: 700 }}>{data.country.name}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 15 }}>
          <div style={{ flex: 1 }}><div style={tiny}>Date of issue</div><div style={{ ...typed, fontSize: 12, fontWeight: 700 }}>{issued}</div></div>
          <div style={{ flex: 1 }}><div style={tiny}>Passport no.</div><div style={{ ...typed, fontSize: 12, fontWeight: 700 }}>{data.passportNumber}</div></div>
        </div>
        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.25)', paddingBottom: 6, marginTop: 30 }}>
          <div style={{ fontFamily: 'var(--font-caveat)', fontSize: 26, fontWeight: 700, color: '#1c2a6b', transform: 'rotate(-2deg)', transformOrigin: 'left' }}>{data.name}</div>
          <div style={{ ...tiny, marginTop: 2 }}>Holder&rsquo;s signature</div>
        </div>
      </div>
      <Mrz lines={lines} />
      <PageNo n={n} left={left} />
    </Paper>
  ));

  // 3 — journey overview
  pages.push(({ n, left, active }) => (
    <Paper left={left} tint={cover.b}>
      <div style={{ height: 66, background: `linear-gradient(100deg, ${cover.a}, ${cover.b})`, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 16px' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 16, fontWeight: 700, color: '#f3dd9a' }}>Journey overview</div>
        <div style={{ fontFamily: 'var(--font-jost)', fontSize: 7.5, color: 'rgb(243 221 154 / .75)', marginTop: 3 }}>{data.name} · {data.passportNumber}</div>
      </div>
      <div style={{ padding: '14px 15px', display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {([[totalVisas, 'Visas earned', cover.b], [data.stamps.length, 'Countries', shade(cover.b, -0.15)]] as const).map(([v, l, c]) => (
            <div key={l} style={{ textAlign: 'center', padding: '11px 4px', borderRadius: 8, background: `${c}22`, border: `1px solid ${c}55` }}>
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 30, fontWeight: 900, color: c, lineHeight: 1, transform: active ? 'none' : 'scale(.6)', transition: 'transform .6s cubic-bezier(.3,1.6,.5,1) .2s' }}>{v}</div>
              <div style={{ ...tiny, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ ...tiny, marginBottom: 6 }}>Countries explored</div>
          {[...data.stamps, ...(data.inProgress ? [data.inProgress] : [])].map((s) => (
            <div key={s.number} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '0.5px solid rgba(0,0,0,0.12)', fontFamily: 'var(--font-jost)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700 }}>
                <span style={{ width: 9, height: 9, borderRadius: 99, background: s.accent, boxShadow: `0 0 0 2px ${s.accent}33` }} />
                <img src={flagUrl(s.iso2, 40)} alt="" style={{ width: 17, height: 11, objectFit: 'cover', borderRadius: 1 }} /> {s.country}
              </span>
              <span style={{ fontSize: 8, fontWeight: 700, color: s.accent }}>{data.inProgress?.number === s.number ? '● In progress' : `${s.visas.length} visa${s.visas.length === 1 ? '' : 's'}`}</span>
            </div>
          ))}
          {data.stamps.length === 0 && !data.inProgress && <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 10, opacity: 0.6 }}>Your first stamp is waiting.</div>}
        </div>
      </div>
      <Mrz lines={lines} />
      <PageNo n={n} left={left} />
    </Paper>
  ));

  // visa pages
  const visaPage = (s: PassportStamp, pending: boolean): PageFn => ({ n, left, active }) => {
    const count = s.visas.length;
    const stampSize = count > 2 ? 112 : 128;
    return (
      <Paper left={left} tint={s.accent}>
        <div style={{ position: 'relative', height: 54, background: `linear-gradient(105deg, ${shade(s.accent, -0.35)}, ${s.accent} 55%, ${shade(s.accent, 0.3)})`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', color: '#fff' }}>
          <div>
            <div style={{ ...tiny, color: 'rgb(255 255 255 / .8)' }}>Expedition Nº {String(s.number).padStart(2, '0')} · {s.dateLabel}</div>
            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 19, fontWeight: 800, lineHeight: 1.15, textShadow: '0 1px 0 rgb(0 0 0 / .3)' }}>{s.country}</div>
          </div>
          <img src={flagUrl(s.iso2, 80)} alt="" style={{ width: 34, height: 23, objectFit: s.iso2 === 'np' ? 'contain' : 'cover', borderRadius: 3, boxShadow: '0 2px 6px rgb(0 0 0 / .4)' }} />
        </div>
        {s.silhouette && (
          <svg viewBox="0 0 200 200" aria-hidden style={{ position: 'absolute', left: 38, top: 96, width: 214, height: 214, opacity: 0.22, transform: active ? 'scale(1)' : 'scale(.9)', transition: 'transform 1s ease-out' }}>
            <path d={s.silhouette} fill={s.accent} stroke={shade(s.accent, -0.3)} strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        )}
        <div style={{ position: 'absolute', left: 20, right: 20, top: 66, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 9 }}>
          {s.visas.map((v, i) => (
            <VisaSticker key={`${v.kind}-${v.workTitle}-${i}`} kind={v.kind} country={s.country} number={s.number} workTitle={v.workTitle} awardedOn={v.awardedOn} holder={data.name} passportNumber={data.passportNumber} active={active} delay={150 + i * 230} />
          ))}
          {count === 0 && (
            <div style={{ height: 84, borderRadius: 10, border: `2px dashed ${s.accent}88`, display: 'grid', placeItems: 'center', textAlign: 'center', color: s.accent, animation: 'pulse-ring 3s infinite' }}>
              <div>
                <div style={{ ...tiny, color: s.accent }}>{pending ? 'Expedition in progress' : 'No visas yet'}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 10.5, marginTop: 3, color: 'rgba(0,0,0,.55)' }}>Confirm what you read, watched &amp; attended<br />and your visas appear here.</div>
              </div>
            </div>
          )}
        </div>
        {count > 0 && (
          <div style={{ position: 'absolute', right: 6, bottom: count > 2 ? 22 : 40 }}>
            <Stamp country={s.country} number={s.number} dateLabel={s.issuedOn || s.dateLabel} color={shade(s.accent, -0.42)} size={stampSize} label="Visa granted" active={active} delay={150 + count * 230 + 100} />
          </div>
        )}
        <div style={{ position: 'absolute', left: 20, bottom: 30, maxWidth: 120, display: 'grid', gap: 3 }}>
          {s.book && <div><div style={tiny}>Book</div><div style={{ fontFamily: 'var(--font-playfair)', fontSize: 9.5, fontWeight: 700, lineHeight: 1.2 }}>{s.book.title}</div></div>}
          {s.friend && <div><div style={tiny}>Guided by</div><div style={{ fontFamily: 'var(--font-jost)', fontSize: 9, fontWeight: 600 }}>{s.friend}</div></div>}
        </div>
        <PageNo n={n} left={left} />
      </Paper>
    );
  };
  data.stamps.forEach((s) => pages.push(visaPage(s, false)));
  if (data.inProgress) pages.push(visaPage(data.inProgress, true));

  // always leave room for the next country
  pages.push(({ n, left }) => (
    <Paper left={left} tint={cover.b}>
      <div style={{ position: 'absolute', inset: 26, border: '1.5px dashed rgba(0,0,0,0.18)', borderRadius: 10, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 30, opacity: 0.35 }}>🌍</div>
          <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 11.5, color: 'rgba(0,0,0,0.5)', maxWidth: 150, marginTop: 6 }}>Space reserved for the next country.</div>
        </div>
      </div>
      <PageNo n={n} left={left} />
    </Paper>
  ));
  if (pages.length % 2 === 1) pages.push(({ n, left }) => <Paper left={left} tint={cover.b}><PageNo n={n} left={left} /></Paper>);

  pages.push(() => (
    <Leather cover={cover} face="inside">
      <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12.5, textAlign: 'center', lineHeight: 2, opacity: 0.85 }}>
        &ldquo;More journeys await.
        <br />
        More stories to share.
        <br />
        More worlds to open.&rdquo;
      </div>
    </Leather>
  ));
  pages.push(() => (
    <Leather cover={cover} face="back">
      <WOWLogo size={112} color="url(#wow-foil)" />
      <div className="foil" style={{ marginTop: 20, fontFamily: 'var(--font-jost)', fontSize: 8.5, fontWeight: 700, letterSpacing: '0.34em' }}>END OF PASSPORT</div>
    </Leather>
  ));
  return pages;
}

// ── the book ───────────────────────────────────────────────────────────────

export function PassportBook({ data }: { data: PassportData }) {
  const cover = useMemo(() => coverFor(data.passportNumber), [data.passportNumber]);
  const pages = useMemo(() => buildPages(data, cover), [data, cover]);
  const sheets = pages.length / 2;

  // desktop: number of sheets turned (0 = closed, `sheets` = closed at the back)
  const [turned, setTurned] = useState(0);
  const turnedRef = useRef(0);
  const chain = useRef<ReturnType<typeof setInterval> | null>(null);
  const [flipping, setFlipping] = useState<Record<number, 'fwd' | 'back'>>({});
  const [peek, setPeek] = useState<'l' | 'r' | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const step = (dir: 1 | -1) => {
    const next = Math.max(0, Math.min(sheets, turnedRef.current + dir));
    if (next === turnedRef.current) return false;
    const sheet = dir > 0 ? turnedRef.current : next;
    turnedRef.current = next;
    setTurned(next);
    setFlipping((f) => ({ ...f, [sheet]: dir > 0 ? 'fwd' : 'back' }));
    setTimeout(() => setFlipping((f) => { const c = { ...f }; delete c[sheet]; return c; }), FLIP_MS);
    return true;
  };
  const goTo = (target: number) => {
    if (chain.current) clearInterval(chain.current);
    const run = () => {
      const cur = turnedRef.current;
      if (cur === target || !step(target > cur ? 1 : -1)) {
        if (chain.current) clearInterval(chain.current);
        return;
      }
      if (turnedRef.current === target && chain.current) clearInterval(chain.current);
    };
    run();
    if (turnedRef.current !== target) chain.current = setInterval(run, 170);
  };
  useEffect(() => () => { if (chain.current) clearInterval(chain.current); }, []);

  // phones: one page at a time, with a page-turn animation
  const [single, setSingle] = useState(0);
  const [anim, setAnim] = useState<{ from: number; to: number; dir: 'fwd' | 'back' } | null>(null);
  const [touchX, setTouchX] = useState<number | null>(null);
  const go = (d: number) => {
    if (anim) return;
    const to = Math.max(0, Math.min(pages.length - 1, single + d));
    if (to === single) return;
    setAnim({ from: single, to, dir: d > 0 ? 'fwd' : 'back' });
    setSingle(to);
  };

  const activeDesktop = new Set([2 * turned - 1, 2 * turned]);
  const closedFront = turned === 0;
  const closedBack = turned === sheets;
  const shift = closedFront ? -(PW + GAP) / 2 : closedBack ? (PW + GAP) / 2 : 0;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'Escape') goTo(0);
  };

  const renderSingle = (idx: number, active: boolean) => pages[idx]({ n: idx + 1, left: idx % 2 === 1, active });

  return (
    <>
      {/* shared gold-foil gradient used by the logo and ornaments */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <defs>
          <linearGradient id="wow-foil" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8a6a2a" />
            <stop offset=".25" stopColor="#f7e3a1" />
            <stop offset=".5" stopColor="#c9a052" />
            <stop offset=".75" stopColor="#fff3c4" />
            <stop offset="1" stopColor="#8a6a2a" />
          </linearGradient>
        </defs>
      </svg>

      {/* ───── phones & small tablets ───── */}
      <div className="md:hidden">
        <div className="flex flex-col items-center gap-5">
          <div
            className="passport-single touch-pan-y select-none"
            style={{ width: PW, height: PH, perspective: 1400, position: 'relative' }}
            onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX === null) return;
              const dx = e.changedTouches[0].clientX - touchX;
              if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
              setTouchX(null);
            }}
            onClick={() => single === 0 && go(1)}
          >
            <div style={{ position: 'absolute', inset: 0, boxShadow: '0 24px 50px -16px rgb(0 0 0 / .75)', borderRadius: 4 }}>
              {anim ? (
                <>
                  <div style={{ position: 'absolute', inset: 0 }}>{renderSingle(anim.dir === 'fwd' ? anim.to : anim.from, false)}</div>
                  <div
                    className={`is-flipping ${anim.dir === 'back' ? 'flip-left' : ''}`}
                    style={{ position: 'absolute', inset: 0, transformOrigin: 'left center', zIndex: 2, backfaceVisibility: 'hidden', animation: `${anim.dir === 'fwd' ? 'page-out-fwd 0.8s ease-in' : 'page-in-back 0.8s ease-out'} forwards` }}
                    onAnimationEnd={() => setAnim(null)}
                  >
                    {renderSingle(anim.dir === 'fwd' ? anim.from : anim.to, false)}
                  </div>
                </>
              ) : (
                renderSingle(single, true)
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => go(-1)} disabled={single === 0 || !!anim} aria-label="Previous page" className="grid h-12 w-12 place-items-center rounded-full border border-line-strong text-xl disabled:opacity-30">‹</button>
            <button onClick={() => (single === 0 ? go(1) : setSingle(0))} className="btn btn-ghost !px-5 !py-2.5">{single === 0 ? 'Open passport' : 'Close passport'}</button>
            <button onClick={() => go(1)} disabled={single === pages.length - 1 || !!anim} aria-label="Next page" className="grid h-12 w-12 place-items-center rounded-full border border-line-strong text-xl disabled:opacity-30">›</button>
          </div>
          <p className="text-sm text-ink-faint">{single === 0 ? 'Tap the passport to open it.' : `Page ${single + 1} of ${pages.length} · swipe to turn`}</p>
        </div>
      </div>

      {/* ───── desktop: the real book ───── */}
      <div className="hidden md:block">
        <div className="flex flex-col items-center gap-8 outline-none" tabIndex={0} onKeyDown={onKey} aria-label="Cultural Passport. Use the arrow keys to turn pages.">
          <div
            className="relative"
            style={{ width: PW * 2 + GAP + 80, height: PH + 70 }}
            onPointerMove={(e) => {
              if (!closedFront) return;
              const r = e.currentTarget.getBoundingClientRect();
              setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 2, y: ((e.clientY - r.top) / r.height - 0.5) * 2 });
            }}
            onPointerLeave={() => setTilt({ x: 0, y: 0 })}
          >
            {/* floor shadow */}
            <div aria-hidden style={{ position: 'absolute', left: '50%', bottom: 6, width: closedFront || closedBack ? PW * 0.95 : PW * 2, height: 34, marginLeft: closedFront || closedBack ? -PW * 0.475 : -PW, borderRadius: '50%', background: 'radial-gradient(closest-side, rgb(0 0 0 / .55), transparent)', transition: 'all 1s cubic-bezier(.5,0,.2,1)', animation: closedFront ? 'shadow-breathe 5s ease-in-out infinite' : undefined }} />
            <div style={{ position: 'absolute', left: 40, top: 0, animation: closedFront ? 'book-float 5s ease-in-out infinite' : undefined }}>
              <div style={{ transform: closedFront ? `perspective(1400px) rotateY(${tilt.x * 13}deg) rotateX(${-tilt.y * 9}deg)` : 'none', transition: tilt.x || tilt.y ? 'transform .12s ease-out' : 'transform .6s ease-out' }}>
                <div style={{ width: PW * 2 + GAP, height: PH, position: 'relative', perspective: 2400, transform: `translateX(${shift}px)`, transition: 'transform 1s cubic-bezier(.5,0,.2,1)' }}>
                  {/* page blocks give the book thickness */}
                  <div aria-hidden style={{ position: 'absolute', left: PW + GAP + 4, top: 5, width: PW, height: PH, background: 'repeating-linear-gradient(to bottom, #efe4c9 0 2px, #d9cba8 2px 3px)', borderRadius: 2, opacity: closedBack ? 0 : 1, transition: 'opacity .5s' }} />
                  <div aria-hidden style={{ position: 'absolute', left: -4, top: 5, width: PW, height: PH, background: 'repeating-linear-gradient(to bottom, #efe4c9 0 2px, #d9cba8 2px 3px)', borderRadius: 2, opacity: closedFront ? 0 : 1, transition: 'opacity .5s' }} />

                  {!closedFront && <button aria-label="Previous page" onClick={() => step(-1)} onPointerEnter={() => setPeek('l')} onPointerLeave={() => setPeek(null)} className="absolute inset-y-0 left-0 z-[200] w-1/2 cursor-w-resize" />}
                  {!closedBack && <button aria-label={closedFront ? 'Open the passport' : 'Next page'} onClick={() => step(1)} onPointerEnter={() => setPeek('r')} onPointerLeave={() => setPeek(null)} className="absolute inset-y-0 right-0 z-[200] w-1/2 cursor-e-resize" />}

                  {Array.from({ length: sheets }, (_, i) => {
                    const isTurned = turned > i;
                    const base = isTurned ? -180 : 0;
                    const lift = peek === 'r' && i === turned && !closedBack ? (closedFront ? -16 : -9) : peek === 'l' && i === turned - 1 ? 9 : 0;
                    const fl = flipping[i];
                    return (
                      <div
                        key={i}
                        className={fl ? `is-flipping ${fl === 'back' ? 'flip-left' : ''}` : ''}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: PW + GAP,
                          width: PW,
                          height: PH,
                          transformStyle: 'preserve-3d',
                          transformOrigin: 'left center',
                          transition: `transform ${FLIP_MS}ms cubic-bezier(.45,.05,.2,1)`,
                          transform: `rotateY(${base + lift}deg)`,
                          zIndex: isTurned ? i + 1 : sheets + 10 - i,
                        }}
                      >
                        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', boxShadow: fl ? '0 16px 28px -8px rgb(0 0 0 / .5)' : '0 2px 4px rgb(0 0 0 / .25)', transition: 'box-shadow .4s' }}>{pages[i * 2]({ n: i * 2 + 1, left: false, active: activeDesktop.has(i * 2) })}</div>
                        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', boxShadow: fl ? '0 16px 28px -8px rgb(0 0 0 / .5)' : '0 2px 4px rgb(0 0 0 / .25)', transition: 'box-shadow .4s' }}>{pages[i * 2 + 1]({ n: i * 2 + 2, left: true, active: activeDesktop.has(i * 2 + 1) })}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <button onClick={() => step(-1)} disabled={closedFront} aria-label="Previous page" className="grid h-12 w-12 place-items-center rounded-full border border-line-strong text-xl transition hover:border-accent disabled:opacity-30">‹</button>
            <button onClick={() => goTo(closedFront ? 1 : 0)} className="btn btn-primary">{closedFront ? 'Open passport' : 'Close passport'}</button>
            <button onClick={() => step(1)} disabled={closedBack} aria-label="Next page" className="grid h-12 w-12 place-items-center rounded-full border border-line-strong text-xl transition hover:border-accent disabled:opacity-30">›</button>
          </div>
          <div className="flex items-center gap-2" role="tablist" aria-label="Passport spreads">
            {Array.from({ length: sheets + 1 }, (_, i) => (
              <button key={i} onClick={() => goTo(i)} aria-label={`Spread ${i + 1}`} className={`h-2 rounded-full transition-all ${i === turned ? 'w-7 bg-gold' : 'w-2 bg-line-strong hover:bg-gold/60'}`} />
            ))}
          </div>
          <p className="text-sm text-ink-faint">{closedFront ? 'Hover to tilt it. Click to open.' : 'Click the right page to turn forward, the left to go back. ← → keys work too.'}</p>
        </div>
      </div>
    </>
  );
}
