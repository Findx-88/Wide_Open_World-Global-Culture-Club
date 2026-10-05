import { useId } from 'react';
import type { Expedition } from '@/server/db/schema';

/**
 * Decorative cultural patterns an expedition can choose from (expeditions.pattern).
 * Add a new pattern here + to the schema enum; admins then pick it from a dropdown.
 */
export const PATTERNS: Record<Expedition['pattern'], string> = {
  stars: 'Eight-point stars (girih)',
  lattice: 'Window lattice',
  waves: 'Waves',
  diamonds: 'Diamonds',
  none: 'None',
};

export function Pattern({ name, className = '', opacity = 0.09 }: { name: Expedition['pattern']; className?: string; opacity?: number }) {
  const id = useId().replace(/:/g, '');
  if (name === 'none') return null;
  return (
    <svg className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden="true" style={{ opacity, color: 'var(--accent)' }}>
      <defs>
        {name === 'stars' && (
          <pattern id={id} width="64" height="64" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M32 6 L39 25 L58 32 L39 39 L32 58 L25 39 L6 32 L25 25 Z" />
              <path d="M13.6 13.6 L32 21 L50.4 13.6 L43 32 L50.4 50.4 L32 43 L13.6 50.4 L21 32 Z" />
              <circle cx="32" cy="32" r="4" />
              <path d="M0 0 L6 6 M64 0 L58 6 M0 64 L6 58 M64 64 L58 58" />
            </g>
          </pattern>
        )}
        {name === 'lattice' && (
          <pattern id={id} width="48" height="48" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="4" y="4" width="40" height="40" />
              <rect x="14" y="14" width="20" height="20" />
              <path d="M4 24 H14 M34 24 H44 M24 4 V14 M24 34 V44" />
              <path d="M14 14 L4 4 M34 14 L44 4 M14 34 L4 44 M34 34 L44 44" opacity="0.6" />
            </g>
          </pattern>
        )}
        {name === 'waves' && (
          <pattern id={id} width="56" height="28" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M0 28 A28 28 0 0 1 56 28" />
              <path d="M8 28 A20 20 0 0 1 48 28" />
              <path d="M16 28 A12 12 0 0 1 40 28" />
              <path d="M-28 14 A28 28 0 0 1 28 14 M28 14 A28 28 0 0 1 84 14" opacity="0.5" />
            </g>
          </pattern>
        )}
        {name === 'diamonds' && (
          <pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M20 2 L38 20 L20 38 L2 20 Z" />
              <path d="M20 12 L28 20 L20 28 L12 20 Z" />
            </g>
          </pattern>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
