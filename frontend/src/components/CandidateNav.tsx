'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CandidateNav() {
  const router = useRouter();

  function handleChangeRole(e: React.MouseEvent) {
    e.preventDefault();
    sessionStorage.clear();
    router.push('/');
  }

  return (
    <header>
      <nav>
        <div className="nav-inner" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link href="/candidate" className="site-title">
              DREMS (Candidate)
            </Link>
            <ul>
              <li>
                <Link href="/candidate">Dashboard</Link>
              </li>
              <li>
                <Link href="/register">Register</Link>
              </li>
              <li>
                <Link href="/notifications">Notifications</Link>
              </li>
              <li>
                <Link href="/apply">Apply</Link>
              </li>
              <li>
                <Link href="/application">Applications</Link>
              </li>
            </ul>
          </div>
          <div>
            <a href="/" onClick={handleChangeRole} style={{ color: '#666', fontSize: '13px' }}>
              Change role
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}

