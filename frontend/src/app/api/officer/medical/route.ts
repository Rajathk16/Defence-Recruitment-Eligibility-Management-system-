import { NextResponse } from 'next/server';
import { supabase, envConfigured } from '@/lib/supabase';
import { verifySession, parseSessionCookie } from '@/lib/auth';

async function checkOfficerSession(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const token = parseSessionCookie(cookieHeader);
  const session = token ? await verifySession(token) : null;
  return session && session.role === 'officer' ? session : null;
}

export async function POST(request: Request) {
  const officer = await checkOfficerSession(request);
  if (!officer) {
    return NextResponse.json(
      { error: 'Forbidden: Officer credentials required.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { applicationId, boardLocation, examDate, status, notes } = body;

    const appId = parseInt(applicationId, 10);
    if (isNaN(appId) || !boardLocation || !examDate || !status) {
      return NextResponse.json(
        { error: 'Application, board location, exam date, and status are mandatory.' },
        { status: 400 }
      );
    }

    if (!['FIT', 'UNFIT', 'PENDING'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be FIT, UNFIT, or PENDING.' },
        { status: 400 }
      );
    }

    if (!envConfigured) {
      return NextResponse.json(
        { error: 'Database environment variables are not configured.' },
        { status: 503 }
      );
    }

    const { error } = await supabase.from('medical_exams').upsert({
      application_id: appId,
      board_location: String(boardLocation).trim(),
      exam_date: examDate,
      status,
      notes: notes ? String(notes).trim() : null,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to record medical exam: ' + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Medical exam result recorded successfully.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Operation failed.' },
      { status: 500 }
    );
  }
}
