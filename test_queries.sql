-- DREMS viva queries. Run them one at a time in the Supabase SQL editor.

-- 1. Screening result of every application (set automatically by the trigger)
SELECT a.id, p.full_name, n.notification_number, a.status, a.remarks
FROM applications a
JOIN profiles p ON p.id = a.candidate_id
JOIN notifications n ON n.id = a.notification_id
ORDER BY a.id;

-- 2. The view: application, age, scores and medical status together
SELECT * FROM v_application_summary;

-- 3. Trigger demo: Meena applies to CDS. Nobody sets the status by hand.
--    She is too short, so it comes back REJECTED.
INSERT INTO applications (candidate_id, notification_id) VALUES (5, 2)
RETURNING id, status, remarks;
-- clean up so the other queries stay the same
DELETE FROM applications WHERE candidate_id = 5 AND notification_id = 2;

-- 4. Merit list with DENSE_RANK (Sneha is missing because she is medically UNFIT)
SELECT n.notification_number, m.rank_order, p.full_name, m.composite_score, m.is_selected
FROM merit_list m
JOIN applications a ON a.id = m.application_id
JOIN profiles p ON p.id = a.candidate_id
JOIN notifications n ON n.id = a.notification_id
ORDER BY n.notification_number, m.rank_order;

-- 5. Aggregation: applicants and pass rate per notification
SELECT n.notification_number,
       COUNT(a.id) AS applied,
       COUNT(*) FILTER (WHERE a.status <> 'REJECTED') AS passed_screening,
       ROUND(100.0 * COUNT(*) FILTER (WHERE a.status <> 'REJECTED') / NULLIF(COUNT(a.id), 0), 1) AS pass_pct
FROM notifications n
LEFT JOIN applications a ON a.notification_id = n.id
GROUP BY n.notification_number
ORDER BY n.notification_number;

-- 6. Subquery: candidates whose written marks are above the average
SELECT p.full_name, t.written_marks
FROM test_scores t
JOIN applications a ON a.id = t.application_id
JOIN profiles p ON p.id = a.candidate_id
WHERE t.written_marks > (SELECT AVG(written_marks) FROM test_scores);

-- 7. Constraint demo: this should FAIL because expanded chest < normal chest
INSERT INTO physical_details VALUES (1, 175, 72, 90, 85);
