import { NextResponse } from 'next/server';
import { supabase, envConfigured } from '@/lib/supabase';
import { verifySession, parseSessionCookie } from '@/lib/auth';

export async function GET(request: Request) {
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

    if (!envConfigured) {
      return NextResponse.json({ applications: [] });
    }

    // Security: Retrieve ONLY applications owned by this candidate
    const { data: appData, error: appErr } = await supabase
      .from('applications')
      .select('id')
      .eq('candidate_id', session.candidateId);

    if (appErr) {
      return NextResponse.json(
        { error: 'Failed to retrieve candidate applications: ' + appErr.message },
        { status: 500 }
      );
    }

    const appIds = (appData ?? []).map((a) => a.id);
    if (appIds.length === 0) {
      return NextResponse.json({ applications: [] });
    }

    const { data: sumData, error: sumErr } = await supabase
      .from('v_application_summary')
      .select('*')
      .in('application_id', appIds)
      .order('application_id', { ascending: false });

    if (sumErr) {
      return NextResponse.json(
        { error: 'Failed to retrieve application summary: ' + sumErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      applications: sumData ?? [],
      candidate: {
        id: session.candidateId,
        email: session.email,
        fullName: session.fullName,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error fetching applications.' },
      { status: 500 }
    );
  }
}
