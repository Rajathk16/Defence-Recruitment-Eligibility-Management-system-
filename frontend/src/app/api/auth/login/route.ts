import { NextResponse } from 'next/server';
import { signSession, getCookieHeader } from '@/lib/auth';
import { getOfficerAccessCode } from '@/lib/config';
import { supabase, envConfigured } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, code, email } = body;

    // 1. Officer authentication
    if (role === 'officer') {
      const correctCode = getOfficerAccessCode();
      if (!code || String(code).trim() !== String(correctCode).trim()) {
        return NextResponse.json(
          { error: 'Invalid officer access code.' },
          { status: 401 }
        );
      }

      const token = await signSession({
        role: 'officer',
        fullName: 'Recruitment Officer',
      });

      const response = NextResponse.json({
        success: true,
        role: 'officer',
        message: 'Officer authenticated successfully.',
      });

      response.headers.set('Set-Cookie', getCookieHeader(token));
      return response;
    }

    // 2. Candidate authentication
    if (role === 'candidate') {
      // Case A: General candidate portal entry (without specific email upfront)
      if (!email || typeof email !== 'string' || !email.trim()) {
        const token = await signSession({
          role: 'candidate',
        });

        const response = NextResponse.json({
          success: true,
          role: 'candidate',
          message: 'Candidate session established.',
        });

        response.headers.set('Set-Cookie', getCookieHeader(token));
        return response;
      }

      // Case B: Candidate identified with registered email
      const cleanEmail = email.trim().toLowerCase();

      if (!envConfigured) {
        // Fallback for environment without live Supabase credentials
        const token = await signSession({
          role: 'candidate',
          email: cleanEmail,
          fullName: 'Demo Candidate',
          candidateId: 1,
        });

        const response = NextResponse.json({
          success: true,
          role: 'candidate',
          candidate: {
            id: 1,
            email: cleanEmail,
            full_name: 'Demo Candidate',
          },
        });

        response.headers.set('Set-Cookie', getCookieHeader(token));
        return response;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .ilike('email', cleanEmail)
        .eq('role', 'CANDIDATE')
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          { error: 'Database lookup error: ' + error.message },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json(
          { error: 'No candidate profile found with this email. Please register first.' },
          { status: 404 }
        );
      }

      const token = await signSession({
        role: 'candidate',
        candidateId: data.id,
        email: data.email,
        fullName: data.full_name,
      });

      const response = NextResponse.json({
        success: true,
        role: 'candidate',
        candidate: {
          id: data.id,
          email: data.email,
          full_name: data.full_name,
        },
      });

      response.headers.set('Set-Cookie', getCookieHeader(token));
      return response;
    }

    return NextResponse.json(
      { error: 'Invalid role specified. Must be officer or candidate.' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Authentication failed.' },
      { status: 500 }
    );
  }
}
