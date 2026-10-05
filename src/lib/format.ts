export const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const flagUrl = (iso2: string, width: 40 | 80 | 160 | 320 = 80) => `https://flagcdn.com/w${width}/${iso2.toLowerCase()}.png`;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** "No. 02" style expedition numbering. */
export const expeditionNo = (n: number) => `No. ${pad2(n)}`;

export function lengthLabel(kind: 'book' | 'film', length: number | null) {
  if (!length) return null;
  return kind === 'book' ? `${length} pages` : `${Math.floor(length / 60)}h ${length % 60}m`;
}
