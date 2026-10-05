import 'server-only';
import type { PassportData, PassportStamp } from '@/components/passport/PassportBook';
import { formatMonthRange } from '@/lib/time';
import { silhouette } from './geo';
import { getCurrentExpedition, getPassport, type ExpeditionView, type PassportExpeditionVisas } from './queries';

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

const toStamp = (e: ExpeditionView, visas: PassportExpeditionVisas['visas']): PassportStamp => ({
  number: e.number,
  country: e.country.name,
  iso2: e.countryIso2,
  accent: e.accentColor,
  dateLabel: formatMonthRange(e.startsOn, e.endsOn),
  issuedOn: visas.length ? fmt(visas.map((v) => v.awardedAt).sort()[0]) : '',
  visas: visas.map((v) => ({ kind: v.kind, workTitle: v.workTitle, awardedOn: fmt(v.awardedAt) })),
  book: e.book ? { title: e.book.title, creator: e.book.creator } : null,
  film: e.film ? { title: e.film.title, creator: e.film.creator } : null,
  friend: e.friends.map((f) => f.name).join(' & ') || null,
  silhouette: silhouette(e.countryIso2),
});

export async function getPassportData(passportNumber: string): Promise<PassportData | null> {
  const [p, current] = await Promise.all([getPassport(passportNumber), getCurrentExpedition()]);
  if (!p) return null;
  const stamped = new Set(p.stamps.map((s) => s.expedition.id));
  return {
    name: p.member.name,
    passportNumber: p.member.passportNumber,
    joinedOn: p.member.joinedOn,
    country: { iso2: p.member.country.iso2, iso3: p.member.country.iso3, name: p.member.country.name },
    stamps: p.stamps.map((s) => toStamp(s.expedition, s.visas)),
    inProgress: current && !stamped.has(current.id) ? toStamp(current, []) : null,
  };
}
