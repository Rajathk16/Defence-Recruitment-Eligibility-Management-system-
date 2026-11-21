import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession, signSession, getCookieHeader, COOKIE_NAME } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySession(sessionCookie) : null;

  // 1. Officer administrative routes protection (Mandatory Admin Authorization)
  const isOfficerRoute =
    pathname.startsWith('/officer') || pathname.startsWith('/notification');

  if (isOfficerRoute) {
    if (!session || session.role !== 'officer') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('error', 'unauthorized_officer');
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 2. Candidate routes access
  const isCandidateRoute =
    pathname.startsWith('/candidate') ||
    pathname.startsWith('/apply') ||
    pathname.startsWith('/application');

  if (isCandidateRoute) {
    // If user already has a candidate session, allow through
    if (session && session.role === 'candidate') {
      return NextResponse.next();
    }

    // If an officer navigates to candidate pages, allow or keep officer session
    if (session && session.role === 'officer') {
      return NextResponse.next();
    }

    // If no session exists yet, automatically initialize a candidate session
    // so candidates and new visitors can seamlessly browse applicant features
    const candidateToken = await signSession({ role: 'candidate' });
    const response = NextResponse.next();
    response.headers.set('Set-Cookie', getCookieHeader(candidateToken));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/officer/:path*',
    '/notification/:path*',
    '/candidate/:path*',
    '/apply/:path*',
    '/application/:path*',
  ],
};
