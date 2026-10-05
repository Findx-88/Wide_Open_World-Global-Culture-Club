import { useId } from 'react';
import { flagUrl } from '@/lib/format';

/** The official WOW emblem (globe in a ring with "WIDE OPEN WORLD · A GLOBAL CULTURE CLUB"). */
export function WOWLogo({ size = 80, color = 'currentColor', className }: { size?: number; color?: string; className?: string }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 440 440" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <path id={`la${uid}`} d="M 88,220 A 132,132 0 0,1 352,220 A 132,132 0 0,1 88,220" />
        <path id={`lb${uid}`} d="M 88,220 A 132,132 0 0,0 352,220 A 132,132 0 0,0 88,220" />
      </defs>
      <g fill="none" stroke={color}>
        <circle cx="220" cy="220" r="160" strokeWidth="3" />
        <circle cx="220" cy="220" r="153" strokeWidth="0.9" opacity="0.45" />
        <circle cx="220" cy="220" r="116" strokeWidth="1.4" opacity="0.55" />
        <circle cx="220" cy="220" r="102" strokeWidth="2.4" />
        <ellipse cx="220" cy="220" rx="102" ry="26" strokeWidth="1.05" opacity="0.76" />
        <ellipse cx="220" cy="220" rx="102" ry="52" strokeWidth="0.9" opacity="0.6" />
        <ellipse cx="220" cy="220" rx="102" ry="78" strokeWidth="0.75" opacity="0.46" />
        <ellipse cx="220" cy="220" rx="26" ry="102" strokeWidth="1.05" opacity="0.76" />
        <ellipse cx="220" cy="220" rx="68" ry="102" strokeWidth="0.9" opacity="0.6" />
        <line x1="118" y1="220" x2="322" y2="220" strokeWidth="0.7" opacity="0.46" />
        <line x1="220" y1="118" x2="220" y2="322" strokeWidth="0.7" opacity="0.46" />
      </g>
      <g fill={color}>
        <polygon points="220,57 224,64 220,71 216,64" />
        <polygon points="220,369 224,376 220,383 216,376" />
        <polygon points="88,213 81,220 88,227 95,220" />
        <polygon points="352,213 345,220 352,227 359,220" />
      </g>
      <text fontFamily="var(--font-jost), sans-serif" fontSize="13" fontWeight="500" fill={color} letterSpacing="4.5">
        <textPath href={`#la${uid}`} startOffset="25%" textAnchor="middle">WIDE OPEN WORLD</textPath>
      </text>
      <text fontFamily="var(--font-jost), sans-serif" fontSize="11" fill={color} letterSpacing="3" dy="17">
        <textPath href={`#lb${uid}`} startOffset="25%" textAnchor="middle">A GLOBAL CULTURE CLUB</textPath>
      </text>
      <text x="220" y="225" textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-playfair), Georgia, serif" fontSize="46" fontWeight="700" fill={color} letterSpacing="8">
        WOW
      </text>
    </svg>
  );
}

/** Country flag. Nepal's flag is taller than wide, so it's never cropped. */
export function Flag({ iso2, name, className = 'h-4 w-6', width = 80 }: { iso2: string; name: string; className?: string; width?: 40 | 80 | 160 | 320 }) {
  return (
    <img
      src={flagUrl(iso2, width)}
      alt={`${name} flag`}
      loading="lazy"
      className={`${className} shrink-0 rounded-[3px] ${iso2 === 'np' ? 'object-contain' : 'object-cover'} shadow-[0_1px_4px_rgb(0_0_0/0.35)]`}
    />
  );
}
