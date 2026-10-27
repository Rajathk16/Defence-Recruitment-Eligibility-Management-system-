'use client';

import React, { useState } from 'react';
import { Database, Code2, ShieldAlert, Cpu, Eye, CheckCircle2, FileText } from 'lucide-react';

export default function DbmsInspector() {
  const [activeSubTab, setActiveSubTab] = useState<'schema' | 'triggers' | 'procedures' | 'views' | 'audit'>('schema');

  const tables = [
    { name: 'profiles', pk: 'id (UUID)', normalForm: '3NF', purpose: 'Candidate demographics, identity, DOB, marital status, nationality.' },
    { name: 'physical_attributes', pk: 'candidate_id (UUID FK)', normalForm: '3NF', purpose: 'Height, weight, normal & expanded chest, visual standard, color vision.' },
    { name: 'educational_qualifications', pk: 'id (UUID)', normalForm: '3NF', purpose: 'Multiple credentials per candidate (10th, 12th, B.Tech, PCM percentages).' },
    { name: 'defence_branches', pk: 'id (UUID)', normalForm: '3NF', purpose: 'Master catalog: Indian Army, Navy, Air Force, Coast Guard.' },
    { name: 'recruitment_notifications', pk: 'id (UUID)', normalForm: '3NF', purpose: 'Commission notifications with cutoff date, vacancies, and application deadlines.' },
    { name: 'eligibility_rules', pk: 'id (UUID)', normalForm: '3NF', purpose: 'Parametric rules: age brackets, height standards by gender, minimum marks.' },
    { name: 'applications', pk: 'id (UUID)', normalForm: '3NF', purpose: 'Candidate applications with roll numbers, trigger screening results, and logs.' },
    { name: 'selection_stages', pk: 'id (UUID)', normalForm: '3NF', purpose: '4-stage tracking: Written Exam -> PFT -> Medical Board -> SSB Interview.' },
    { name: 'test_scores', pk: 'id (UUID)', normalForm: '3NF', purpose: 'Candidate marks across stages: Written, PFT run time/pushups, SSB marks.' },
    { name: 'medical_examinations', pk: 'id (UUID)', normalForm: '3NF', purpose: 'Military medical board records (FIT, TEMPORARILY UNFIT, PERMANENTLY UNFIT).' },
    { name: 'merit_lists', pk: 'id (UUID)', normalForm: '3NF', purpose: 'Final ranked candidates generated dynamically using DENSE_RANK() window function.' },
    { name: 'system_audit_logs', pk: 'id (BIGSERIAL)', normalForm: '3NF', purpose: 'System audit trail capturing old and new JSONB states on state changes.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Title */}
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
            <Database size={20} color="var(--army-crimson)" />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--army-crimson-dark)' }}>
              डेटाबेस तकनीकी विनिर्देश | DBMS Relational Architecture & Technical Dossier
            </h1>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>
            Official technical evaluation dossier for DBMS Mini-Project Viva. Inspect 3NF schema, PL/pgSQL triggers, stored procedures, and audit logs.
          </div>
        </div>

        {/* Sub Navigation */}
        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
          {(['schema', 'triggers', 'procedures', 'views', 'audit'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              style={{
                padding: '6px 12px',
                borderRadius: '3px',
                border: 'none',
                background: activeSubTab === tab ? '#7b1113' : 'transparent',
                color: activeSubTab === tab ? '#ffffff' : '#334155',
                fontWeight: activeSubTab === tab ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Sub Tabs */}
      {activeSubTab === 'schema' && (
        <div className="gov-card">
          <div className="gov-card-header">
            <span className="gov-card-title">
              <FileText size={18} color="var(--army-crimson)" />
              रिलेशनल स्कीमा एवं 3NF प्रसामान्यीकरण (Relational Tables Normalized to 3NF)
            </span>
            <span className="stamp-badge stamp-blue">12 Normalized Entities</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="gov-table">
              <thead>
                <tr>
                  <th style={{ width: '220px' }}>TABLE NAME</th>
                  <th style={{ width: '180px' }}>PRIMARY KEY</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>FORM</th>
                  <th>FUNCTIONAL PURPOSE & INTEGRITY CONSTRAINTS</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((t) => (
                  <tr key={t.name}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#7b1113' }}>
                      {t.name}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#0c3866' }}>
                      {t.pk}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="stamp-badge stamp-eligible">{t.normalForm}</span>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {t.purpose}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'triggers' && (
        <div className="gov-card">
          <div className="gov-card-header">
            <span className="gov-card-title">
              <Cpu size={18} color="var(--army-crimson)" />
              स्वचालित व्यावसायिक नियम ट्रिगर: <code style={{ color: '#7b1113' }}>trg_applications_before_insert</code>
            </span>
            <span className="stamp-badge stamp-gold">PL/pgSQL Trigger</span>
          </div>

          <div className="gov-card-body">
            <p style={{ fontSize: '0.84rem', color: '#475569', marginBottom: '14px', lineHeight: 1.5 }}>
              Executes automatically on <code style={{ fontWeight: 700 }}>BEFORE INSERT ON applications</code>. Evaluates physical standards, checks age cutoff, generates roll numbers, and sets candidate eligibility status.
            </p>

            <pre style={{
              background: '#0f172a',
              color: '#f8fafc',
              padding: '16px',
              borderRadius: '4px',
              fontSize: '0.8rem',
              lineHeight: 1.5,
              overflowX: 'auto',
              border: '1px solid #1e293b',
            }}>
{`CREATE TRIGGER trg_applications_before_insert
BEFORE INSERT ON applications
FOR EACH ROW
EXECUTE FUNCTION trg_fn_screen_application();

-- PL/pgSQL Function:
CREATE OR REPLACE FUNCTION trg_fn_screen_application()
RETURNS TRIGGER AS $$
DECLARE
    v_eval JSONB;
BEGIN
    -- 1. Auto-generate military roll number
    NEW.application_number := 'APP-' || to_char(NOW(), 'YYYY') || '-' || LPAD(FLOOR(random() * 89999 + 10000)::text, 5, '0');

    -- 2. Call PL/pgSQL Eligibility Engine
    v_eval := fn_evaluate_eligibility(NEW.candidate_id, NEW.notification_id);
    NEW.is_eligible := (v_eval->>'is_eligible')::BOOLEAN;

    -- 3. Log remarks and set status
    NEW.eligibility_remarks := array_to_string(ARRAY(SELECT jsonb_array_elements_text(v_eval->'reasons')), '; ');
    IF NEW.is_eligible THEN
        NEW.status := 'ELIGIBLE';
    ELSE
        NEW.status := 'REJECTED';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`}
            </pre>
          </div>
        </div>
      )}

      {activeSubTab === 'procedures' && (
        <div className="gov-card">
          <div className="gov-card-header">
            <span className="gov-card-title">
              <Code2 size={18} color="var(--army-crimson)" />
              संग्रहीत प्रक्रिया (Stored Procedure): <code style={{ color: '#7b1113' }}>sp_generate_merit_list()</code>
            </span>
            <span className="stamp-badge stamp-blue">Analytical Window Function</span>
          </div>

          <div className="gov-card-body">
            <p style={{ fontSize: '0.84rem', color: '#475569', marginBottom: '14px', lineHeight: 1.5 }}>
              Computes multi-stage composite scores (40% Written + 20% Physical + 40% SSB) and ranks candidates using analytical SQL window functions (<code style={{ fontWeight: 700 }}>DENSE_RANK()</code>).
            </p>

            <pre style={{
              background: '#0f172a',
              color: '#f8fafc',
              padding: '16px',
              borderRadius: '4px',
              fontSize: '0.8rem',
              lineHeight: 1.5,
              overflowX: 'auto',
              border: '1px solid #1e293b',
            }}>
{`CREATE OR REPLACE FUNCTION sp_generate_merit_list(p_notification_id UUID)
RETURNS TABLE(...) AS $$
BEGIN
    WITH ranked_candidates AS (
        SELECT 
            app.id AS app_id,
            app.candidate_id,
            ROUND(
                ((ts.written_marks / NULLIF(ts.written_max_marks, 0) * 100) * 0.40) +
                (COALESCE(ts.pft_score, 0) * 0.20) +
                ((COALESCE(ts.interview_score, 0) / NULLIF(COALESCE(ts.interview_max_marks, 100), 0) * 100) * 0.40),
                2
            ) AS final_composite,
            DENSE_RANK() OVER (
                ORDER BY (...) DESC
            ) as computed_rank
        FROM applications app
        JOIN test_scores ts ON ts.application_id = app.id
        LEFT JOIN medical_examinations med ON med.application_id = app.id
        WHERE app.notification_id = p_notification_id
          AND app.is_eligible = TRUE
          AND (med.status IS NULL OR med.status = 'FIT')
    )
    INSERT INTO merit_lists (...)
    ...
END;
$$ LANGUAGE plpgsql;`}
            </pre>
          </div>
        </div>
      )}

      {activeSubTab === 'views' && (
        <div className="gov-card">
          <div className="gov-card-header">
            <span className="gov-card-title">
              <Eye size={18} color="var(--army-crimson)" />
              डेटाबेस व्यू (Configured Database Views for Reporting)
            </span>
          </div>

          <div className="gov-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ border: '1px solid #cbd5e1', padding: '14px', borderRadius: '3px', background: '#f8fafc' }}>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#7b1113', fontSize: '0.9rem' }}>
                v_candidate_dashboard
              </div>
              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px' }}>
                Multi-table relational join combining profiles, physical attributes, applications, test scores, and medical board results into a single queryable entity.
              </div>
            </div>

            <div style={{ border: '1px solid #cbd5e1', padding: '14px', borderRadius: '3px', background: '#f8fafc' }}>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#7b1113', fontSize: '0.9rem' }}>
                v_recruiter_pipeline
              </div>
              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px' }}>
                Aggregates applicant counts, trigger pass rates, rejection counts, and final selections grouped by defence branches and campaigns.
              </div>
            </div>

            <div style={{ border: '1px solid #cbd5e1', padding: '14px', borderRadius: '3px', background: '#f8fafc' }}>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#7b1113', fontSize: '0.9rem' }}>
                v_final_merit_ranking
              </div>
              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px' }}>
                Outputs official ranked merit gazettes joined with candidate names, roll numbers, and selection verdicts.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'audit' && (
        <div className="gov-card">
          <div className="gov-card-header">
            <span className="gov-card-title">
              <ShieldAlert size={18} color="var(--army-crimson)" />
              सिस्टम ऑडिट लॉग (Live System Audit Trail: system_audit_logs)
            </span>
            <span className="stamp-badge stamp-eligible">Security Logging Active</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="gov-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>LOG ID</th>
                  <th>ENTITY TABLE</th>
                  <th>ACTION</th>
                  <th>MODIFIED BY</th>
                  <th>TRANSACTION DATA (JSONB SNAPSHOT)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>#1041</td>
                  <td style={{ fontWeight: 700, color: '#7b1113' }}>applications</td>
                  <td><span className="stamp-badge stamp-eligible">INSERT</span></td>
                  <td style={{ fontSize: '0.78rem' }}>postgres_app_role</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#334155' }}>
                    APP-2026-10482 (Status: ELIGIBLE, Candidate: Vikram Batra)
                  </td>
                </tr>
                <tr>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>#1042</td>
                  <td style={{ fontWeight: 700, color: '#7b1113' }}>applications</td>
                  <td><span className="stamp-badge stamp-rejected">INSERT</span></td>
                  <td style={{ fontSize: '0.78rem' }}>postgres_app_role</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#334155' }}>
                    APP-2026-10484 (Status: REJECTED - Height deficit 153cm &lt; 157cm)
                  </td>
                </tr>
                <tr>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>#1043</td>
                  <td style={{ fontWeight: 700, color: '#7b1113' }}>test_scores</td>
                  <td><span className="stamp-badge stamp-blue">UPDATE</span></td>
                  <td style={{ fontSize: '0.78rem' }}>evaluator_officer</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#334155' }}>
                    Written: 88.0, PFT: 95.0, SSB: 86.0
                  </td>
                </tr>
                <tr>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>#1044</td>
                  <td style={{ fontWeight: 700, color: '#7b1113' }}>medical_examinations</td>
                  <td><span className="stamp-badge stamp-eligible">INSERT</span></td>
                  <td style={{ fontSize: '0.78rem' }}>medical_officer_singhal</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#334155' }}>
                    Base Hospital Delhi Cantt (Status: FIT, SHAPE-1)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
