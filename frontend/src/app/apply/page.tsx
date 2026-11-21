'use client';

import { useEffect, useState } from 'react';
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

    const storedId = sessionStorage.getItem('candidateId');
    const storedEmail = sessionStorage.getItem('candidateEmail');
    const storedName = sessionStorage.getItem('candidateName');

    if (storedId && storedEmail) {
      setCandidateId(parseInt(storedId, 10));
      setCandidateEmail(storedEmail);
      if (storedName) setCandidateName(storedName);
    }

    // Load active notifications
    async function loadNotifications() {
      try {
        const res = await fetch('/api/officer/notifications');
        const data = await res.json();
        if (data.notifications && data.notifications.length > 0) {
          setNotifications(data.notifications);
          if (!selectedNotification) {
            setSelectedNotification(String(data.notifications[0].id));
          }
        }
      } catch {
        // ignore
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
    setResult(null);
    setSubmitError(null);
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setResult(null);

    if (!selectedNotification) {
      setSubmitError('Please select a recruitment notification.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/candidate/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId: selectedNotification,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application.');
      }

      setResult(data.application as ApplicationResult);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <CandidateNav />
      <div className="container page">
        <div className="page-header">
          <h1>Apply for Commission Notification</h1>
          <p className="page-desc">
            Submit your application to trigger automated database eligibility screening against rules.
          </p>
        </div>

        {/* Step 1: Candidate identification if none stored */}
        {!candidateId ? (
          <div className="panel panel-accent" style={{ maxWidth: '600px' }}>
            <div className="panel-header">
              <span className="panel-title">Identify Candidate Profile</span>
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
                  placeholder="Enter the email address you registered with"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                />
              </div>

              <div className="mt-16">
                <button type="submit" className="btn btn-primary" disabled={lookupLoading}>
                  {lookupLoading ? 'Locating Record...' : 'Verify & Load Profile'}
                </button>
              </div>

              {lookupError && <div className="error mt-16">{lookupError}</div>}
            </form>
          </div>
        ) : (
          /* Step 2: Candidate is identified -> Apply */
          <div className="panel panel-accent">
            <div className="panel-header">
              <span className="panel-title">Commission Application Form</span>
            </div>

            <div className="info-banner">
              <div>
                Applying as: <strong>{candidateEmail}</strong> {candidateName ? `(${candidateName})` : ''} &bull; Candidate <strong>#{candidateId}</strong>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSwitchCandidate}
              >
                Use Different Email
              </button>
            </div>

            <form onSubmit={handleApply}>
              <div className="form-group">
                <label htmlFor="notification-select">
                  Select Recruitment Notification <span className="required-star">*</span>
                </label>
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
                  {submitting ? 'Screening Application...' : 'Submit Application'}
                </button>
              </div>

              {submitError && <div className="error mt-16">{submitError}</div>}

              {result && (
                <div className="check-result mt-24">
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--c-olive-deep)', marginBottom: '12px' }}>
                    Automated Screening Result (Database Trigger Evaluation)
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '8px 16px', fontSize: '14px' }}>
                    <strong>Application Reference:</strong>
                    <span>#{result.id}</span>

                    <strong>Eligibility Status:</strong>
                    <span>
                      <span
                        className={`status-pill ${
                          result.status === 'ELIGIBLE' ? 'status-eligible' : 'status-rejected'
                        }`}
                      >
                        {result.status}
                      </span>
                    </span>

                    <strong>Evaluation Remarks:</strong>
                    <span>
                      <strong>{result.remarks || 'All physical and educational criteria satisfied.'}</strong>
                    </span>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </>
  );
}
