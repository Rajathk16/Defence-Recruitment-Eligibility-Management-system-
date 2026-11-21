import { NextResponse } from 'next/server';
import { verifySession, parseSessionCookie } from '@/lib/auth';

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const token = parseSessionCookie(cookieHeader);

  if (!token) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  const session = await verifySession(token);
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      role: session.role,
      candidateId: session.candidateId ?? null,
      email: session.email ?? null,
      fullName: session.fullName ?? null,
    },
  });
}
