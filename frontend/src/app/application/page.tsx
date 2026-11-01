'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, envConfigured } from '@/lib/supabase';
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

function statusClass(status: string): string {
  if (status === 'ELIGIBLE') return 'status-eligible';
  if (status === 'REJECTED') return 'status-rejected';
  if (status === 'SELECTED') return 'status-merit_listed';
  return '';
}

export default function CandidateApplicationsPage() {
  const authorized = useRole('candidate');

  const [candidateId, setCandidateId] = useState<number | null>(null);
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateName, setCandidateName] = useState('');

  // Lookup state if not in sessionStorage
  const [inputEmail, setInputEmail] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Rows state
  const [rows, setRows] = useState<ApplicationSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = useCallback(async (cId: number) => {
    if (!envConfigured) return;
    setLoading(true);
    setError(null);

    try {
      // Find application ids for this candidate
      const { data: appData, error: appErr } = await supabase
        .from('applications')
        .select('id')
        .eq('candidate_id', cId);

      if (appErr) throw appErr;

      const appIds = (appData ?? []).map((a) => a.id);
      if (appIds.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      // Query v_application_summary
      const { data: sumData, error: sumErr } = await supabase
        .from('v_application_summary')
        .select('*')
        .in('application_id', appIds)
        .order('application_id', { ascending: false });

      if (sumErr) throw sumErr;
      setRows(sumData ?? []);
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

    if (storedId && storedEmail) {
      const cId = parseInt(storedId, 10);
      setCandidateId(cId);
      setCandidateEmail(storedEmail);
      loadApplications(cId);
    }
  }, [authorized, loadApplications]);

  if (!authorized) return null;

  async function handleFindMe(e: React.FormEvent) {
    e.preventDefault();
    setLookupError(null);
    setLookupLoading(true);

    try {
      const { data, error: profErr } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', inputEmail.trim())
        .eq('role', 'CANDIDATE')
        .maybeSingle();

      if (profErr) throw profErr;
      if (!data) {
        setLookupError('No candidate profile found with this email. Please register first.');
        return;
      }

      setCandidateId(data.id);
      setCandidateEmail(data.email);
      setCandidateName(data.full_name);
      sessionStorage.setItem('candidateId', String(data.id));
      sessionStorage.setItem('candidateEmail', data.email);
      loadApplications(data.id);
    } catch (err: any) {
      setLookupError(err.message || 'Lookup failed.');
    } finally {
      setLookupLoading(false);
    }
  }

  function handleSwitchCandidate() {
    sessionStorage.removeItem('candidateId');
    sessionStorage.removeItem('candidateEmail');
    setCandidateId(null);
    setCandidateEmail('');
    setCandidateName('');
    setRows([]);
  }

  return (
    <>
      <CandidateNav />
      <div className="container page">
        <h1>Your Applications</h1>
        <p className="page-desc">Track screening outcomes, scores, and medical fitness status.</p>

        {!envConfigured && (
          <p className="error">
            Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to use this application.
          </p>
        )}

        {!candidateId ? (
          <div className="section" style={{ background: 'white', padding: '20px', border: '1px solid #ddd' }}>
            <h2>Find your candidate profile</h2>
            <form onSubmit={handleFindMe}>
              <div className="form-group">
                <label htmlFor="registered-email">Your registered email</label>
                <input
                  id="registered-email"
                  type="email"
                  required
                  placeholder="Enter the email you registered with"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                />
              </div>

              <div className="mt-16">
                <button type="submit" className="btn btn-primary" disabled={lookupLoading}>
                  {lookupLoading ? 'Finding...' : 'Find me'}
                </button>
              </div>

              {lookupError && <p className="error mt-8">{lookupError}</p>}
            </form>
          </div>
        ) : (
          <div className="section">
            <div style={{ background: '#f0f0f0', padding: '12px 16px', borderBottom: '1px solid #ddd', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                Applications for: <strong>{candidateEmail}</strong> {candidateName ? `(${candidateName})` : ''} - Candidate #{candidateId}
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '3px 8px', fontSize: '12px' }}
                onClick={handleSwitchCandidate}
              >
                Use different email
              </button>
            </div>

            {loading && <p>Loading applications...</p>}
            {error && <p className="error">{error}</p>}

            {!loading && !error && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Application ID</th>
                      <th>Notification number</th>
                      <th>Status</th>
                      <th>Remarks</th>
                      <th>Written</th>
                      <th>PFT</th>
                      <th>Interview</th>
                      <th>Medical status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={8}>No records.</td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr key={row.application_id}>
                          <td>{row.application_id}</td>
                          <td>{row.notification_number}</td>
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
        )}
      </div>
    </>
  );
}

