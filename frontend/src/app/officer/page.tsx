'use client';

import { useEffect, useState } from 'react';
import { supabase, envConfigured } from '@/lib/supabase';
import OfficerNav from '@/components/OfficerNav';
import { useRole } from '@/lib/useRole';

interface ApplicationSummary {
  application_id: number;
  full_name: string;
  notification_number: string;
  age_at_cutoff: number;
  status: string;
  remarks: string | null;
  written_marks: number | null;
  pft_score: number | null;
  interview_score: number | null;
  medical_status: string | null;
}

interface ApplicationOption {
  id: number;
  candidate_name: string;
  notification_number: string;
}

interface NotificationItem {
  id: number;
  notification_number: string;
  title: string;
  vacancies: number;
}

interface RankedCandidate {
  application_id: number;
  full_name: string;
  score: number;
  rank: number;
  is_selected: boolean;
}

function statusClass(status: string): string {
  if (status === 'ELIGIBLE') return 'status-eligible';
  if (status === 'REJECTED') return 'status-rejected';
  if (status === 'SELECTED') return 'status-merit_listed';
  return '';
}

export default function OfficerPage() {
  const authorized = useRole('officer');

  // Summary table
  const [summary, setSummary] = useState<ApplicationSummary[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Application options for score & medical forms
  const [appOptions, setAppOptions] = useState<ApplicationOption[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Test scores form
  const [scoreAppId, setScoreAppId] = useState('');
  const [writtenMarks, setWrittenMarks] = useState('');
  const [pftScore, setPftScore] = useState('');
  const [interviewScore, setInterviewScore] = useState('');
  const [scoreSaving, setScoreSaving] = useState(false);
  const [scoreSuccess, setScoreSuccess] = useState<string | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);

  // Medical form
  const [medAppId, setMedAppId] = useState('');
  const [boardLocation, setBoardLocation] = useState('');
  const [examDate, setExamDate] = useState('');
  const [medStatus, setMedStatus] = useState('FIT');
  const [notes, setNotes] = useState('');
  const [medSaving, setMedSaving] = useState(false);
  const [medSuccess, setMedSuccess] = useState<string | null>(null);
  const [medError, setMedError] = useState<string | null>(null);

  // Merit list generator
  const [meritNotifId, setMeritNotifId] = useState('');
  const [rankedList, setRankedList] = useState<RankedCandidate[]>([]);
  const [meritLoading, setMeritLoading] = useState(false);
  const [meritMsg, setMeritMsg] = useState<string | null>(null);
  const [meritError, setMeritError] = useState<string | null>(null);

  async function loadData() {
    if (!envConfigured) {
      setSummaryLoading(false);
      return;
    }
    setSummaryLoading(true);

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
      setSummaryError(sumRes.error.message);
    } else {
      setSummary(sumRes.data ?? []);
    }

    if (appsRes.data) {
      const mapped = appsRes.data.map((a: any) => ({
        id: a.id,
        candidate_name: Array.isArray(a.profiles) ? a.profiles[0]?.full_name : a.profiles?.full_name,
        notification_number: Array.isArray(a.notifications)
          ? a.notifications[0]?.notification_number
          : a.notifications?.notification_number,
      }));
      setAppOptions(mapped);
      if (mapped.length > 0 && !scoreAppId) setScoreAppId(String(mapped[0].id));
      if (mapped.length > 0 && !medAppId) setMedAppId(String(mapped[0].id));
    }

    if (notifRes.data) {
      setNotifications(notifRes.data);
      if (notifRes.data.length > 0 && !meritNotifId) {
        setMeritNotifId(String(notifRes.data[0].id));
      }
    }

    setSummaryLoading(false);
  }

  useEffect(() => {
    if (authorized) {
      loadData();
    }
  }, [authorized]);

  if (!authorized) return null;

  async function handleSaveScores(e: React.FormEvent) {
    e.preventDefault();
    setScoreError(null);
    setScoreSuccess(null);

    if (!scoreAppId) {
      setScoreError('Please select an application.');
      return;
    }

    setScoreSaving(true);
    try {
      const { error } = await supabase.from('test_scores').upsert({
        application_id: parseInt(scoreAppId, 10),
        written_marks: parseFloat(writtenMarks),
        pft_score: parseFloat(pftScore),
        interview_score: parseFloat(interviewScore),
      });

      if (error) throw error;

      setScoreSuccess('Test scores recorded successfully.');
      setWrittenMarks('');
      setPftScore('');
      setInterviewScore('');
      loadData();
    } catch (err: any) {
      setScoreError(err.message || 'Failed to save test scores.');
    } finally {
      setScoreSaving(false);
    }
  }

  async function handleSaveMedical(e: React.FormEvent) {
    e.preventDefault();
    setMedError(null);
    setMedSuccess(null);

    if (!medAppId) {
      setMedError('Please select an application.');
      return;
    }

    setMedSaving(true);
    try {
      const { error } = await supabase.from('medical_exams').upsert({
        application_id: parseInt(medAppId, 10),
        board_location: boardLocation.trim(),
        exam_date: examDate,
        status: medStatus,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      setMedSuccess('Medical exam result recorded successfully.');
      setBoardLocation('');
      setExamDate('');
      setNotes('');
      loadData();
    } catch (err: any) {
      setMedError(err.message || 'Failed to save medical exam result.');
    } finally {
      setMedSaving(false);
    }
  }

  async function handleGenerateMerit() {
    setMeritError(null);
    setMeritMsg(null);
    setRankedList([]);

    if (!meritNotifId) {
      setMeritError('Please select a notification.');
      return;
    }

    setMeritLoading(true);
    try {
      const notif = notifications.find((n) => n.id === parseInt(meritNotifId, 10));
      if (!notif) throw new Error('Notification not found.');

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

      if (fetchErr) throw fetchErr;
      if (!apps || apps.length === 0) {
        setMeritMsg('No eligible applications found for this notification.');
        setMeritLoading(false);
        return;
      }

      const validApplicants: RankedCandidate[] = [];
      for (const app of apps as any[]) {
        const med = Array.isArray(app.medical_exams) ? app.medical_exams[0] : app.medical_exams;
        if (med?.status === 'UNFIT') continue;

        const ts = Array.isArray(app.test_scores) ? app.test_scores[0] : app.test_scores;
        if (!ts || ts.written_marks == null || ts.pft_score == null || ts.interview_score == null) {
          continue;
        }

        const score =
          Math.round(
            (Number(ts.written_marks) * 0.4 +
              Number(ts.pft_score) * 0.2 +
              Number(ts.interview_score) * 0.4) *
              100
          ) / 100;

        const name = Array.isArray(app.profiles) ? app.profiles[0]?.full_name : app.profiles?.full_name;

        validApplicants.push({
          application_id: app.id,
          full_name: name || `Applicant #${app.id}`,
          score,
          rank: 0,
          is_selected: false,
        });
      }

      if (validApplicants.length === 0) {
        setMeritMsg('No candidates with complete scores and fit medical status.');
        setMeritLoading(false);
        return;
      }

      validApplicants.sort((a, b) => b.score - a.score);

      let rank = 1;
      for (let i = 0; i < validApplicants.length; i++) {
        if (i > 0 && validApplicants[i].score < validApplicants[i - 1].score) {
          rank++;
        }
        validApplicants[i].rank = rank;
        validApplicants[i].is_selected = rank <= notif.vacancies;
      }

      const appIds = validApplicants.map((v) => v.application_id);
      await supabase.from('merit_list').delete().in('application_id', appIds);

      const meritRows = validApplicants.map((v) => ({
        application_id: v.application_id,
        composite_score: v.score,
        rank_order: v.rank,
        is_selected: v.is_selected,
      }));
      const { error: insertErr } = await supabase.from('merit_list').insert(meritRows);
      if (insertErr) throw insertErr;

      const selectedIds = validApplicants.filter((v) => v.is_selected).map((v) => v.application_id);
      if (selectedIds.length > 0) {
        await supabase.from('applications').update({ status: 'SELECTED' }).in('id', selectedIds);
      }
      const unselectedIds = validApplicants.filter((v) => !v.is_selected).map((v) => v.application_id);
      if (unselectedIds.length > 0) {
        await supabase.from('applications').update({ status: 'ELIGIBLE' }).in('id', unselectedIds);
      }

      setRankedList(validApplicants);
      setMeritMsg(`Merit list generated. ${validApplicants.length} candidate(s) ranked.`);
      loadData();
    } catch (err: any) {
      setMeritError(err.message || 'Failed to generate merit list.');
    } finally {
      setMeritLoading(false);
    }
  }

  return (
    <>
      <OfficerNav />
      <div className="container page">
        <h1>Officer Panel</h1>
        <p className="page-desc">Manage scores, record medical examinations, and generate merit lists.</p>

        {!envConfigured && (
          <p className="error">
            Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to use this application.
          </p>
        )}

        {/* Section 1: Summary Table */}
        <div className="section">
          <h2>Application summary (v_application_summary)</h2>
          {summaryLoading && <p>Loading summary...</p>}
          {summaryError && <p className="error">{summaryError}</p>}
          {!summaryLoading && !summaryError && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>App ID</th>
                    <th>Candidate</th>
                    <th>Notification</th>
                    <th>Age</th>
                    <th>Status</th>
                    <th>Remarks</th>
                    <th>Written</th>
                    <th>PFT</th>
                    <th>Interview</th>
                    <th>Medical</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.length === 0 ? (
                    <tr>
                      <td colSpan={10}>No records.</td>
                    </tr>
                  ) : (
                    summary.map((row) => (
                      <tr key={row.application_id}>
                        <td>{row.application_id}</td>
                        <td>{row.full_name}</td>
                        <td>{row.notification_number}</td>
                        <td>{row.age_at_cutoff}</td>
                        <td>
                          <span className={statusClass(row.status)}>{row.status}</span>
                        </td>
                        <td>{row.remarks ?? '-'}</td>
                        <td>{row.written_marks != null ? row.written_marks : '-'}</td>
                        <td>{row.pft_score != null ? row.pft_score : '-'}</td>
                        <td>{row.interview_score != null ? row.interview_score : '-'}</td>
                        <td>{row.medical_status ?? '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 2: Enter Test Scores */}
        <div className="section">
          <h2>Enter test scores</h2>
          <form onSubmit={handleSaveScores}>
            <div className="form-group">
              <label htmlFor="score-app-select">Application</label>
              <select
                id="score-app-select"
                required
                value={scoreAppId}
                onChange={(e) => setScoreAppId(e.target.value)}
              >
                {appOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    App #{a.id} - {a.candidate_name} ({a.notification_number})
                  </option>
                ))}
              </select>
            </div>

            <div className="row">
              <div className="col">
                <label htmlFor="written-marks">Written marks (0 to 100)</label>
                <input
                  id="written-marks"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={writtenMarks}
                  onChange={(e) => setWrittenMarks(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="pft-score">PFT score (0 to 100)</label>
                <input
                  id="pft-score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={pftScore}
                  onChange={(e) => setPftScore(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="interview-score">Interview score (0 to 100)</label>
                <input
                  id="interview-score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={interviewScore}
                  onChange={(e) => setInterviewScore(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-16">
              <button type="submit" className="btn btn-primary" disabled={scoreSaving}>
                {scoreSaving ? 'Saving...' : 'Save test scores'}
              </button>
            </div>

            {scoreError && <p className="error mt-8">{scoreError}</p>}
            {scoreSuccess && <p className="success mt-8">{scoreSuccess}</p>}
          </form>
        </div>

        {/* Section 3: Record Medical Exams */}
        <div className="section">
          <h2>Record medical exam</h2>
          <form onSubmit={handleSaveMedical}>
            <div className="form-group">
              <label htmlFor="med-app-select">Application</label>
              <select
                id="med-app-select"
                required
                value={medAppId}
                onChange={(e) => setMedAppId(e.target.value)}
              >
                {appOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    App #{a.id} - {a.candidate_name} ({a.notification_number})
                  </option>
                ))}
              </select>
            </div>

            <div className="row">
              <div className="col">
                <label htmlFor="board-location">Board location</label>
                <input
                  id="board-location"
                  type="text"
                  required
                  placeholder="e.g. Military Hospital, Delhi"
                  value={boardLocation}
                  onChange={(e) => setBoardLocation(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="exam-date">Exam date</label>
                <input
                  id="exam-date"
                  type="date"
                  required
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="med-status">Status</label>
                <select
                  id="med-status"
                  value={medStatus}
                  onChange={(e) => setMedStatus(e.target.value)}
                >
                  <option value="FIT">FIT</option>
                  <option value="UNFIT">UNFIT</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes (optional)</label>
              <input
                id="notes"
                type="text"
                placeholder="e.g. SHAPE-1 standard cleared"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="mt-16">
              <button type="submit" className="btn btn-primary" disabled={medSaving}>
                {medSaving ? 'Saving...' : 'Save medical result'}
              </button>
            </div>

            {medError && <p className="error mt-8">{medError}</p>}
            {medSuccess && <p className="success mt-8">{medSuccess}</p>}
          </form>
        </div>

        {/* Section 4: Generate Merit List */}
        <div className="section">
          <h2>Generate merit list (TypeScript calculation)</h2>
          <p className="page-desc" style={{ marginBottom: '12px' }}>
            Formula: composite = (written * 0.4) + (pft * 0.2) + (interview * 0.4). Medically UNFIT or incomplete candidates are excluded. Dense rank is applied and vacancies are allocated.
          </p>

          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div className="col">
              <label htmlFor="merit-notif-select">Notification</label>
              <select
                id="merit-notif-select"
                value={meritNotifId}
                onChange={(e) => setMeritNotifId(e.target.value)}
              >
                {notifications.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.notification_number} - {n.title} (Vacancies: {n.vacancies})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flexShrink: 0 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGenerateMerit}
                disabled={meritLoading}
              >
                {meritLoading ? 'Generating...' : 'Generate merit list'}
              </button>
            </div>
          </div>

          {meritError && <p className="error mt-8">{meritError}</p>}
          {meritMsg && <p className="mt-8">{meritMsg}</p>}

          {rankedList.length > 0 && (
            <div className="table-wrap mt-16">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Candidate name</th>
                    <th>Application ID</th>
                    <th>Composite score</th>
                    <th>Selected</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedList.map((c) => (
                    <tr key={c.application_id} className={c.is_selected ? 'merit-selected' : ''}>
                      <td><strong>{c.rank}</strong></td>
                      <td>{c.full_name}</td>
                      <td>{c.application_id}</td>
                      <td>{c.score}</td>
                      <td>
                        <span className={c.is_selected ? 'eligible' : 'rejected'}>
                          {c.is_selected ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
