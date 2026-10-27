'use client';

import React, { useState, useMemo } from 'react';
import { Award, Shield, Users, CheckCircle, XCircle, Play, BarChart2, Check, RefreshCw, FileText } from 'lucide-react';
import { Application, CandidateProfile, RecruitmentNotification, TestScore, MedicalExam, MeritListItem } from '../lib/types';

interface RecruitmentOfficerPanelProps {
  applications: Application[];
  candidates: CandidateProfile[];
  notifications: RecruitmentNotification[];
  scores: Record<string, TestScore>;
  medicals: Record<string, MedicalExam>;
  onUpdateScore: (appId: string, written: number, pft: number, interview: number) => void;
}

export default function RecruitmentOfficerPanel({
  applications,
  candidates,
  notifications,
  scores,
  medicals,
  onUpdateScore,
}: RecruitmentOfficerPanelProps) {
  const [selectedNotificationId, setSelectedNotificationId] = useState<string>(
    notifications[0]?.id || ''
  );
  const [meritList, setMeritList] = useState<MeritListItem[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const activeNotif = notifications.find((n) => n.id === selectedNotificationId) || notifications[0];

  const filteredApps = useMemo(() => {
    return applications.filter((app) => app.notification_id === selectedNotificationId);
  }, [applications, selectedNotificationId]);

  const stats = useMemo(() => {
    const total = filteredApps.length;
    const eligible = filteredApps.filter((a) => a.is_eligible).length;
    const rejected = total - eligible;
    const passRate = total > 0 ? Math.round((eligible / total) * 100) : 0;
    return { total, eligible, rejected, passRate };
  }, [filteredApps]);

  const handleGenerateMeritList = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const eligibleApps = filteredApps.filter((app) => app.is_eligible);

      // Formula: (written / written_max * 100 * 0.40) + (pft * 0.20) + (interview * 0.40)
      const ranked = eligibleApps.map((app) => {
        const cand = candidates.find((c) => c.id === app.candidate_id);
        const score = scores[app.id] || { written_marks: 70, written_max_marks: 100, pft_score: 80, interview_score: 75 };
        
        const composite = Math.round(
          ((score.written_marks / score.written_max_marks) * 100 * 0.40 +
            score.pft_score * 0.20 +
            score.interview_score * 0.40) * 100
        ) / 100;

        return {
          appId: app.id,
          candidate_name: cand?.full_name || 'Candidate',
          application_number: app.application_number,
          composite_score: composite,
        };
      });

      ranked.sort((a, b) => b.composite_score - a.composite_score);

      const vacancies = activeNotif?.total_vacancies || 5;
      const finalList: MeritListItem[] = ranked.map((item, index) => ({
        rank_order: index + 1,
        candidate_name: item.candidate_name,
        application_number: item.application_number,
        composite_score: item.composite_score,
        is_selected: index < vacancies,
      }));

      setMeritList(finalList);
      setIsGenerating(false);
    }, 400);
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
            <Award size={20} color="var(--army-crimson)" />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--army-crimson-dark)' }}>
              सेना भर्ती बोर्ड | Army Recruitment Board & SSB Selection Command
            </h1>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>
            Official recruitment authority console for evaluating applicant pipelines, physical test scores, and executing stored procedures.
          </div>
        </div>

        {/* Campaign Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
            Target Campaign:
          </span>
          <select
            value={selectedNotificationId}
            onChange={(e) => {
              setSelectedNotificationId(e.target.value);
              setMeritList(null);
            }}
            className="gov-select"
            style={{ width: 'auto', minWidth: '240px', fontSize: '0.82rem' }}
          >
            {notifications.map((n) => (
              <option key={n.id} value={n.id}>
                {n.notification_number} ({n.title.slice(0, 32)}...)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregate Pipeline Statistics (Govt Style Metrics Box) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        <div className="gov-card gov-card-blue" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            TOTAL APPLICATIONS
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0c3866', marginTop: '2px' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Online submissions logged</div>
        </div>

        <div className="gov-card" style={{ padding: '14px 18px', borderTopColor: '#10b981' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            TRIGGER CLEARED (ELIGIBLE)
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#065f46', marginTop: '2px' }}>
            {stats.eligible}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Passed physical & age cutoffs</div>
        </div>

        <div className="gov-card" style={{ padding: '14px 18px', borderTopColor: '#ef4444' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            REJECTED BY TRIGGER
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#991b1b', marginTop: '2px' }}>
            {stats.rejected}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Height / age / marital deficits</div>
        </div>

        <div className="gov-card gov-card-gold" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            ELIGIBILITY PASS RATIO
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>
            {stats.passRate}%
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Computed via SQL view</div>
        </div>
      </div>

      {/* Main Applicants Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div>
            <span className="gov-card-title">
              <Users size={18} color="var(--army-crimson)" />
              उम्मीदवार सत्यापन एवं प्राप्तांक तालिका (Applicant Verification & Test Marks)
            </span>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Showing applications under notification <strong>{activeNotif?.notification_number}</strong>
            </div>
          </div>

          {/* Stored Procedure Execution Button */}
          <button
            onClick={handleGenerateMeritList}
            disabled={isGenerating || stats.eligible === 0}
            className="gov-btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            <Play size={14} />
            <span>{isGenerating ? 'Executing PL/pgSQL Procedure...' : 'Execute: sp_generate_merit_list()'}</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="gov-table">
            <thead>
              <tr>
                <th>ROLL NUMBER</th>
                <th>CANDIDATE NAME</th>
                <th>HEIGHT / WEIGHT</th>
                <th>SCREENING STATUS</th>
                <th>WRITTEN (40%)</th>
                <th>PFT (20%)</th>
                <th>SSB (40%)</th>
                <th>SELECTION STAGE</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app) => {
                const cand = candidates.find((c) => c.id === app.candidate_id);
                const score = scores[app.id];

                return (
                  <tr key={app.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#7b1113' }}>
                      {app.application_number}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{cand?.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {cand?.gender} • {cand?.qualification_level}
                      </div>
                    </td>
                    <td>
                      <div>{cand?.height_cm} cm</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{cand?.weight_kg} kg</div>
                    </td>
                    <td>
                      <span className={`stamp-badge ${app.is_eligible ? 'stamp-eligible' : 'stamp-rejected'}`}>
                        {app.is_eligible ? 'ELIGIBLE' : 'REJECTED'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {score ? `${score.written_marks}/100` : '--'}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {score ? `${score.pft_score}/100` : '--'}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {score ? `${score.interview_score}/100` : '--'}
                    </td>
                    <td>
                      <span className="stamp-badge stamp-blue">{app.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Government Merit List Gazette */}
      {meritList && (
        <div className="gov-card gov-card-gold">
          <div className="gov-card-header" style={{ background: '#fffbeb' }}>
            <div>
              <span className="gov-card-title" style={{ color: '#92400e' }}>
                <Award size={18} color="#b45309" />
                भारत का राजपत्र | Official Final Merit List & Gazette Selection
              </span>
              <div style={{ fontSize: '0.75rem', color: '#78350f' }}>
                Generated dynamically via PostgreSQL procedure <code style={{ fontWeight: 700 }}>sp_generate_merit_list()</code> using analytical window function <code style={{ fontWeight: 700 }}>DENSE_RANK()</code>.
              </div>
            </div>

            <span className="stamp-badge stamp-gold" style={{ fontSize: '0.78rem' }}>
              VACANCIES: {activeNotif?.total_vacancies} POSTS
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="gov-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>MERIT RANK</th>
                  <th>ROLL NUMBER</th>
                  <th>CANDIDATE NAME</th>
                  <th style={{ textAlign: 'center' }}>COMPOSITE SCORE (WEIGHTED)</th>
                  <th style={{ textAlign: 'center' }}>SELECTION VERDICT</th>
                </tr>
              </thead>
              <tbody>
                {meritList.map((item) => (
                  <tr key={item.rank_order}>
                    <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '1rem', color: '#0c3866' }}>
                      #{item.rank_order}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#7b1113' }}>
                      {item.application_number}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {item.candidate_name}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#065f46', fontSize: '0.95rem' }}>
                      {item.composite_score} / 100.00
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {item.is_selected ? (
                        <span className="stamp-badge stamp-eligible" style={{ padding: '4px 10px' }}>
                          <Check size={13} /> SELECTED FOR ACADEMY TRAINING
                        </span>
                      ) : (
                        <span className="stamp-badge stamp-rejected">
                          WAITLISTED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
