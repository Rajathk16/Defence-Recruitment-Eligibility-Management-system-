'use client';

import { useEffect, useState } from 'react';
import { supabase, envConfigured } from '@/lib/supabase';
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
    if (!envConfigured) {
      setLoading(false);
      return;
    }

    async function loadNotifications() {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from('notifications')
        .select('*, branches(name), eligibility_rules(*)')
        .order('id', { ascending: true });

      if (fetchErr) {
        setError(fetchErr.message);
      } else {
        setNotifications((data as unknown as NotificationRow[]) ?? []);
      }
      setLoading(false);
    }

    loadNotifications();
  }, [authorized]);

  if (!authorized) return null;

  return (
    <>
      <CandidateNav />
      <div className="container page">
        <h1>Open Recruitments</h1>
        <p className="page-desc">Current defence commission notifications and eligibility rules.</p>

        {!envConfigured && (
          <p className="error">
            Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to use this application.
          </p>
        )}

        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && envConfigured && (
          <div className="section">
            <NotificationsTable notifications={notifications} canEdit={false} />
          </div>
        )}
      </div>
    </>
  );
}
