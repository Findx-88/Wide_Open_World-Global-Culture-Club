import 'server-only';
import { asc, desc, eq, isNull } from 'drizzle-orm';
import { db, schema } from '../db';
import { requireAdmin } from '../auth';
import { getSite } from '../queries';

const { members, countries, visaAwards, recommendations, auditLog, admins } = schema;

/** Site data (all expeditions incl. unpublished). Admin writes invalidate this cache, so it's always fresh here. */
export async function adminSite() {
  await requireAdmin();
  return getSite();
}

export async function adminCountries() {
  return (await adminSite()).countries.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export async function adminMembers() {
  await requireAdmin();
  const [rows, visaRows] = await db.batch([
    db
      .select({ member: members, countryName: countries.name })
      .from(members)
      .innerJoin(countries, eq(countries.iso2, members.countryIso2))
      .orderBy(desc(members.passportNumber)),
    db.select({ memberId: visaAwards.memberId, expeditionId: visaAwards.expeditionId, kind: visaAwards.kind }).from(visaAwards).where(isNull(visaAwards.revokedAt)),
  ]);
  return rows.map(({ member, countryName }) => ({
    ...member,
    countryName,
    visaExpeditionIds: [...new Set(visaRows.filter((v) => v.memberId === member.id).map((v) => v.expeditionId))],
    visaCount: visaRows.filter((v) => v.memberId === member.id).length,
  }));
}

export async function adminMember(id: number) {
  return (await adminMembers()).find((m) => m.id === id) ?? null;
}

export async function adminRecommendations() {
  await requireAdmin();
  return db.select().from(recommendations).orderBy(desc(recommendations.createdAt));
}

export async function adminActivity(limit = 12) {
  await requireAdmin();
  return db
    .select({ log: auditLog, adminName: admins.name })
    .from(auditLog)
    .leftJoin(admins, eq(admins.id, auditLog.adminId))
    .orderBy(desc(auditLog.id))
    .limit(limit);
}

export async function adminList() {
  await requireAdmin();
  return db.select({ id: admins.id, email: admins.email, name: admins.name, lastLoginAt: admins.lastLoginAt }).from(admins).orderBy(asc(admins.id));
}
