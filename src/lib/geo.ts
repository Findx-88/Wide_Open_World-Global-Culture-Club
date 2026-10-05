/** Small GeoJSON helpers shared by the server (passport silhouettes) and the client (globe hit-testing, SVG map). */
export type Ring = number[][];
export type GeoFeature = {
  type: 'Feature';
  properties: { ISO_A2: string; NAME: string; CONTINENT?: string; [k: string]: unknown };
  bbox?: number[];
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: Ring[] | Ring[][] };
};
export type GeoCollection = { type: 'FeatureCollection'; features: GeoFeature[] };

const NAME_TO_ISO: Record<string, string> = { France: 'fr', Norway: 'no', 'N. Cyprus': 'cy', Somaliland: 'so', Kosovo: 'xk' };

/** Lower-case ISO-2 for a feature (Natural Earth marks a few as -99). */
export function isoOf(f: GeoFeature): string {
  const iso = f.properties.ISO_A2;
  return (iso && iso !== '-99' ? iso : NAME_TO_ISO[f.properties.NAME] ?? '').toLowerCase();
}

/** Shoelace area in lon/lat degrees (positive = counter-clockwise, y pointing north). */
const signedArea = (ring: Ring) => {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  return a / 2;
};

/**
 * d3-geo wants exterior rings clockwise and holes counter-clockwise (the opposite of the GeoJSON spec),
 * otherwise a country renders as "everything except the country". This normalises the winding.
 */
export function rewindForD3(f: GeoFeature): GeoFeature {
  const fix = (poly: Ring[]) => poly.map((ring, i) => ((i === 0 ? signedArea(ring) > 0 : signedArea(ring) < 0) ? [...ring].reverse() : ring));
  const g = f.geometry;
  return {
    ...f,
    geometry: g.type === 'Polygon' ? { type: 'Polygon', coordinates: fix(g.coordinates as Ring[]) } : { type: 'MultiPolygon', coordinates: (g.coordinates as Ring[][]).map(fix) },
  };
}

function inRing(lng: number, lat: number, ring: Ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Does this country contain the point? (planar test in lon/lat — Natural Earth is split at the antimeridian) */
export function containsLonLat(f: GeoFeature, lng: number, lat: number) {
  const b = f.bbox;
  if (b && (lng < b[0] || lng > b[2] || lat < b[1] || lat > b[3])) return false;
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates as Ring[]] : (f.geometry.coordinates as Ring[][]);
  return polys.some((poly) => inRing(lng, lat, poly[0]) && !poly.slice(1).some((hole) => inRing(lng, lat, hole)));
}

export function parseGeo(text: string): GeoCollection {
  return JSON.parse(text.replace(/^\uFEFF/, '')) as GeoCollection;
}

/** "#rrggbb" → "rgba(r,g,b,a)" */
export function rgba(hex: string, a: number) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Mix a hex colour toward white (amount 0..1) or black (negative); returns a hex colour. */
export function shade(hex: string, amount: number) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const mix = (c: number) => Math.max(0, Math.min(255, Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount))));
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => mix(c).toString(16).padStart(2, '0')).join('');
}
