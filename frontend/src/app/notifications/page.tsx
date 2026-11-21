'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CandidateNav from '@/components/CandidateNav';
import NotificationsTable, { NotificationRow } from '@/components/NotificationsTable';
import { useRole } from '@/lib/useRole';

export default function CandidateNotificationsPage() {
  const authorized = useRole('candidate');
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authorized) return;

    async function loadNotifications() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/officer/notifications');
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load notifications.');
        }
        setNotifications((data.notifications as NotificationRow[]) ?? []);
      } catch (err: any) {
        setError(err.message || 'Error loading recruitments.');
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, [authorized]);

  if (!authorized) return null;

  return (
    <>
      <CandidateNav />
      <div className="container page">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>Open Commission Notifications</h1>
            <p className="page-desc">
              Current active defence recruitment notifications, vacancies, cutoff dates, and eligibility rules.
            </p>
          </div>
          <div>
            <Link href="/apply" className="btn btn-primary">
              Proceed to Apply
            </Link>
          </div>
        </div>

        {error && <div className="error mb-16">{error}</div>}

        {loading ? (
          <div className="panel" style={{ textAlign: 'center', padding: '36px' }}>
            <span style={{ color: 'var(--c-text-muted)' }}>Loading active commission notifications...</span>
          </div>
        ) : (
          <div className="section">
            <NotificationsTable notifications={notifications} canEdit={false} />
          </div>
        )}
      </div>
    </>
  );
}
