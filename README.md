# DREMS - Defence Recruitment & Eligibility Management System

A defence recruitment portal built on PostgreSQL / Supabase and Next.js 14 App Router, featuring an institutional military UI/UX design and a lightweight, secure Role-Based Access Control (RBAC) architecture.

---

## 1. How to Run

### Step 1: Database Setup
1. Run `supabase_schema.sql` in your Supabase SQL editor.
   This provisions the 10 core tables, the screening trigger (`trg_screen_application`), the summary view (`v_application_summary`), the 4 service branches, and optional Row-Level Security (RLS) policies.

2. (Optional) Run `seed_data.sql` if you wish to pre-load demo commission notifications, applicant profiles, scores, and medical exam rows. Otherwise, all records can be submitted directly through the portal.

### Step 2: Configure Environment Variables
In `frontend/`, create `.env.local` (or copy from `.env.example`):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-Side Role-Based Access Control (RBAC) Security
OFFICER_ACCESS_CODE=4827
SESSION_SECRET=drems-secure-defence-recruitment-secret-key-2026
```

### Step 3: Install & Start Development Server
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 2. Role-Based Access Control (RBAC) Structure

The system enforces strict role isolation on both the backend (Next.js Edge Middleware and Route Handlers) and the client:

| Role | Permitted Areas | Restricted Operations |
|---|---|---|
| **Officer / Admin** | Access `/notification`, `/officer`, manage notifications, record written/PFT/interview scores, enter medical fitness board results, compute dense-ranked merit lists. | Cannot impersonate candidate profiles or submit candidate applications. |
| **Candidate / Applicant** | Access `/candidate`, `/register`, `/notifications`, `/apply`, `/application`. Can register, apply for entries, and view **only their own** applications and scores. | **Strictly blocked** from accessing `/officer`, `/notification`, and all administrative score/merit endpoints. Cannot modify their own role. |

### Security Implementation Highlights:
1. **Server-Side Authentication**: Officer access code is validated exclusively on the server (`/api/auth/login`) via `OFFICER_ACCESS_CODE` environment variable and is never exposed in the client bundle.
2. **Cryptographic Sessions**: Authenticated users receive an `HttpOnly`, `SameSite=Lax` signed HMAC-SHA256 session cookie (`drems_session`) built on standard Web Crypto API.
3. **Route Protection via Edge Middleware**: Next.js `middleware.ts` intercepts requests before rendering. Unauthorized attempts to access administrative pages (`/officer`, `/notification`) or private candidate routes immediately redirect with appropriate security notifications.
4. **Data Isolation & Backend Ownership Checks**: Candidate applications and education records are strictly scoped to the authenticated `session.candidateId`. Role self-escalation is prevented by forcing `role = 'CANDIDATE'` during profile creation.

---

## 3. Website Pages & Workflows

### Landing & Authentication (`/`)
- Choose between **Candidate Portal** and **Officer Console**.
- Officers authenticate using their confidential 4-digit security code.
- Candidates can log in with their registered email or proceed directly to register a new profile.

### Candidate Portal
- `/candidate`: Dashboard overview and profile summary.
- `/register`: Comprehensive profile registration (Personal Bio-data, Physical Measurements, Academic Qualifications) with client and server validation.
- `/notifications`: Read-only view of active commission recruitments, vacancies, and eligibility criteria.
- `/apply`: Submit an application for an open recruitment. Instantly triggers PostgreSQL trigger `trg_screen_application` (`fn_screen_application()`) to perform automated screening.
- `/application`: Track personal application status, screening remarks, test marks, and medical board decisions.

### Officer Administration
- `/notification`: Full recruitment lifecycle management — publish new notifications and update existing course details and eligibility cutoffs.
- `/officer`: Officer console featuring:
  - Live application summary (`v_application_summary`).
  - Score recording (Written Examination, Physical Fitness Test, SSB Interview).
  - Medical fitness examination board recording (`FIT`, `UNFIT`, `PENDING`).
  - Automated merit list computation with `written*0.4 + pft*0.2 + interview*0.4`, dense ranking, and vacancy allocation.

---

## 4. UI/UX Design System

The interface has been redesigned to reflect an institutional, professional defence recruitment portal:
- **Palette**: Deep Officer Olive (`#1b261b`), Tactical Army Drab (`#2d3e2c`), Desert Khaki (`#c4b694`), Off-White (`#f5f4ef`), and Charcoal Slate (`#191e19`).
- **Typography & Components**: High-contrast, clean system typography, institutional header bar, status badges (`ELIGIBLE`, `REJECTED`, `SELECTED`, `FIT`, `UNFIT`), structured data tables with zebra striping, and responsive layouts across desktop, tablet, and mobile.
- **Design Restraint**: No unnecessary decorative military clip art, no excessive bubble rounding, no unnecessary animations.
