'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CandidateNav from '@/components/CandidateNav';
import { useRole } from '@/lib/useRole';

export default function CandidateDashboard() {
  const authorized = useRole('candidate');
  const [candidateEmail, setCandidateEmail] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);

  useEffect(() => {
    if (authorized) {
      setCandidateEmail(sessionStorage.getItem('candidateEmail'));
      setCandidateName(sessionStorage.getItem('candidateName'));
      setCandidateId(sessionStorage.getItem('candidateId'));
    }
  }, [authorized]);

  if (!authorized) return null;

  return (
    <>
      <CandidateNav />
      <div className="container page">
        <div className="page-header">
          <h1>Candidate Portal Dashboard</h1>
          <p className="page-desc">
            Defence recruitment eligibility verification, application submission, and evaluation tracking.
          </p>
        </div>

        {candidateId && (
          <div className="info-banner">
            <div>
              Active Profile: <strong>{candidateName || candidateEmail}</strong> &bull; Candidate ID: <strong>#{candidateId}</strong>
            </div>
            <Link href="/application" className="btn btn-secondary btn-sm">
              View Status
            </Link>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          {/* Card 1: Register */}
          <div className="panel panel-accent" style={{ padding: '22px' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '8px' }}>
              Profile Registration
            </h3>
            <p style={{ color: 'var(--c-text-muted)', fontSize: '13.5px', marginBottom: '16px', minHeight: '40px' }}>
              Create or update your personal bio-data, physical measurements, and qualification records.
            </p>
            <Link href="/register" className="btn btn-secondary" style={{ width: '100%' }}>
              Register Profile
            </Link>
          </div>

          {/* Card 2: Notifications */}
          <div className="panel panel-accent" style={{ padding: '22px' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '8px' }}>
              Open Recruitments
            </h3>
            <p style={{ color: 'var(--c-text-muted)', fontSize: '13.5px', marginBottom: '16px', minHeight: '40px' }}>
              Browse active notifications, available vacancies, cutoff dates, and eligibility rules.
            </p>
            <Link href="/notifications" className="btn btn-secondary" style={{ width: '100%' }}>
              View Notifications
            </Link>
          </div>

          {/* Card 3: Apply */}
          <div className="panel panel-accent" style={{ padding: '22px' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '8px' }}>
              Apply for Commission
            </h3>
            <p style={{ color: 'var(--c-text-muted)', fontSize: '13.5px', marginBottom: '16px', minHeight: '40px' }}>
              Submit an application and immediately trigger automated database eligibility screening.
            </p>
            <Link href="/apply" className="btn btn-primary" style={{ width: '100%' }}>
              Submit Application
            </Link>
          </div>

          {/* Card 4: Applications */}
          <div className="panel panel-accent" style={{ padding: '22px' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '8px' }}>
              Track Applications
            </h3>
            <p style={{ color: 'var(--c-text-muted)', fontSize: '13.5px', marginBottom: '16px', minHeight: '40px' }}>
              Monitor screening outcomes, test scores, medical exam status, and selection decisions.
            </p>
            <Link href="/application" className="btn btn-secondary" style={{ width: '100%' }}>
              Track Status
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
