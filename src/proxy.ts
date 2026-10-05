import { NextResponse, type NextRequest } from 'next/server';
import { auth0, auth0Configured } from '@/lib/auth0';

export async function proxy(request: NextRequest) {
  // Until Auth0 is configured the site runs normally with member sign-in switched off.
  if (!auth0Configured()) return NextResponse.next();
  return auth0.middleware(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
