import { NextResponse } from 'next/server';
import { supabase, envConfigured } from '@/lib/supabase';
import { verifySession, parseSessionCookie } from '@/lib/auth';

async function checkOfficerSession(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const token = parseSessionCookie(cookieHeader);
  const session = token ? await verifySession(token) : null;
  return session && session.role === 'officer' ? session : null;
}

// GET: active notifications & branches (also accessible for public/candidate reading)
export async function GET(request: Request) {
  try {
    if (!envConfigured) {
      return NextResponse.json({ notifications: [], branches: [] });
    }

    const [notifRes, branchRes] = await Promise.all([
      supabase
        .from('notifications')
        .select('*, branches(name), eligibility_rules(*)')
        .order('id', { ascending: true }),
      supabase.from('branches').select('id, code, name').order('id'),
    ]);

    if (notifRes.error) {
      return NextResponse.json(
        { error: notifRes.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      notifications: notifRes.data ?? [],
      branches: branchRes.data ?? [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to retrieve notifications.' },
      { status: 500 }
    );
  }
}

// POST: Add new notification (Officer only)
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
    const {
      notificationNumber,
      branchId,
      title,
      vacancies,
      cutoffDate,
      lastDate,
      minAge,
      maxAge,
      minHeightCm,
      minPercentage,
      unmarriedOnly,
    } = body;

    if (!notificationNumber || !branchId || !title || !vacancies || !cutoffDate || !lastDate) {
      return NextResponse.json(
        { error: 'All notification details are required.' },
        { status: 400 }
      );
    }

    const vac = parseInt(vacancies, 10);
    const bId = parseInt(branchId, 10);
    if (isNaN(vac) || vac <= 0 || isNaN(bId)) {
      return NextResponse.json(
        { error: 'Invalid vacancies count or branch selection.' },
        { status: 400 }
      );
    }

    const minA = parseFloat(minAge);
    const maxA = parseFloat(maxAge);
    const minH = parseFloat(minHeightCm);
    const minP = parseFloat(minPercentage);

    if (isNaN(minA) || isNaN(maxA) || isNaN(minH) || isNaN(minP)) {
      return NextResponse.json(
        { error: 'Eligibility criteria numbers are invalid.' },
        { status: 400 }
      );
    }

    if (!envConfigured) {
      return NextResponse.json(
        { error: 'Database environment variables are not configured.' },
        { status: 503 }
      );
    }

    // 1. Insert notification
    const { data: notifData, error: notifErr } = await supabase
      .from('notifications')
      .insert({
        notification_number: String(notificationNumber).trim(),
        branch_id: bId,
        title: String(title).trim(),
        vacancies: vac,
        cutoff_date: cutoffDate,
        last_date: lastDate,
      })
      .select('id')
      .single();

    if (notifErr) {
      return NextResponse.json(
        { error: notifErr.message },
        { status: 400 }
      );
    }

    const notifId = notifData.id;

    // 2. Insert eligibility rules
    const { error: ruleErr } = await supabase
      .from('eligibility_rules')
      .insert({
        notification_id: notifId,
        min_age: minA,
        max_age: maxA,
        min_height_cm: minH,
        min_percentage: minP,
        unmarried_only: Boolean(unmarriedOnly),
      });

    if (ruleErr) {
      await supabase.from('notifications').delete().eq('id', notifId);
      return NextResponse.json(
        { error: 'Failed to save eligibility rules: ' + ruleErr.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      notificationId: notifId,
      message: 'Notification and eligibility rules created successfully.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Operation failed.' },
      { status: 500 }
    );
  }
}

// PUT: Edit existing notification (Officer only)
export async function PUT(request: Request) {
  const officer = await checkOfficerSession(request);
  if (!officer) {
    return NextResponse.json(
      { error: 'Forbidden: Officer credentials required.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      id,
      title,
      vacancies,
      lastDate,
      minAge,
      maxAge,
      minHeightCm,
      minPercentage,
      unmarriedOnly,
    } = body;

    const notifId = parseInt(id, 10);
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

    // 1. Update notification fields
    const { error: notifErr } = await supabase
      .from('notifications')
      .update({
        title: String(title).trim(),
        vacancies: parseInt(vacancies, 10),
        last_date: lastDate,
      })
      .eq('id', notifId);

    if (notifErr) {
      return NextResponse.json({ error: notifErr.message }, { status: 400 });
    }

    // 2. Upsert eligibility rules
    const { error: ruleErr } = await supabase
      .from('eligibility_rules')
      .upsert({
        notification_id: notifId,
        min_age: parseFloat(minAge),
        max_age: parseFloat(maxAge),
        min_height_cm: parseFloat(minHeightCm),
        min_percentage: parseFloat(minPercentage),
        unmarried_only: Boolean(unmarriedOnly),
      });

    if (ruleErr) {
      return NextResponse.json({ error: ruleErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification updated successfully.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Operation failed.' },
      { status: 500 }
    );
  }
}
