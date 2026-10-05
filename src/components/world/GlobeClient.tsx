'use client';

import dynamic from 'next/dynamic';
import type { WorldData } from '@/lib/world';

const Globe = dynamic(() => import('./Globe'), { ssr: false, loading: () => <div className="world-stage h-full w-full animate-pulse" /> });

export function GlobeClient({ data }: { data: WorldData }) {
  return <Globe data={data} />;
}
