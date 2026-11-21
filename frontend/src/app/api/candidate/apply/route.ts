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
    const { notificationId } = body;

    const notifId = parseInt(notificationId, 10);
    if (isNaN(notifId) || notifId <= 0) {
      return NextResponse.json(
        { error: 'Valid notification ID is required.' },
        { status: 400 }
      );
    }

    if (!envConfigured) {
      return NextResponse.json(
        { error: 'Database environment variables are not configured.' },
        { status: 503 }
      );
    }

    // Security: Application is strictly bound to session.candidateId
    // Candidates cannot submit on behalf of any other candidate ID.
    const { data, error } = await supabase
      .from('applications')
      .insert({
        candidate_id: session.candidateId,
        notification_id: notifId,
      })
      .select('id, status, remarks, applied_on')
      .single();

    if (error) {
      if (
        error.code === '23505' ||
        error.message?.toLowerCase().includes('duplicate') ||
        error.message?.toLowerCase().includes('unique')
      ) {
        return NextResponse.json(
          { error: 'You have already submitted an application for this notification.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: error.message || 'Failed to submit application.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      application: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal error processing application.' },
      { status: 500 }
    );
  }
}
