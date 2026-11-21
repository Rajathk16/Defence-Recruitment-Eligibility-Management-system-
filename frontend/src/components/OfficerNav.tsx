'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function OfficerNav() {
  const router = useRouter();
  const pathname = usePathname();

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
            <Link href="/notification" className="brand-section">
              <div className="crest-badge" title="DREMS Insignia">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v5.18c0 4.54-3.08 8.8-7 9.94-3.92-1.14-7-5.4-7-9.94V6.3l7-3.12zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z" />
                </svg>
              </div>
              <div className="brand-text">
                <span className="brand-title">DREMS</span>
                <span className="brand-subtitle">Officer Administration</span>
              </div>
            </Link>

            <ul>
              <li>
                <Link
                  href="/notification"
                  className={`nav-link ${pathname === '/notification' ? 'active' : ''}`}
                >
                  Notifications Management
                </Link>
              </li>
              <li>
                <Link
                  href="/officer"
                  className={`nav-link ${pathname === '/officer' ? 'active' : ''}`}
                >
                  Officer Console
                </Link>
              </li>
            </ul>
          </div>

          <div className="nav-actions">
            <span className="role-badge officer">
              Officer Authorized
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              title="Secure officer sign out"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
