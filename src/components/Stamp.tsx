import { useId, type CSSProperties } from 'react';

/**
 * A rubber ink stamp. The ink is deliberately imperfect (warped edges, worn speckle) and it "slams" onto the
 * page when `active` flips to true. Shape and tilt vary with the expedition number so no two pages look alike.
 */
export function Stamp({
  country,
  number,
  dateLabel,
  color,
  size = 150,
  faded = false,
  label = 'Visa granted',
  active = true,
  delay = 0,
}: {
  country: string;
  number: number;
  dateLabel: string;
  color: string;
  size?: number;
  faded?: boolean;
  label?: string;
  active?: boolean;
  delay?: number;
}) {
  const id = useId().replace(/:/g, '');
  const shape = number % 3;
  const tilt = ((number * 37) % 21) - 10;
  const name = country.toUpperCase();
  const nameSize = name.length > 14 ? 11.5 : name.length > 11 ? 13.5 : name.length > 8 ? 16 : 20;

  const style: CSSProperties = {
    ['--tilt' as string]: `${tilt}deg`,
    color,
    mixBlendMode: 'multiply',
    opacity: active ? undefined : 0,
    animation: active ? `stamp-slam 0.75s ${delay}ms cubic-bezier(0.2, 0.85, 0.3, 1) both` : undefined,
    transform: `rotate(${tilt}deg)`,
  };

  return (
    <div className="stamp-wrap relative inline-block" style={{ width: size, height: size }}>
      <svg viewBox="0 0 160 160" width={size} height={size} style={style} role="img" aria-label={`${country} stamp, expedition ${number}`} className={faded ? 'opacity-40' : ''}>
        <defs>
          <filter id={`ink${id}`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed={number + 3} result="warp" />
            <feDisplacementMap in="SourceGraphic" in2="warp" scale="2.6" result="shape" />
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed={number + 11} result="grain" />
            <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.2 0 0 0 -0.42" result="wear" />
            <feComposite in="shape" in2="wear" operator="in" />
          </filter>
          <path id={`arc${id}`} d="M 80,80 m -57,0 a 57,57 0 1,1 114,0 a 57,57 0 1,1 -114,0" />
        </defs>
        <g filter={`url(#ink${id})`} fill="none" stroke="currentColor">
          {shape === 0 && (
            <>
              <circle cx="80" cy="80" r="74" strokeWidth="3.4" />
              <circle cx="80" cy="80" r="67" strokeWidth="1.1" />
              <circle cx="80" cy="80" r="44" strokeWidth="1.1" strokeDasharray="3 3" />
              <text fill="currentColor" stroke="none" fontSize="9" fontWeight="700" letterSpacing="3" fontFamily="var(--font-jost), sans-serif">
                <textPath href={`#arc${id}`}>• WIDE OPEN WORLD • {label.toUpperCase()} •</textPath>
              </text>
            </>
          )}
          {shape === 1 && (
            <>
              <rect x="8" y="26" width="144" height="108" rx="10" strokeWidth="3.4" />
              <rect x="15" y="33" width="130" height="94" rx="6" strokeWidth="1.1" />
              <text x="80" y="50" textAnchor="middle" fill="currentColor" stroke="none" fontSize="9" fontWeight="700" letterSpacing="3" fontFamily="var(--font-jost), sans-serif">
                WIDE OPEN WORLD
              </text>
            </>
          )}
          {shape === 2 && (
            <>
              <polygon points="52,6 108,6 154,52 154,108 108,154 52,154 6,108 6,52" strokeWidth="3.4" />
              <polygon points="55,14 105,14 146,55 146,105 105,146 55,146 14,105 14,55" strokeWidth="1.1" />
              <text x="80" y="42" textAnchor="middle" fill="currentColor" stroke="none" fontSize="9" fontWeight="700" letterSpacing="3" fontFamily="var(--font-jost), sans-serif">
                {label.toUpperCase()}
              </text>
            </>
          )}
          <text x="80" y={shape === 1 ? 86 : 84} textAnchor="middle" fill="currentColor" stroke="none" fontSize={nameSize} fontWeight="800" letterSpacing="1.4" fontFamily="var(--font-playfair), Georgia, serif">
            {name}
          </text>
          <text x="80" y={shape === 1 ? 104 : 102} textAnchor="middle" fill="currentColor" stroke="none" fontSize="8.5" letterSpacing="1.5" fontFamily="var(--font-special-elite), monospace">
            EXPEDITION Nº {String(number).padStart(2, '0')}
          </text>
          <text x="80" y={shape === 1 ? 118 : 116} textAnchor="middle" fill="currentColor" stroke="none" fontSize="8" letterSpacing="1" fontFamily="var(--font-special-elite), monospace">
            {dateLabel.toUpperCase()}
          </text>
        </g>
      </svg>
      {/* the "thud" ring that radiates from the point of impact */}
      {active && <span aria-hidden className="stamp-thud pointer-events-none absolute inset-[18%] rounded-full border-2" style={{ borderColor: color, animation: `stamp-thud 0.7s ${delay + 280}ms ease-out both` }} />}
    </div>
  );
}
