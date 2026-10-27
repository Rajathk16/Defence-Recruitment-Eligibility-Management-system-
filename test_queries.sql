-- ============================================================================
-- DEFENCE RECRUITMENT & ELIGIBILITY MANAGEMENT SYSTEM (DREMS)
-- DBMS EVALUATION & VIVA DEMO QUERIES
-- Run these queries in Supabase SQL Editor to demonstrate database functionality
-- to your professor / project evaluator.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- DEMO 1: Automated Eligibility Screening Results (Triggers in Action)
-- Shows how the database automatically flagged ELIGIBLE vs REJECTED candidates
-- with exact reasons (Height deficit, Overage, etc.)
-- ----------------------------------------------------------------------------
SELECT 
    app.application_number,
    p.full_name AS candidate_name,
    p.gender,
    n.title AS entry_applied_for,
    app.status,
    app.is_eligible,
    app.eligibility_remarks
FROM applications app
JOIN profiles p ON p.id = app.candidate_id
JOIN recruitment_notifications n ON n.id = app.notification_id
ORDER BY app.applied_at DESC;


-- ----------------------------------------------------------------------------
-- DEMO 2: Candidate Dashboard View (Multi-Table Join with Age Calculation)
-- Joins: profiles + physical_attributes + applications + notifications + test_scores + medical
-- ----------------------------------------------------------------------------
SELECT * FROM v_candidate_dashboard;


-- ----------------------------------------------------------------------------
-- DEMO 3: Recruitment Officer Pipeline View (Aggregations & Pass Rates)
-- Demonstrates: COUNT, CASE WHEN, NULLIF, and Percentage Calculations
-- ----------------------------------------------------------------------------
SELECT * FROM v_recruiter_pipeline;


-- ----------------------------------------------------------------------------
-- DEMO 4: Final Merit List (Stored Procedure & Analytical Window Functions)
-- Uses: DENSE_RANK() OVER (ORDER BY composite_score DESC) and vacancy allocation
-- ----------------------------------------------------------------------------
SELECT * FROM v_final_merit_ranking;


-- ----------------------------------------------------------------------------
-- DEMO 5: Direct Test of the PL/pgSQL Eligibility Function
-- Evaluates Vikram Batra (c1000000-0000-0000-0000-000000000001) for AFCAT
-- ----------------------------------------------------------------------------
SELECT fn_evaluate_eligibility(
    'c1000000-0000-0000-0000-000000000001', -- Candidate ID
    'n1000000-0000-0000-0000-000000000003'  -- AFCAT Notification ID
) AS eligibility_breakdown;


-- ----------------------------------------------------------------------------
-- DEMO 6: System Audit Log Trail
-- Shows automatic logging of changes on critical tables via generic triggers
-- ----------------------------------------------------------------------------
SELECT 
    id,
    entity_name,
    record_id,
    action,
    changed_by,
    changed_at,
    new_data->>'application_number' AS application_num,
    new_data->>'status' AS current_status
FROM system_audit_logs
ORDER BY changed_at DESC
LIMIT 10;
