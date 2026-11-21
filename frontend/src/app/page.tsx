'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<'candidate' | 'officer'>('candidate');
  const [officerCode, setOfficerCode] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized_officer') {
      setErrorMsg('Access Denied: Officer authentication required to access administrative portals.');
      setRole('officer');
    }
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (role === 'officer') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'officer', code: officerCode }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Authentication failed.');
        }

        sessionStorage.setItem('role', 'officer');
        router.push('/notification');
        return;
      }

      if (role === 'candidate') {
        const cleanEmail = candidateEmail.trim();
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'candidate',
            email: cleanEmail || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Authentication failed.');
        }

        sessionStorage.setItem('role', 'candidate');
        if (data.candidate?.id) {
          sessionStorage.setItem('candidateId', String(data.candidate.id));
        }
        if (data.candidate?.email) {
          sessionStorage.setItem('candidateEmail', data.candidate.email);
        }
        if (data.candidate?.full_name) {
          sessionStorage.setItem('candidateName', data.candidate.full_name);
        }

        router.push('/candidate');
        return;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel panel-accent" style={{ padding: '32px 28px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          className="crest-badge"
          style={{ width: '48px', height: '48px', margin: '0 auto 14px auto' }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm0 3.5l6 3.33v4.67c0 4.22-2.82 8.16-6 9.42-3.18-1.26-6-5.2-6-9.42V8.83l6-3.33z" />
          </svg>
        </div>
        <h1 style={{ fontSize: '1.45rem', marginBottom: '4px' }}>
          Defence Recruitment System
        </h1>
        <p className="page-desc" style={{ marginBottom: 0 }}>
          Official Eligibility Management & Commissioning Portal
        </p>
      </div>

      {errorMsg && (
        <div className="error mb-16" style={{ marginBottom: '20px' }}>
          {errorMsg}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          border: '1px solid var(--c-border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          marginBottom: '22px',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setRole('candidate');
            setErrorMsg(null);
          }}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            background: role === 'candidate' ? 'var(--c-olive-deep)' : 'var(--c-surface-subtle)',
            color: role === 'candidate' ? '#f5f4ef' : 'var(--c-charcoal)',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          Candidate Portal
        </button>
        <button
          type="button"
          onClick={() => {
            setRole('officer');
            setErrorMsg(null);
          }}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            background: role === 'officer' ? 'var(--c-olive-deep)' : 'var(--c-surface-subtle)',
            color: role === 'officer' ? '#f5f4ef' : 'var(--c-charcoal)',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          Officer Console
        </button>
      </div>

      <form onSubmit={handleLogin}>
        {role === 'candidate' && (
          <div>
            <div className="form-group">
              <label htmlFor="candidate-email">
                Registered Email Address (Optional for Dashboard)
              </label>
              <input
                id="candidate-email"
                type="email"
                placeholder="name@example.com (optional)"
                value={candidateEmail}
                onChange={(e) => {
                  setCandidateEmail(e.target.value);
                  setErrorMsg(null);
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--c-text-muted)', display: 'block', marginTop: '4px' }}>
                Enter your registered email to load your active profile, or continue directly.
              </span>
            </div>

            <div className="mt-16">
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '11px 0' }}
                disabled={loading}
              >
                {loading ? 'Entering Portal...' : 'Enter Candidate Portal'}
              </button>
            </div>

            <div
              style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid var(--c-border)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
              }}
            >
              <Link
                href="/register"
                style={{ color: 'var(--c-olive-primary)', fontWeight: 600, textDecoration: 'none' }}
              >
                New Applicant? Register Profile
              </Link>
              <Link
                href="/notifications"
                style={{ color: 'var(--c-olive-primary)', fontWeight: 600, textDecoration: 'none' }}
              >
                View Open Recruitments
              </Link>
            </div>
          </div>
        )}

        {role === 'officer' && (
          <div>
            <div className="form-group">
              <label htmlFor="officer-code">
                Officer Security Access Code <span className="required-star">*</span>
              </label>
              <input
                id="officer-code"
                type="password"
                maxLength={10}
                required
                placeholder="Enter 4-digit authorization code"
                value={officerCode}
                onChange={(e) => {
                  setOfficerCode(e.target.value);
                  setErrorMsg(null);
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--c-text-muted)', display: 'block', marginTop: '4px' }}>
                Restricted to authorized recruitment and medical examination officers.
              </span>
            </div>

            <div className="mt-16">
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '11px 0' }}
                disabled={loading}
              >
                {loading ? 'Verifying Credentials...' : 'Authenticate & Enter Console'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="container page" style={{ maxWidth: '520px', marginTop: '40px' }}>
      <Suspense fallback={<div className="panel" style={{ padding: '32px', textAlign: 'center' }}>Loading portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
