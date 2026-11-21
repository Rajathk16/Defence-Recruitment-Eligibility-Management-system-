'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CandidateNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [candidateInfo, setCandidateInfo] = useState<string | null>(null);

  useEffect(() => {
    const email = sessionStorage.getItem('candidateEmail');
    const id = sessionStorage.getItem('candidateId');
    if (email && id) {
      setCandidateInfo(`#${id} (${email})`);
    } else if (email) {
      setCandidateInfo(email);
    }
  }, []);

  async function handleLogout(e: React.MouseEvent) {
    e.preventDefault();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    sessionStorage.clear();
    router.push('/');
  }

  return (
    <header>
      <nav>
        <div className="nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <Link href="/candidate" className="brand-section">
              <div className="crest-badge" title="DREMS Insignia">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm0 3.5l6 3.33v4.67c0 4.22-2.82 8.16-6 9.42-3.18-1.26-6-5.2-6-9.42V8.83l6-3.33z" />
                </svg>
              </div>
              <div className="brand-text">
                <span className="brand-title">DREMS</span>
                <span className="brand-subtitle">Candidate Portal</span>
              </div>
            </Link>

            <ul>
              <li>
                <Link
                  href="/candidate"
                  className={`nav-link ${pathname === '/candidate' ? 'active' : ''}`}
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className={`nav-link ${pathname === '/register' ? 'active' : ''}`}
                >
                  Register
                </Link>
              </li>
              <li>
                <Link
                  href="/notifications"
                  className={`nav-link ${pathname === '/notifications' ? 'active' : ''}`}
                >
                  Notifications
                </Link>
              </li>
              <li>
                <Link
                  href="/apply"
                  className={`nav-link ${pathname === '/apply' ? 'active' : ''}`}
                >
                  Apply
                </Link>
              </li>
              <li>
                <Link
                  href="/application"
                  className={`nav-link ${pathname === '/application' ? 'active' : ''}`}
                >
                  Applications
                </Link>
              </li>
            </ul>
          </div>

          <div className="nav-actions">
            <span className="role-badge candidate">
              Candidate {candidateInfo ? candidateInfo : ''}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              title="Sign out of candidate session"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
