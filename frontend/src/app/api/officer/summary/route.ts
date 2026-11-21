import { NextResponse } from 'next/server';
import { supabase, envConfigured } from '@/lib/supabase';
import { verifySession, parseSessionCookie } from '@/lib/auth';

async function checkOfficerSession(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const token = parseSessionCookie(cookieHeader);
  const session = token ? await verifySession(token) : null;
  return session && session.role === 'officer' ? session : null;
}

export async function GET(request: Request) {
  const officer = await checkOfficerSession(request);
  if (!officer) {
    return NextResponse.json(
      { error: 'Forbidden: Officer credentials required.' },
      { status: 403 }
    );
  }

  try {
    if (!envConfigured) {
      return NextResponse.json({
        summary: [],
        appOptions: [],
        notifications: [],
      });
    }

    const [sumRes, appsRes, notifRes] = await Promise.all([
      supabase.from('v_application_summary').select('*').order('application_id'),
      supabase
        .from('applications')
        .select('id, profiles(full_name), notifications(notification_number)')
        .order('id'),
      supabase
        .from('notifications')
        .select('id, notification_number, title, vacancies')
        .order('id'),
    ]);

    if (sumRes.error) {
      return NextResponse.json({ error: sumRes.error.message }, { status: 500 });
    }

    const mappedApps = (appsRes.data ?? []).map((a: any) => ({
      id: a.id,
      candidate_name: Array.isArray(a.profiles)
        ? a.profiles[0]?.full_name
        : a.profiles?.full_name,
      notification_number: Array.isArray(a.notifications)
        ? a.notifications[0]?.notification_number
        : a.notifications?.notification_number,
    }));

    return NextResponse.json({
      summary: sumRes.data ?? [],
      appOptions: mappedApps,
      notifications: notifRes.data ?? [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to load officer data.' },
      { status: 500 }
    );
  }
}
