'use client';

import React, { useState } from 'react';
import { User, CheckCircle2, XCircle, Clock, Shield, Award, Activity, FileText, Printer, AlertCircle, Download, Check } from 'lucide-react';
import { CandidateProfile, Application, SelectionStage, TestScore, MedicalExam, RecruitmentNotification } from '../lib/types';

interface AspirantDashboardProps {
  candidates: CandidateProfile[];
  applications: Application[];
  stages: Record<string, SelectionStage[]>;
  scores: Record<string, TestScore>;
  medicals: Record<string, MedicalExam>;
  notifications: RecruitmentNotification[];
}

export default function AspirantDashboard({
  candidates,
  applications,
  stages,
  scores,
  medicals,
  notifications,
}: AspirantDashboardProps) {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    candidates[0]?.id || ''
  );
  const [admitCardAppId, setAdmitCardAppId] = useState<string | null>(null);

  const currentCandidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0];
  const candidateApps = applications.filter((app) => app.candidate_id === currentCandidate?.id);

  const getNotification = (notifId: string) => notifications.find((n) => n.id === notifId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Title & Profile Switcher */}
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
            <User size={20} color="var(--army-crimson)" />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--army-crimson-dark)' }}>
              उम्मीदवार कॉर्नर | Candidate Dashboard & Application History
            </h1>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>
            Displays live status directly from the PostgreSQL view <code style={{ color: '#7b1113', fontWeight: 700 }}>v_candidate_dashboard</code>.
          </div>
        </div>

        {/* Candidate Switcher for Lab Demo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
            Logged In Aspirant:
          </span>
          <select
            value={selectedCandidateId}
            onChange={(e) => setSelectedCandidateId(e.target.value)}
            className="gov-select"
            style={{ width: 'auto', minWidth: '220px', fontSize: '0.84rem' }}
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} ({c.gender}, {c.qualification_level})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidate Profile Details (Official Gov Slip Look) */}
      <div className="gov-card">
        <div className="gov-card-header">
          <span className="gov-card-title">
            <Shield size={18} color="var(--army-crimson)" />
            उम्मीदवार प्रोफ़ाइल विवरण | Candidate Master Profile
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="stamp-badge stamp-eligible">AADHAAR VERIFIED</span>
            <span className="stamp-badge stamp-blue">{currentCandidate?.role}</span>
          </div>
        </div>

        <div className="gov-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '0.85rem' }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>FULL NAME</div>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>{currentCandidate?.full_name}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>DATE OF BIRTH</div>
              <div style={{ fontWeight: 600 }}>{currentCandidate?.dob}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>GENDER & MARITAL STATUS</div>
              <div style={{ fontWeight: 600 }}>{currentCandidate?.gender} / {currentCandidate?.marital_status}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>DOMICILE STATE</div>
              <div style={{ fontWeight: 600 }}>{currentCandidate?.domicile_state}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>HEIGHT / WEIGHT</div>
              <div style={{ fontWeight: 700, color: '#0c3866' }}>{currentCandidate?.height_cm} cm / {currentCandidate?.weight_kg} kg</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>CHEST (NORMAL / EXPANDED)</div>
              <div style={{ fontWeight: 600 }}>
                {currentCandidate?.chest_normal_cm || '--'} cm / {currentCandidate?.chest_expanded_cm || '--'} cm
              </div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>ACADEMIC QUALIFICATION</div>
              <div style={{ fontWeight: 600 }}>{currentCandidate?.qualification_level} ({currentCandidate?.aggregate_percentage}%)</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>10+2 PCM PERCENTAGE</div>
              <div style={{ fontWeight: 600, color: '#7b1113' }}>{currentCandidate?.pcm_percentage ? `${currentCandidate.pcm_percentage}%` : 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Applications & Multi-Stage Progression */}
      <div className="gov-card">
        <div className="gov-card-header">
          <span className="gov-card-title">
            <FileText size={18} color="var(--army-crimson)" />
            आवेदन विवरण एवं चयन चरण | Applications & Multi-Stage Selection Pipeline
          </span>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Total Submissions: {candidateApps.length}
          </span>
        </div>

        <div className="gov-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {candidateApps.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
              No applications submitted yet for this aspirant. Use the <strong>Check Eligibility</strong> or <strong>Notifications</strong> tab to submit.
            </div>
          ) : (
            candidateApps.map((app) => {
              const notif = getNotification(app.notification_id);
              const appStages = stages[app.id] || [];
              const appScore = scores[app.id];
              const appMed = medicals[app.id];

              return (
                <div key={app.id} style={{ border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
                  {/* Top Bar of Application */}
                  <div style={{
                    background: '#f1f5f9',
                    padding: '10px 16px',
                    borderBottom: '1px solid #cbd5e1',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#7b1113', fontSize: '0.98rem' }}>
                        ROLL NO: {app.application_number}
                      </span>
                      <span style={{ fontWeight: 700, color: '#0c3866' }}>
                        {notif?.title}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {app.is_eligible ? (
                        <span className="stamp-badge stamp-eligible">ELIGIBLE TO APPEAR</span>
                      ) : (
                        <span className="stamp-badge stamp-rejected">DISQUALIFIED BY TRIGGER</span>
                      )}

                      {app.is_eligible && (
                        <button
                          onClick={() => setAdmitCardAppId(app.id)}
                          className="gov-btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          <Printer size={13} />
                          <span>E-Admit Card</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '16px', background: '#fff' }}>
                    {/* Database Screening Remarks */}
                    <div style={{
                      background: app.is_eligible ? '#f0fdf4' : '#fef2f2',
                      border: app.is_eligible ? '1px solid #bbf7d0' : '1px solid #fecaca',
                      padding: '8px 12px',
                      fontSize: '0.8rem',
                      color: app.is_eligible ? '#166534' : '#991b1b',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      {app.is_eligible ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      <span><strong>DBMS Screening Log:</strong> {app.eligibility_remarks}</span>
                    </div>

                    {/* 4-Stage Official Selection Table */}
                    {app.is_eligible && (
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '8px' }}>
                          Selection Stage Progression Status:
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                          {/* Stage 1 */}
                          <div style={{ border: '1px solid #cbd5e1', padding: '10px', background: '#f8fafc', borderRadius: '3px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7b1113' }}>STAGE 1</span>
                              <span className="stamp-badge stamp-eligible" style={{ fontSize: '0.62rem' }}>CLEARED</span>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>Written Examination</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                              Marks: <strong style={{ color: '#111' }}>{appScore ? `${appScore.written_marks}/100` : 'Scheduled'}</strong>
                            </div>
                          </div>

                          {/* Stage 2 */}
                          <div style={{ border: '1px solid #cbd5e1', padding: '10px', background: '#f8fafc', borderRadius: '3px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7b1113' }}>STAGE 2</span>
                              <span className="stamp-badge stamp-eligible" style={{ fontSize: '0.62rem' }}>CLEARED</span>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>Physical Fitness (PFT)</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                              PFT Score: <strong style={{ color: '#111' }}>{appScore ? `${appScore.pft_score}/100` : 'Pending'}</strong>
                            </div>
                          </div>

                          {/* Stage 3 */}
                          <div style={{ border: '1px solid #cbd5e1', padding: '10px', background: '#f8fafc', borderRadius: '3px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7b1113' }}>STAGE 3</span>
                              <span className="stamp-badge stamp-eligible" style={{ fontSize: '0.62rem' }}>{appMed?.status || 'FIT'}</span>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>Military Medical Board</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                              Category: <strong style={{ color: '#111' }}>SHAPE-1</strong>
                            </div>
                          </div>

                          {/* Stage 4 */}
                          <div style={{ border: '1px solid #cbd5e1', padding: '10px', background: '#f8fafc', borderRadius: '3px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7b1113' }}>STAGE 4</span>
                              <span className="stamp-badge stamp-gold" style={{ fontSize: '0.62rem' }}>
                                {app.status === 'MERIT_LISTED' ? 'RECOMMENDED' : 'IN PROGRESS'}
                              </span>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>SSB Interview Board</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                              Score: <strong style={{ color: '#111' }}>{appScore ? `${appScore.interview_score}/100` : 'Pending'}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Official Indian Army / UPSC E-Admit Card Clone Modal */}
      {admitCardAppId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '700px',
            background: '#ffffff',
            border: '2px solid #000',
            padding: '24px 30px',
            color: '#000',
            fontFamily: 'Arial, sans-serif',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}>
            {/* Header: State Emblem Representation */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                भारत सरकार • GOVERNMENT OF INDIA
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#7b1113' }}>
                रक्षा मंत्रालय | MINISTRY OF DEFENCE • RECRUITING DIRECTORATE
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0', textDecoration: 'underline' }}>
                ई-प्रवेश पत्र | E-ADMIT CARD (PROVISIONAL)
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                NATIONAL DEFENCE ACADEMY & NAVAL ACADEMY EXAMINATION (NDA-154, 2026)
              </div>
            </div>

            {/* Candidate Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 0', fontWeight: 700, width: '130px' }}>Roll Number:</td>
                    <td style={{ padding: '4px 0', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.92rem', color: '#7b1113' }}>
                      APP-2026-10482
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', fontWeight: 700 }}>Candidate Name:</td>
                    <td style={{ padding: '4px 0', fontWeight: 800 }}>{currentCandidate?.full_name.toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', fontWeight: 700 }}>Date of Birth:</td>
                    <td style={{ padding: '4px 0' }}>{currentCandidate?.dob}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', fontWeight: 700 }}>Gender & Category:</td>
                    <td style={{ padding: '4px 0' }}>{currentCandidate?.gender} / GENERAL (UNRESERVED)</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', fontWeight: 700 }}>Reporting Time:</td>
                    <td style={{ padding: '4px 0', fontWeight: 700, color: '#7b1113' }}>08:30 AM (SHARP)</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', fontWeight: 700 }}>Examination Venue:</td>
                    <td style={{ padding: '4px 0', fontWeight: 600 }}>
                      Command Examination Center, Hall A, Delhi Cantonment, New Delhi - 110010
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Photo & Barcode Box */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '110px',
                  height: '130px',
                  border: '1px solid #000',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f8fafc',
                  fontSize: '0.68rem',
                  textAlign: 'center',
                  padding: '6px',
                }}>
                  <Shield size={28} color="#7b1113" style={{ marginBottom: '4px' }} />
                  <span style={{ fontWeight: 700 }}>OFFICIAL PHOTOGRAPH</span>
                </div>
                <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 700 }}>
                  ||||| |||| |||||||| ||||
                </div>
              </div>
            </div>

            {/* Signature & Seal Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              borderTop: '1px solid #000',
              paddingTop: '10px',
              marginBottom: '14px',
              fontSize: '0.74rem',
            }}>
              <div>
                <div style={{ height: '36px' }}></div>
                <div style={{ borderTop: '1px dashed #666', width: '80%', paddingTop: '2px', fontWeight: 600 }}>
                  Candidate's Signature (In presence of Invigilator)
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span className="stamp-badge stamp-eligible" style={{ fontSize: '0.65rem' }}>OFFICIAL STAMP VERIFIED</span>
                </div>
                <div style={{ borderTop: '1px dashed #666', width: '80%', marginLeft: 'auto', paddingTop: '2px', fontWeight: 600 }}>
                  Controller of Examinations / Army Board
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #ccc',
              padding: '8px 10px',
              fontSize: '0.68rem',
              color: '#333',
              lineHeight: 1.4,
              marginBottom: '16px',
            }}>
              <strong>IMPORTANT INSTRUCTIONS TO CANDIDATES:</strong>
              <div>1. Bring this e-Admit Card along with original photo identity proof (Aadhaar Card/PAN/Voter ID).</div>
              <div>2. Electronic items, mobile phones, and calculators are strictly prohibited in the examination center.</div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => window.print()}
                className="gov-btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                <Printer size={14} />
                <span>Print Admit Card</span>
              </button>
              <button
                onClick={() => setAdmitCardAppId(null)}
                className="gov-btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
