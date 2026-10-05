import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { geoArea, geoAzimuthalEqualArea, geoCentroid, geoPath } from 'd3-geo';
import { isoOf, parseGeo, rewindForD3, type GeoFeature } from '@/lib/geo';

let features: GeoFeature[] | null = null;
const load = () =>
  (features ??= parseGeo(fs.readFileSync(path.join(process.cwd(), 'public', 'countries.geojson'), 'utf8')).features.map(rewindForD3));
const cache = new Map<string, string | null>();

/**
 * A country's outline as an SVG path in a 0–200 box (equal-area projection centred on the country),
 * used as the watermark on its visa page. Fitted to the biggest landmass so far-flung islands don't shrink it.
 */
export function silhouette(iso2: string): string | null {
  if (cache.has(iso2)) return cache.get(iso2)!;
  const f = load().find((x) => isoOf(x) === iso2);
  let d: string | null = null;
  if (f) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    const parts = (polys as unknown[]).map((c) => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'Polygon' as const, coordinates: c as never } }));
    const biggest = parts.reduce((a, b) => (geoArea(b) > geoArea(a) ? b : a));
    const [lng, lat] = geoCentroid(biggest);
    const projection = geoAzimuthalEqualArea().rotate([-lng, -lat]).fitExtent([[14, 14], [186, 186]], biggest);
    d = geoPath(projection)({ type: 'FeatureCollection', features: parts } as never);
  }
  cache.set(iso2, d);
  return d;
}
