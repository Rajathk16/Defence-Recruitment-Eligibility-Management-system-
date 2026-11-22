-- DREMS: Defence Recruitment Eligibility Management System
-- Demo / Seed Data — safe to run AFTER supabase_schema.sql on a fresh database.
-- All personal data below is entirely fictional and created for testing purposes only.
-- BUG-18 FIX: added this file so new developers can set up a working test environment.

-- ============================================================
-- 1. CANDIDATE PROFILES (5 fictional candidates)
-- ============================================================
INSERT INTO profiles (full_name, email, dob, gender, marital_status, state, role) VALUES
  ('Arjun Sharma',    'arjun.sharma@test.example',    '2001-03-15', 'MALE',   'UNMARRIED', 'Rajasthan',     'CANDIDATE'),  -- id 1
  ('Priya Nair',      'priya.nair@test.example',      '2002-07-22', 'FEMALE', 'UNMARRIED', 'Kerala',        'CANDIDATE'),  -- id 2
  ('Vikram Singh',    'vikram.singh@test.example',    '2000-11-05', 'MALE',   'UNMARRIED', 'Punjab',        'CANDIDATE'),  -- id 3
  ('Anjali Patel',    'anjali.patel@test.example',    '2001-09-30', 'FEMALE', 'MARRIED',   'Gujarat',       'CANDIDATE'),  -- id 4
  ('Meena Krishnan',  'meena.krishnan@test.example',  '2003-01-12', 'FEMALE', 'UNMARRIED', 'Tamil Nadu',    'CANDIDATE');  -- id 5

-- ============================================================
-- 2. PHYSICAL DETAILS
-- ============================================================
INSERT INTO physical_details (candidate_id, height_cm, weight_kg, chest_normal_cm, chest_expanded_cm) VALUES
  (1, 172.5, 68.0, 82.0, 87.0),   -- Arjun: eligible height
  (2, 160.0, 55.0, 76.0, 81.0),   -- Priya: eligible height
  (3, 180.0, 75.0, 88.0, 94.0),   -- Vikram: eligible height
  (4, 158.5, 52.0, 74.0, 79.0),   -- Anjali: eligible height, but married
  (5, 152.0, 48.0, 70.0, 75.0);   -- Meena: too short for many notifications

-- ============================================================
-- 3. EDUCATION RECORDS
-- ============================================================
INSERT INTO education (candidate_id, level, board, year_passed, percentage) VALUES
  (1, '12TH', 'CBSE',      2019, 78.40),
  (2, '12TH', 'CBSE',      2020, 85.20),
  (3, '12TH', 'ICSE',      2018, 72.60),
  (4, '12TH', 'State Board',2019, 65.80),
  (5, '12TH', 'State Board',2021, 60.10);

-- ============================================================
-- 4. NOTIFICATIONS (2 sample recruitment drives)
-- ============================================================
INSERT INTO notifications (notification_number, branch_id, title, vacancies, cutoff_date, last_date) VALUES
  ('NDA-155-2026',  1, 'National Defence Academy Course 155 (Army)',         420, '2026-07-01', '2026-06-30'),  -- id 1
  ('CDS-II-2026',   3, 'Combined Defence Services Examination II 2026 (AF)', 280, '2026-10-01', '2026-09-30'); -- id 2

-- ============================================================
-- 5. ELIGIBILITY RULES
-- ============================================================
INSERT INTO eligibility_rules (notification_id, min_age, max_age, min_height_cm, min_percentage, unmarried_only) VALUES
  (1, 16.5, 19.5, 157.0, 60.0, TRUE),   -- NDA: strict age and unmarried
  (2, 20.0, 24.0, 157.0, 55.0, FALSE);  -- CDS: older bracket, married allowed

-- ============================================================
-- 6. SAMPLE APPLICATIONS
-- (The trigger fn_screen_application() will auto-set status and remarks)
-- ============================================================
INSERT INTO applications (candidate_id, notification_id) VALUES
  (1, 1),  -- Arjun → NDA     → Expected: ELIGIBLE
  (2, 1),  -- Priya → NDA     → Expected: ELIGIBLE
  (3, 1),  -- Vikram → NDA    → Expected: REJECTED (age too old for NDA)
  (5, 1),  -- Meena → NDA     → Expected: REJECTED (height too low)
  (4, 2),  -- Anjali → CDS    → Expected: REJECTED (age range check)
  (1, 2);  -- Arjun → CDS     → Expected: REJECTED (age too young for CDS)

-- ============================================================
-- 7. TEST SCORES (for applications that passed screening)
-- Check actual application IDs if running on a fresh DB (IDs start at 1)
-- ============================================================
INSERT INTO test_scores (application_id, written_marks, pft_score, interview_score) VALUES
  (1, 72.50, 85.00, 78.00),  -- Arjun NDA application
  (2, 68.00, 90.00, 82.50);  -- Priya NDA application

-- ============================================================
-- 8. MEDICAL EXAMS
-- ============================================================
INSERT INTO medical_exams (application_id, board_location, exam_date, status, notes) VALUES
  (1, 'Pune Military Hospital', '2026-08-10', 'FIT',   NULL),
  (2, 'Delhi Military Hospital','2026-08-12', 'FIT',   NULL);

-- ============================================================
-- VERIFICATION QUERIES (run to confirm seed loaded correctly)
-- ============================================================
-- SELECT * FROM v_application_summary;
-- SELECT * FROM profiles;
-- SELECT a.id, p.full_name, n.notification_number, a.status, a.remarks
--   FROM applications a
--   JOIN profiles p ON p.id = a.candidate_id
--   JOIN notifications n ON n.id = a.notification_id;
