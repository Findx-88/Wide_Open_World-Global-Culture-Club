import Link from 'next/link';
import { Flag } from '@/components/brand';
import { Panel } from '@/components/admin/forms';
import { adminCountries, adminSite } from '@/server/admin/data';
import { formatRange } from '@/lib/time';
import { ExpeditionForm } from './ExpeditionForm';

export const metadata = { title: 'Expeditions' };

export default async function AdminExpeditions() {
  const [site, countries] = await Promise.all([adminSite(), adminCountries()]);
  const list = [...site.expeditions].sort((a, b) => b.number - a.number);
  const nextNumber = Math.max(0, ...site.expeditions.map((e) => e.number)) + 1;

  return (
    <div className="grid gap-6">
      <h1 className="font-display text-4xl">Expeditions</h1>
      <Panel title="All expeditions">
        <ul className="divide-y divide-line">
          {list.map((e) => (
            <li key={e.id}>
              <Link href={`/admin/expeditions/${e.id}`} className="flex flex-wrap items-center gap-4 py-4 hover:text-accent">
                <span className="num w-8 font-display text-2xl text-ink-faint">{String(e.number).padStart(2, '0')}</span>
                <Flag iso2={e.countryIso2} name={e.country.name} className="h-5 w-7" />
                <span className="flex-1">
                  <span className="font-display text-xl">{e.country.name}</span>
                  <span className="block text-sm text-ink-faint">{formatRange(e.startsOn, e.endsOn)} · {e.books.length} book(s) · {e.films.length} film(s) · {e.friends.length} friend(s) · {e.events.length} session(s)</span>
                </span>
                <span className={`chip ${e.status === 'current' ? '!border-gold !text-gold' : ''}`}>{e.published ? e.status : 'draft'}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
      <div id="new">
        <Panel title="New expedition" description="Create it here, then add books, films, friends and meetings on the next screen. Leave it unpublished until it's ready.">
          <ExpeditionForm countries={countries} nextNumber={nextNumber} />
        </Panel>
      </div>
    </div>
  );
}
