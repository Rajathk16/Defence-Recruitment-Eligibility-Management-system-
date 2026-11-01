'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OFFICER_CODE } from '@/lib/config';

export default function LandingPage() {
  const router = useRouter();
  const [role, setRole] = useState<'candidate' | 'officer'>('candidate');
  const [officerCode, setOfficerCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (role === 'candidate') {
      sessionStorage.setItem('role', 'candidate');
      router.push('/candidate');
      return;
    }

    if (role === 'officer') {
      if (officerCode.trim() === OFFICER_CODE) {
        sessionStorage.setItem('role', 'officer');
        router.push('/notification');
      } else {
        setErrorMsg('Wrong code.');
      }
    }
  }

  return (
    <div className="container page" style={{ maxWidth: '480px', marginTop: '60px' }}>
      <h1>Defence Recruitment Eligibility Management System</h1>
      <p className="page-desc">Choose how you want to use the system.</p>

      <form onSubmit={handleContinue} className="section" style={{ background: 'white', padding: '20px', border: '1px solid #ddd' }}>
        <div className="form-group">
          <label htmlFor="role-select">I am a</label>
          <select
            id="role-select"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as 'candidate' | 'officer');
              setErrorMsg(null);
              setOfficerCode('');
            }}
          >
            <option value="candidate">Candidate</option>
            <option value="officer">Officer</option>
          </select>
        </div>

        {role === 'officer' && (
          <div className="form-group">
            <label htmlFor="officer-code">Officer code</label>
            <input
              id="officer-code"
              type="password"
              maxLength={4}
              required
              placeholder="4-digit code"
              value={officerCode}
              onChange={(e) => {
                setOfficerCode(e.target.value);
                setErrorMsg(null);
              }}
            />
          </div>
        )}

        <div className="mt-16">
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Continue
          </button>
        </div>

        {errorMsg && <p className="error mt-8">{errorMsg}</p>}
      </form>
    </div>
  );
}
