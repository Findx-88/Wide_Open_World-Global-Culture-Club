import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Flag } from '@/components/brand';
import { ActionButton, Panel, Submit } from '@/components/admin/forms';
import { EventForm } from '@/components/admin/EventForm';
import { LocalTime } from '@/components/LocalTime';
import { createDefaultMeetings, deleteEvent, deleteExpedition, removeExpeditionWork, removeFriend } from '@/server/admin/actions';
import { expeditionProgress } from '@/server/verification/rules';
import { activitiesFor } from '@/server/verification/rules';
import { VerificationPanel } from './VerificationPanel';
import { adminCountries, adminSite } from '@/server/admin/data';
import { ExpeditionForm } from '../ExpeditionForm';
import { FriendForm } from './FriendForm';
import { WorkForm } from './WorkForm';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> };

export default async function AdminExpedition({ params, searchParams }: Props) {
  const id = Number((await params).id);
  const { created } = await searchParams;
  const [site, countries] = await Promise.all([adminSite(), adminCountries()]);
  const e = site.expeditions.find((x) => x.id === id);
  if (!e) notFound();
  const events = site.allEvents.filter((ev) => ev.expeditionId === e.id);
  const progress = await expeditionProgress(e.id);
  const tz = site.settings.default_timezone || 'Asia/Kolkata';

  return (
    <div className="grid gap-6" style={{ ['--accent' as string]: e.accentColor }}>
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/admin/expeditions" className="text-sm text-ink-faint hover:text-accent">← Expeditions</Link>
        <Flag iso2={e.countryIso2} name={e.country.name} className="h-6 w-9" />
        <h1 className="font-display text-4xl">{e.country.name}</h1>
        <span className="chip">No. {String(e.number).padStart(2, '0')} · {e.published ? e.status : 'draft'}</span>
        <Link href={`/expeditions/${e.slug}`} target="_blank" className="ml-auto text-sm text-accent link-underline">View page ↗</Link>
      </div>
      {created && <p className="rounded-xl border border-ok/40 bg-ok/10 p-4 text-sm text-ok">Expedition created. Now add its book, films, friend and meetings below.</p>}

      <Panel title="Details & look">
        <ExpeditionForm expedition={e} countries={countries} nextNumber={e.number} />
      </Panel>

      {(['book', 'film'] as const).map((kind) => {
        const list = kind === 'book' ? e.books : e.films;
        return (
          <Panel key={kind} title={kind === 'book' ? 'Books' : 'Films'} description={kind === 'book' ? 'The main book appears first; add more if the expedition has several.' : 'One featured film, plus any number of extra films grouped by category.'}>
            <ul className="mb-6 grid gap-3">
              {list.map((w) => (
                <li key={w.linkId}>
                  <details className="rounded-xl border border-line bg-bg">
                    <summary className="flex cursor-pointer list-none items-center gap-4 p-3">
                      <div className="aspect-[2/3] w-10 shrink-0 overflow-hidden rounded bg-sunken">{w.coverUrl && <img src={w.coverUrl} alt="" className="h-full w-full object-cover" />}</div>
                      <div className="flex-1">
                        <div className="font-medium">{w.title}</div>
                        <div className="text-sm text-ink-faint">{w.creator}{w.year ? ` · ${w.year}` : ''}{w.category ? ` · ${w.category}` : ''}{w.role === 'primary' ? ' · ★ main' : ''}</div>
                      </div>
                      <span className="text-xs text-ink-faint">Edit ▾</span>
                    </summary>
                    <div className="border-t border-line p-4">
                      <WorkForm expeditionId={e.id} kind={kind} work={w} nextSort={w.sortOrder} />
                      <div className="mt-4 border-t border-line pt-4">
                        <ActionButton action={removeExpeditionWork} fields={{ linkId: w.linkId }} confirm={`Remove “${w.title}” from this expedition?`}>Remove from expedition</ActionButton>
                      </div>
                    </div>
                  </details>
                </li>
              ))}
              {list.length === 0 && <li className="text-sm text-ink-faint">None yet.</li>}
            </ul>
            <details className="rounded-xl border border-dashed border-line-strong p-4" open={list.length === 0}>
              <summary className="cursor-pointer font-medium text-accent">+ Add a {kind}</summary>
              <div className="mt-4">
                <WorkForm expeditionId={e.id} kind={kind} nextSort={list.length} />
              </div>
            </details>
          </Panel>
        );
      })}

      <Panel title="Friends" description="The guest(s) from this country. Each gets a formal invite at /guest-invite?id=…">
        <ul className="mb-6 grid gap-3">
          {e.friends.map((f) => (
            <li key={f.id}>
              <details className="rounded-xl border border-line bg-bg">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-3">
                  <span className="flex-1 font-medium">{f.name} <span className="text-sm font-normal text-ink-faint">· {f.location}</span></span>
                  <Link href={`/guest-invite?id=${f.slug}`} target="_blank" className="text-xs text-accent link-underline">Guest invite ↗</Link>
                  <span className="text-xs text-ink-faint">Edit ▾</span>
                </summary>
                <div className="border-t border-line p-4">
                  <FriendForm expeditionId={e.id} friend={f} countryName={e.country.name} />
                  <div className="mt-4 border-t border-line pt-4">
                    <ActionButton action={removeFriend} fields={{ expeditionId: e.id, friendId: f.id }} confirm={`Remove ${f.name} from this expedition?`}>Remove</ActionButton>
                  </div>
                </div>
              </details>
            </li>
          ))}
          {e.friends.length === 0 && <li className="text-sm text-ink-faint">No friend yet.</li>}
        </ul>
        <details className="rounded-xl border border-dashed border-line-strong p-4" open={e.friends.length === 0}>
          <summary className="cursor-pointer font-medium text-accent">+ Add a friend</summary>
          <div className="mt-4"><FriendForm expeditionId={e.id} countryName={e.country.name} /></div>
        </details>
      </Panel>

      <Panel
        title="Meetings & sessions"
        description="Times are entered in the host's time zone; visitors see them in their own."
        actions={
          events.length === 0 ? (
            <form action={createDefaultMeetings} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="expeditionId" value={e.id} />
              <input type="hidden" name="timezone" value={tz} />
              <input name="time" type="time" defaultValue="17:30" className="field !w-28 !py-1.5" aria-label="Meeting time" />
              <Submit className="btn btn-ghost !px-3 !py-1.5 !text-[0.7rem]">Create the usual 2 meetings</Submit>
            </form>
          ) : null
        }
      >
        <ul className="mb-6 grid gap-3">
          {events.map((ev) => (
            <li key={ev.id}>
              <details className="rounded-xl border border-line bg-bg">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-3">
                  <span className="flex-1">
                    <span className="font-medium">{ev.title}</span>
                    {!ev.published && <span className="ml-2 chip !py-0">hidden</span>}
                    <span className="block text-sm text-ink-faint"><LocalTime iso={ev.startsAt} fallbackZone={ev.hostTimezone} /></span>
                  </span>
                  <span className="text-xs text-ink-faint">Edit ▾</span>
                </summary>
                <div className="border-t border-line p-4">
                  <EventForm event={ev} expeditionId={e.id} defaultTimezone={tz} />
                  <div className="mt-4 border-t border-line pt-4">
                    <ActionButton action={deleteEvent} fields={{ id: ev.id }} confirm={`Delete “${ev.title}”?`}>Delete session</ActionButton>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
        <details className="rounded-xl border border-dashed border-line-strong p-4">
          <summary className="cursor-pointer font-medium text-accent">+ Add a session</summary>
          <div className="mt-4"><EventForm expeditionId={e.id} defaultTimezone={tz} /></div>
        </details>
      </Panel>

      <Panel title="Visas, confirmations & rules" description="Visas are earned, never handed out in bulk: from a member's confirmation, verified attendance, or an admin decision (always with a recorded reason).">
        <VerificationPanel
          expeditionId={e.id}
          rules={{ classVisaEvidence: e.classVisaEvidence, classVisaMinSessions: e.classVisaMinSessions, movieVisaMinFilms: e.movieVisaMinFilms }}
          opened={e.confirmationsOpenedAt}
          hasActivities={activitiesFor(e).length > 0}
          stats={{
            activeMembers: progress.activeMembers,
            withEmail: progress.withEmail,
            requestsOpen: progress.requests.filter((r) => r.status === 'open').length,
            requestsAnswered: progress.requests.filter((r) => r.status === 'answered').length,
            requestsExpired: progress.requests.filter((r) => r.status === 'expired').length,
            awards: { book: progress.awards.filter((a) => a.kind === 'book').length, movie: progress.awards.filter((a) => a.kind === 'movie').length, class: progress.awards.filter((a) => a.kind === 'class').length, legacy: progress.awards.filter((a) => a.kind === 'legacy').length },
          }}
        />
      </Panel>

      <Panel title="Danger zone">
        <ActionButton action={deleteExpedition} fields={{ id: e.id }} confirm={`Delete the ${e.country.name} expedition, its links, sessions and visas? This cannot be undone.`} className="btn !border-danger !px-4 !py-2 !text-[0.7rem] !text-danger border">
          Delete expedition
        </ActionButton>
      </Panel>
    </div>
  );
}
