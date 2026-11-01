# DREMS - Defence Recruitment and Eligibility Management System
### DBMS Mini-Project | PostgreSQL / Supabase + Next.js

## What This System Does

DREMS is a student DBMS mini-project that automates eligibility screening for Armed Forces recruitment. Candidate profiles, physical measurements, and qualifications are entered through the website. When a candidate applies for a notification, a PostgreSQL BEFORE INSERT trigger evaluates their age, height, marital status, and academic percentage against the notification's eligibility rules, setting the application status to ELIGIBLE or REJECTED. Officers can view summaries, record written, physical, and interview scores, enter medical results, and generate a merit list with dense ranking.

## The 10 Tables

| Table | Purpose |
|---|---|
| branches | Lookup table for the 4 armed forces branches (Army, Navy, Air Force, Coast Guard). |
| profiles | Personal details for candidates and officers (name, email, DOB, gender, state, role). |
| physical_details | Height, weight, and chest measurements linked 1-to-1 with candidate profiles. |
| education | Qualification records per candidate (level, board, year passed, percentage). |
| notifications | Recruitment campaigns with title, vacancies, cutoff date, and application deadline. |
| eligibility_rules | Specific criteria per notification (age bounds, min height, min marks, marital status). |
| applications | Applications linking candidate and notification with trigger-assigned status and remarks. |
| test_scores | Written marks, PFT score, and interview score (0 to 100) per application. |
| medical_exams | Medical board findings (FIT, UNFIT, PENDING), location, date, and notes. |
| merit_list | Ranked applicants with composite score, rank order, and selection flag. |

## Functions, Triggers, and Views

- Trigger Function `fn_screen_application()`: Runs BEFORE INSERT on `applications`. Calculates age on the cutoff date, checks physical height, marital status, and latest qualification marks against `eligibility_rules`. Automatically marks the row as ELIGIBLE or REJECTED with descriptive remarks.
- View `v_application_summary`: Joins `applications`, `profiles`, `notifications`, `test_scores`, and `medical_exams` with age calculation for quick evaluation.

## Merit List Calculation

The merit list is computed in TypeScript on the officer page:
- Filters applications for the chosen notification with status ELIGIBLE or SELECTED.
- Skips applicants who are medically UNFIT or missing test scores.
- Calculates: Composite Score = (Written x 0.40) + (PFT x 0.20) + (Interview x 0.40).
- Sorts candidates descending by composite score.
- Applies dense ranking (1, 2, 2, 3...) so tied scores share a rank.
- Sets is_selected = true where rank <= vacancies.
- Deletes prior merit list entries, inserts the new ranked rows, and marks selected applications as SELECTED.

## Website Pages

On the landing page (/), choose your role. Officers enter the 4 digit code set in lib/config.ts (default: 4827).

Candidate pages:
- `/candidate`: Dashboard with links to all candidate actions.
- `/register`: Registration form for profile, physical details, and education.
- `/notifications`: Read only table of open recruitments and eligibility rules.
- `/apply`: Application form for the logged in candidate.
- `/application`: Track the logged in candidate's application status and scores.

Officer pages:
- `/notification`: Notifications table with the add notification form and row edit buttons.
- `/officer`: View all applications, enter test scores, record medical exams, and generate the merit list.

## How to Run

1. Run `supabase_schema.sql` in the Supabase SQL editor.
2. (Optional) Run `seed_data.sql` if you want demo candidates and notifications.
3. In `frontend/`, copy `.env.example` to `.env.local` and add your Supabase URL and anon key.
4. Run `npm install` inside `frontend/`.
5. Run `npm run dev` and open http://localhost:3000.
