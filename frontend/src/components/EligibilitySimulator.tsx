'use client';

import React, { useState, useMemo } from 'react';
import { Target, CheckCircle2, XCircle, AlertTriangle, ArrowRight, UserCheck, Shield, HelpCircle, FileCheck } from 'lucide-react';
import { CandidateProfile, RecruitmentNotification } from '../lib/types';
import { evaluateEligibility } from '../lib/eligibilityEngine';

interface EligibilitySimulatorProps {
  notifications: RecruitmentNotification[];
  candidates: CandidateProfile[];
  onApply: (candidate: CandidateProfile, notificationId: string) => void;
}

export default function EligibilitySimulator({
  notifications,
  candidates,
  onApply,
}: EligibilitySimulatorProps) {
  const [selectedNotificationId, setSelectedNotificationId] = useState<string>(
    notifications[0]?.id || ''
  );

  const [profile, setProfile] = useState<CandidateProfile>({
    id: 'simulated-candidate',
    full_name: 'Simulated Aspirant',
    email: 'aspirant@defence.gov.in',
    phone: '9876543210',
    dob: '2008-01-15',
    gender: 'MALE',
    marital_status: 'UNMARRIED',
    nationality: 'INDIAN',
    domicile_state: 'Himachal Pradesh',
    role: 'CANDIDATE',
    height_cm: 175.0,
    weight_kg: 66.0,
    chest_normal_cm: 82.0,
    chest_expanded_cm: 88.0,
    eye_vision_left: '6/6',
    eye_vision_right: '6/6',
    color_blindness: false,
    qualification_level: '12TH',
    stream_specialization: 'Physics, Chemistry, Maths',
    aggregate_percentage: 82.0,
    pcm_percentage: 85.0,
  });

  const selectedNotification = useMemo(() => {
    return notifications.find((n) => n.id === selectedNotificationId) || notifications[0];
  }, [notifications, selectedNotificationId]);

  const evalResult = useMemo(() => {
    if (!selectedNotification) return null;
    return evaluateEligibility(profile, selectedNotification);
  }, [profile, selectedNotification]);

  const loadPreset = (candId: string) => {
    const found = candidates.find((c) => c.id === candId);
    if (found) {
      setProfile({ ...found });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Official Government Page Title Banner */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderLeft: '5px solid var(--army-crimson)',
        padding: '14px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={20} color="var(--army-crimson)" />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--army-crimson-dark)' }}>
              पात्रता जांचें | Online Eligibility Verification Engine
            </h1>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>
            Official screening module conforming to Indian Army Recruitment Directive 2026 and PostgreSQL Stored Function <code style={{ color: '#7b1113', fontWeight: 700 }}>fn_evaluate_eligibility()</code>.
          </div>
        </div>

        {/* Demo Quick Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
            Select Test Aspirant (Viva Demo):
          </span>
          <select
            onChange={(e) => loadPreset(e.target.value)}
            className="gov-select"
            style={{ width: 'auto', minWidth: '220px', fontSize: '0.82rem' }}
          >
            <option value="">-- Choose Preset Candidate --</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} ({c.gender}, Height: {c.height_cm}cm)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Form Left, Govt Assessment Memorandum Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
        {/* Left Form: Official Govt Inputs */}
        <div className="gov-card">
          <div className="gov-card-header">
            <span className="gov-card-title">
              <Shield size={18} color="var(--army-crimson)" />
              खंड 1: उम्मीदवार विवरण एवं शारीरिक मापदंड (Candidate Details)
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>* All fields are mandatory</span>
          </div>

          <div className="gov-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Target Entry */}
            <div>
              <label className="gov-label">
                Select Recruitment Notification / Entry Applied For:
              </label>
              <select
                value={selectedNotificationId}
                onChange={(e) => setSelectedNotificationId(e.target.value)}
                className="gov-select"
                style={{ fontWeight: 600, color: '#0c3866' }}
              >
                {notifications.map((n) => (
                  <option key={n.id} value={n.id}>
                    [{n.notification_number}] {n.title} (Vacancies: {n.total_vacancies})
                  </option>
                ))}
              </select>
            </div>

            {/* Demographics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="gov-label">Date of Birth (as per Matriculation Certificate):</label>
                <input
                  type="date"
                  value={profile.dob}
                  onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                  className="gov-input"
                />
              </div>

              <div>
                <label className="gov-label">Gender / लिंग:</label>
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}
                  className="gov-select"
                >
                  <option value="MALE">Male (पुरुष)</option>
                  <option value="FEMALE">Female (महिला)</option>
                </select>
              </div>
            </div>

            {/* Marital & Domicile */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="gov-label">Marital Status / वैवाहिक स्थिति:</label>
                <select
                  value={profile.marital_status}
                  onChange={(e) => setProfile({ ...profile, marital_status: e.target.value as any })}
                  className="gov-select"
                >
                  <option value="UNMARRIED">Unmarried (अविवाहित)</option>
                  <option value="MARRIED">Married (विवाहित)</option>
                  <option value="DIVORCED">Divorced / Widowed</option>
                </select>
              </div>

              <div>
                <label className="gov-label">Domicile State / निवास राज्य:</label>
                <select
                  value={profile.domicile_state}
                  onChange={(e) => setProfile({ ...profile, domicile_state: e.target.value })}
                  className="gov-select"
                >
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Delhi">Delhi (NCT)</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Haryana">Haryana</option>
                </select>
              </div>
            </div>

            {/* Physical Standards Fieldset */}
            <fieldset style={{ border: '1px solid #cbd5e1', padding: '12px 14px', borderRadius: '4px', background: '#f8fafc' }}>
              <legend style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--army-crimson-dark)', padding: '0 6px' }}>
                Physical Standards (शारीरिक मानक)
              </legend>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="gov-label">Height (in cms) / ऊंचाई:</label>
                  <input
                    type="number"
                    step="0.5"
                    value={profile.height_cm}
                    onChange={(e) => setProfile({ ...profile, height_cm: parseFloat(e.target.value) || 0 })}
                    className="gov-input"
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    Army Min: 157.0 cm (Male) | 152.0 cm (Female)
                  </span>
                </div>

                <div>
                  <label className="gov-label">Weight (in kg) / वजन:</label>
                  <input
                    type="number"
                    step="0.5"
                    value={profile.weight_kg}
                    onChange={(e) => setProfile({ ...profile, weight_kg: parseFloat(e.target.value) || 0 })}
                    className="gov-input"
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Standard weight corresponding to age & height</span>
                </div>
              </div>

              {profile.gender === 'MALE' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                  <div>
                    <label className="gov-label">Chest Normal (cm) / सीना सामान्य:</label>
                    <input
                      type="number"
                      step="0.5"
                      value={profile.chest_normal_cm || 80}
                      onChange={(e) => setProfile({ ...profile, chest_normal_cm: parseFloat(e.target.value) || 0 })}
                      className="gov-input"
                    />
                  </div>
                  <div>
                    <label className="gov-label">Chest Expanded (cm) / सीना फुलाव:</label>
                    <input
                      type="number"
                      step="0.5"
                      value={profile.chest_expanded_cm || 85}
                      onChange={(e) => setProfile({ ...profile, chest_expanded_cm: parseFloat(e.target.value) || 0 })}
                      className="gov-input"
                    />
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Minimum 5.0 cm expansion required</span>
                  </div>
                </div>
              )}
            </fieldset>

            {/* Academic Fieldset */}
            <fieldset style={{ border: '1px solid #cbd5e1', padding: '12px 14px', borderRadius: '4px', background: '#f8fafc' }}>
              <legend style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--army-crimson-dark)', padding: '0 6px' }}>
                Academic Qualifications (शैक्षणिक योग्यता)
              </legend>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="gov-label">Highest Qualification:</label>
                  <select
                    value={profile.qualification_level}
                    onChange={(e) => setProfile({ ...profile, qualification_level: e.target.value })}
                    className="gov-select"
                  >
                    <option value="10TH">10th Matriculation</option>
                    <option value="12TH">10+2 Intermediate</option>
                    <option value="GRADUATION">Graduation (BA/BSc/BCom)</option>
                    <option value="GRADUATION_BTECH">B.E. / B.Tech (Engineering)</option>
                  </select>
                </div>

                <div>
                  <label className="gov-label">Aggregate %:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={profile.aggregate_percentage}
                    onChange={(e) => setProfile({ ...profile, aggregate_percentage: parseFloat(e.target.value) || 0 })}
                    className="gov-input"
                  />
                </div>

                <div>
                  <label className="gov-label">10+2 PCM %:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={profile.pcm_percentage || 0}
                    onChange={(e) => setProfile({ ...profile, pcm_percentage: parseFloat(e.target.value) || 0 })}
                    className="gov-input"
                  />
                </div>
              </div>
            </fieldset>

            {/* Medical Check */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '8px', border: '1px solid #e2e8f0' }}>
              <input
                type="checkbox"
                id="armyColorBlindness"
                checked={profile.color_blindness || false}
                onChange={(e) => setProfile({ ...profile, color_blindness: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--army-crimson)', cursor: 'pointer' }}
              />
              <label htmlFor="armyColorBlindness" style={{ fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}>
                Suffering from Color Vision Deficiency / Color Blindness (CP-4 / CP-5)
              </label>
            </div>
          </div>
        </div>

        {/* Right Card: Official Government Assessment Memorandum */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="gov-card gov-card-gold">
            <div className="gov-card-header" style={{ background: '#fffdf5' }}>
              <span className="gov-card-title">
                <FileCheck size={18} color="#b45309" />
                पात्रता मूल्यांकन पत्र | Screening Memorandum
              </span>
              {evalResult?.is_eligible ? (
                <span className="stamp-badge stamp-eligible">
                  <CheckCircle2 size={13} /> ELIGIBLE
                </span>
              ) : (
                <span className="stamp-badge stamp-rejected">
                  <XCircle size={13} /> NOT ELIGIBLE
                </span>
              )}
            </div>

            <div className="gov-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Benchmark Reference Banner */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '3px',
                padding: '10px 12px',
                fontSize: '0.82rem',
                lineHeight: 1.4,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Benchmark Cutoff Date:</span>
                  <span style={{ fontWeight: 700, color: '#0c3866' }}>{selectedNotification?.cutoff_date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Calculated Age as on Cutoff:</span>
                  <span style={{ fontWeight: 700, color: '#7b1113', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                    {evalResult?.calculated_age} Years
                  </span>
                </div>
              </div>

              {/* Individual Standard Checks Table */}
              <table className="gov-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>STANDARD / मापदंड</th>
                    <th>VERIFICATION RESULT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {evalResult?.checks.map((chk, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{chk.label}</td>
                      <td style={{ fontSize: '0.78rem', color: chk.passed ? '#065f46' : '#991b1b' }}>
                        {chk.detail}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {chk.passed ? (
                          <span className="stamp-badge stamp-eligible">PASS</span>
                        ) : (
                          <span className="stamp-badge stamp-rejected">FAIL</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Official Remarks Note */}
              <div style={{
                background: evalResult?.is_eligible ? '#f0fdf4' : '#fef2f2',
                border: evalResult?.is_eligible ? '1px solid #86efac' : '1px solid #fca5a5',
                padding: '10px 12px',
                fontSize: '0.8rem',
                borderRadius: '3px',
                color: evalResult?.is_eligible ? '#166534' : '#991b1b',
              }}>
                <strong>Official Decision:</strong> {evalResult?.summaryRemarks}
              </div>

              {/* Submit Application Button */}
              <button
                onClick={() => onApply(profile, selectedNotificationId)}
                className="gov-btn-primary"
                style={{ width: '100%', padding: '10px', marginTop: '4px' }}
              >
                <span>{evalResult?.is_eligible ? 'Proceed to Application Submission' : 'Submit Test Application (Triggers Rejection)'}</span>
                <ArrowRight size={16} />
              </button>

              <div style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'center', lineHeight: 1.4 }}>
                * Verified under Section 19 of the Armed Forces Recruitment Regulations. Real-time insertion into the PostgreSQL <code style={{ color: '#7b1113' }}>applications</code> table.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
