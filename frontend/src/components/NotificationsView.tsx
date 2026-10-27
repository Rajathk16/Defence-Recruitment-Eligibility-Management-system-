'use client';

import React, { useState } from 'react';
import { FileText, Calendar, Users, Shield, Download, ChevronRight, X, AlertCircle, FileCheck } from 'lucide-react';
import { RecruitmentNotification, DefenceBranch, CandidateProfile } from '../lib/types';

interface NotificationsViewProps {
  notifications: RecruitmentNotification[];
  branches: DefenceBranch[];
  candidates: CandidateProfile[];
  onApply: (candidate: CandidateProfile, notificationId: string) => void;
}

export default function NotificationsView({
  notifications,
  branches,
  candidates,
  onApply,
}: NotificationsViewProps) {
  const [selectedNotification, setSelectedNotification] = useState<RecruitmentNotification | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(candidates[0]?.id || '');
  const [undertakingChecked, setUndertakingChecked] = useState(true);

  const getBranch = (branchId: string) => branches.find((b) => b.id === branchId);

  const handleApplyClick = (notification: RecruitmentNotification) => {
    setSelectedNotification(notification);
  };

  const confirmApplication = () => {
    if (!selectedNotification || !undertakingChecked) return;
    const candidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0];
    onApply(candidate, selectedNotification.id);
    setSelectedNotification(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Title */}
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
            <FileText size={20} color="var(--army-crimson)" />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--army-crimson-dark)' }}>
              भर्ती अधिसूचनाएं एवं रैलियां | Recruitment Notifications & Rallies
            </h1>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>
            Official commission entries released under the Ministry of Defence, Integrated Headquarters (Army, Navy, Air Force).
          </div>
        </div>

        <div className="stamp-badge stamp-gold" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
          SESSION 2026-2027
        </div>
      </div>

      {/* Official Government Notifications Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <span className="gov-card-title">
            <Shield size={18} color="var(--army-crimson)" />
            सक्रिय भर्ती सूचनाएं (Active Armed Forces Recruitment Campaigns)
          </span>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Showing {notifications.length} Active Directives
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="gov-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>NOTIFICATION NO.</th>
                <th>ENTRY TITLE & BRANCH</th>
                <th>COMMISSION TYPE</th>
                <th style={{ textAlign: 'center' }}>VACANCIES</th>
                <th>AGE & QUALIFICATION</th>
                <th>LAST DATE</th>
                <th style={{ textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notif) => {
                const branch = getBranch(notif.branch_id);
                const rules = notif.rules;

                return (
                  <tr key={notif.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#7b1113' }}>
                      {notif.notification_number}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0c3866', fontSize: '0.9rem' }}>
                        {notif.title}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                        Branch: <strong>{branch?.name}</strong> • Motto: <em>"{branch?.motto}"</em>
                      </div>
                    </td>
                    <td>
                      <span className="stamp-badge stamp-blue">
                        {notif.entry_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#b45309', fontSize: '0.95rem' }}>
                      {notif.total_vacancies.toLocaleString()}
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {rules ? (
                        <div>
                          <div>Age: <strong>{rules.min_age_years} - {rules.max_age_years} yrs</strong></div>
                          <div>Min: <strong>{rules.min_qualification_level}</strong> (Min {rules.min_aggregate_percentage}%)</div>
                        </div>
                      ) : (
                        'Standard Rules'
                      )}
                    </td>
                    <td style={{ fontSize: '0.82rem', fontWeight: 600, color: '#991b1b' }}>
                      {notif.application_end_date}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleApplyClick(notif)}
                        className="gov-btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        Apply Online
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Guidelines & Instructions Note */}
      <div style={{
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderLeft: '4px solid #b45309',
        padding: '14px 18px',
        borderRadius: '3px',
        fontSize: '0.82rem',
        color: '#78350f',
        lineHeight: 1.5,
      }}>
        <strong>महत्वपूर्ण निर्देश | Guidelines for Online Application:</strong>
        <ol style={{ paddingLeft: '20px', marginTop: '6px' }}>
          <li>Candidates must ensure they fulfill all eligibility conditions including age, educational qualification, and physical standards as laid down in the notification.</li>
          <li>Admission at all stages of the examination will be purely provisional subject to satisfying prescribed eligibility conditions.</li>
          <li>Verification of eligibility is automatically performed by the automated DBMS screening engine. Ineligible submissions will be rejected at Stage 0.</li>
        </ol>
      </div>

      {/* Official Application Form Modal */}
      {selectedNotification && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
        }}>
          <div className="gov-card" style={{ width: '100%', maxWidth: '580px', background: '#fff', borderTop: '4px solid #7b1113' }}>
            <div className="gov-card-header" style={{ background: '#7b1113', color: '#fff' }}>
              <span style={{ fontWeight: 700, fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={18} color="#fff" />
                ऑनलाइन आवेदन पत्र | Official Online Application Submission
              </span>
              <button
                onClick={() => setSelectedNotification(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="gov-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="gov-label">Target Commission Entry:</label>
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  padding: '8px 12px',
                  fontWeight: 700,
                  color: '#0c3866',
                  fontSize: '0.92rem',
                }}>
                  [{selectedNotification.notification_number}] {selectedNotification.title}
                </div>
              </div>

              <div>
                <label className="gov-label">Select Candidate Profile (Aadhaar Linked):</label>
                <select
                  value={selectedCandidateId}
                  onChange={(e) => setSelectedCandidateId(e.target.value)}
                  className="gov-select"
                >
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} | {c.gender} | DOB: {c.dob} | Height: {c.height_cm}cm | {c.qualification_level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Legal Undertaking */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '12px',
                borderRadius: '3px',
                fontSize: '0.8rem',
                color: '#334155',
              }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={undertakingChecked}
                    onChange={(e) => setUndertakingChecked(e.target.checked)}
                    style={{ marginTop: '2px', accentColor: 'var(--army-crimson)' }}
                  />
                  <span>
                    <strong>Undertaking:</strong> I hereby declare that all statements made in this application are true, complete, and correct to the best of my knowledge. I understand that false statements will result in automatic rejection under Section 19 of Army Rules.
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="gov-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApplication}
                  disabled={!undertakingChecked}
                  className="gov-btn-primary"
                >
                  Confirm & Submit Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
