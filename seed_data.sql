-- OPTIONAL demo data for the viva.
-- Run supabase_schema.sql first, on empty tables. Ids below start from 1.
-- If you enter your own data from the website, skip this file.

INSERT INTO notifications (notification_number, branch_id, title, vacancies, cutoff_date, last_date) VALUES
    ('NDA-154-2026', 1, 'National Defence Academy 154th Course', 400, '2026-07-01', '2026-12-31'),   -- 1
    ('CDS-02-2026', 1, 'Combined Defence Services II', 340, '2026-07-01', '2026-12-31'),            -- 2
    ('AFCAT-01-2026', 3, 'Air Force Common Admission Test', 250, '2026-01-01', '2026-12-31'),       -- 3
    ('AGNIVEER-2026', 1, 'Army Agniveer General Duty', 1200, '2026-10-01', '2026-12-31');           -- 4

-- notification, min age, max age, min height, min percentage, unmarried only
INSERT INTO eligibility_rules VALUES
    (1, 16.5, 19.5, 157.0, 60, TRUE),
    (2, 19.0, 24.0, 157.0, 50, TRUE),
    (3, 20.0, 24.0, 162.5, 60, TRUE),
    (4, 17.5, 21.0, 169.0, 45, TRUE);

INSERT INTO profiles (full_name, email, dob, gender, marital_status, state, role) VALUES
    ('Maj. Ramesh Nair', 'ramesh.nair@drems.mil',  '1985-06-15', 'MALE',   'MARRIED',   'Kerala', 'OFFICER'), -- 1
    ('Arjun Singh',      'arjun.singh@example.com', '2007-12-01', 'MALE',   'UNMARRIED', 'Uttar Pradesh', 'CANDIDATE'), -- 2
    ('Priya Sharma',     'priya.sharma@example.com','2003-05-10', 'FEMALE', 'UNMARRIED', 'Maharashtra', 'CANDIDATE'),   -- 3
    ('Rajesh Kumar',     'rajesh.kumar@example.com','2003-09-15', 'MALE',   'MARRIED',   'Bihar', 'CANDIDATE'),         -- 4
    ('Meena Joshi',      'meena.joshi@example.com', '2007-03-20', 'FEMALE', 'UNMARRIED', 'Rajasthan', 'CANDIDATE'),     -- 5
    ('Karan Mehta',      'karan.mehta@example.com', '2007-08-10', 'MALE',   'UNMARRIED', 'Gujarat', 'CANDIDATE'),       -- 6
    ('Sneha Reddy',      'sneha.reddy@example.com', '2002-11-05', 'FEMALE', 'UNMARRIED', 'Telangana', 'CANDIDATE');     -- 7

INSERT INTO physical_details VALUES
    (2, 163.0, 58, 83, 89),
    (3, 158.0, 52, 76, 80),
    (4, 160.0, 65, 82, 87),
    (5, 148.0, 45, 74, 78),   -- too short for NDA
    (6, 170.0, 62, 84, 90),
    (7, 160.0, 54, 77, 81);

INSERT INTO education (candidate_id, level, board, year_passed, percentage) VALUES
    (2, '10TH', 'CBSE', 2023, 80),
    (2, '12TH', 'CBSE', 2025, 72),
    (3, '12TH', 'Maharashtra Board', 2021, 70),
    (3, 'GRADUATION', 'Mumbai University', 2025, 65),
    (4, '12TH', 'CBSE', 2021, 55),   -- below the 60% NDA needs
    (5, '12TH', 'Rajasthan Board', 2025, 70),
    (6, '12TH', 'Gujarat Board', 2025, 85),
    (7, 'GRADUATION', 'Osmania University', 2024, 78);

-- The trigger decides status and remarks for each of these.
INSERT INTO applications (candidate_id, notification_id) VALUES
    (2, 1),  -- 1  Arjun  -> NDA, eligible
    (6, 1),  -- 2  Karan  -> NDA, eligible
    (4, 1),  -- 3  Rajesh -> NDA, rejected (age, married, percentage)
    (5, 1),  -- 4  Meena  -> NDA, rejected (height)
    (3, 2),  -- 5  Priya  -> CDS, eligible
    (7, 2);  -- 6  Sneha  -> CDS, eligible

INSERT INTO test_scores VALUES
    (1, 78, 82, 74),
    (2, 85, 90, 80),
    (5, 85, 78, 88),
    (6, 72, 80, 70);

INSERT INTO medical_exams (application_id, board_location, exam_date, status) VALUES
    (1, 'Military Hospital, Delhi', '2026-10-01', 'FIT'),
    (2, 'Military Hospital, Delhi', '2026-10-01', 'FIT'),
    (5, 'Military Hospital, Pune',  '2026-11-01', 'FIT'),
    (6, 'Military Hospital, Pune',  '2026-11-01', 'UNFIT');  -- left out of the merit list

-- Merit list: 40% written + 20% PFT + 40% interview, ranked inside each notification.
-- Re-run this block (after DELETE FROM merit_list) whenever scores change.
INSERT INTO merit_list (application_id, composite_score, rank_order, is_selected)
SELECT application_id, score, rnk, rnk <= vacancies
FROM (
    SELECT a.id AS application_id,
           n.vacancies,
           t.written_marks * 0.4 + t.pft_score * 0.2 + t.interview_score * 0.4 AS score,
           DENSE_RANK() OVER (
               PARTITION BY a.notification_id
               ORDER BY t.written_marks * 0.4 + t.pft_score * 0.2 + t.interview_score * 0.4 DESC
           ) AS rnk
    FROM applications a
    JOIN notifications n ON n.id = a.notification_id
    JOIN test_scores t ON t.application_id = a.id
    LEFT JOIN medical_exams m ON m.application_id = a.id
    WHERE a.status = 'ELIGIBLE' AND COALESCE(m.status, 'PENDING') <> 'UNFIT'
) ranked;

UPDATE applications SET status = 'SELECTED'
WHERE id IN (SELECT application_id FROM merit_list WHERE is_selected);
