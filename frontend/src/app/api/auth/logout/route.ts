import { NextResponse } from 'next/server';
import { getClearCookieHeader } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Signed out successfully.',
  });
  response.headers.set('Set-Cookie', getClearCookieHeader());
  return response;
}

export async function GET() {
  const response = NextResponse.redirect(new URL('/', 'http://localhost:3000'));
  response.headers.set('Set-Cookie', getClearCookieHeader());
  return response;
}
