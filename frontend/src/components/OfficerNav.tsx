'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OfficerNav() {
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
            <Link href="/notification" className="site-title">
              DREMS (Officer)
            </Link>
            <ul>
              <li>
                <Link href="/notification">Notifications</Link>
              </li>
              <li>
                <Link href="/officer">Officer</Link>
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

