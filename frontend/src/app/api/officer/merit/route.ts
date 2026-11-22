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

    // 1. Fetch notification details for vacancies
    const { data: notif, error: notifErr } = await supabase
      .from('notifications')
      .select('id, notification_number, title, vacancies')
      .eq('id', notifId)
      .single();

    if (notifErr || !notif) {
      return NextResponse.json(
        { error: 'Notification not found.' },
        { status: 404 }
      );
    }

    // 2. Fetch eligible applications with scores & medical status
    const { data: apps, error: fetchErr } = await supabase
      .from('applications')
      .select(`
        id,
        candidate_id,
        status,
        profiles (full_name),
        test_scores (written_marks, pft_score, interview_score),
        medical_exams (status)
      `)
      .eq('notification_id', notif.id)
      .in('status', ['ELIGIBLE', 'SELECTED']);

    if (fetchErr) {
      return NextResponse.json(
        { error: 'Failed to fetch candidate applications: ' + fetchErr.message },
        { status: 500 }
      );
    }

    if (!apps || apps.length === 0) {
      return NextResponse.json({
        rankedList: [],
        message: 'No eligible applications found for this notification.',
      });
    }

    const validApplicants: Array<{
      application_id: number;
      full_name: string;
      score: number;
      rank: number;
      is_selected: boolean;
    }> = [];

    for (const app of apps as any[]) {
      const med = Array.isArray(app.medical_exams)
        ? app.medical_exams[0]
        : app.medical_exams;
      if (med?.status === 'UNFIT') continue;

      const ts = Array.isArray(app.test_scores)
        ? app.test_scores[0]
        : app.test_scores;
      if (
        !ts ||
        ts.written_marks == null ||
        ts.pft_score == null ||
        ts.interview_score == null
      ) {
        continue;
      }

      // Preserved exact formula: composite = (written * 0.4) + (pft * 0.2) + (interview * 0.4)
      const score =
        Math.round(
          (Number(ts.written_marks) * 0.4 +
            Number(ts.pft_score) * 0.2 +
            Number(ts.interview_score) * 0.4) *
            100
        ) / 100;

      const name = Array.isArray(app.profiles)
        ? app.profiles[0]?.full_name
        : app.profiles?.full_name;

      validApplicants.push({
        application_id: app.id,
        full_name: name || `Applicant #${app.id}`,
        score,
        rank: 0,
        is_selected: false,
      });
    }

    if (validApplicants.length === 0) {
      return NextResponse.json({
        rankedList: [],
        message: 'No candidates with complete scores and fit medical status.',
      });
    }

    // Sort descending by composite score
    validApplicants.sort((a, b) => b.score - a.score);

    // Apply dense ranking
    let rank = 1;
    for (let i = 0; i < validApplicants.length; i++) {
      if (i > 0 && validApplicants[i].score < validApplicants[i - 1].score) {
        rank++;
      }
      validApplicants[i].rank = rank;
      validApplicants[i].is_selected = rank <= notif.vacancies;
    }

    const appIds = validApplicants.map((v) => v.application_id);

    // BUG-16 FIX: use a sequential approach with error recovery to maximize consistency.
    // Note: Supabase JS client does not support multi-statement transactions directly.
    // For true atomicity, consider a Supabase RPC/stored procedure in production.

    // Step 1: Clear old merit list records for these applications
    const { error: deleteErr } = await supabase
      .from('merit_list')
      .delete()
      .in('application_id', appIds);

    if (deleteErr) {
      return NextResponse.json(
        { error: 'Failed to clear old merit list: ' + deleteErr.message },
        { status: 500 }
      );
    }

    // Insert new merit rows
    const meritRows = validApplicants.map((v) => ({
      application_id: v.application_id,
      composite_score: v.score,
      rank_order: v.rank,
      is_selected: v.is_selected,
    }));

    const { error: insertErr } = await supabase.from('merit_list').insert(meritRows);
    if (insertErr) {
      return NextResponse.json(
        { error: 'Failed to record merit list: ' + insertErr.message },
        { status: 500 }
      );
    }

    // Step 3: Update application statuses based on selection
    const selectedIds = validApplicants
      .filter((v) => v.is_selected)
      .map((v) => v.application_id);
    if (selectedIds.length > 0) {
      await supabase.from('applications').update({ status: 'SELECTED' }).in('id', selectedIds);
    }

    const unselectedIds = validApplicants
      .filter((v) => !v.is_selected)
      .map((v) => v.application_id);
    if (unselectedIds.length > 0) {
      await supabase.from('applications').update({ status: 'ELIGIBLE' }).in('id', unselectedIds);
    }

    return NextResponse.json({
      success: true,
      rankedList: validApplicants,
      message: `Merit list successfully generated. ${validApplicants.length} candidate(s) ranked, ${selectedIds.length} selected for ${notif.vacancies} vacancies.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to generate merit list.' },
      { status: 500 }
    );
  }
}
