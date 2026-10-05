import { Auth0Client } from '@auth0/nextjs-auth0/server';

/**
 * Member sign-in via Auth0 (Universal Login). Reads AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET,
 * AUTH0_SECRET and APP_BASE_URL from the environment. Mounts /auth/login, /auth/logout, /auth/callback
 * through src/proxy.ts. Admin auth is separate (server/auth.ts) and never uses this.
 */
export const auth0Configured = () =>
  ['AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET', 'AUTH0_SECRET', 'APP_BASE_URL'].every((k) => !!process.env[k]);

export const auth0 = new Auth0Client({
  signInReturnToPath: '/me',
  authorizationParameters: { scope: 'openid profile email' },
});
