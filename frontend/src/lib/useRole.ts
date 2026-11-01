'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useRole(requiredRole: 'candidate' | 'officer') {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const role = sessionStorage.getItem('role');
    if (!role || role !== requiredRole) {
      router.replace('/');
    } else {
      setAuthorized(true);
    }
  }, [requiredRole, router]);

  return authorized;
}

