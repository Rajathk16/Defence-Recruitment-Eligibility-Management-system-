# DREMS - Defence Recruitment and Eligibility Management System

A simplified student DBMS mini-project built on PostgreSQL / Supabase and Next.js.

## How to Run

1. Run `supabase_schema.sql` in the Supabase SQL editor.
   This creates the 10 tables, the screening trigger, the view, and the 4 branches.

2. (Optional) Run `seed_data.sql` in the Supabase SQL editor.
   This inserts demo notifications, candidate profiles, test scores, and medical exams.
   If you prefer to enter all data directly from the website, skip this step.

3. In `frontend/`, copy `.env.example` to `.env.local` and configure your API keys:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 in your browser.

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

## Viva Demo Queries

Run the queries in `test_queries.sql` one by one in the Supabase SQL editor to demonstrate triggers, views, dense ranking, aggregations, and integrity constraints.
