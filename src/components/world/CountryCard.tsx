'use client';

import Link from 'next/link';
import { flagUrl } from '@/lib/format';
import { continentColor, type WorldCountry } from '@/lib/world';

const STATUS = { current: 'Expedition happening now', completed: 'We have travelled here', upcoming: 'Coming up on our journey' } as const;

/**
 * The pop-up shown when a country is hovered or tapped on the globe or the map:
 * name · epithet · capital · fun fact · a way into the Library (and the expedition, if there is one).
 */
export function CountryCard({
  country,
  pinned,
  onClose,
  onEnter,
  onLeave,
  className = '',
}: {
  country: WorldCountry | null;
  pinned: boolean;
  onClose: () => void;
  onEnter: () => void;
  onLeave: () => void;
  className?: string;
}) {
  if (!country) return null;
  const exp = country.expedition;
  const accent = continentColor(country.continent);
  return (
    <aside
      key={country.iso2}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      aria-live="polite"
      className={`rise z-20 w-[min(22rem,calc(100%-1.5rem))] overflow-hidden rounded-2xl border border-line-strong bg-bg/90 shadow-2xl backdrop-blur-xl ${className}`}
    >
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${accent}, var(--gold))` }} />
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <img src={flagUrl(country.iso2, 80)} alt="" className={`mt-1 h-7 w-10 shrink-0 rounded-[3px] shadow ${country.iso2 === 'np' ? 'object-contain' : 'object-cover'}`} />
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-2xl leading-tight">{country.name}</h3>
            {country.epithet && <p className="font-display text-base italic leading-snug text-ink-soft">{country.epithet}</p>}
          </div>
          {pinned && (
            <button onClick={onClose} aria-label="Close" className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-line hover:text-ink">
              ✕
            </button>
          )}
        </div>

        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {country.capital && (
            <>
              <dt className="text-ink-faint">Capital</dt>
              <dd className="text-ink">{country.capital}</dd>
            </>
          )}
          {country.languages && (
            <>
              <dt className="text-ink-faint">Language</dt>
              <dd className="truncate text-ink-soft">{country.languages}</dd>
            </>
          )}
        </dl>

        {country.funFact && (
          <p className="mt-3 rounded-xl bg-line px-3 py-2.5 text-sm leading-relaxed text-ink-soft">
            <span className="mr-1.5 text-gold">✦ Did you know?</span>
            {country.funFact}
          </p>
        )}

        {(exp || country.members > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {exp && <span className="chip !border-accent/60 !text-accent">{STATUS[exp.status]}</span>}
            {country.members > 0 && <span className="chip">{country.members} explorer{country.members === 1 ? '' : 's'} from here</span>}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {exp && (
            <Link href={`/expeditions/${exp.slug}`} className="btn btn-primary !px-4 !py-2.5 !text-[0.72rem]">
              Open the expedition
            </Link>
          )}
          {country.books > 0 ? (
            <Link href={`/library#${country.iso2}`} className={`btn !px-4 !py-2.5 !text-[0.72rem] ${exp ? 'btn-ghost' : 'btn-primary'}`}>
              Explore {country.name.length > 14 ? 'the country' : country.name} · {country.books} book{country.books === 1 ? '' : 's'}
            </Link>
          ) : (
            <Link href={`/recommend?country=${encodeURIComponent(country.name)}`} className="btn btn-ghost !px-4 !py-2.5 !text-[0.72rem]">
              Recommend a book from here
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
