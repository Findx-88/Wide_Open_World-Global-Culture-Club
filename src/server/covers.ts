/**
 * Finds cover art without API keys: book covers from Open Library, film posters from Wikipedia.
 * Used by the admin "Find cover" button and by scripts/fetch-covers.ts.
 */
const UA = { 'User-Agent': 'WideOpenWorld/2.0 (https://github.com/Findx-88/Wide-Open-World---Global-Culture-club; cover lookup)' };

async function openLibrarySearch(params: Record<string, string>) {
  const q = new URLSearchParams({ ...params, limit: '5', fields: 'cover_i' });
  const res = await fetch(`https://openlibrary.org/search.json?${q}`, { headers: UA, cache: 'no-store' });
  if (!res.ok) return null;
  const json = (await res.json()) as { docs?: { cover_i?: number }[] };
  const id = json.docs?.find((d) => d.cover_i)?.cover_i;
  return id ? `https://covers.openlibrary.org/b/id/${id}-L.jpg` : null;
}

export async function findBookCover(title: string, author?: string): Promise<string | null> {
  const clean = title.replace(/\s*\(.*?\)\s*/g, ' ').trim();
  const surname = author?.split(/\s+/).pop();
  // Always constrain by author: a title alone ("Snow", "Shame") matches the wrong book too often.
  if (!author) return null;
  return (await openLibrarySearch({ title: clean, author })) || (surname ? await openLibrarySearch({ q: `${clean} ${surname}` }) : null);
}

export async function findFilmPoster(title: string, year?: number | null): Promise<string | null> {
  const q = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `${title} ${year ?? ''} film`.trim(),
    gsrlimit: '1',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '600',
    pilicense: 'any', // film posters are non-free images; the default ("free") hides them
    format: 'json',
    origin: '*',
  });
  const res = await fetch(`https://en.wikipedia.org/w/api.php?${q}`, { headers: UA, cache: 'no-store' });
  if (!res.ok) return null;
  const json = (await res.json()) as { query?: { pages?: Record<string, { thumbnail?: { source: string } }> } };
  const page = Object.values(json.query?.pages ?? {})[0];
  return page?.thumbnail?.source ?? null;
}

export async function findCover(kind: 'book' | 'film', title: string, creator?: string, year?: number | null) {
  try {
    return kind === 'book' ? await findBookCover(title, creator) : await findFilmPoster(title, year);
  } catch {
    return null;
  }
}
