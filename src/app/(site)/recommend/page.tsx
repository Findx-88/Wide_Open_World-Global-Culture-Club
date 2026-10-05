import type { Metadata } from 'next';
import { RecommendForm } from './RecommendForm';

export const metadata: Metadata = { title: 'Recommend a book or film' };

export default async function RecommendPage({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  const { country } = await searchParams;
  return (
    <div className="container-page grid gap-14 pt-36 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <div className="eyebrow">Your voice</div>
        <h1 className="display mt-4">Where should we go next?</h1>
        <p className="lede mt-6">Suggest a book or a film that opened a country up for you. Every suggestion is read by the curators and helps shape future expeditions.</p>
      </div>
      <RecommendForm defaultCountry={country ?? ''} />
    </div>
  );
}
