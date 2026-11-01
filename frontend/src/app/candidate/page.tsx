'use client';

import Link from 'next/link';
import CandidateNav from '@/components/CandidateNav';
import { useRole } from '@/lib/useRole';

export default function CandidateDashboard() {
  const authorized = useRole('candidate');

  if (!authorized) return null;

  return (
    <>
      <CandidateNav />
      <div className="container page">
        <h1>Candidate Dashboard</h1>
        <p className="page-desc">Select an action to proceed.</p>

        <div className="section" style={{ background: 'white', padding: '20px', border: '1px solid #ddd' }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <li>
              <Link href="/register" style={{ fontWeight: 600, color: '#1f4e79', textDecoration: 'none' }}>
                Register
              </Link>
              <div style={{ color: '#666', fontSize: '14px', marginTop: '2px' }}>
                Create your profile.
              </div>
            </li>
            <li>
              <Link href="/notifications" style={{ fontWeight: 600, color: '#1f4e79', textDecoration: 'none' }}>
                Notifications
              </Link>
              <div style={{ color: '#666', fontSize: '14px', marginTop: '2px' }}>
                See open recruitments.
              </div>
            </li>
            <li>
              <Link href="/apply" style={{ fontWeight: 600, color: '#1f4e79', textDecoration: 'none' }}>
                Apply
              </Link>
              <div style={{ color: '#666', fontSize: '14px', marginTop: '2px' }}>
                Apply for a notification.
              </div>
            </li>
            <li>
              <Link href="/application" style={{ fontWeight: 600, color: '#1f4e79', textDecoration: 'none' }}>
                Applications
              </Link>
              <div style={{ color: '#666', fontSize: '14px', marginTop: '2px' }}>
                See the status of your applications.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

