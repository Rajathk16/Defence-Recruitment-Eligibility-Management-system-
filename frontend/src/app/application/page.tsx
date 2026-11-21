'use client';

import { useEffect, useState, useCallback } from 'react';
import CandidateNav from '@/components/CandidateNav';
import { useRole } from '@/lib/useRole';

interface ApplicationSummaryRow {
  application_id: number;
  full_name: string;
  notification_number: string;
  status: string;
  remarks: string | null;
  written_marks: number | null;
  pft_score: number | null;
  interview_score: number | null;
  medical_status: string | null;
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

export default function CandidateApplicationsPage() {
  const authorized = useRole('candidate');

  const [candidateId, setCandidateId] = useState<number | null>(null);
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateName, setCandidateName] = useState('');

  // Lookup state
  const [inputEmail, setInputEmail] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Rows state
  const [rows, setRows] = useState<ApplicationSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/candidate/applications');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load applications.');
      }
      setRows(data.applications ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authorized) return;

    const storedId = sessionStorage.getItem('candidateId');
    const storedEmail = sessionStorage.getItem('candidateEmail');
    const storedName = sessionStorage.getItem('candidateName');

    if (storedId && storedEmail) {
      setCandidateId(parseInt(storedId, 10));
      setCandidateEmail(storedEmail);
      if (storedName) setCandidateName(storedName);
      loadApplications();
    }
  }, [authorized, loadApplications]);

  if (!authorized) return null;

  async function handleFindMe(e: React.FormEvent) {
    e.preventDefault();
    setLookupError(null);
    setLookupLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'candidate', email: inputEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to locate candidate profile.');
      }

      setCandidateId(data.candidate.id);
      setCandidateEmail(data.candidate.email);
      setCandidateName(data.candidate.full_name);
      sessionStorage.setItem('candidateId', String(data.candidate.id));
      sessionStorage.setItem('candidateEmail', data.candidate.email);
      sessionStorage.setItem('candidateName', data.candidate.full_name);

      loadApplications();
    } catch (err: any) {
      setLookupError(err.message || 'Lookup failed.');
    } finally {
      setLookupLoading(false);
    }
  }

  function handleSwitchCandidate() {
    sessionStorage.removeItem('candidateId');
    sessionStorage.removeItem('candidateEmail');
    sessionStorage.removeItem('candidateName');
    setCandidateId(null);
    setCandidateEmail('');
    setCandidateName('');
    setRows([]);
  }

  return (
    <>
      <CandidateNav />
      <div className="container page">
        <div className="page-header">
          <h1>My Commission Applications</h1>
          <p className="page-desc">
            Track automated screening outcomes, recorded test scores, and medical fitness board results.
          </p>
        </div>

        {!candidateId ? (
          <div className="panel panel-accent" style={{ maxWidth: '600px' }}>
            <div className="panel-header">
              <span className="panel-title">Verify Candidate Identity</span>
            </div>
            <form onSubmit={handleFindMe}>
              <div className="form-group">
                <label htmlFor="registered-email">
                  Registered Email Address <span className="required-star">*</span>
                </label>
                <input
                  id="registered-email"
                  type="email"
                  required
                  placeholder="Enter your registered email address"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                />
              </div>

              <div className="mt-16">
                <button type="submit" className="btn btn-primary" disabled={lookupLoading}>
                  {lookupLoading ? 'Locating Record...' : 'Verify & Load Applications'}
                </button>
              </div>

              {lookupError && <div className="error mt-16">{lookupError}</div>}
            </form>
          </div>
        ) : (
          <div className="section">
            <div className="info-banner">
              <div>
                Applications for: <strong>{candidateEmail}</strong> {candidateName ? `(${candidateName})` : ''} &bull; Candidate <strong>#{candidateId}</strong>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSwitchCandidate}
              >
                Use Different Email
              </button>
            </div>

            {loading && (
              <div className="panel" style={{ textAlign: 'center', padding: '36px' }}>
                <span style={{ color: 'var(--c-text-muted)' }}>Retrieving your official application records...</span>
              </div>
            )}

            {error && <div className="error mb-16">{error}</div>}

            {!loading && !error && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>App ID</th>
                      <th>Notification No.</th>
                      <th>Screening Status</th>
                      <th>Screening Remarks</th>
                      <th>Written Marks</th>
                      <th>PFT Score</th>
                      <th>Interview</th>
                      <th>Medical Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '28px', color: 'var(--c-text-muted)' }}>
                          No applications submitted yet under candidate #{candidateId}.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr key={row.application_id}>
                          <td><strong>#{row.application_id}</strong></td>
                          <td><strong>{row.notification_number}</strong></td>
                          <td>
                            <span className={`status-pill ${getStatusBadgeClass(row.status)}`}>
                              {row.status}
                            </span>
                          </td>
                          <td style={{ maxWidth: '240px' }}>{row.remarks ?? 'All criteria satisfied.'}</td>
                          <td>{row.written_marks != null ? `${row.written_marks} / 100` : '-'}</td>
                          <td>{row.pft_score != null ? `${row.pft_score} / 100` : '-'}</td>
                          <td>{row.interview_score != null ? `${row.interview_score} / 100` : '-'}</td>
                          <td>
                            {row.medical_status ? (
                              <span className={`status-pill ${getMedicalBadgeClass(row.medical_status)}`}>
                                {row.medical_status}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--c-text-muted)' }}>Pending Exam</span>
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
        )}
      </div>
    </>
  );
}
