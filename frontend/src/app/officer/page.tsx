'use client';

import { useEffect, useState } from 'react';
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

function getStatusBadgeClass(status: string): string {
  if (status === 'ELIGIBLE') return 'status-eligible';
  if (status === 'REJECTED') return 'status-rejected';
  if (status === 'SELECTED') return 'status-selected';
  return 'status-pending';
}

function getMedicalBadgeClass(status: string | null): string {
  if (status === 'FIT') return 'status-eligible';
  if (status === 'UNFIT') return 'status-rejected';
  if (status === 'PENDING') return 'status-pending';
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
    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const res = await fetch('/api/officer/summary');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load officer records.');
      }

      setSummary(data.summary ?? []);
      setAppOptions(data.appOptions ?? []);
      if (data.appOptions?.length > 0 && !scoreAppId) {
        setScoreAppId(String(data.appOptions[0].id));
      }
      if (data.appOptions?.length > 0 && !medAppId) {
        setMedAppId(String(data.appOptions[0].id));
      }

      setNotifications(data.notifications ?? []);
      if (data.notifications?.length > 0 && !meritNotifId) {
        setMeritNotifId(String(data.notifications[0].id));
      }
    } catch (err: any) {
      setSummaryError(err.message || 'Error loading records.');
    } finally {
      setSummaryLoading(false);
    }
  }

  useEffect(() => {
    if (authorized) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);

  if (!authorized) return null;

  async function handleSaveScores(e: React.FormEvent) {
    e.preventDefault();
    setScoreError(null);
    setScoreSuccess(null);

    if (!scoreAppId) {
      setScoreError('Please select a candidate application.');
      return;
    }

    setScoreSaving(true);
    try {
      const res = await fetch('/api/officer/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: scoreAppId,
          writtenMarks,
          pftScore,
          interviewScore,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record test scores.');
      }

      setScoreSuccess('Official test scores recorded successfully.');
      setWrittenMarks('');
      setPftScore('');
      setInterviewScore('');
      loadData();
    } catch (err: any) {
      setScoreError(err.message || 'Operation failed.');
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
      const res = await fetch('/api/officer/medical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: medAppId,
          boardLocation,
          examDate,
          status: medStatus,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record medical examination.');
      }

      setMedSuccess('Medical fitness board examination recorded successfully.');
      setBoardLocation('');
      setExamDate('');
      setNotes('');
      loadData();
    } catch (err: any) {
      setMedError(err.message || 'Operation failed.');
    } finally {
      setMedSaving(false);
    }
  }

  async function handleGenerateMerit() {
    setMeritError(null);
    setMeritMsg(null);
    setRankedList([]);

    if (!meritNotifId) {
      setMeritError('Please select a recruitment notification.');
      return;
    }

    setMeritLoading(true);
    try {
      const res = await fetch('/api/officer/merit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId: meritNotifId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate merit list.');
      }

      setRankedList(data.rankedList ?? []);
      setMeritMsg(data.message || 'Merit list generated.');
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
        <div className="page-header">
          <h1>Officer Administration Console</h1>
          <p className="page-desc">
            Recruitment candidate screening overview, test marks evaluation, medical board outcomes, and merit ranking.
          </p>
        </div>

        {/* Section 1: Summary Table */}
        <div className="panel panel-accent">
          <div className="panel-header">
            <span className="panel-title">Application Overview (v_application_summary)</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={loadData}
              disabled={summaryLoading}
            >
              Refresh Table
            </button>
          </div>

          {summaryLoading && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--c-text-muted)' }}>
              Loading candidate applications summary...
            </div>
          )}

          {summaryError && <div className="error mb-16">{summaryError}</div>}

          {!summaryLoading && !summaryError && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>App ID</th>
                    <th>Candidate Name</th>
                    <th>Notification</th>
                    <th>Age at Cutoff</th>
                    <th>Status</th>
                    <th>Remarks</th>
                    <th>Written</th>
                    <th>PFT</th>
                    <th>Interview</th>
                    <th>Medical Status</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '24px', color: 'var(--c-text-muted)' }}>
                        No application records found.
                      </td>
                    </tr>
                  ) : (
                    summary.map((row) => (
                      <tr key={row.application_id}>
                        <td><strong>#{row.application_id}</strong></td>
                        <td>{row.full_name}</td>
                        <td>{row.notification_number}</td>
                        <td>{row.age_at_cutoff} yrs</td>
                        <td>
                          <span className={`status-pill ${getStatusBadgeClass(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td style={{ maxWidth: '200px' }}>{row.remarks ?? '-'}</td>
                        <td>{row.written_marks != null ? `${row.written_marks}` : '-'}</td>
                        <td>{row.pft_score != null ? `${row.pft_score}` : '-'}</td>
                        <td>{row.interview_score != null ? `${row.interview_score}` : '-'}</td>
                        <td>
                          {row.medical_status ? (
                            <span className={`status-pill ${getMedicalBadgeClass(row.medical_status)}`}>
                              {row.medical_status}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 2: Enter Test Scores */}
        <div className="panel panel-accent">
          <div className="panel-header">
            <span className="panel-title">Record Examination & Interview Scores</span>
          </div>

          <form onSubmit={handleSaveScores}>
            <div className="form-group">
              <label htmlFor="score-app-select">
                Target Application Reference <span className="required-star">*</span>
              </label>
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
                <label htmlFor="written-marks">
                  Written Marks (0 to 100) <span className="required-star">*</span>
                </label>
                <input
                  id="written-marks"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  placeholder="e.g. 78.50"
                  value={writtenMarks}
                  onChange={(e) => setWrittenMarks(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="pft-score">
                  Physical Fitness Test (0 to 100) <span className="required-star">*</span>
                </label>
                <input
                  id="pft-score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  placeholder="e.g. 85.00"
                  value={pftScore}
                  onChange={(e) => setPftScore(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="interview-score">
                  SSB Interview Score (0 to 100) <span className="required-star">*</span>
                </label>
                <input
                  id="interview-score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  placeholder="e.g. 82.00"
                  value={interviewScore}
                  onChange={(e) => setInterviewScore(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-16">
              <button type="submit" className="btn btn-primary" disabled={scoreSaving}>
                {scoreSaving ? 'Saving Scores...' : 'Save Test Scores'}
              </button>
            </div>

            {scoreError && <div className="error mt-16">{scoreError}</div>}
            {scoreSuccess && <div className="success mt-16">{scoreSuccess}</div>}
          </form>
        </div>

        {/* Section 3: Record Medical Exams */}
        <div className="panel panel-accent">
          <div className="panel-header">
            <span className="panel-title">Record Medical Fitness Examination</span>
          </div>

          <form onSubmit={handleSaveMedical}>
            <div className="form-group">
              <label htmlFor="med-app-select">
                Target Application Reference <span className="required-star">*</span>
              </label>
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
                <label htmlFor="board-location">
                  Medical Board Location <span className="required-star">*</span>
                </label>
                <input
                  id="board-location"
                  type="text"
                  required
                  placeholder="e.g. Military Hospital, Delhi Cantt"
                  value={boardLocation}
                  onChange={(e) => setBoardLocation(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="exam-date">
                  Examination Date <span className="required-star">*</span>
                </label>
                <input
                  id="exam-date"
                  type="date"
                  required
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="med-status">
                  Fitness Decision <span className="required-star">*</span>
                </label>
                <select
                  id="med-status"
                  value={medStatus}
                  onChange={(e) => setMedStatus(e.target.value)}
                >
                  <option value="FIT">FIT (Cleared Medicals)</option>
                  <option value="UNFIT">UNFIT (Permanent Disqualification)</option>
                  <option value="PENDING">PENDING (Review Appeal)</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '14px' }}>
              <label htmlFor="notes">Clinical Findings / Notes (Optional)</label>
              <input
                id="notes"
                type="text"
                placeholder="e.g. SHAPE-1 standard cleared, visual acuity 6/6"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="mt-16">
              <button type="submit" className="btn btn-primary" disabled={medSaving}>
                {medSaving ? 'Saving Medical Result...' : 'Save Medical Result'}
              </button>
            </div>

            {medError && <div className="error mt-16">{medError}</div>}
            {medSuccess && <div className="success mt-16">{medSuccess}</div>}
          </form>
        </div>

        {/* Section 4: Generate Merit List */}
        <div className="panel panel-accent">
          <div className="panel-header">
            <span className="panel-title">Merit List Computation & Selection Allocation</span>
          </div>

          <p className="page-desc" style={{ marginBottom: '16px' }}>
            Formula: <code>Composite Score = (Written &times; 0.4) + (PFT &times; 0.2) + (Interview &times; 0.4)</code>. Medically UNFIT or incomplete candidates are automatically disqualified. Dense rank ordering is applied, and vacancies are allocated to top-ranked candidates.
          </p>

          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div className="col">
              <label htmlFor="merit-notif-select">Select Commission Notification</label>
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
                {meritLoading ? 'Computing Rankings...' : 'Generate Official Merit List'}
              </button>
            </div>
          </div>

          {meritError && <div className="error mt-16">{meritError}</div>}
          {meritMsg && <div className="success mt-16">{meritMsg}</div>}

          {rankedList.length > 0 && (
            <div className="table-wrap mt-24">
              <table>
                <thead>
                  <tr>
                    <th>Rank Order</th>
                    <th>Candidate Name</th>
                    <th>Application Ref</th>
                    <th>Composite Score</th>
                    <th>Selection Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedList.map((c) => (
                    <tr key={c.application_id} className={c.is_selected ? 'merit-selected' : ''}>
                      <td><strong>Rank #{c.rank}</strong></td>
                      <td>{c.full_name}</td>
                      <td>#{c.application_id}</td>
                      <td><strong>{c.score.toFixed(2)}</strong></td>
                      <td>
                        <span
                          className={`status-pill ${
                            c.is_selected ? 'status-selected' : 'status-rejected'
                          }`}
                        >
                          {c.is_selected ? 'Selected (Commissioned)' : 'Not Selected (Reserve)'}
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
