# WOW — Wide Open World

A global book & film club. Every ~2 months the club "visits" one country (an *expedition*): a book, films,
a guest ("friend") from that country and two live Zoom sessions. Members hold a Cultural Passport; visas are
*earned* per expedition (Book / Movie / Class), never handed out for being a member.

## Core principle
Content, schedules, people, rules and links live in the **database** and are managed in `/admin`.
Code owns behaviour, layout, auth and design. If a change would need a code edit every expedition,
it belongs in the DB — never hardcode a country, book, date, member or link in a component.

## Stack
Next.js 16 (App Router, Server Components/Actions) · TypeScript · Tailwind v4 (tokens in `src/app/globals.css`)
· Cloudflare D1 via Drizzle over the HTTP API (`src/server/db/d1.ts`) · Zod · jose (admin session) · three-globe.
Read `node_modules/next/dist/docs/` before using Next APIs — this version differs from older ones.

## Commands
`npm run dev|build|start|typecheck` · `npm run db:generate` (after editing `src/server/db/schema.ts`) →
`npm run db:migrate` · `npm run db:seed` (one-time import) · `npm run admin:create -- email "Name"`
· `npx tsx scripts/query.ts "SELECT …"` (run SQL on D1) · `npx tsx scripts/fetch-covers.ts [--all]`

## Layout
- `src/server/db/schema.ts` — single source of truth for tables; migrations in `drizzle/` (hand-edit a generated migration if data must be copied).
- `src/server/queries.ts` — all public reads (cached 60s; admin writes call `invalidateCache()`).
- `src/server/admin/` — admin mutations (`actions.ts`, `verification-actions.ts`) and admin reads (`data.ts`).
- `src/server/verification/` — **the visa system**: `rules.ts` (what earns a visa), `workflow.ts` (confirmations, reminders, expiry, `tick()`), `attendance.ts` (Zoom report import).
- `src/server/notifications/` — `registry.ts` (types), `templates.ts` (email bodies), `queue.ts` (outbox + prefs), `email.ts` (provider).
- `src/lib/settings.ts` — every admin-editable setting and its default. `src/lib/calendar.ts` — Google/Outlook links + .ics.
- `src/app/(site)` public · `src/app/admin` panel · `src/app/invite` invitations · `src/app/api/cron/tick` scheduler.

## The verification flow (do not shortcut it)
Expedition's last session ends → `tick()` opens confirmations → each member gets a private link (`/confirm/<token>`) →
they answer read/watched/attended → `submitAnswers` records `participation` → `evaluate()` awards visas into `visa_awards`
**with a stored reason** → visa email queued. Attendance imported from a Zoom report can mark the class activity `verified`.
Unanswered requests get reminders on the configured schedule, then `expire`; expired ≠ awarded.
Statuses: unconfirmed · awaiting (reminders pending) · confirmed · declined · verified · expired.

## Rules
- Visas only come from `evaluate()` (auto) or `awardManually()` (admin, mandatory reason). Never bulk-grant visas. Revoking keeps the row.
- Every admin action: `requireAdmin()` first, Zod-validate input, write `audit_log`, then `refresh()`.
- Emails are idempotent via `email_outbox.dedupe_key`; nothing is sent unless Settings → "Send emails" is on AND a provider is configured.
- New notification type: add to `registry.ts` + `templates.ts`, then `enqueue()`; members get the toggle automatically.
- D1 limits: max 100 bound values per statement → use `insertChunked()` for bulk inserts; no interactive transactions → use `db.batch([...])`.
- Expedition status/current expedition derive from dates (admin may pin one). Times are stored UTC; admin enters time + host time zone.
- Styling: Tailwind utilities + CSS tokens; no inline style objects except per-expedition `--accent`. Mobile-first: design for 390px, enhance upward.
- Never expose member emails in public queries. Respect `members.is_public`.

## Auth model
- Admins: password + `wow_admin` cookie (`server/auth.ts`). Members: Auth0 (`@auth0/nextjs-auth0` v4, `lib/auth0.ts` + `proxy.ts` mounting `/auth/*`; `server/member-auth.ts`). Separate from admin; a member session never opens /admin.
- An Auth0 login is accepted only if its **verified** email matches an active `members.email` (enforced in `getMember()`).

## Do not break
- Passport numbers (`WOW-YYYY-NNNN`) and URLs `/invite?uid=`, `/guest-invite?id=`, `/expeditions/<slug>`,
  `/members?uid=` (redirects to `/passport/<n>`): they're in links people already received.
- Legacy visas (`kind='legacy'`, from before verification) are kept and labelled unverified — don't delete them silently.

## Environment (set on Hostinger, never commit `.env*`)
`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`, `CLOUDFLARE_D1_TOKEN` (scoped D1 Edit token), `SESSION_SECRET` (32+ chars),
`CRON_SECRET` (16+ chars), `RESEND_API_KEY` (email), `APP_BASE_URL`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET` (member login), optional `SITE_URL`, `EMAIL_FROM`. Node >= 20.9. Build `npm run build`, start `npm run start`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
