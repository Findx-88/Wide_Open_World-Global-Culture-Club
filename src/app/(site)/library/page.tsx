import type { Metadata } from 'next';
import { getLibrary, getPublishedExpeditions } from '@/server/queries';
import { LibraryBrowser, type LibraryBook } from './LibraryBrowser';

export const metadata: Metadata = { title: 'The Library', description: 'A reading list for the whole world — books from every country we hope to visit.' };

export default async function LibraryPage() {
  const [books, expeditions] = await Promise.all([getLibrary(), getPublishedExpeditions()]);
  const expeditionBookIds = new Map(expeditions.flatMap((e) => e.books.map((b) => [b.id, e.slug] as const)));
  const list: LibraryBook[] = books.map((b) => ({
    id: b.id,
    title: b.title,
    creator: b.creator,
    year: b.year,
    coverUrl: b.coverUrl,
    country: b.countryName,
    iso2: b.countryIso2!,
    continent: b.continent,
    featured: b.featured,
    expeditionSlug: expeditionBookIds.get(b.id) ?? null,
  }));
  return (
    <div className="container-page pt-36">
      <div className="max-w-3xl">
        <div className="eyebrow">The Library</div>
        <h1 className="display mt-4">A reading list for the whole world.</h1>
        <p className="lede mt-6">{list.length} books from {new Set(list.map((b) => b.iso2)).size} countries — the shelf our future expeditions are chosen from.</p>
      </div>
      <LibraryBrowser books={list} />
    </div>
  );
}
