'use client';

import { useEffect, useState } from 'react';
import { supabase, envConfigured } from '@/lib/supabase';
import CandidateNav from '@/components/CandidateNav';
import { useRole } from '@/lib/useRole';

interface CandidateOption {
  id: number;
  full_name: string;
  email: string;
}

export default function RegisterPage() {
  const authorized = useRole('candidate');

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

  // Second form state: add education to existing candidate
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [eduLevel, setEduLevel] = useState('GRADUATION');
  const [eduBoard, setEduBoard] = useState('');
  const [eduYear, setEduYear] = useState('');
  const [eduPct, setEduPct] = useState('');

  const [eduSaving, setEduSaving] = useState(false);
  const [eduError, setEduError] = useState<string | null>(null);
  const [eduSuccess, setEduSuccess] = useState<string | null>(null);

  async function loadCandidates() {
    if (!envConfigured) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'CANDIDATE')
      .order('id', { ascending: false });
    if (data) setCandidates(data);
  }

  useEffect(() => {
    if (authorized) {
      loadCandidates();
    }
  }, [authorized]);

  if (!authorized) return null;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!envConfigured) {
      setErrorMsg('Supabase environment variables are missing.');
      return;
    }

    setSaving(true);
    try {
      // 1. Insert into profiles
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .insert({
          full_name: fullName.trim(),
          email: email.trim(),
          dob,
          gender,
          marital_status: maritalStatus,
          state: state.trim(),
          role: 'CANDIDATE',
        })
        .select('id')
        .single();

      if (profErr) throw profErr;
      const candidateId = profData.id;

      // 2. Insert into physical_details
      const { error: physErr } = await supabase
        .from('physical_details')
        .insert({
          candidate_id: candidateId,
          height_cm: parseFloat(heightCm),
          weight_kg: parseFloat(weightKg),
          chest_normal_cm: chestNormalCm ? parseFloat(chestNormalCm) : null,
          chest_expanded_cm: chestExpandedCm ? parseFloat(chestExpandedCm) : null,
        });

      if (physErr) throw physErr;

      // 3. Insert into education
      const { error: eduErr } = await supabase
        .from('education')
        .insert({
          candidate_id: candidateId,
          level,
          board: board.trim(),
          year_passed: parseInt(yearPassed, 10),
          percentage: parseFloat(percentage),
        });

      if (eduErr) throw eduErr;

      // Save to sessionStorage
      sessionStorage.setItem('candidateId', String(candidateId));
      sessionStorage.setItem('candidateEmail', email.trim());

      setSuccessMsg(`Candidate registered successfully. Candidate ID: ${candidateId}`);

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

      loadCandidates();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register candidate.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddEducation(e: React.FormEvent) {
    e.preventDefault();
    setEduError(null);
    setEduSuccess(null);

    if (!selectedCandidateId) {
      setEduError('Please select a candidate.');
      return;
    }

    setEduSaving(true);
    try {
      const { error } = await supabase.from('education').insert({
        candidate_id: parseInt(selectedCandidateId, 10),
        level: eduLevel,
        board: eduBoard.trim(),
        year_passed: parseInt(eduYear, 10),
        percentage: parseFloat(eduPct),
      });

      if (error) throw error;

      setEduSuccess('Education record added.');
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
        <h1>Candidate Registration</h1>
        <p className="page-desc">Enter candidate profile, physical measurements, and qualification.</p>

        {/* Main Registration Form */}
        <form onSubmit={handleRegister} className="section">
          <h2>Personal details</h2>
          <div className="row">
            <div className="col">
              <label htmlFor="full-name">Full name</label>
              <input
                id="full-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="col">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="row">
            <div className="col">
              <label htmlFor="dob">Date of birth</label>
              <input
                id="dob"
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
            <div className="col">
              <label htmlFor="gender">Gender</label>
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
              <label htmlFor="marital-status">Marital status</label>
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
              <label htmlFor="state">State</label>
              <input
                id="state"
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
          </div>

          <h2 className="mt-16">Physical details</h2>
          <div className="row">
            <div className="col">
              <label htmlFor="height">Height (cm)</label>
              <input
                id="height"
                type="number"
                step="0.1"
                required
                placeholder="130 to 230"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
              />
            </div>
            <div className="col">
              <label htmlFor="weight">Weight (kg)</label>
              <input
                id="weight"
                type="number"
                step="0.1"
                required
                placeholder="35 to 150"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>
            <div className="col">
              <label htmlFor="chest-normal">Chest normal (cm)</label>
              <input
                id="chest-normal"
                type="number"
                step="0.1"
                placeholder="e.g. 80"
                value={chestNormalCm}
                onChange={(e) => setChestNormalCm(e.target.value)}
              />
            </div>
            <div className="col">
              <label htmlFor="chest-expanded">Chest expanded (cm)</label>
              <input
                id="chest-expanded"
                type="number"
                step="0.1"
                placeholder="Must be >= normal"
                value={chestExpandedCm}
                onChange={(e) => setChestExpandedCm(e.target.value)}
              />
            </div>
          </div>

          <h2 className="mt-16">Education record</h2>
          <div className="row">
            <div className="col">
              <label htmlFor="level">Level</label>
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
              <label htmlFor="board">Board / University</label>
              <input
                id="board"
                type="text"
                required
                value={board}
                onChange={(e) => setBoard(e.target.value)}
              />
            </div>
            <div className="col">
              <label htmlFor="year-passed">Year passed</label>
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
              <label htmlFor="percentage">Percentage</label>
              <input
                id="percentage"
                type="number"
                step="0.01"
                required
                placeholder="0 to 100"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-16">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Registering...' : 'Register candidate'}
            </button>
          </div>

          {errorMsg && <p className="error">{errorMsg}</p>}
          {successMsg && <p className="success mt-8">{successMsg}</p>}
        </form>

        {/* Second Form: Add extra education to existing candidate */}
        <div className="section">
          <h2>Add education to existing candidate</h2>
          <form onSubmit={handleAddEducation}>
            <div className="form-group">
              <label htmlFor="candidate-select">Select candidate</label>
              <select
                id="candidate-select"
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
              >
                <option value="">Select a candidate</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} - {c.full_name} ({c.email})
                  </option>
                ))}
              </select>
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
                  value={eduBoard}
                  onChange={(e) => setEduBoard(e.target.value)}
                />
              </div>
              <div className="col">
                <label htmlFor="extra-year">Year passed</label>
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
                <label htmlFor="extra-percentage">Percentage</label>
                <input
                  id="extra-percentage"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0 to 100"
                  value={eduPct}
                  onChange={(e) => setEduPct(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-16">
              <button type="submit" className="btn btn-secondary" disabled={eduSaving}>
                {eduSaving ? 'Adding...' : 'Add education record'}
              </button>
            </div>

            {eduError && <p className="error">{eduError}</p>}
            {eduSuccess && <p className="success mt-8">{eduSuccess}</p>}
          </form>
        </div>
      </div>
    </>
  );
}
