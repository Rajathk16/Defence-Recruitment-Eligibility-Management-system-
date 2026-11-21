'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CandidateNav from '@/components/CandidateNav';
import { useRole } from '@/lib/useRole';

export default function RegisterPage() {
  const authorized = useRole('candidate');

  // Candidate identity
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);
  const [activeCandidateEmail, setActiveCandidateEmail] = useState<string | null>(null);

  // Main form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('MALE');
  const [maritalStatus, setMaritalStatus] = useState('UNMARRIED');
  const [state, setState] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [chestNormalCm, setChestNormalCm] = useState('');
  const [chestExpandedCm, setChestExpandedCm] = useState('');

  // Initial education state
  const [level, setLevel] = useState('12TH');
  const [board, setBoard] = useState('');
  const [yearPassed, setYearPassed] = useState('');
  const [percentage, setPercentage] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Extra education form state
  const [eduLevel, setEduLevel] = useState('GRADUATION');
  const [eduBoard, setEduBoard] = useState('');
  const [eduYear, setEduYear] = useState('');
  const [eduPct, setEduPct] = useState('');

  const [eduSaving, setEduSaving] = useState(false);
  const [eduError, setEduError] = useState<string | null>(null);
  const [eduSuccess, setEduSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authorized) {
      setActiveCandidateId(sessionStorage.getItem('candidateId'));
      setActiveCandidateEmail(sessionStorage.getItem('candidateEmail'));
    }
  }, [authorized]);

  if (!authorized) return null;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSaving(true);

    try {
      const res = await fetch('/api/candidate/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          dob,
          gender,
          maritalStatus,
          state,
          heightCm,
          weightKg,
          chestNormalCm,
          chestExpandedCm,
          level,
          board,
          yearPassed,
          percentage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register candidate.');
      }

      sessionStorage.setItem('candidateId', String(data.candidateId));
      sessionStorage.setItem('candidateEmail', email.trim());
      sessionStorage.setItem('candidateName', fullName.trim());
      setActiveCandidateId(String(data.candidateId));
      setActiveCandidateEmail(email.trim());

      setSuccessMsg(
        `Profile registered successfully! Assigned Candidate ID: #${data.candidateId}. You are now authenticated.`
      );

      // Clear main form
      setFullName('');
      setEmail('');
      setDob('');
      setState('');
      setHeightCm('');
      setWeightKg('');
      setChestNormalCm('');
      setChestExpandedCm('');
      setBoard('');
      setYearPassed('');
      setPercentage('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddEducation(e: React.FormEvent) {
    e.preventDefault();
    setEduError(null);
    setEduSuccess(null);

    if (!activeCandidateId) {
      setEduError('Please register or sign in to your profile before adding additional qualification records.');
      return;
    }

    setEduSaving(true);
    try {
      const res = await fetch('/api/candidate/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: eduLevel,
          board: eduBoard,
          yearPassed: eduYear,
          percentage: eduPct,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add education record.');
      }

      setEduSuccess('Additional qualification record added successfully.');
      setEduBoard('');
      setEduYear('');
      setEduPct('');
    } catch (err: any) {
      setEduError(err.message || 'Failed to add education record.');
    } finally {
      setEduSaving(false);
    }
  }

  return (
    <>
      <CandidateNav />
      <div className="container page">
        <div className="page-header">
          <h1>Candidate Registration</h1>
          <p className="page-desc">
            Submit your personal details, physical measurements, and educational qualifications for recruitment eligibility.
          </p>
        </div>

        {activeCandidateId && (
          <div className="info-banner">
            <div>
              Active Profile: <strong>{activeCandidateEmail}</strong> (Candidate #{activeCandidateId})
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/apply" className="btn btn-primary btn-sm">
                Apply for Entry
              </Link>
            </div>
          </div>
        )}

        {/* Main Profile Registration */}
        <div className="panel panel-accent">
          <div className="panel-header">
            <span className="panel-title">Initial Profile & Qualification Registration</span>
          </div>

          <form onSubmit={handleRegister}>
            <h3 style={{ fontSize: '1rem', marginBottom: '14px' }}>1. Personal Bio-Data</h3>
            <div className="row">
              <div className="col">
                <label htmlFor="full-name">
                  Full Name <span className="required-star">*</span>
                </label>
                <input
                  id="full-name"
                  type="text"
                  required
                  placeholder="e.g. Vikram Batra"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="email">
                  Email Address <span className="required-star">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="row" style={{ marginTop: '12px' }}>
              <div className="col">
                <label htmlFor="dob">
                  Date of Birth <span className="required-star">*</span>
                </label>
                <input
                  id="dob"
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="gender">
                  Gender <span className="required-star">*</span>
                </label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div className="col">
                <label htmlFor="marital-status">
                  Marital Status <span className="required-star">*</span>
                </label>
                <select
                  id="marital-status"
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                >
                  <option value="UNMARRIED">UNMARRIED</option>
                  <option value="MARRIED">MARRIED</option>
                  <option value="DIVORCED">DIVORCED</option>
                  <option value="WIDOWED">WIDOWED</option>
                </select>
              </div>
              <div className="col">
                <label htmlFor="state">
                  Domicile State <span className="required-star">*</span>
                </label>
                <input
                  id="state"
                  type="text"
                  required
                  placeholder="e.g. Himachal Pradesh"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', marginTop: '24px', marginBottom: '14px' }}>
              2. Physical Standards
            </h3>
            <div className="row">
              <div className="col">
                <label htmlFor="height">
                  Height (cm) <span className="required-star">*</span>
                </label>
                <input
                  id="height"
                  type="number"
                  step="0.1"
                  required
                  placeholder="130.0 to 230.0"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="weight">
                  Weight (kg) <span className="required-star">*</span>
                </label>
                <input
                  id="weight"
                  type="number"
                  step="0.1"
                  required
                  placeholder="35.0 to 150.0"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="chest-normal">Chest Normal (cm)</label>
                <input
                  id="chest-normal"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 80.0"
                  value={chestNormalCm}
                  onChange={(e) => setChestNormalCm(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="chest-expanded">Chest Expanded (cm)</label>
                <input
                  id="chest-expanded"
                  type="number"
                  step="0.1"
                  placeholder="Must be >= Normal"
                  value={chestExpandedCm}
                  onChange={(e) => setChestExpandedCm(e.target.value)}
                />
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', marginTop: '24px', marginBottom: '14px' }}>
              3. Highest Academic Qualification
            </h3>
            <div className="row">
              <div className="col">
                <label htmlFor="level">
                  Level <span className="required-star">*</span>
                </label>
                <select
                  id="level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  <option value="10TH">10TH</option>
                  <option value="12TH">12TH</option>
                  <option value="GRADUATION">GRADUATION</option>
                </select>
              </div>
              <div className="col">
                <label htmlFor="board">
                  Board / University <span className="required-star">*</span>
                </label>
                <input
                  id="board"
                  type="text"
                  required
                  placeholder="e.g. CBSE / Delhi University"
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="year-passed">
                  Year of Passing <span className="required-star">*</span>
                </label>
                <input
                  id="year-passed"
                  type="number"
                  required
                  placeholder="e.g. 2024"
                  value={yearPassed}
                  onChange={(e) => setYearPassed(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="percentage">
                  Percentage (%) <span className="required-star">*</span>
                </label>
                <input
                  id="percentage"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00 to 100.00"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-24">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Registering...' : 'Submit Profile & Register'}
              </button>
            </div>

            {errorMsg && <div className="error mt-16">{errorMsg}</div>}
            {successMsg && <div className="success mt-16">{successMsg}</div>}
          </form>
        </div>

        {/* Second Form: Add Extra Education */}
        <div className="panel panel-accent">
          <div className="panel-header">
            <span className="panel-title">Add Additional Qualification Record</span>
          </div>

          <form onSubmit={handleAddEducation}>
            <div style={{ marginBottom: '16px', color: 'var(--c-text-muted)', fontSize: '13.5px' }}>
              {activeCandidateId ? (
                <span>Adding additional qualification for: <strong>{activeCandidateEmail}</strong> (Candidate #{activeCandidateId})</span>
              ) : (
                <span>Please complete initial profile registration above before adding extra qualifications.</span>
              )}
            </div>

            <div className="row">
              <div className="col">
                <label htmlFor="extra-level">Level</label>
                <select
                  id="extra-level"
                  value={eduLevel}
                  onChange={(e) => setEduLevel(e.target.value)}
                >
                  <option value="10TH">10TH</option>
                  <option value="12TH">12TH</option>
                  <option value="GRADUATION">GRADUATION</option>
                </select>
              </div>
              <div className="col">
                <label htmlFor="extra-board">Board / University</label>
                <input
                  id="extra-board"
                  type="text"
                  required
                  placeholder="e.g. Central University"
                  value={eduBoard}
                  onChange={(e) => setEduBoard(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="extra-year">Year Passed</label>
                <input
                  id="extra-year"
                  type="number"
                  required
                  placeholder="e.g. 2025"
                  value={eduYear}
                  onChange={(e) => setEduYear(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="extra-percentage">Percentage (%)</label>
                <input
                  id="extra-percentage"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00 to 100.00"
                  value={eduPct}
                  onChange={(e) => setEduPct(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-16">
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={eduSaving || !activeCandidateId}
              >
                {eduSaving ? 'Saving...' : 'Add Qualification Record'}
              </button>
            </div>

            {eduError && <div className="error mt-16">{eduError}</div>}
            {eduSuccess && <div className="success mt-16">{eduSuccess}</div>}
          </form>
        </div>
      </div>
    </>
  );
}
