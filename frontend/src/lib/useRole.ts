'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface UserSessionInfo {
  role: 'candidate' | 'officer';
  candidateId?: number | null;
  email?: string | null;
  fullName?: string | null;
}

export function useRole(requiredRole: 'candidate' | 'officer') {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verifyAuth() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();

        if (!isMounted) return;

        if (data?.authenticated && data.user?.role === requiredRole) {
          sessionStorage.setItem('role', data.user.role);
          if (data.user.candidateId) {
            sessionStorage.setItem('candidateId', String(data.user.candidateId));
          }
          if (data.user.email) {
            sessionStorage.setItem('candidateEmail', data.user.email);
          }
          if (data.user.fullName) {
            sessionStorage.setItem('candidateName', data.user.fullName);
          }
          setAuthorized(true);
        } else if (requiredRole === 'candidate') {
          // Candidate routes are applicant-facing: auto-initialize candidate session if needed
          if (data?.authenticated && data.user?.role === 'officer') {
            setAuthorized(true);
          } else {
            await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: 'candidate' }),
            });
            sessionStorage.setItem('role', 'candidate');
            setAuthorized(true);
          }
        } else {
          // Officer route requires officer authorization
          sessionStorage.clear();
          setAuthorized(false);
          router.replace(`/?error=unauthorized_${requiredRole}`);
        }
      } catch {
        const localRole = sessionStorage.getItem('role');
        if (localRole === requiredRole || requiredRole === 'candidate') {
          setAuthorized(true);
        } else {
          router.replace('/');
        }
      }
    }

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [requiredRole, router]);

  return authorized;
}
