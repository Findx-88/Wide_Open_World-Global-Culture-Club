import type { Work } from '@/server/db/schema';

/**
 * Book cover / film poster. Falls back to a typographic cover in the expedition's accent colour
 * when no image is known, so nothing ever looks broken.
 */
export function Cover({
  work,
  className = 'w-40',
  priority = false,
}: {
  work: Pick<Work, 'title' | 'creator' | 'coverUrl' | 'kind' | 'year'>;
  className?: string;
  priority?: boolean;
}) {
  const ratio = 'aspect-[2/3]';
  if (work.coverUrl) {
    return (
      <div className={`${className} ${ratio} relative shrink-0 overflow-hidden rounded-md bg-sunken shadow-[0_18px_40px_-12px_rgb(0_0_0/0.6)] ring-1 ring-line`}>
        <img src={work.coverUrl} alt={`${work.title} ${work.kind === 'book' ? 'cover' : 'poster'}`} loading={priority ? 'eager' : 'lazy'} className="h-full w-full object-cover" />
        {work.kind === 'book' && <div className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/35 to-transparent" />}
      </div>
    );
  }
  return (
    <div
      className={`${className} ${ratio} relative flex shrink-0 flex-col justify-between overflow-hidden rounded-md p-4 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.6)] ring-1 ring-line`}
      style={{ background: 'linear-gradient(150deg, color-mix(in srgb, var(--accent) 38%, #0b1310), #070d0a 75%)' }}
      aria-label={`${work.title} by ${work.creator}`}
    >
      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-white/60">{work.kind === 'book' ? 'A novel' : 'A film'}</span>
      <div>
        <div className="font-display text-xl leading-tight text-white">{work.title}</div>
        <div className="mt-2 text-xs text-white/70">{work.creator}</div>
      </div>
      {work.kind === 'book' && <div className="absolute inset-y-0 left-0 w-2 bg-black/30" />}
    </div>
  );
}
