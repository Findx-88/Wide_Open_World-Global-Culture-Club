'use client';

import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { select } from 'd3-selection';
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { isoOf, parseGeo, rewindForD3, type GeoFeature } from '@/lib/geo';
import { CONTINENTS, continentColor, type WorldData } from '@/lib/world';
import { CountryCard } from './CountryCard';

const W = 1000;
const H = 520;

/**
 * The colourful map: countries by continent, expedition countries outlined in gold with a pulsing marker,
 * a bubble where explorers live, continent filters, zoom/pan, and the same country card as the globe.
 */
export default function WorldMap({ data }: { data: WorldData }) {
  const countries = data.countries;
  const svgRef = useRef<SVGSVGElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [geo, setGeo] = useState<GeoFeature[] | null>(null);
  const [t, setT] = useState({ x: 0, y: 0, k: 1 });
  const kRef = useRef(1);
  const [active, setActive] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const [showExplorers, setShowExplorers] = useState(true);
  const cardHover = useRef(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On phones the map is wider than the screen (swipe sideways); start centred on Europe/Africa.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) * 0.5;
  }, [geo]);

  useEffect(() => {
    let ok = true;
    fetch('/countries.geojson')
      .then(async (r) => parseGeo(await r.text()))
      .then((g) => ok && setGeo(g.features.filter((f) => f.properties.ISO_A2 !== 'AQ').map(rewindForD3)))
      .catch((e) => console.error('[WorldMap]', e));
    return () => {
      ok = false;
    };
  }, []);

  const { paths, project, sphere } = useMemo(() => {
    const projection = geoNaturalEarth1().fitExtent(
      [[8, 8], [W - 8, H - 8]],
      { type: 'Sphere' },
    );
    const path = geoPath(projection);
    return {
      project: (lng: number, lat: number) => projection([lng, lat]) as [number, number],
      sphere: path({ type: 'Sphere' }) ?? '',
      paths: (geo ?? []).map((f) => ({ iso: isoOf(f), name: f.properties.NAME, d: path(f as never) ?? '' })),
    };
  }, [geo]);

  // zoom / pan (wheel needs Ctrl so the page still scrolls; one-finger pan only once zoomed in)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const z = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .translateExtent([[0, 0], [W, H]])
      .extent([[0, 0], [W, H]])
      .filter((e: Event) => {
        const ev = e as WheelEvent & TouchEvent;
        if (e.type === 'wheel') return ev.ctrlKey || ev.metaKey;
        if (e.type.startsWith('touch')) return kRef.current > 1.05 || (ev.touches?.length ?? 0) > 1;
        return !(e as MouseEvent).button;
      })
      .on('zoom', (e) => {
        kRef.current = e.transform.k;
        setT({ x: e.transform.x, y: e.transform.y, k: e.transform.k });
      });
    zoomRef.current = z;
    select(svg).call(z);
    return () => {
      select(svg).on('.zoom', null);
    };
  }, []);

  const zoomBy = (f: number) => svgRef.current && zoomRef.current && select(svgRef.current).call(zoomRef.current.scaleBy, f);
  const reset = () => svgRef.current && zoomRef.current && select(svgRef.current).call(zoomRef.current.transform, zoomIdentity);

  const hover = (iso: string | null) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    if (pinned) return;
    if (iso) setActive(iso);
    else leaveTimer.current = setTimeout(() => !cardHover.current && setActive(null), 450);
  };
  const click = (iso: string | null) => {
    if (iso) {
      setPinned(true);
      setActive(iso);
    } else {
      setPinned(false);
      setActive(null);
    }
  };

  const markers = Object.values(countries).filter((c) => c.expedition && c.lat != null && c.lng != null);
  const dots = Object.values(countries).filter((c) => c.members > 0 && c.lat != null && c.lng != null);
  const country = active ? countries[active] ?? null : null;
  // keep the card on the opposite side of the map from the country being pointed at
  const cardOnRight = !!country && country.lng != null && country.lat != null && project(country.lng, country.lat)[0] * t.k + t.x < W / 2;

  return (
    <div className="world-stage relative overflow-hidden rounded-[1.75rem] border border-line">
      <div ref={scroller} className="overflow-x-auto sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full min-w-[700px] select-none sm:min-w-0"
        role="img"
        aria-label="Interactive world map of Wide Open World expeditions and explorers"
        onClick={(e) => e.target === e.currentTarget && click(null)}
      >
        <defs>
          <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--map-sea-2)" />
            <stop offset="1" stopColor="var(--map-sea)" />
          </linearGradient>
        </defs>
        <g transform={`translate(${t.x} ${t.y}) scale(${t.k})`}>
          <path d={sphere} fill="url(#sea)" onClick={() => click(null)} />
          {paths.map((p, i) => {
            const c = countries[p.iso];
            if (!c) return <path key={`x${i}`} d={p.d} fill="var(--c-antarctica)" opacity={0.5} stroke="var(--map-line)" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />;
            const dim = focus && c.continent !== focus;
            const st = c.expedition?.status;
            return (
              <path
                key={`${i}-${p.iso}`}
                d={p.d}
                className="cursor-pointer transition-[opacity,filter] duration-200 hover:brightness-125"
                style={{ fill: st === 'current' ? 'var(--gold)' : continentColor(c.continent), opacity: dim ? 0.18 : 1 }}
                stroke={st ? 'var(--gold)' : 'var(--map-line)'}
                strokeWidth={st ? 1.6 : 0.6}
                vectorEffect="non-scaling-stroke"
                onPointerEnter={(e) => e.pointerType === 'mouse' && hover(p.iso)}
                onPointerLeave={(e) => e.pointerType === 'mouse' && hover(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  click(p.iso);
                }}
              >
                <title>{c.name}</title>
              </path>
            );
          })}
          {/* the hovered/pinned country is drawn again on top, with a glowing outline */}
          {active && paths.filter((p) => p.iso === active).map((p) => (
            <path key={`a-${p.iso}`} d={p.d} fill="none" stroke="var(--ink)" strokeWidth={2.2} vectorEffect="non-scaling-stroke" pointerEvents="none" style={{ filter: 'drop-shadow(0 0 5px var(--gold))' }} />
          ))}
          {showExplorers && dots.map((c) => {
            const [x, y] = project(c.lng as number, c.lat as number);
            return <circle key={`m-${c.iso2}`} cx={x} cy={y} r={(2.5 + Math.sqrt(c.members) * 1.8) / t.k} fill="var(--gold)" fillOpacity={0.9} stroke="var(--bg)" strokeWidth={1.2 / t.k} pointerEvents="none" />;
          })}
          {markers.filter((c) => c.expedition!.status !== 'completed').map((c) => {
            const [x, y] = project(c.lng as number, c.lat as number);
            return (
              <g key={`e-${c.iso2}`} pointerEvents="none">
                <circle cx={x} cy={y} r={6 / t.k} fill="var(--gold)" className="map-ping" />
                <circle cx={x} cy={y} r={4 / t.k} fill="var(--bg)" stroke="var(--gold)" strokeWidth={2 / t.k} />
              </g>
            );
          })}
        </g>
      </svg>
      </div>

      {!geo && <div className="absolute inset-0 grid place-items-center text-sm text-ink-faint">Drawing the world…</div>}
      <div className="pointer-events-none absolute left-4 top-3 text-[0.68rem] uppercase tracking-[0.18em] text-ink-faint sm:hidden">Swipe to explore</div>

      <div className="absolute right-3 top-3 flex flex-col gap-2">
        {([['+', 'Zoom in', () => zoomBy(1.7)], ['−', 'Zoom out', () => zoomBy(1 / 1.7)], ['⟲', 'Reset view', reset]] as const).map(([label, aria, fn]) => (
          <button key={aria} onClick={fn} aria-label={aria} className="grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-bg/85 text-lg backdrop-blur transition hover:border-accent hover:text-accent">
            {label}
          </button>
        ))}
      </div>

      <CountryCard
        country={country}
        pinned={pinned}
        onClose={() => click(null)}
        onEnter={() => {
          cardHover.current = true;
          if (leaveTimer.current) clearTimeout(leaveTimer.current);
        }}
        onLeave={() => {
          cardHover.current = false;
          if (!pinned) hover(null);
        }}
        className={`absolute top-3 sm:top-auto sm:bottom-20 ${cardOnRight ? 'right-3 sm:right-20' : 'left-3 sm:left-5'}`}
      />

      {/* legend = filters */}
      <div className="relative flex flex-wrap gap-2 border-t border-line px-3 py-3 sm:absolute sm:inset-x-0 sm:bottom-0 sm:border-0 sm:bg-gradient-to-t sm:from-bg/80 sm:to-transparent sm:px-5 sm:pb-3 sm:pt-8">
        {CONTINENTS.map((c) => (
          <button
            key={c}
            onClick={() => setFocus((f) => (f === c ? null : c))}
            aria-pressed={focus === c}
            className={`chip shrink-0 !bg-bg/80 !px-3 !py-1.5 backdrop-blur transition ${focus === c ? '!border-ink !text-ink' : focus ? 'opacity-60' : ''}`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: continentColor(c) }} />
            {c}
          </button>
        ))}
        <button onClick={() => setShowExplorers((s) => !s)} aria-pressed={showExplorers} className={`chip shrink-0 !bg-bg/80 !px-3 !py-1.5 backdrop-blur ${showExplorers ? '!border-gold !text-gold' : ''}`}>
          <span className="h-2.5 w-2.5 rounded-full bg-gold" /> Explorers
        </button>
      </div>
    </div>
  );
}
