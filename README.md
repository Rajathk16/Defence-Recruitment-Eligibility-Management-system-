# Defence Recruitment & Eligibility Management System (DREMS)
## DBMS Mini-Project (PostgreSQL / Supabase + Next.js App Router)

---

### 1. Project Overview
**DREMS** is an automated defence recruitment portal for the Armed Forces (Indian Army, Indian Navy, Indian Air Force, Coast Guard). It manages the recruitment pipeline from notification issuance to eligibility screening, examination scheduling, multi-stage scoring, and final merit list generation.

---

### 2. Relational Database Architecture (DBMS Core)

The system is normalized to **3NF / BCNF** and consists of 12 tables:
1. `profiles`: Candidate personal details, demographics, and contact info.
2. `physical_attributes`: Strict defence physical measurements (height, weight, normal & expanded chest, visual acuity, color perception).
3. `educational_qualifications`: Credentials (10th, 12th, B.Tech/Graduation, percentages, 10+2 PCM marks).
4. `defence_branches`: Armed forces branches (Army, Navy, Air Force, Coast Guard).
5. `recruitment_notifications`: Commission campaigns (NDA, CDS, AFCAT, Agniveer) with vacancies and cutoff dates.
6. `eligibility_rules`: Per-notification criteria (age bounds, gender rules, minimum heights, percentages, PCM mandates).
7. `applications`: Submitted applications with auto-generated roll numbers and trigger screening results.
8. `selection_stages`: 4-stage pipeline (Written Exam $\to$ PFT $\to$ Medical $\to$ SSB Interview).
9. `test_scores`: Scores across all examination stages.
10. `medical_examinations`: Military medical board findings (SHAPE-1, FIT / TEMPORARILY UNFIT / PERMANENTLY UNFIT).
11. `merit_lists`: Official merit gazette generated dynamically via stored procedures.
12. `system_audit_logs`: Generic database audit trail capturing JSONB old/new snapshots on state changes.

---

### 3. Key DBMS Features (Showcase to Evaluator)

1. **Automated Eligibility Trigger (`trg_applications_before_insert`)**:
   - Executes before every row insert into `applications`.
   - Calls PL/pgSQL function `fn_evaluate_eligibility(candidate_id, notification_id)`.
   - Evaluates:
     - Exact decimal age as of cutoff date (`fn_calculate_age`).
     - Gender restrictions (e.g. Agniveer Rally male-only rule).
     - Marital status (unmarried requirements).
     - Minimum height standards (separate male and female thresholds).
     - Minimum chest expansion (5 cm rule).
     - Academic cutoffs and 10+2 PCM criteria.
   - Automatically marks the record as `ELIGIBLE` or `REJECTED` with specific diagnostic remarks.

2. **Automated Stage Creator Trigger (`trg_applications_after_insert`)**:
   - Fires after inserting an eligible application to auto-schedule Stage 1 (Written Exam) and initialize the 4-stage pipeline.

3. **Composite Merit List Stored Procedure (`sp_generate_merit_list(notification_id)`)**:
   - Computes weighted score:
     $$\text{Composite Score} = (0.40 \times \text{Written\%}) + (0.20 \times \text{PFT Score}) + (0.40 \times \text{Interview\%})$$
   - Uses SQL window function `DENSE_RANK() OVER (ORDER BY composite_score DESC)`.
   - Automatically allocates selection based on total notification vacancies.

4. **Database Views**:
   - `v_candidate_dashboard`: Joins profile, physical, application, test scores, and medical status.
   - `v_recruiter_pipeline`: Aggregates applicant counts, trigger pass rates, and rejections.
   - `v_final_merit_ranking`: Gazette rankings joined with candidate names and roll numbers.

5. **Audit Logging Trigger**:
   - Records all changes to `applications` and `medical_examinations` in `system_audit_logs`.

---

### 4. How to Run the Database in Supabase

1. Open your project on [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to the **SQL Editor** tab from the left sidebar.
3. Open [`supabase_schema.sql`](./supabase_schema.sql), copy all lines, paste them into the SQL Editor, and click **Run**.
4. Check the **Table Editor** to view populated tables and seed candidates.
5. To run viva demo queries, open [`test_queries.sql`](./test_queries.sql) and execute them.

---

### 5. How to Run the Next.js Frontend

1. Open a terminal in `d:/DBMS/frontend`:
   ```bash
   cd frontend
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) in your web browser.

#### (Optional) Connecting Live Supabase to Frontend:
1. In `frontend/`, copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
2. Paste your project URL and public Anon Key from Supabase Dashboard $\to$ Settings $\to$ API:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
*(Note: The frontend also features a built-in state simulator, so it functions immediately even without cloud API keys!)*

---

### 6. Interactive Frontend Tabs

- **Eligibility Simulator**: Instant calculator evaluating age, physical standards, and academic scores against NDA, CDS, AFCAT, and Agniveer rules.
- **Active Notifications**: Official armed forces commission notifications with vacancy counts and application deadlines.
- **Aspirant Portal**: Live candidate tracker, 4-stage pipeline stepper, and printable official Admit Card.
- **Recruitment Board**: Recruiter pipeline analytics, test score management, and 1-click execution of `sp_generate_merit_list()`.
- **DBMS Live Queries**: Live presentation tab displaying 3NF schema tables, PL/pgSQL triggers, views, and system audit logs for viva demonstration.
