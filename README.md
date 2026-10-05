# Wide Open World

Architecture, rules and the visa flow are in `CLAUDE.md`.

## Deploying on Hostinger (Node.js app connected to this Git repo)
1. Environment variables: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`, `CLOUDFLARE_D1_TOKEN`, `SESSION_SECRET`, `CRON_SECRET`
   (and `RESEND_API_KEY` once you want email).
2. Build command `npm run build`, start command `npm run start`, Node 20.9 or newer.
3. Admin lives at `/admin` (create the first admin locally with `npm run admin:create`).

## Turning on email + reminders (when you're ready)
1. Create a free account at resend.com, verify your sending domain, add `RESEND_API_KEY` on the server.
2. Admin → Settings → Email: set *Send from*, *Website address*, then switch **Send emails** on. Use *Emails → Send a test email*.
3. Add a timer that calls the scheduler every ~10 minutes:
   `POST https://YOUR-SITE/api/cron/tick` with header `Authorization: Bearer <CRON_SECRET>`.
   Options: a Hostinger cron job (`curl -X POST -H "Authorization: Bearer …" https://YOUR-SITE/api/cron/tick`),
   or a free Cloudflare Worker with a Cron Trigger doing the same fetch.

## Zoom attendance
Export the participants report from Zoom (Reports → Usage → meeting → Export) and import it under Admin → Calendar → a session → Attendance.
Zoom only reports a participant's email when they signed in or registered; others are matched by name or assigned by hand.
Requires a paid Zoom plan for the report.

## Local setup
Copy `.env.example` to `.env.local` and fill it in (locally you may use `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL` instead of a token), then
`npm install`, `npm run db:migrate`, `npm run admin:create -- you@example.com "Your Name"`, `npm run dev`.

## Member login (Auth0)
1. In the Auth0 dashboard, create a **Regular Web Application**. In its settings add
   **Allowed Callback URLs** `https://YOUR-SITE/auth/callback` (and `http://localhost:3000/auth/callback` for local testing) and
   **Allowed Logout URLs** `https://YOUR-SITE` (and `http://localhost:3000`).
2. Set `APP_BASE_URL` (the site URL), `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` and `AUTH0_SECRET`
   (`openssl rand -hex 32`) in the server environment, then restart. Until all five are set, member login stays switched off.
3. A member can log in once their email is on their membership (Admin → Members → *Members without an email* box, or edit the member).
   Login only lets in an account whose *verified* email matches an active member. Admin login is separate (`/admin/login`).
