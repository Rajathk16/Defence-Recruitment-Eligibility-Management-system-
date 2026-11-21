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
    const { applicationId, writtenMarks, pftScore, interviewScore } = body;

    const appId = parseInt(applicationId, 10);
    const written = parseFloat(writtenMarks);
    const pft = parseFloat(pftScore);
    const interview = parseFloat(interviewScore);

    if (
      isNaN(appId) ||
      isNaN(written) || written < 0 || written > 100 ||
      isNaN(pft) || pft < 0 || pft > 100 ||
      isNaN(interview) || interview < 0 || interview > 100
    ) {
      return NextResponse.json(
        { error: 'Valid application ID and scores between 0 and 100 are required.' },
        { status: 400 }
      );
    }

    if (!envConfigured) {
      return NextResponse.json(
        { error: 'Database environment variables are not configured.' },
        { status: 503 }
      );
    }

    const { error } = await supabase.from('test_scores').upsert({
      application_id: appId,
      written_marks: written,
      pft_score: pft,
      interview_score: interview,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to record scores: ' + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test scores recorded successfully.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Operation failed.' },
      { status: 500 }
    );
  }
}
