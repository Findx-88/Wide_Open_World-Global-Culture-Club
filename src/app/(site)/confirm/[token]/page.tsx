import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq, and } from 'drizzle-orm';
import { Flag } from '@/components/brand';
import { db, schema } from '@/server/db';
import { getSite } from '@/server/queries';
import { activitiesFor, keys } from '@/server/verification/rules';
import { ConfirmForm } from './ConfirmForm';

export const metadata: Metadata = { title: 'Confirm your visas', robots: { index: false, follow: false } };

type Props = { params: Promise<{ token: string }> };

export default async function ConfirmPage({ params }: Props) {
  const { token } = await params;
  const [row] = await db
    .select({ req: schema.confirmationRequests, member: schema.members })
    .from(schema.confirmationRequests)
    .innerJoin(schema.members, eq(schema.members.id, schema.confirmationRequests.memberId))
    .where(eq(schema.confirmationRequests.token, token));
  if (!row) notFound();

  const site = await getSite();
  const exp = site.expeditions.find((e) => e.id === row.req.expeditionId);
  if (!exp) notFound();
  const parts = await db.select().from(schema.participation).where(and(eq(schema.participation.memberId, row.member.id), eq(schema.participation.expeditionId, exp.id)));
  const statusOf = (key: string) => parts.find((p) => p.targetKey === key)?.status;
  const current = (key: string) => (statusOf(key) === 'confirmed' || statusOf(key) === 'verified' ? ('yes' as const) : statusOf(key) === 'declined' ? ('no' as const) : null);
  const acts = activitiesFor(exp);
  const first = row.member.name.split(' ')[0];

  return (
    <div className="container-page max-w-3xl pt-32" style={{ ['--accent' as string]: exp.accentColor }}>
      <div className="eyebrow flex items-center gap-2">
        Expedition {String(exp.number).padStart(2, '0')} <Flag iso2={exp.countryIso2} name={exp.country.name} className="h-3.5 w-5" />
      </div>
      <h1 className="display mt-3 !text-[clamp(2.4rem,6vw,4.2rem)]">How was {exp.country.name}, {first}?</h1>

      {row.req.status === 'expired' ? (
        <div className="card mt-10 p-8">
          <h2 className="font-display text-2xl">This confirmation window has closed.</h2>
          <p className="mt-3 text-ink-soft">We only ask for a limited time so that visas always reflect what members really did. If you’d still like your {exp.country.name} visas, please message the club and an admin can reopen it.</p>
          <Link href="/" className="btn btn-ghost mt-6">Back to the site</Link>
        </div>
      ) : (
        <>
          <p className="lede mt-5">Tell us what you did and we’ll stamp your Cultural Passport. A visa is only awarded for what you confirm.</p>
          <div className="mt-10">
            <ConfirmForm
              token={token}
              passportNumber={row.member.passportNumber}
              books={acts.filter((a) => a.kind === 'book').map((a) => ({ id: a.workId!, title: a.work!.title, creator: a.work!.creator, year: a.work!.year, coverUrl: a.work!.coverUrl, kind: 'book' as const, current: current(a.targetKey), locked: statusOf(a.targetKey) === 'verified' }))}
              films={acts.filter((a) => a.kind === 'movie').map((a) => ({ id: a.workId!, title: a.work!.title, creator: a.work!.creator, year: a.work!.year, coverUrl: a.work!.coverUrl, kind: 'film' as const, current: current(a.targetKey), locked: statusOf(a.targetKey) === 'verified' }))}
              hasClass={acts.some((a) => a.kind === 'class')}
              classCurrent={current(keys.class(exp.id))}
              classLocked={statusOf(keys.class(exp.id)) === 'verified'}
            />
          </div>
        </>
      )}
    </div>
  );
}
