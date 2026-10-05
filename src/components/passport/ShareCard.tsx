'use client';

import { useState } from 'react';
import { flagUrl } from '@/lib/format';
import type { PassportData } from './PassportBook';

/** Square, downloadable "I'm a WOW explorer" card + share links. */
export function ShareCard({ data }: { data: PassportData }) {
  const [copied, setCopied] = useState(false);
  const stamps = [...data.stamps, ...(data.inProgress ? [data.inProgress] : [])].slice(0, 6);
  const link = () => `${window.location.origin}/invite?uid=${data.passportNumber}`;
  const text = 'I’m a cultural explorer with Wide Open World — one country, one book, one film at a time.';

  const download = () => {
    const svg = document.getElementById('wow-share-card');
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${data.name.replace(/\s+/g, '_')}_WOW_Passport.svg` });
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const share = async () => {
    if (navigator.share) await navigator.share({ title: 'My WOW Cultural Passport', text, url: link() }).catch(() => {});
    else {
      await navigator.clipboard.writeText(link());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="card flex flex-col items-center gap-6 p-6">
      <svg id="wow-share-card" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 340" width="300" height="300" className="rounded-lg shadow-2xl">
        <rect width="340" height="340" fill="#0d2618" />
        <rect x="10" y="10" width="320" height="320" fill="none" stroke="#C9A052" strokeWidth="1.5" />
        <rect x="14" y="14" width="312" height="312" fill="none" stroke="#C9A052" strokeWidth="0.5" strokeDasharray="3 3" />
        <g transform="translate(170 104)" fill="none" stroke="#C9A052">
          <circle r="56" strokeWidth="2" />
          <circle r="44" strokeWidth="1.4" />
          <ellipse rx="44" ry="12" strokeWidth="0.8" opacity="0.7" />
          <ellipse rx="44" ry="26" strokeWidth="0.6" opacity="0.5" />
          <ellipse rx="12" ry="44" strokeWidth="0.8" opacity="0.7" />
          <ellipse rx="28" ry="44" strokeWidth="0.6" opacity="0.5" />
          <text y="8" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fontWeight="900" fill="#C9A052" stroke="none" letterSpacing="5">WOW</text>
        </g>
        <text x="170" y="196" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="9.5" fontWeight="700" fill="#C9A052" letterSpacing="4">CULTURAL EXPLORER</text>
        <text x="170" y="228" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="26" fill="#f7f3eb">{data.name}</text>
        <text x="170" y="250" textAnchor="middle" fontFamily="Courier New, monospace" fontSize="10" fill="#C9A052" letterSpacing="1">{data.passportNumber}</text>
        <g transform={`translate(${170 - ((stamps.length - 1) * 44) / 2} 284)`}>
          {stamps.map((s, i) => (
            <g key={s.number} transform={`translate(${i * 44} 0)`}>
              <image href={flagUrl(s.iso2, 80)} x="-14" y="-11" width="28" height="18" preserveAspectRatio="xMidYMid slice" />
              <text y="18" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="6.5" fontWeight="700" fill="#C9A052">{s.country.toUpperCase().slice(0, 11)}</text>
            </g>
          ))}
        </g>
      </svg>
      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={download} className="btn btn-ghost">Download card</button>
        <button onClick={share} className="btn btn-primary">{copied ? 'Link copied ✓' : 'Share my passport'}</button>
      </div>
      <div className="flex gap-4 text-sm text-ink-soft">
        <a className="link-underline" target="_blank" rel="noreferrer" href={`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}%20`} onClick={(e) => ((e.currentTarget.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${link()}`)}`))}>WhatsApp</a>
        <a className="link-underline" target="_blank" rel="noreferrer" href="https://www.facebook.com/" onClick={(e) => ((e.currentTarget.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link())}`))}>Facebook</a>
        <a className="link-underline" target="_blank" rel="noreferrer" href="https://x.com/" onClick={(e) => ((e.currentTarget.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link())}`))}>X</a>
      </div>
    </div>
  );
}
