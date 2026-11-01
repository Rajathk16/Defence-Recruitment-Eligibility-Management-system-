-- DREMS: Defence Recruitment and Eligibility Management System
-- Run this whole file in the Supabase SQL editor.
-- Row level security is left off because this is only a course demo.

DROP VIEW IF EXISTS v_application_summary;
DROP TABLE IF EXISTS merit_list, medical_exams, test_scores, applications,
    eligibility_rules, notifications, education, physical_details,
    profiles, branches CASCADE;
DROP FUNCTION IF EXISTS fn_screen_application() CASCADE;


-- 1. TABLES (10)

CREATE TABLE branches (
    id           SERIAL PRIMARY KEY,
    code         TEXT UNIQUE NOT NULL,
    name         TEXT NOT NULL,
    headquarters TEXT DEFAULT 'New Delhi'
);

CREATE TABLE profiles (
    id             SERIAL PRIMARY KEY,
    full_name      TEXT NOT NULL,
    email          TEXT UNIQUE NOT NULL,
    dob            DATE NOT NULL,
    gender         TEXT NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    marital_status TEXT NOT NULL DEFAULT 'UNMARRIED'
                   CHECK (marital_status IN ('UNMARRIED', 'MARRIED', 'DIVORCED', 'WIDOWED')),
    state          TEXT NOT NULL,
    role           TEXT NOT NULL DEFAULT 'CANDIDATE' CHECK (role IN ('CANDIDATE', 'OFFICER'))
);

CREATE TABLE physical_details (
    candidate_id      INT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    height_cm         NUMERIC(5,1) NOT NULL CHECK (height_cm BETWEEN 130 AND 230),
    weight_kg         NUMERIC(5,1) NOT NULL CHECK (weight_kg BETWEEN 35 AND 150),
    chest_normal_cm   NUMERIC(5,1),
    chest_expanded_cm NUMERIC(5,1),
    -- our "assertion": expanded chest can never be smaller than normal chest
    CONSTRAINT chk_chest CHECK (chest_expanded_cm >= chest_normal_cm)
);

CREATE TABLE education (
    id           SERIAL PRIMARY KEY,
    candidate_id INT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    level        TEXT NOT NULL CHECK (level IN ('10TH', '12TH', 'GRADUATION')),
    board        TEXT NOT NULL,
    year_passed  INT NOT NULL,
    percentage   NUMERIC(5,2) NOT NULL CHECK (percentage BETWEEN 0 AND 100)
);

CREATE TABLE notifications (
    id                  SERIAL PRIMARY KEY,
    notification_number TEXT UNIQUE NOT NULL,
    branch_id           INT NOT NULL REFERENCES branches(id),
    title               TEXT NOT NULL,
    vacancies           INT NOT NULL CHECK (vacancies > 0),
    cutoff_date         DATE NOT NULL,   -- age is measured on this date
    last_date           DATE NOT NULL
);

-- one row of rules per notification
CREATE TABLE eligibility_rules (
    notification_id INT PRIMARY KEY REFERENCES notifications(id) ON DELETE CASCADE,
    min_age         NUMERIC(4,1) NOT NULL,
    max_age         NUMERIC(4,1) NOT NULL,
    min_height_cm   NUMERIC(5,1) NOT NULL,
    min_percentage  NUMERIC(5,2) NOT NULL,
    unmarried_only  BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE applications (
    id              SERIAL PRIMARY KEY,
    candidate_id    INT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    notification_id INT NOT NULL REFERENCES notifications(id),
    status          TEXT NOT NULL DEFAULT 'SUBMITTED'
                    CHECK (status IN ('SUBMITTED', 'ELIGIBLE', 'REJECTED', 'SELECTED')),
    remarks         TEXT,
    applied_on      DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE (candidate_id, notification_id)
);

CREATE TABLE test_scores (
    application_id  INT PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
    written_marks   NUMERIC(5,2) NOT NULL CHECK (written_marks BETWEEN 0 AND 100),
    pft_score       NUMERIC(5,2) NOT NULL CHECK (pft_score BETWEEN 0 AND 100),
    interview_score NUMERIC(5,2) NOT NULL CHECK (interview_score BETWEEN 0 AND 100)
);

CREATE TABLE medical_exams (
    application_id INT PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
    board_location TEXT NOT NULL,
    exam_date      DATE NOT NULL,
    status         TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'FIT', 'UNFIT')),
    notes          TEXT
);

CREATE TABLE merit_list (
    application_id  INT PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
    composite_score NUMERIC(5,2) NOT NULL,
    rank_order      INT NOT NULL,
    is_selected     BOOLEAN NOT NULL
);


-- 2. THE ONE FUNCTION
-- Runs before every new application is saved. It checks four rules
-- (age, height, marital status, marks) and sets status and remarks.

CREATE FUNCTION fn_screen_application() RETURNS TRIGGER AS $$
DECLARE
    r        eligibility_rules%ROWTYPE;
    v_age    NUMERIC;
    v_height NUMERIC;
    v_marital TEXT;
    v_pct    NUMERIC;
    v_why    TEXT := '';
BEGIN
    SELECT * INTO r FROM eligibility_rules WHERE notification_id = NEW.notification_id;

    SELECT (n.cutoff_date - p.dob) / 365.25, ph.height_cm, p.marital_status
    INTO v_age, v_height, v_marital
    FROM profiles p
    LEFT JOIN physical_details ph ON ph.candidate_id = p.id
    JOIN notifications n ON n.id = NEW.notification_id
    WHERE p.id = NEW.candidate_id;

    -- marks of the most recent qualification
    SELECT percentage INTO v_pct FROM education
    WHERE candidate_id = NEW.candidate_id
    ORDER BY year_passed DESC LIMIT 1;

    IF v_age < r.min_age OR v_age > r.max_age THEN
        v_why := v_why || 'Age not in range. ';
    END IF;
    IF v_height IS NULL OR v_height < r.min_height_cm THEN
        v_why := v_why || 'Height too low. ';
    END IF;
    IF r.unmarried_only AND v_marital <> 'UNMARRIED' THEN
        v_why := v_why || 'Must be unmarried. ';
    END IF;
    IF v_pct IS NULL OR v_pct < r.min_percentage THEN
        v_why := v_why || 'Marks too low. ';
    END IF;

    NEW.remarks := NULLIF(trim(v_why), '');
    NEW.status  := CASE WHEN v_why = '' THEN 'ELIGIBLE' ELSE 'REJECTED' END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_screen_application
BEFORE INSERT ON applications
FOR EACH ROW EXECUTE FUNCTION fn_screen_application();


-- 3. THE ONE VIEW

CREATE VIEW v_application_summary AS
SELECT a.id AS application_id,
       p.full_name,
       n.notification_number,
       ROUND((n.cutoff_date - p.dob) / 365.25, 1) AS age_at_cutoff,
       a.status,
       a.remarks,
       t.written_marks,
       t.pft_score,
       t.interview_score,
       m.status AS medical_status
FROM applications a
JOIN profiles p ON p.id = a.candidate_id
JOIN notifications n ON n.id = a.notification_id
LEFT JOIN test_scores t ON t.application_id = a.id
LEFT JOIN medical_exams m ON m.application_id = a.id;


-- 4. FIXED LOOKUP DATA
-- Everything else (candidates, notifications, applications, scores)
-- is entered from the website. See seed_data.sql for optional demo rows.

INSERT INTO branches (code, name) VALUES
    ('ARMY', 'Indian Army'),            -- 1
    ('NAVY', 'Indian Navy'),            -- 2
    ('AIR_FORCE', 'Indian Air Force'),  -- 3
    ('COAST_GUARD', 'Indian Coast Guard'); -- 4
