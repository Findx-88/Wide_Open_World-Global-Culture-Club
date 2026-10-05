'use client';

import dynamic from 'next/dynamic';
import type { WorldData } from '@/lib/world';

const WorldMap = dynamic(() => import('./WorldMap'), { ssr: false, loading: () => <div className="world-stage aspect-[1000/520] w-full animate-pulse rounded-[1.75rem]" /> });

export function WorldMapClient({ data }: { data: WorldData }) {
  return <WorldMap data={data} />;
}
