'use client';

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import EligibilitySimulator from '../components/EligibilitySimulator';
import NotificationsView from '../components/NotificationsView';
import AspirantDashboard from '../components/AspirantDashboard';
import RecruitmentOfficerPanel from '../components/RecruitmentOfficerPanel';
import DbmsInspector from '../components/DbmsInspector';

import {
  INITIAL_BRANCHES,
  INITIAL_NOTIFICATIONS,
  INITIAL_CANDIDATES,
  INITIAL_APPLICATIONS,
  INITIAL_STAGES,
  INITIAL_SCORES,
  INITIAL_MEDICALS,
} from '../lib/mockData';
import { CandidateProfile, Application, SelectionStage } from '../lib/types';
import { evaluateEligibility } from '../lib/eligibilityEngine';
import { Shield, Target, FileText, UserCheck, Award, ExternalLink } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('simulator');

  // Application Data State
  const [branches] = useState(INITIAL_BRANCHES);
  const [notifications] = useState(INITIAL_NOTIFICATIONS);
  const [candidates, setCandidates] = useState(INITIAL_CANDIDATES);
  const [applications, setApplications] = useState(INITIAL_APPLICATIONS);
  const [stages, setStages] = useState(INITIAL_STAGES);
  const [scores, setScores] = useState(INITIAL_SCORES);
  const [medicals, setMedicals] = useState(INITIAL_MEDICALS);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Handler for applying to an entry (simulating the PostgreSQL BEFORE INSERT trigger)
  const handleApply = (candidate: CandidateProfile, notificationId: string) => {
    const targetNotif = notifications.find((n) => n.id === notificationId);
    if (!targetNotif) return;

    let existingCandidate = candidates.find((c) => c.id === candidate.id);
    let candidateId = candidate.id;
    if (!existingCandidate) {
      candidateId = `cand-${Date.now()}`;
      const newCand = { ...candidate, id: candidateId };
      setCandidates((prev) => [newCand, ...prev]);
    }

    // Run Eligibility Engine
    const evalResult = evaluateEligibility(candidate, targetNotif);

    // Auto-generate roll number: APP-YYYY-XXXXX
    const randomRoll = Math.floor(10000 + Math.random() * 90000);
    const appNumber = `APP-2026-${randomRoll}`;
    const newAppId = `app-${Date.now()}`;

    const newApp: Application = {
      id: newAppId,
      application_number: appNumber,
      candidate_id: candidateId,
      notification_id: notificationId,
      status: evalResult.is_eligible ? 'ELIGIBLE' : 'REJECTED',
      is_eligible: evalResult.is_eligible,
      eligibility_remarks: evalResult.summaryRemarks,
      applied_at: new Date().toISOString(),
    };

    setApplications((prev) => [newApp, ...prev]);

    // If eligible, simulate trigger trg_applications_after_insert
    if (evalResult.is_eligible) {
      const newStages: SelectionStage[] = [
        {
          id: `s-${Date.now()}-1`,
          application_id: newAppId,
          stage_name: 'WRITTEN_EXAM',
          stage_order: 1,
          status: 'SCHEDULED',
          scheduled_date: '2026-09-15',
          venue_details: 'Command Examination Center, Main Hall A, Delhi Cantt',
        },
        {
          id: `s-${Date.now()}-2`,
          application_id: newAppId,
          stage_name: 'PHYSICAL_TEST',
          stage_order: 2,
          status: 'PENDING',
          venue_details: 'Army Physical Grounds, Cantonment',
        },
        {
          id: `s-${Date.now()}-3`,
          application_id: newAppId,
          stage_name: 'MEDICAL_EXAM',
          stage_order: 3,
          status: 'PENDING',
          venue_details: 'Military Hospital, Board 1',
        },
        {
          id: `s-${Date.now()}-4`,
          application_id: newAppId,
          stage_name: 'INTERVIEW_SSB',
          stage_order: 4,
          status: 'PENDING',
          venue_details: 'Services Selection Board',
        },
      ];

      setStages((prev) => ({ ...prev, [newAppId]: newStages }));
      setScores((prev) => ({
        ...prev,
        [newAppId]: {
          id: `ts-${Date.now()}`,
          application_id: newAppId,
          written_marks: 0,
          written_max_marks: 100,
          pft_pushups: 0,
          pft_situps: 0,
          pft_score: 0,
          interview_score: 0,
          interview_max_marks: 100,
        },
      }));

      showToast(`Application ${appNumber} submitted. Candidate screened ELIGIBLE.`);
    } else {
      showToast(`Application ${appNumber} recorded: Auto-Rejected by Database Trigger.`);
    }

    setActiveTab('candidate');
  };

  const handleUpdateScore = (appId: string, written: number, pft: number, interview: number) => {
    setScores((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        written_marks: written,
        pft_score: pft,
        interview_score: interview,
      },
    }));
    showToast('Updated stage test scores successfully.');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f2f5' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Official Government Quick Selection Banners (Matching Join Indian Army layout) */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #cbd5e1', padding: '12px 0' }}>
        <div className="gov-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Officers Selection Banner */}
          <div style={{
            border: '1px solid #cbd5e1',
            borderLeft: '4px solid #7b1113',
            background: '#fafafa',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: '2px',
          }}>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#7b1113', letterSpacing: '0.04em' }}>
                OFFICERS SELECTION • अधिकारी चयन
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0c3866' }}>
                NDA, CDS, AFCAT & Technical Entries
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Permanent Commission (PC) & Short Service Commission (SSC)
              </div>
            </div>
            <button
              onClick={() => setActiveTab('simulator')}
              className="gov-btn-primary"
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
            >
              Check Eligibility
            </button>
          </div>

          {/* Agniveer Enrolment Banner */}
          <div style={{
            border: '1px solid #cbd5e1',
            borderLeft: '4px solid #b45309',
            background: '#fafafa',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: '2px',
          }}>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#b45309', letterSpacing: '0.04em' }}>
                AGNIVEER ENROLMENT • अग्निवीर भर्ती
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0c3866' }}>
                Agnipath Scheme Rally Recruitment 2026
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                General Duty, Technical, Clerk & Tradesman Cadres
              </div>
            </div>
            <button
              onClick={() => setActiveTab('notifications')}
              className="gov-btn-primary"
              style={{ fontSize: '0.75rem', padding: '6px 12px', background: '#b45309', borderColor: '#78350f' }}
            >
              View Rallies
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="gov-container" style={{ flex: 1, padding: '24px 16px 40px' }}>
        {activeTab === 'simulator' && (
          <EligibilitySimulator
            notifications={notifications}
            candidates={candidates}
            onApply={handleApply}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsView
            notifications={notifications}
            branches={branches}
            candidates={candidates}
            onApply={handleApply}
          />
        )}

        {activeTab === 'candidate' && (
          <AspirantDashboard
            candidates={candidates}
            applications={applications}
            stages={stages}
            scores={scores}
            medicals={medicals}
            notifications={notifications}
          />
        )}

        {activeTab === 'officer' && (
          <RecruitmentOfficerPanel
            applications={applications}
            candidates={candidates}
            notifications={notifications}
            scores={scores}
            medicals={medicals}
            onUpdateScore={handleUpdateScore}
          />
        )}

        {activeTab === 'dbms' && <DbmsInspector />}
      </main>

      {/* Official Government Floating Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0c3866',
          color: '#ffffff',
          border: '2px solid #e6b83b',
          borderRadius: '4px',
          padding: '12px 18px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          zIndex: 9999,
          fontSize: '0.86rem',
          fontWeight: 600,
        }}>
          {toastMessage}
        </div>
      )}

      {/* Authentic Indian Government / NIC Official Footer */}
      <footer style={{
        background: '#1e293b',
        color: '#cbd5e1',
        borderTop: '3px solid #7b1113',
        fontSize: '0.78rem',
      }}>
        {/* Top Links Bar */}
        <div style={{ background: '#0f172a', padding: '14px 0', borderBottom: '1px solid #334155' }}>
          <div className="gov-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '20px', fontWeight: 600 }}>
              <span style={{ cursor: 'pointer' }}>Terms & Conditions</span>
              <span>•</span>
              <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
              <span>•</span>
              <span style={{ cursor: 'pointer' }}>Hyperlinking Policy</span>
              <span>•</span>
              <span style={{ cursor: 'pointer' }}>Copyright Policy</span>
              <span>•</span>
              <span style={{ cursor: 'pointer' }}>Disclaimer</span>
            </div>
            <div style={{ color: '#94a3b8' }}>
              Last Updated: 27 Oct 2026 | Total Visitors: 4,812,940
            </div>
          </div>
        </div>

        {/* Main Footer Info */}
        <div className="gov-container" style={{ padding: '24px 16px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff', marginBottom: '6px' }}>
              DIRECTORATE GENERAL OF RECRUITING, INTEGRATED HEADQUARTERS OF MINISTRY OF DEFENCE (ARMY)
            </div>
            <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.76rem' }}>
              Website Content Managed by Directorate General of Recruiting, Indian Army, West Block-III, RK Puram, New Delhi - 110066.<br />
              Automated Eligibility & Multi-Stage Recruitment Management System built on PostgreSQL Relational Database Management System (DBMS).
            </p>
          </div>

          {/* National Portal Badges */}
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
            <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem' }}>
              Designed, Developed & Maintained for Academic DBMS Evaluation
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Hosted in accordance with Government of India Guidelines for Indian Government Websites (GIGW).
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <span className="stamp-badge stamp-blue" style={{ fontSize: '0.65rem' }}>india.gov.in</span>
              <span className="stamp-badge stamp-gold" style={{ fontSize: '0.65rem' }}>mod.gov.in</span>
              <span className="stamp-badge stamp-eligible" style={{ fontSize: '0.65rem' }}>NIC Standards Compliant</span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div style={{ background: '#0b1120', padding: '10px 0', textAlign: 'center', color: '#64748b', fontSize: '0.72rem' }}>
          Copyright © 2026 Join Indian Army. All Rights Reserved. Powered by PostgreSQL 16 & Next.js 16.
        </div>
      </footer>
    </div>
  );
}
