import { ActionButton, Panel } from '@/components/admin/forms';
import { deleteRecommendations, setRecommendationStatus } from '@/server/admin/actions';
import { adminRecommendations } from '@/server/admin/data';

export const metadata = { title: 'Recommendations' };

const STATUSES = ['new', 'shortlisted', 'archived'] as const;

export default async function AdminRecommendations() {
  const recs = await adminRecommendations();
  return (
    <div className="grid gap-6">
      <h1 className="font-display text-4xl">Recommendations</h1>
      {STATUSES.map((status) => {
        const list = recs.filter((r) => r.status === status);
        return (
          <Panel key={status} title={`${status[0].toUpperCase()}${status.slice(1)} (${list.length})`}>
            {list.length === 0 ? (
              <p className="text-sm text-ink-faint">Nothing here.</p>
            ) : (
              <ul className="grid gap-3">
                {list.map((r) => (
                  <li key={r.id} className="rounded-xl border border-line bg-bg p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="font-display text-xl">{r.country}</div>
                      <div className="text-xs text-ink-faint">{r.submitterName ?? 'Anonymous'} · {new Date(r.createdAt).toLocaleDateString('en-GB')}</div>
                    </div>
                    <div className="mt-1 text-sm text-ink-soft">
                      {r.bookTitle && <div>📖 <em>{r.bookTitle}</em>{r.bookAuthor && ` — ${r.bookAuthor}`}</div>}
                      {r.filmTitle && <div>🎬 <em>{r.filmTitle}</em>{r.filmDirector && ` — ${r.filmDirector}`}</div>}
                    </div>
                    {r.why && <p className="mt-2 text-sm text-ink-soft">{r.why}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {STATUSES.filter((s) => s !== status).map((s) => (
                        <ActionButton key={s} action={setRecommendationStatus} fields={{ id: r.id, status: s }}>
                          Move to {s}
                        </ActionButton>
                      ))}
                      <ActionButton action={deleteRecommendations} fields={{ id: r.id }} confirm="Delete this recommendation?">Delete</ActionButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        );
      })}
    </div>
  );
}
