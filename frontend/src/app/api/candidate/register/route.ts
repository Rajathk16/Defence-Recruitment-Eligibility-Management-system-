import { NextResponse } from 'next/server';
import { supabase, envConfigured } from '@/lib/supabase';
import { signSession, getCookieHeader } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      dob,
      gender,
      maritalStatus,
      state,
      heightCm,
      weightKg,
      chestNormalCm,
      chestExpandedCm,
      level,
      board,
      yearPassed,
      percentage,
    } = body;

    // Validation
    if (!fullName || !email || !dob || !gender || !maritalStatus || !state) {
      return NextResponse.json(
        { error: 'All personal profile fields are mandatory.' },
        { status: 400 }
      );
    }

    const height = parseFloat(heightCm);
    const weight = parseFloat(weightKg);
    if (isNaN(height) || height < 130 || height > 230) {
      return NextResponse.json(
        { error: 'Height must be between 130 and 230 cm.' },
        { status: 400 }
      );
    }
    if (isNaN(weight) || weight < 35 || weight > 150) {
      return NextResponse.json(
        { error: 'Weight must be between 35 and 150 kg.' },
        { status: 400 }
      );
    }

    const chestNorm = chestNormalCm ? parseFloat(chestNormalCm) : null;
    const chestExp = chestExpandedCm ? parseFloat(chestExpandedCm) : null;
    if (chestNorm !== null && chestExp !== null && chestExp < chestNorm) {
      return NextResponse.json(
        { error: 'Expanded chest cannot be less than normal chest measurement.' },
        { status: 400 }
      );
    }

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

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Insert into profiles - Security: role is HARDCODED to 'CANDIDATE'
    const { data: profData, error: profErr } = await supabase
      .from('profiles')
      .insert({
        full_name: String(fullName).trim(),
        email: cleanEmail,
        dob,
        gender,
        marital_status: maritalStatus,
        state: String(state).trim(),
        role: 'CANDIDATE', // Role self-escalation prevented
      })
      .select('id, full_name, email')
      .single();

    if (profErr) {
      if (profErr.code === '23505' || profErr.message?.includes('unique')) {
        return NextResponse.json(
          { error: 'A profile with this email address already exists.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Profile creation failed: ' + profErr.message },
        { status: 500 }
      );
    }

    const candidateId = profData.id;

    // 2. Insert into physical_details
    const { error: physErr } = await supabase
      .from('physical_details')
      .insert({
        candidate_id: candidateId,
        height_cm: height,
        weight_kg: weight,
        chest_normal_cm: chestNorm,
        chest_expanded_cm: chestExp,
      });

    if (physErr) {
      // rollback profile if physical details fails
      await supabase.from('profiles').delete().eq('id', candidateId);
      return NextResponse.json(
        { error: 'Physical measurements rejected: ' + physErr.message },
        { status: 400 }
      );
    }

    // 3. Insert into education
    const { error: eduErr } = await supabase
      .from('education')
      .insert({
        candidate_id: candidateId,
        level: level || '12TH',
        board: String(board).trim(),
        year_passed: yr,
        percentage: pct,
      });

    if (eduErr) {
      return NextResponse.json(
        { error: 'Education record rejected: ' + eduErr.message },
        { status: 400 }
      );
    }

    // Automatically establish candidate session
    const token = await signSession({
      role: 'candidate',
      candidateId,
      email: profData.email,
      fullName: profData.full_name,
    });

    const response = NextResponse.json({
      success: true,
      candidateId,
      candidate: {
        id: candidateId,
        email: profData.email,
        full_name: profData.full_name,
      },
      message: `Candidate registered successfully. Candidate ID: ${candidateId}`,
    });

    response.headers.set('Set-Cookie', getCookieHeader(token));
    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Registration processing error.' },
      { status: 500 }
    );
  }
}
