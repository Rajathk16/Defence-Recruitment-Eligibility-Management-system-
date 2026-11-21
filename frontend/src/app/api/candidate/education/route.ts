import { NextResponse } from 'next/server';
import { supabase, envConfigured } from '@/lib/supabase';
import { verifySession, parseSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const token = parseSessionCookie(cookieHeader);
    const session = token ? await verifySession(token) : null;

    if (!session || session.role !== 'candidate' || !session.candidateId) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid candidate session required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { level, board, yearPassed, percentage } = body;

    const yr = parseInt(yearPassed, 10);
    const pct = parseFloat(percentage);

    if (!board || isNaN(yr) || isNaN(pct) || pct < 0 || pct > 100) {
      return NextResponse.json(
        { error: 'Valid qualification details (Board, Year, Percentage 0-100) are required.' },
        { status: 400 }
      );
    }

    if (!envConfigured) {
      return NextResponse.json(
        { error: 'Database environment variables are not configured.' },
        { status: 503 }
      );
    }

    // Security: Bound exclusively to session.candidateId
    const { data, error } = await supabase
      .from('education')
      .insert({
        candidate_id: session.candidateId,
        level: level || 'GRADUATION',
        board: String(board).trim(),
        year_passed: yr,
        percentage: pct,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to record education: ' + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      education: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error saving education record.' },
      { status: 500 }
    );
  }
}
