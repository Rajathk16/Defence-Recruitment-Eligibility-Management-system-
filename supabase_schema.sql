-- ============================================================================
-- DEFENCE RECRUITMENT & ELIGIBILITY MANAGEMENT SYSTEM (DREMS)
-- DBMS MINI-PROJECT: Complete PostgreSQL / Supabase Database Schema
-- Features: 3NF Relational Model, Custom Enums, Check Constraints,
--           PL/pgSQL Functions, Triggers, Views, Audit Logging, & Mock Data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS & CLEANUP
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing views if refreshing
DROP VIEW IF EXISTS v_branch_selection_analytics CASCADE;
DROP VIEW IF EXISTS v_final_merit_ranking CASCADE;
DROP VIEW IF EXISTS v_recruiter_pipeline CASCADE;
DROP VIEW IF EXISTS v_candidate_dashboard CASCADE;
DROP VIEW IF EXISTS v_active_notifications_with_rules CASCADE;

-- Drop tables in reverse order of foreign key dependency
DROP TABLE IF EXISTS system_audit_logs CASCADE;
DROP TABLE IF EXISTS merit_lists CASCADE;
DROP TABLE IF EXISTS medical_examinations CASCADE;
DROP TABLE IF EXISTS test_scores CASCADE;
DROP TABLE IF EXISTS selection_stages CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS eligibility_rules CASCADE;
DROP TABLE IF EXISTS recruitment_notifications CASCADE;
DROP TABLE IF EXISTS defence_branches CASCADE;
DROP TABLE IF EXISTS educational_qualifications CASCADE;
DROP TABLE IF EXISTS physical_attributes CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS branch_code_enum CASCADE;
DROP TYPE IF EXISTS gender_enum CASCADE;
DROP TYPE IF EXISTS marital_status_enum CASCADE;
DROP TYPE IF EXISTS application_status_enum CASCADE;
DROP TYPE IF EXISTS stage_name_enum CASCADE;
DROP TYPE IF EXISTS stage_status_enum CASCADE;
DROP TYPE IF EXISTS medical_status_enum CASCADE;
DROP TYPE IF EXISTS user_role_enum CASCADE;

-- ----------------------------------------------------------------------------
-- 1. ENUMS (DOMAIN CONSTRAINTS)
-- ----------------------------------------------------------------------------
CREATE TYPE branch_code_enum AS ENUM ('ARMY', 'NAVY', 'AIR_FORCE', 'COAST_GUARD');
CREATE TYPE gender_enum AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE marital_status_enum AS ENUM ('UNMARRIED', 'MARRIED', 'DIVORCED', 'WIDOWED');
CREATE TYPE user_role_enum AS ENUM ('CANDIDATE', 'OFFICER', 'ADMIN');

CREATE TYPE application_status_enum AS ENUM (
    'SUBMITTED',
    'ELIGIBLE',
    'REJECTED',
    'EXAM_SCHEDULED',
    'WRITTEN_QUALIFIED',
    'PFT_QUALIFIED',
    'MEDICAL_FIT',
    'RECOMMENDED',
    'MERIT_LISTED'
);

CREATE TYPE stage_name_enum AS ENUM (
    'WRITTEN_EXAM',
    'PHYSICAL_TEST',
    'MEDICAL_EXAM',
    'INTERVIEW_SSB'
);

CREATE TYPE stage_status_enum AS ENUM (
    'PENDING',
    'SCHEDULED',
    'CLEARED',
    'FAILED',
    'ABSENT'
);

CREATE TYPE medical_status_enum AS ENUM (
    'FIT',
    'TEMPORARILY_UNFIT',
    'PERMANENTLY_UNFIT',
    'PENDING'
);

-- ----------------------------------------------------------------------------
-- 2. CORE CANDIDATE TABLES
-- ----------------------------------------------------------------------------

-- Table: profiles
-- Stores personal details for candidates and board personnel
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    dob DATE NOT NULL,
    gender gender_enum NOT NULL,
    marital_status marital_status_enum NOT NULL DEFAULT 'UNMARRIED',
    nationality VARCHAR(50) DEFAULT 'INDIAN' NOT NULL,
    domicile_state VARCHAR(60) NOT NULL,
    aadhar_number VARCHAR(12) UNIQUE,
    role user_role_enum DEFAULT 'CANDIDATE' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_dob_realistic CHECK (dob > '1970-01-01' AND dob < CURRENT_DATE)
);

-- Table: physical_attributes
-- Physical metrics strictly measured for defence criteria
CREATE TABLE physical_attributes (
    candidate_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    height_cm NUMERIC(5,2) NOT NULL CHECK (height_cm >= 130.0 AND height_cm <= 230.0),
    weight_kg NUMERIC(5,2) NOT NULL CHECK (weight_kg >= 35.0 AND weight_kg <= 150.0),
    chest_normal_cm NUMERIC(5,2) CHECK (chest_normal_cm >= 60.0 AND chest_normal_cm <= 140.0),
    chest_expanded_cm NUMERIC(5,2) CHECK (chest_expanded_cm >= 60.0 AND chest_expanded_cm <= 150.0),
    eye_vision_left VARCHAR(10) DEFAULT '6/6' NOT NULL,
    eye_vision_right VARCHAR(10) DEFAULT '6/6' NOT NULL,
    color_blindness BOOLEAN DEFAULT FALSE NOT NULL,
    verified_by_officer BOOLEAN DEFAULT FALSE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_chest_expansion CHECK (
        chest_expanded_cm IS NULL OR 
        chest_normal_cm IS NULL OR 
        chest_expanded_cm >= chest_normal_cm
    )
);

-- Table: educational_qualifications
-- Educational credentials supporting multiple records per candidate
CREATE TABLE educational_qualifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    qualification_level VARCHAR(50) NOT NULL, -- '10TH', '12TH', 'DIPLOMA', 'GRADUATION_BTECH', 'GRADUATION_BSC', 'POST_GRADUATION'
    stream_specialization VARCHAR(100),       -- e.g. 'Physics, Chemistry, Maths', 'Mechanical Engineering'
    board_university VARCHAR(150) NOT NULL,
    year_of_passing INT NOT NULL CHECK (year_of_passing BETWEEN 1990 AND 2030),
    aggregate_percentage NUMERIC(5,2) NOT NULL CHECK (aggregate_percentage >= 0.0 AND aggregate_percentage <= 100.0),
    pcm_percentage NUMERIC(5,2) CHECK (pcm_percentage >= 0.0 AND pcm_percentage <= 100.0),
    is_highest_qualification BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ----------------------------------------------------------------------------
-- 3. DEFENCE BRANCHES & RECRUITMENT NOTIFICATIONS
-- ----------------------------------------------------------------------------

-- Table: defence_branches
CREATE TABLE defence_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code branch_code_enum UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    motto VARCHAR(255),
    headquarters VARCHAR(100) DEFAULT 'New Delhi',
    insignia_icon VARCHAR(50) DEFAULT 'shield'
);

-- Table: recruitment_notifications
CREATE TABLE recruitment_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_number VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'NDA-01-2026', 'CDS-02-2026'
    branch_id UUID NOT NULL REFERENCES defence_branches(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    entry_type VARCHAR(100) NOT NULL, -- 'PERMANENT_COMMISSION', 'SHORT_SERVICE_COMMISSION', 'AGNIVEER'
    total_vacancies INT NOT NULL CHECK (total_vacancies > 0),
    cutoff_date DATE NOT NULL,        -- Benchmark date to compute candidate age
    application_start_date DATE NOT NULL,
    application_end_date DATE NOT NULL,
    exam_date DATE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_app_dates CHECK (application_end_date >= application_start_date)
);

-- Table: eligibility_rules
-- Rule engine parameters tied to each notification
CREATE TABLE eligibility_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID UNIQUE NOT NULL REFERENCES recruitment_notifications(id) ON DELETE CASCADE,
    min_age_years NUMERIC(4,2) NOT NULL CHECK (min_age_years >= 16.0),
    max_age_years NUMERIC(4,2) NOT NULL CHECK (max_age_years <= 45.0),
    allowed_gender VARCHAR(20) DEFAULT 'ALL' NOT NULL CHECK (allowed_gender IN ('ALL', 'MALE_ONLY', 'FEMALE_ONLY')),
    allowed_marital_status VARCHAR(20) DEFAULT 'UNMARRIED' NOT NULL, -- 'UNMARRIED', 'ALL'
    min_height_male_cm NUMERIC(5,2) DEFAULT 157.0 NOT NULL,
    min_height_female_cm NUMERIC(5,2) DEFAULT 152.0 NOT NULL,
    min_chest_expansion_cm NUMERIC(4,2) DEFAULT 5.0 NOT NULL,
    min_qualification_level VARCHAR(50) NOT NULL, -- '12TH', 'GRADUATION_BTECH', etc.
    min_aggregate_percentage NUMERIC(5,2) DEFAULT 50.0 NOT NULL,
    min_pcm_percentage NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
    color_blindness_allowed BOOLEAN DEFAULT FALSE NOT NULL,
    requires_pcm BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_age_range CHECK (max_age_years >= min_age_years)
);

-- ----------------------------------------------------------------------------
-- 4. APPLICATIONS & SELECTION PIPELINE
-- ----------------------------------------------------------------------------

-- Table: applications
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number VARCHAR(35) UNIQUE NOT NULL,
    candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    notification_id UUID NOT NULL REFERENCES recruitment_notifications(id) ON DELETE RESTRICT,
    status application_status_enum DEFAULT 'SUBMITTED' NOT NULL,
    is_eligible BOOLEAN DEFAULT FALSE NOT NULL,
    eligibility_remarks TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_candidate_notification UNIQUE (candidate_id, notification_id)
);

-- Table: selection_stages
-- Multi-stage workflow: Written Exam -> PFT -> Medical -> Interview (SSB)
CREATE TABLE selection_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    stage_name stage_name_enum NOT NULL,
    stage_order INT NOT NULL CHECK (stage_order BETWEEN 1 AND 4),
    status stage_status_enum DEFAULT 'PENDING' NOT NULL,
    scheduled_date DATE,
    venue_details TEXT,
    completed_at TIMESTAMPTZ,
    CONSTRAINT uq_application_stage UNIQUE (application_id, stage_name)
);

-- Table: test_scores
-- Scores recorded across different stages
CREATE TABLE test_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    written_marks NUMERIC(5,2) DEFAULT 0.0 CHECK (written_marks >= 0.0),
    written_max_marks NUMERIC(5,2) DEFAULT 100.0 CHECK (written_max_marks > 0.0),
    pft_run_time_seconds INT CHECK (pft_run_time_seconds IS NULL OR pft_run_time_seconds > 0), -- e.g. 330s for 1.6km
    pft_pushups INT DEFAULT 0 CHECK (pft_pushups >= 0),
    pft_situps INT DEFAULT 0 CHECK (pft_situps >= 0),
    pft_score NUMERIC(5,2) DEFAULT 0.0 CHECK (pft_score >= 0.0),
    interview_score NUMERIC(5,2) DEFAULT 0.0 CHECK (interview_score >= 0.0),
    interview_max_marks NUMERIC(5,2) DEFAULT 100.0,
    evaluator_remarks TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_test_scores_app UNIQUE (application_id)
);

-- Table: medical_examinations
CREATE TABLE medical_examinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID UNIQUE NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    medical_board_location VARCHAR(120) NOT NULL,
    exam_date DATE NOT NULL,
    status medical_status_enum DEFAULT 'PENDING' NOT NULL,
    blood_group VARCHAR(5),
    blood_pressure VARCHAR(15),
    dental_points INT CHECK (dental_points IS NULL OR (dental_points BETWEEN 0 AND 22)),
    visual_standard_passed BOOLEAN DEFAULT TRUE NOT NULL,
    findings_notes TEXT,
    appeal_deadline DATE,
    medical_officer_name VARCHAR(100),
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table: merit_lists
CREATE TABLE merit_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES recruitment_notifications(id) ON DELETE CASCADE,
    application_id UUID UNIQUE NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    composite_score NUMERIC(6,2) NOT NULL,
    rank_order INT NOT NULL,
    is_selected BOOLEAN DEFAULT FALSE NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_notification_rank UNIQUE (notification_id, rank_order)
);

-- Table: system_audit_logs
-- Full DBMS audit trail logging table state changes
CREATE TABLE system_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    entity_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    changed_by VARCHAR(100) DEFAULT CURRENT_USER,
    changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ----------------------------------------------------------------------------
-- 5. STORED PROCEDURES & PL/pgSQL FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function 1: Calculate precise age in decimal years as of a cutoff date
CREATE OR REPLACE FUNCTION fn_calculate_age(p_dob DATE, p_cutoff_date DATE)
RETURNS NUMERIC AS $$
BEGIN
    RETURN ROUND(
        EXTRACT(EPOCH FROM (p_cutoff_date::timestamp - p_dob::timestamp)) / (365.25 * 86400)::numeric,
        2
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function 2: Complete Eligibility Evaluation Engine
-- Evaluates: Age, Gender, Marital Status, Height, Chest Expansion, Vision, Education, Percentage, PCM Requirement
CREATE OR REPLACE FUNCTION fn_evaluate_eligibility(
    p_candidate_id UUID,
    p_notification_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
    v_physical RECORD;
    v_rules RECORD;
    v_highest_edu RECORD;
    v_candidate_age NUMERIC(5,2);
    v_is_eligible BOOLEAN := TRUE;
    v_reasons TEXT[] := ARRAY[]::TEXT[];
    v_min_height NUMERIC(5,2);
    v_expansion NUMERIC(5,2);
BEGIN
    -- 1. Fetch Candidate Profile
    SELECT * INTO v_profile FROM profiles WHERE id = p_candidate_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('is_eligible', FALSE, 'reasons', ARRAY['Candidate profile not found']);
    END IF;

    -- 2. Fetch Notification Rules & Benchmark Cutoff Date
    SELECT r.*, n.cutoff_date, n.title INTO v_rules
    FROM eligibility_rules r
    JOIN recruitment_notifications n ON n.id = r.notification_id
    WHERE r.notification_id = p_notification_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('is_eligible', FALSE, 'reasons', ARRAY['Eligibility rules not configured for this notification']);
    END IF;

    -- 3. Age Verification
    v_candidate_age := fn_calculate_age(v_profile.dob, v_rules.cutoff_date);
    IF v_candidate_age < v_rules.min_age_years THEN
        v_is_eligible := FALSE;
        v_reasons := array_append(v_reasons, format('Underage: %.2f years (Min required: %.2f years)', v_candidate_age, v_rules.min_age_years));
    ELSIF v_candidate_age > v_rules.max_age_years THEN
        v_is_eligible := FALSE;
        v_reasons := array_append(v_reasons, format('Overage: %.2f years (Max permitted: %.2f years)', v_candidate_age, v_rules.max_age_years));
    END IF;

    -- 4. Gender Verification
    IF v_rules.allowed_gender = 'MALE_ONLY' AND v_profile.gender <> 'MALE' THEN
        v_is_eligible := FALSE;
        v_reasons := array_append(v_reasons, 'Restricted to Male candidates only');
    ELSIF v_rules.allowed_gender = 'FEMALE_ONLY' AND v_profile.gender <> 'FEMALE' THEN
        v_is_eligible := FALSE;
        v_reasons := array_append(v_reasons, 'Restricted to Female candidates only');
    END IF;

    -- 5. Marital Status Verification
    IF v_rules.allowed_marital_status = 'UNMARRIED' AND v_profile.marital_status <> 'UNMARRIED' THEN
        v_is_eligible := FALSE;
        v_reasons := array_append(v_reasons, 'Restricted to Unmarried candidates only');
    END IF;

    -- 6. Physical Standards Verification
    SELECT * INTO v_physical FROM physical_attributes WHERE candidate_id = p_candidate_id;
    IF NOT FOUND THEN
        v_is_eligible := FALSE;
        v_reasons := array_append(v_reasons, 'Physical attributes not submitted in profile');
    ELSE
        -- Height standard
        v_min_height := CASE WHEN v_profile.gender = 'FEMALE' THEN v_rules.min_height_female_cm ELSE v_rules.min_height_male_cm END;
        IF v_physical.height_cm < v_min_height THEN
            v_is_eligible := FALSE;
            v_reasons := array_append(v_reasons, format('Height %.1f cm is below requirement of %.1f cm', v_physical.height_cm, v_min_height));
        END IF;

        -- Chest expansion (for males)
        IF v_profile.gender = 'MALE' AND v_physical.chest_normal_cm IS NOT NULL AND v_physical.chest_expanded_cm IS NOT NULL THEN
            v_expansion := v_physical.chest_expanded_cm - v_physical.chest_normal_cm;
            IF v_expansion < v_rules.min_chest_expansion_cm THEN
                v_is_eligible := FALSE;
                v_reasons := array_append(v_reasons, format('Chest expansion %.1f cm is below required %.1f cm', v_expansion, v_rules.min_chest_expansion_cm));
            END IF;
        END IF;

        -- Color blindness check
        IF NOT v_rules.color_blindness_allowed AND v_physical.color_blindness THEN
            v_is_eligible := FALSE;
            v_reasons := array_append(v_reasons, 'Color blindness is disqualifying for this entry');
        END IF;
    END IF;

    -- 7. Educational Qualifications Verification
    SELECT * INTO v_highest_edu 
    FROM educational_qualifications 
    WHERE candidate_id = p_candidate_id 
    ORDER BY aggregate_percentage DESC 
    LIMIT 1;

    IF NOT FOUND THEN
        v_is_eligible := FALSE;
        v_reasons := array_append(v_reasons, 'No educational qualifications recorded');
    ELSE
        IF v_highest_edu.aggregate_percentage < v_rules.min_aggregate_percentage THEN
            v_is_eligible := FALSE;
            v_reasons := array_append(v_reasons, format('Aggregate marks %.2f%% is below minimum %.2f%%', v_highest_edu.aggregate_percentage, v_rules.min_aggregate_percentage));
        END IF;

        IF v_rules.requires_pcm THEN
            IF v_highest_edu.pcm_percentage IS NULL OR v_highest_edu.pcm_percentage < v_rules.min_pcm_percentage THEN
                v_is_eligible := FALSE;
                v_reasons := array_append(v_reasons, format('PCM marks requirement of %.2f%% not met', v_rules.min_pcm_percentage));
            END IF;
        END IF;
    END IF;

    -- Return JSON result
    RETURN jsonb_build_object(
        'is_eligible', v_is_eligible,
        'calculated_age', v_candidate_age,
        'reasons', to_jsonb(v_reasons)
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 3: Automated Application Screening Trigger
-- Runs BEFORE INSERT on applications to evaluate eligibility, generate unique roll number, and set status
CREATE OR REPLACE FUNCTION trg_fn_screen_application()
RETURNS TRIGGER AS $$
DECLARE
    v_eval JSONB;
    v_reasons_arr TEXT[];
    v_reasons_str TEXT := '';
    v_seq_num TEXT;
BEGIN
    -- 1. Generate unique human-readable application number: APP-YYYY-[RANDOM]
    v_seq_num := to_char(NOW(), 'YYYY') || '-' || LPAD(FLOOR(random() * 89999 + 10000)::text, 5, '0');
    NEW.application_number := 'APP-' || v_seq_num;

    -- 2. Call PL/pgSQL Eligibility Engine
    v_eval := fn_evaluate_eligibility(NEW.candidate_id, NEW.notification_id);
    NEW.is_eligible := (v_eval->>'is_eligible')::BOOLEAN;

    -- 3. Extract remarks
    SELECT array_agg(value::text) INTO v_reasons_arr FROM jsonb_array_elements_text(v_eval->'reasons');
    IF array_length(v_reasons_arr, 1) > 0 THEN
        v_reasons_str := array_to_string(v_reasons_arr, '; ');
    ELSE
        v_reasons_str := 'All physical, demographic, and educational criteria satisfied.';
    END IF;
    NEW.eligibility_remarks := v_reasons_str;

    -- 4. Update status based on screening outcome
    IF NEW.is_eligible THEN
        NEW.status := 'ELIGIBLE';
    ELSE
        NEW.status := 'REJECTED';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function 4: Post-Application Stage Creator Trigger
-- Automatically schedules Stage 1 (Written Exam) for eligible applicants
CREATE OR REPLACE FUNCTION trg_fn_initiate_stages_after_application()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_eligible THEN
        INSERT INTO selection_stages (application_id, stage_name, stage_order, status, scheduled_date, venue_details)
        VALUES 
            (NEW.id, 'WRITTEN_EXAM', 1, 'SCHEDULED', CURRENT_DATE + INTERVAL '14 days', 'Command Examination Center, Main Hall'),
            (NEW.id, 'PHYSICAL_TEST', 2, 'PENDING', NULL, 'Army Physical Grounds'),
            (NEW.id, 'MEDICAL_EXAM', 3, 'PENDING', NULL, 'Military Hospital'),
            (NEW.id, 'INTERVIEW_SSB', 4, 'PENDING', NULL, 'Services Selection Board (SSB)');

        -- Initialize empty test score record
        INSERT INTO test_scores (application_id, written_marks, written_max_marks)
        VALUES (NEW.id, 0.0, 100.0);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function 5: Generate Final Merit List
-- Stored Procedure computing weighted composite score and assigning ranks
CREATE OR REPLACE FUNCTION sp_generate_merit_list(p_notification_id UUID)
RETURNS TABLE(
    rank_order INT,
    candidate_name VARCHAR,
    roll_number VARCHAR,
    composite_score NUMERIC,
    is_selected BOOLEAN
) AS $$
DECLARE
    v_vacancies INT;
BEGIN
    -- Get total vacancies for the notification
    SELECT total_vacancies INTO v_vacancies 
    FROM recruitment_notifications 
    WHERE id = p_notification_id;

    -- Clear prior merit list computation for this notification
    DELETE FROM merit_lists WHERE notification_id = p_notification_id;

    -- Insert newly ranked candidates
    -- Formula: Composite Score = (Written% * 0.40) + (PFT Score * 0.20) + (Interview% * 0.40)
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
                ORDER BY 
                (((ts.written_marks / NULLIF(ts.written_max_marks, 0) * 100) * 0.40) +
                 (COALESCE(ts.pft_score, 0) * 0.20) +
                 ((COALESCE(ts.interview_score, 0) / NULLIF(COALESCE(ts.interview_max_marks, 100), 0) * 100) * 0.40)) DESC
            ) as computed_rank
        FROM applications app
        JOIN test_scores ts ON ts.application_id = app.id
        LEFT JOIN medical_examinations med ON med.application_id = app.id
        WHERE app.notification_id = p_notification_id
          AND app.is_eligible = TRUE
          AND (med.status IS NULL OR med.status = 'FIT') -- Only medically fit or pending appeal
    )
    INSERT INTO merit_lists (notification_id, application_id, candidate_id, composite_score, rank_order, is_selected)
    SELECT 
        p_notification_id,
        rc.app_id,
        rc.candidate_id,
        rc.final_composite,
        rc.computed_rank,
        (rc.computed_rank <= v_vacancies)
    FROM ranked_candidates rc;

    -- Update application status for selected candidates
    UPDATE applications
    SET status = 'MERIT_LISTED'
    WHERE id IN (
        SELECT application_id FROM merit_lists 
        WHERE notification_id = p_notification_id AND is_selected = TRUE
    );

    -- Return the result
    RETURN QUERY
    SELECT 
        ml.rank_order,
        p.full_name,
        app.application_number,
        ml.composite_score,
        ml.is_selected
    FROM merit_lists ml
    JOIN profiles p ON p.id = ml.candidate_id
    JOIN applications app ON app.id = ml.application_id
    WHERE ml.notification_id = p_notification_id
    ORDER BY ml.rank_order ASC;
END;
$$ LANGUAGE plpgsql;

-- Function 6: Generic Audit Logging Trigger
CREATE OR REPLACE FUNCTION trg_fn_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO system_audit_logs (entity_name, record_id, action, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO system_audit_logs (entity_name, record_id, action, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO system_audit_logs (entity_name, record_id, action, old_data)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 6. TRIGGERS ATTACHMENT
-- ----------------------------------------------------------------------------

-- Trigger 1: Auto-screen application on submission
CREATE TRIGGER trg_applications_before_insert
BEFORE INSERT ON applications
FOR EACH ROW
EXECUTE FUNCTION trg_fn_screen_application();

-- Trigger 2: Auto-populate examination stages after application insertion
CREATE TRIGGER trg_applications_after_insert
AFTER INSERT ON applications
FOR EACH ROW
EXECUTE FUNCTION trg_fn_initiate_stages_after_application();

-- Trigger 3: Audit logging on critical tables
CREATE TRIGGER trg_audit_applications
AFTER INSERT OR UPDATE OR DELETE ON applications
FOR EACH ROW EXECUTE FUNCTION trg_fn_audit_log();

CREATE TRIGGER trg_audit_medical
AFTER INSERT OR UPDATE OR DELETE ON medical_examinations
FOR EACH ROW EXECUTE FUNCTION trg_fn_audit_log();

-- ----------------------------------------------------------------------------
-- 7. DBMS VIEWS FOR REPORTING & FRONTEND CONSUMPTION
-- ----------------------------------------------------------------------------

-- View 1: Active notifications with formatted criteria summary
CREATE OR REPLACE VIEW v_active_notifications_with_rules AS
SELECT 
    n.id AS notification_id,
    n.notification_number,
    b.code AS branch_code,
    b.name AS branch_name,
    n.title,
    n.entry_type,
    n.total_vacancies,
    n.cutoff_date,
    n.application_start_date,
    n.application_end_date,
    r.min_age_years,
    r.max_age_years,
    r.allowed_gender,
    r.allowed_marital_status,
    r.min_height_male_cm,
    r.min_height_female_cm,
    r.min_qualification_level,
    r.min_aggregate_percentage,
    r.requires_pcm,
    n.is_active
FROM recruitment_notifications n
JOIN defence_branches b ON b.id = n.branch_id
JOIN eligibility_rules r ON r.notification_id = n.id;

-- View 2: Comprehensive Candidate Dashboard
CREATE OR REPLACE VIEW v_candidate_dashboard AS
SELECT 
    app.id AS application_id,
    app.application_number,
    p.id AS candidate_id,
    p.full_name,
    p.email,
    p.gender,
    p.dob,
    fn_calculate_age(p.dob, n.cutoff_date) AS age_at_cutoff,
    pa.height_cm,
    pa.weight_kg,
    b.name AS branch_name,
    n.title AS notification_title,
    app.status AS application_status,
    app.is_eligible,
    app.eligibility_remarks,
    app.applied_at,
    ts.written_marks,
    ts.pft_score,
    ts.interview_score,
    med.status AS medical_status
FROM applications app
JOIN profiles p ON p.id = app.candidate_id
LEFT JOIN physical_attributes pa ON pa.candidate_id = p.id
JOIN recruitment_notifications n ON n.id = app.notification_id
JOIN defence_branches b ON b.id = n.branch_id
LEFT JOIN test_scores ts ON ts.application_id = app.id
LEFT JOIN medical_examinations med ON med.application_id = app.id;

-- View 3: Recruitment Board / Officer Pipeline View
CREATE OR REPLACE VIEW v_recruiter_pipeline AS
SELECT 
    n.id AS notification_id,
    n.notification_number,
    n.title AS entry_title,
    b.name AS branch_name,
    COUNT(app.id) AS total_applications,
    COUNT(CASE WHEN app.is_eligible THEN 1 END) AS eligible_candidates,
    COUNT(CASE WHEN NOT app.is_eligible THEN 1 END) AS rejected_candidates,
    COUNT(CASE WHEN app.status = 'MERIT_LISTED' THEN 1 END) AS selected_candidates,
    ROUND(
        (COUNT(CASE WHEN app.is_eligible THEN 1 END)::numeric / NULLIF(COUNT(app.id), 0) * 100), 
        1
    ) AS eligibility_pass_rate_pct
FROM recruitment_notifications n
JOIN defence_branches b ON b.id = n.branch_id
LEFT JOIN applications app ON app.notification_id = n.id
GROUP BY n.id, n.notification_number, n.title, b.name;

-- View 4: Final Merit Ranking View
CREATE OR REPLACE VIEW v_final_merit_ranking AS
SELECT 
    ml.rank_order,
    b.name AS branch_name,
    n.title AS notification_title,
    p.full_name AS candidate_name,
    app.application_number,
    p.gender,
    ml.composite_score,
    ml.is_selected,
    ml.generated_at
FROM merit_lists ml
JOIN applications app ON app.id = ml.application_id
JOIN profiles p ON p.id = ml.candidate_id
JOIN recruitment_notifications n ON n.id = ml.notification_id
JOIN defence_branches b ON b.id = n.branch_id
ORDER BY ml.notification_id, ml.rank_order ASC;

-- View 5: Branch-wise Demographic & Selection Analytics
CREATE OR REPLACE VIEW v_branch_selection_analytics AS
SELECT 
    b.name AS branch_name,
    p.gender,
    COUNT(app.id) AS total_applicants,
    ROUND(AVG(pa.height_cm), 1) AS avg_height_cm,
    ROUND(AVG(ts.written_marks), 2) AS avg_written_score,
    COUNT(CASE WHEN ml.is_selected = TRUE THEN 1 END) AS final_selections
FROM defence_branches b
JOIN recruitment_notifications n ON n.branch_id = b.id
JOIN applications app ON app.notification_id = n.id
JOIN profiles p ON p.id = app.candidate_id
LEFT JOIN physical_attributes pa ON pa.candidate_id = p.id
LEFT JOIN test_scores ts ON ts.application_id = app.id
LEFT JOIN merit_lists ml ON ml.application_id = app.id
GROUP BY b.name, p.gender;

-- ----------------------------------------------------------------------------
-- 8. SEED DATA (MOCK ARMED FORCES RECRUITMENT CAMPAIGNS & CANDIDATES)
-- ----------------------------------------------------------------------------

-- Insert Defence Branches
INSERT INTO defence_branches (id, code, name, motto, headquarters, insignia_icon) VALUES
('b1000000-0000-0000-0000-000000000001', 'ARMY', 'Indian Army', 'Service Before Self', 'Integrated Defence HQ, New Delhi', 'shield-sword'),
('b1000000-0000-0000-0000-000000000002', 'NAVY', 'Indian Navy', 'May the Lord of the Oceans be auspicious unto us', 'Naval HQ, New Delhi', 'anchor'),
('b1000000-0000-0000-0000-000000000003', 'AIR_FORCE', 'Indian Air Force', 'Touch the Sky with Glory', 'Air HQ, Vayu Bhawan, New Delhi', 'plane-takeoff'),
('b1000000-0000-0000-0000-000000000004', 'COAST_GUARD', 'Indian Coast Guard', 'We Protect', 'Coast Guard HQ, New Delhi', 'life-buoy');

-- Insert Recruitment Notifications
INSERT INTO recruitment_notifications (
    id, notification_number, branch_id, title, entry_type, total_vacancies, 
    cutoff_date, application_start_date, application_end_date, exam_date, is_active, description
) VALUES
(
    'n1000000-0000-0000-0000-000000000001',
    'NDA-154-2026',
    'b1000000-0000-0000-0000-000000000001',
    'National Defence Academy (NDA & NA Exam I, 2026)',
    'PERMANENT_COMMISSION',
    400,
    '2026-07-01',
    '2026-01-01',
    '2026-12-31',
    '2026-09-15',
    TRUE,
    'Commissioned Officer entry through National Defence Academy Khadakwasla for Army, Navy, and Air Force wings.'
),
(
    'n1000000-0000-0000-0000-000000000002',
    'CDS-02-2026',
    'b1000000-0000-0000-0000-000000000001',
    'Combined Defence Services (CDS Exam II, 2026)',
    'PERMANENT_COMMISSION',
    340,
    '2026-07-01',
    '2026-02-01',
    '2026-12-31',
    '2026-10-20',
    TRUE,
    'Entry for graduates into Indian Military Academy (IMA), Air Force Academy (AFA), Indian Naval Academy (INA) and OTA.'
),
(
    'n1000000-0000-0000-0000-000000000003',
    'AFCAT-01-2026',
    'b1000000-0000-0000-0000-000000000003',
    'Air Force Common Admission Test (Flying & Ground Duty)',
    'SHORT_SERVICE_COMMISSION',
    250,
    '2026-01-01',
    '2026-01-15',
    '2026-12-31',
    '2026-08-25',
    TRUE,
    'Recruitment for Flying Branch and Ground Duty (Technical & Non-Technical) Officers in the Indian Air Force.'
),
(
    'n1000000-0000-0000-0000-000000000004',
    'AGNIVEER-ARMY-2026',
    'b1000000-0000-0000-0000-000000000001',
    'Agniveer General Duty (All Arms) Rally 2026',
    'AGNIVEER',
    1200,
    '2026-10-01',
    '2026-03-01',
    '2026-12-31',
    '2026-11-10',
    TRUE,
    'Agniveer recruitment rally for soldiers in General Duty, Technical, and Clerk cadres under the Agnipath Scheme.'
);

-- Configure Eligibility Rules for Notifications
INSERT INTO eligibility_rules (
    notification_id, min_age_years, max_age_years, allowed_gender, allowed_marital_status,
    min_height_male_cm, min_height_female_cm, min_chest_expansion_cm, min_qualification_level,
    min_aggregate_percentage, min_pcm_percentage, color_blindness_allowed, requires_pcm
) VALUES
(
    'n1000000-0000-0000-0000-000000000001', -- NDA (Age 16.5 to 19.5, 12th pass)
    16.50, 19.50, 'ALL', 'UNMARRIED',
    157.0, 152.0, 5.0, '12TH',
    60.0, 60.0, FALSE, TRUE
),
(
    'n1000000-0000-0000-0000-000000000002', -- CDS (Age 19 to 24, Graduate)
    19.00, 24.00, 'ALL', 'UNMARRIED',
    157.5, 152.0, 5.0, 'GRADUATION',
    50.0, 0.0, FALSE, FALSE
),
(
    'n1000000-0000-0000-0000-000000000003', -- AFCAT (Age 20 to 24 for Flying, Height 162.5cm)
    20.00, 24.00, 'ALL', 'UNMARRIED',
    162.5, 162.5, 5.0, 'GRADUATION_BTECH',
    60.0, 60.0, FALSE, TRUE
),
(
    'n1000000-0000-0000-0000-000000000004', -- Agniveer (Age 17.5 to 21, 10th pass)
    17.50, 21.00, 'MALE_ONLY', 'UNMARRIED',
    169.0, 152.0, 5.0, '10TH',
    45.0, 0.0, FALSE, FALSE
);

-- Insert Sample Profiles (Officers and Candidates)
INSERT INTO profiles (
    id, full_name, email, phone, dob, gender, marital_status, domicile_state, aadhar_number, role
) VALUES
(
    'c1000000-0000-0000-0000-000000000001',
    'Vikram Batra',
    'vikram.batra@aspirant.defence.gov',
    '9876543210',
    '2008-01-15', -- Age ~18.4 at NDA cutoff: PERFECT FIT
    'MALE',
    'UNMARRIED',
    'Himachal Pradesh',
    '112233445566',
    'CANDIDATE'
),
(
    'c1000000-0000-0000-0000-000000000002',
    'Ananya Sharma',
    'ananya.sharma@aspirant.defence.gov',
    '9811223344',
    '2003-05-12', -- Age ~23.1 at CDS cutoff: ELIGIBLE GRADUATE
    'FEMALE',
    'UNMARRIED',
    'Delhi',
    '223344556677',
    'CANDIDATE'
),
(
    'c1000000-0000-0000-0000-000000000003',
    'Rohan Kulkarni',
    'rohan.kulkarni@aspirant.defence.gov',
    '9988776655',
    '2008-02-10', -- Age ~18.4: BUT Short Height (153 cm) for NDA Male requirement (157cm)
    'MALE',
    'UNMARRIED',
    'Maharashtra',
    '334455667788',
    'CANDIDATE'
),
(
    'c1000000-0000-0000-0000-000000000004',
    'Siddharth Verma',
    'siddharth.verma@aspirant.defence.gov',
    '9765432109',
    '1999-04-10', -- Age ~27 at NDA cutoff: OVERAGE REJECTION TEST
    'MALE',
    'MARRIED',
    'Uttar Pradesh',
    '445566778899',
    'CANDIDATE'
),
(
    'c1000000-0000-0000-0000-000000000005',
    'Col. Rajeshwar Singh',
    'rajeshwar.singh@army.gov.in',
    '9822334455',
    '1980-08-15',
    'MALE',
    'MARRIED',
    'Punjab',
    '998811223344',
    'OFFICER'
);

-- Insert Physical Attributes
INSERT INTO physical_attributes (
    candidate_id, height_cm, weight_kg, chest_normal_cm, chest_expanded_cm, eye_vision_left, eye_vision_right, color_blindness, verified_by_officer
) VALUES
(
    'c1000000-0000-0000-0000-000000000001', -- Vikram: Fits all criteria
    175.5, 68.0, 82.0, 88.0, '6/6', '6/6', FALSE, TRUE
),
(
    'c1000000-0000-0000-0000-000000000002', -- Ananya: Fits female criteria
    164.0, 56.0, 78.0, 83.0, '6/6', '6/6', FALSE, TRUE
),
(
    'c1000000-0000-0000-0000-000000000003', -- Rohan: Height 153.0 cm (Fails 157.0cm requirement)
    153.0, 54.0, 77.0, 82.0, '6/6', '6/6', FALSE, FALSE
),
(
    'c1000000-0000-0000-0000-000000000004', -- Siddharth: Standard metrics
    172.0, 72.0, 84.0, 89.0, '6/6', '6/6', FALSE, FALSE
);

-- Insert Educational Qualifications
INSERT INTO educational_qualifications (
    candidate_id, qualification_level, stream_specialization, board_university, year_of_passing, aggregate_percentage, pcm_percentage, is_highest_qualification
) VALUES
(
    'c1000000-0000-0000-0000-000000000001', -- Vikram: 12th PCM 88%
    '12TH', 'Physics, Chemistry, Maths', 'CBSE Board', 2025, 88.50, 91.00, TRUE
),
(
    'c1000000-0000-0000-0000-000000000002', -- Ananya: B.Tech Computer Science 78%
    'GRADUATION', 'Computer Science & Engineering', 'Delhi Technological University', 2024, 78.40, 82.00, TRUE
),
(
    'c1000000-0000-0000-0000-000000000003', -- Rohan: 12th PCM 72%
    '12TH', 'Physics, Chemistry, Maths', 'Maharashtra State Board', 2025, 72.00, 70.00, TRUE
),
(
    'c1000000-0000-0000-0000-000000000004', -- Siddharth: BA 54%
    'GRADUATION', 'History & Political Science', 'Lucknow University', 2020, 54.00, NULL, TRUE
);

-- ----------------------------------------------------------------------------
-- 9. SUBMIT SAMPLE APPLICATIONS (DEMONSTRATING AUTOMATED TRIGGER SCREENING)
-- ----------------------------------------------------------------------------

-- Vikram applies for NDA (Expected: ELIGIBLE, Stages Auto-Created by Triggers)
INSERT INTO applications (candidate_id, notification_id)
VALUES ('c1000000-0000-0000-0000-000000000001', 'n1000000-0000-0000-0000-000000000001');

-- Ananya applies for CDS (Expected: ELIGIBLE, Stages Auto-Created by Triggers)
INSERT INTO applications (candidate_id, notification_id)
VALUES ('c1000000-0000-0000-0000-000000000002', 'n1000000-0000-0000-0000-000000000002');

-- Rohan applies for NDA (Expected: REJECTED by Trigger due to Height 153cm < 157cm)
INSERT INTO applications (candidate_id, notification_id)
VALUES ('c1000000-0000-0000-0000-000000000003', 'n1000000-0000-0000-0000-000000000001');

-- Siddharth applies for NDA (Expected: REJECTED by Trigger due to Overage & Married status)
INSERT INTO applications (candidate_id, notification_id)
VALUES ('c1000000-0000-0000-0000-000000000004', 'n1000000-0000-0000-0000-000000000001');

-- ----------------------------------------------------------------------------
-- 10. SIMULATE ADVANCED SELECTION STAGES FOR ELIGIBLE CANDIDATES
-- ----------------------------------------------------------------------------

-- Enter Test Scores for Vikram (High scorer)
UPDATE test_scores
SET 
    written_marks = 88.0,
    pft_run_time_seconds = 320, -- 5 mins 20 secs
    pft_pushups = 30,
    pft_situps = 45,
    pft_score = 95.0,
    interview_score = 86.0,
    evaluator_remarks = 'Exceptional leadership qualities demonstrated in SSB conference.'
WHERE application_id = (
    SELECT id FROM applications WHERE candidate_id = 'c1000000-0000-0000-0000-000000000001'
);

-- Enter Medical Examination for Vikram
INSERT INTO medical_examinations (
    application_id, medical_board_location, exam_date, status, blood_group, blood_pressure, dental_points, visual_standard_passed, findings_notes, medical_officer_name
) VALUES (
    (SELECT id FROM applications WHERE candidate_id = 'c1000000-0000-0000-0000-000000000001'),
    'Base Hospital Delhi Cantt',
    '2026-04-10',
    'FIT',
    'O_POS',
    '120/80',
    20,
    TRUE,
    'Fit in all categories (SHAPE-1). All parameters normal.',
    'Lt. Col. Dr. A. K. Singhal'
);

-- Update stage clearance for Vikram
UPDATE selection_stages
SET status = 'CLEARED', completed_at = NOW()
WHERE application_id = (SELECT id FROM applications WHERE candidate_id = 'c1000000-0000-0000-0000-000000000001');

-- Enter Test Scores for Ananya (CDS applicant)
UPDATE test_scores
SET 
    written_marks = 76.5,
    pft_run_time_seconds = 350,
    pft_pushups = 22,
    pft_situps = 35,
    pft_score = 88.0,
    interview_score = 84.0,
    evaluator_remarks = 'Strong analytical and tactical aptitude in group testing tasks.'
WHERE application_id = (
    SELECT id FROM applications WHERE candidate_id = 'c1000000-0000-0000-0000-000000000002'
);

INSERT INTO medical_examinations (
    application_id, medical_board_location, exam_date, status, blood_group, blood_pressure, dental_points, visual_standard_passed, findings_notes, medical_officer_name
) VALUES (
    (SELECT id FROM applications WHERE candidate_id = 'c1000000-0000-0000-0000-000000000002'),
    'Command Hospital Air Force Bangalore',
    '2026-05-15',
    'FIT',
    'B_POS',
    '118/76',
    21,
    TRUE,
    'Fit in all respects. Qualified for Air Force and Army ground duties.',
    'Wing Commander Dr. Priya Nair'
);

-- Execute Merit List Generation Stored Procedure for NDA Notification
SELECT * FROM sp_generate_merit_list('n1000000-0000-0000-0000-000000000001');

-- Execute Merit List Generation Stored Procedure for CDS Notification
SELECT * FROM sp_generate_merit_list('n1000000-0000-0000-0000-000000000002');
