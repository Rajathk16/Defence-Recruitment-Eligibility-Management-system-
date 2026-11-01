'use client';

import { useEffect, useState } from 'react';
import { supabase, envConfigured } from '@/lib/supabase';
import CandidateNav from '@/components/CandidateNav';
import { useRole } from '@/lib/useRole';

interface NotificationItem {
  id: number;
  notification_number: string;
  title: string;
}

interface ApplicationResult {
  id: number;
  status: string;
  remarks: string | null;
}

export default function CandidateApplyPage() {
  const authorized = useRole('candidate');

  const [candidateId, setCandidateId] = useState<number | null>(null);
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateName, setCandidateName] = useState('');

  // Lookup form state
  const [inputEmail, setInputEmail] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Application form state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedNotification, setSelectedNotification] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplicationResult | null>(null);

  useEffect(() => {
    if (!authorized) return;

    // Check sessionStorage
    const storedId = sessionStorage.getItem('candidateId');
    const storedEmail = sessionStorage.getItem('candidateEmail');

    if (storedId && storedEmail) {
      setCandidateId(parseInt(storedId, 10));
      setCandidateEmail(storedEmail);
    }

    // Load notifications
    async function loadNotifications() {
      if (!envConfigured) return;
      const { data } = await supabase
        .from('notifications')
        .select('id, notification_number, title')
        .order('id', { ascending: false });

      if (data) {
        setNotifications(data);
        if (data.length > 0 && !selectedNotification) {
          setSelectedNotification(String(data[0].id));
        }
      }
    }

    loadNotifications();
  }, [authorized, selectedNotification]);

  if (!authorized) return null;

  async function handleFindMe(e: React.FormEvent) {
    e.preventDefault();
    setLookupError(null);
    setLookupLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', inputEmail.trim())
        .eq('role', 'CANDIDATE')
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setLookupError('No candidate profile found with this email. Please register first.');
        return;
      }

      setCandidateId(data.id);
      setCandidateEmail(data.email);
      setCandidateName(data.full_name);
      sessionStorage.setItem('candidateId', String(data.id));
      sessionStorage.setItem('candidateEmail', data.email);
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
    setResult(null);
    setSubmitError(null);
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setResult(null);

    if (!candidateId || !selectedNotification) {
      setSubmitError('Missing candidate or notification selection.');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          candidate_id: candidateId,
          notification_id: parseInt(selectedNotification, 10),
        })
        .select('id, status, remarks')
        .single();

      if (error) throw error;
      setResult(data as ApplicationResult);
    } catch (err: any) {
      if (
        err.code === '23505' ||
        err.message?.toLowerCase().includes('duplicate') ||
        err.message?.toLowerCase().includes('unique')
      ) {
        setSubmitError('This candidate has already submitted an application for this notification.');
      } else {
        setSubmitError(err.message || 'Failed to submit application.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <CandidateNav />
      <div className="container page">
        <h1>Apply for Notification</h1>
        <p className="page-desc">Submit your application to trigger automated eligibility screening.</p>

        {!envConfigured && (
          <p className="error">
            Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to use this application.
          </p>
        )}

        {/* Step 1: Candidate identification if none stored */}
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
          /* Step 2: Candidate is identified -> Apply */
          <div className="section">
            <div style={{ background: '#f0f0f0', padding: '12px 16px', borderBottom: '1px solid #ddd', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                Applying as: <strong>{candidateEmail}</strong> {candidateName ? `(${candidateName})` : ''} - Candidate #{candidateId}
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

            <form onSubmit={handleApply}>
              <div className="form-group">
                <label htmlFor="notification-select">Notification</label>
                <select
                  id="notification-select"
                  required
                  value={selectedNotification}
                  onChange={(e) => {
                    setSelectedNotification(e.target.value);
                    setResult(null);
                    setSubmitError(null);
                  }}
                >
                  {notifications.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.notification_number} - {n.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-16">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit application'}
                </button>
              </div>

              {submitError && <p className="error mt-8">{submitError}</p>}

              {result && (
                <div className="check-result mt-16">
                  <h3>Screening result (Trigger evaluation)</h3>
                  <p>Application ID: <strong>{result.id}</strong></p>
                  <p className="mt-8">
                    Status:{' '}
                    <span className={result.status === 'ELIGIBLE' ? 'eligible' : 'rejected'}>
                      {result.status}
                    </span>
                  </p>
                  <p className="mt-8">
                    Remarks: <strong>{result.remarks || 'All criteria satisfied.'}</strong>
                  </p>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </>
  );
}
