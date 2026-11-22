# DREMS – Known Issues, Bugs & Loopholes

**Project:** Defence Recruitment Eligibility Management System  
**Analysis Date:** 2026-11-22  
**Scope:** Full audit of SQL schema, triggers, API routes, and frontend source code.

---

## Section 1 – Database / SQL Layer

### BUG-01: Trigger Passes Silently When No Eligibility Rules Exist
- **Location:** `supabase_schema.sql` → function `fn_screen_application()`
- **Description:** The trigger queries `eligibility_rules` for the `notification_id` of the new application. If no row exists (rules not yet configured), all PL/pgSQL comparisons like `v_age < r.min_age` produce `NULL` instead of `TRUE`, so no rejection reason is recorded and the application is wrongly marked `ELIGIBLE`.
- **Impact:** Critical — candidates can be auto-approved for notifications with incomplete setup, bypassing all eligibility checks.
- **Suggested Fix:** After `SELECT * INTO r FROM eligibility_rules WHERE notification_id = NEW.notification_id`, add:
  ```sql
  IF r IS NULL THEN
    RAISE EXCEPTION 'No eligibility rules configured for notification %', NEW.notification_id;
  END IF;
  ```

---

### BUG-02: Age Calculation Uses Approximate Divisor (365.25)
- **Location:** `supabase_schema.sql` → `fn_screen_application()` and `v_application_summary` view
- **Description:** Age is computed as `(n.cutoff_date - p.dob) / 365.25`. This approximation can cause off-by-one errors for candidates born on leap-year boundaries who are exactly at the min or max age limit.
- **Impact:** Low — edge cases only, but could incorrectly reject or accept candidates at boundary ages.
- **Suggested Fix:** Use `EXTRACT(YEAR FROM AGE(n.cutoff_date, p.dob))` for exact integer age, or use `DATE_PART` with explicit month/day comparison for decimal age.

---

### BUG-03: No Unique Constraint on `(candidate_id, level)` in `education` Table
- **Location:** `supabase_schema.sql` → `education` table
- **Description:** The trigger picks the latest education record with `ORDER BY year_passed DESC LIMIT 1`. If two rows have the same `year_passed`, the result is non-deterministic. Additionally, duplicate `(candidate_id, level)` rows can be inserted.
- **Impact:** Medium — eligibility screening may use the wrong education record.
- **Suggested Fix:** Add `UNIQUE(candidate_id, level)` constraint to the `education` table.

---

### BUG-04: No `ON DELETE CASCADE` on `applications` Foreign Key to `notifications`
- **Location:** `supabase_schema.sql` → `applications` table, FK `fk_application_notification`
- **Description:** Deleting a `notification` row leaves orphaned `applications` records because no `ON DELETE CASCADE` or `ON DELETE RESTRICT` is defined. The database will raise a FK violation if deletion is attempted, but only at runtime — there is no guarding referential action.
- **Impact:** Medium — data integrity risk if notifications are ever deleted through direct SQL or admin tools.
- **Suggested Fix:** Add `ON DELETE RESTRICT` (safest) or `ON DELETE CASCADE` (if cascading deletes are intended) to the foreign key definition.

---

### BUG-05: `chk_chest` Constraint Silently Passes When Values Are NULL
- **Location:** `supabase_schema.sql` → `physical_details` table
- **Description:** The constraint `CHECK (chest_expanded_cm >= chest_normal_cm)` evaluates to `TRUE` (unknown/pass) under SQL three-valued logic when either operand is `NULL`. An officer could store `chest_normal_cm = 100, chest_expanded_cm = NULL` with no constraint error.
- **Impact:** Low-Medium — invalid medical data can be stored without warning.
- **Suggested Fix:** Add a stricter constraint: `CHECK (chest_expanded_cm IS NULL OR chest_normal_cm IS NULL OR chest_expanded_cm >= chest_normal_cm)` and separately enforce `NOT NULL` where values are mandatory.

---

### BUG-06: `v_application_summary` View Returns Decimal Age Without Formatting Context
- **Location:** `supabase_schema.sql` → view `v_application_summary`
- **Description:** `ROUND((...) / 365.25, 1)` returns a numeric like `18.4`, which is functionally fine but may display inconsistently depending on client locale or PostgreSQL numeric precision settings.
- **Impact:** Very Low — cosmetic/display concern only.
- **Suggested Fix:** Cast explicitly: `ROUND((...) / 365.25, 1)::NUMERIC(5,1)`.

---

### BUG-07: `test_queries.sql` Cleanup Is Not Atomic
- **Location:** `test_queries.sql` → Query 3
- **Description:** The test inserts a dummy application record and then deletes it in a separate statement. If the session terminates between the `INSERT` and `DELETE`, the test record pollutes the production data. No transaction wrapping (`BEGIN`/`ROLLBACK`) is used.
- **Impact:** Medium during testing — could leave junk data in `applications` table.
- **Suggested Fix:** Wrap the test block in `BEGIN; ... ROLLBACK;` to ensure the test record is never committed.

---

## Section 2 – API / Backend Layer

### BUG-08: No Validation That `minAge < maxAge` in Notification API
- **Location:** `frontend/src/app/api/officer/notifications/route.ts` → POST handler (~line 88–98)
- **Description:** The API parses `minAge` and `maxAge` as floats and checks for `NaN`, but does not verify `minA < maxA`. An officer can publish a notification with `min_age = 25, max_age = 20`, which causes all applicants to be rejected by the trigger with "Age not in range."
- **Impact:** High — all candidates for the notification would be incorrectly rejected.
- **Suggested Fix:** Add: `if (minA >= maxA) return NextResponse.json({ error: 'Min age must be less than max age.' }, { status: 400 });`

---

### BUG-09: `cutoff_date` Defaults to `last_date` for All New Notifications
- **Location:** `frontend/src/app/notification/page.tsx` (POST body), `frontend/src/app/api/officer/notifications/route.ts`
- **Description:** After removing the cutoff date UI field, the POST body sends `cutoffDate: lastDate`. In real Defence recruitment, the age cutoff date (the date on which age is calculated) is distinct from the application deadline. Setting them equal means age is always calculated as of the application deadline, which may not reflect the actual notification requirement.
- **Impact:** Medium — functionally incorrect for notifications where the two dates differ; affects all age-based eligibility calculations.
- **Suggested Fix:** Either expose a separate (optional) cutoff date field in the form with a default of `lastDate`, or document this business rule limitation clearly.

---

### BUG-10: No Validation That `cutoffDate ≤ lastDate`
- **Location:** `frontend/src/app/api/officer/notifications/route.ts` → POST handler
- **Description:** The API accepts any date string for `cutoffDate` and `lastDate` without checking their logical ordering. A cutoff date after the application deadline is logically invalid.
- **Impact:** Low — data integrity issue; would not cause crashes but would result in incorrect age calculations.
- **Suggested Fix:** Add: `if (new Date(cutoffDate) > new Date(lastDate)) return NextResponse.json({ error: 'Cutoff date must not be after last date.' }, { status: 400 });`

---

### BUG-11: Hardcoded JWT Secret Fallback in Source Code
- **Location:** `frontend/src/lib/auth.ts` → `DEFAULT_SECRET` constant
- **Description:** `const DEFAULT_SECRET = 'drems-secure-defence-recruitment-secret-key-2026'` is hardcoded in source. If `SESSION_SECRET` env var is not set, JWT tokens are signed with this known key, which is publicly readable in the repository. Any user who reads the source can forge valid officer session tokens.
- **Impact:** Critical — complete authentication bypass is possible if `SESSION_SECRET` is not set in production.
- **Suggested Fix:** Remove `DEFAULT_SECRET`; throw a startup error if `SESSION_SECRET` is missing: `if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET environment variable is required');`

---

### BUG-12: Middleware Auto-Creates Candidate Sessions Without Authentication
- **Location:** `frontend/src/middleware.ts` (~lines 42–47)
- **Description:** When an unauthenticated user visits any `/candidate/*` route, the middleware automatically creates a candidate session cookie without requiring email verification, OTP, or any form of identity confirmation. Any anonymous visitor receives a valid `drems_session` cookie.
- **Impact:** High — unauthorized users can explore the candidate portal without registering. However, since `candidateId` is not set in the auto-created session, actual form submissions (like `/api/candidate/apply`) correctly reject it.
- **Suggested Fix:** Remove auto-session creation from middleware. Redirect unauthenticated users to `/register` instead, and only create a session after successful registration.

---

### BUG-13: Incomplete Rollback on Registration Failure
- **Location:** `frontend/src/app/api/candidate/register/route.ts` (~lines 118–136)
- **Description:** The registration flow inserts into `profiles`, then `physical_details`, then `education`. If the `education` insert fails, only `profile` and `physical_details` are present in the database — the rollback only covers the `physical_details` failure path. There is no Supabase transaction wrapping the entire registration flow.
- **Impact:** High — orphaned `profiles` and `physical_details` rows without matching `education` rows leave the database in an inconsistent state and may prevent the candidate from re-registering (unique constraint on email or candidate ID).
- **Suggested Fix:** Use Supabase RPC with a PostgreSQL transaction function, or use a Supabase Edge Function that wraps all three inserts in `BEGIN`/`COMMIT`/`ROLLBACK`.

---

### BUG-14: No Server-Side Date-of-Birth Validation
- **Location:** `frontend/src/app/api/candidate/register/route.ts`
- **Description:** The API accepts any string as `dob` without validating that it is a parseable date, a date in the past, or that the candidate meets a minimum age threshold (e.g., at least 10 years old). A candidate could submit `dob: "0001-01-01"` or `dob: "not-a-date"`.
- **Impact:** Medium — invalid DOB values would cause incorrect age calculations in the trigger.
- **Suggested Fix:** Parse `dob` with `new Date(dob)`, validate `isNaN(date.getTime())`, and enforce a reasonable age range (e.g., age between 10 and 60 years).

---

### BUG-15: Officer Can Enter Scores for Any Application (No Scoping)
- **Location:** `frontend/src/app/api/officer/scores/route.ts` → POST handler
- **Description:** The scores API only validates `!isNaN(appId)` before inserting a score. It does not verify that the `application_id` belongs to a notification the officer is authorized to manage. In a multi-officer environment, any authenticated officer could modify scores for any application.
- **Impact:** Medium — data integrity risk in multi-officer deployments; not exploitable in single-officer setups.
- **Suggested Fix:** Cross-reference the application's `notification_id` against the officer's assigned scope before allowing score insertion.

---

### BUG-16: Merit List Generation Is Not Atomic (No Transaction)
- **Location:** `frontend/src/app/api/officer/merit/route.ts` → POST handler
- **Description:** Merit list generation performs three sequential operations: (1) delete old merit rows, (2) insert new merit rows, (3) update `applications.status`. These are separate Supabase calls with no wrapping transaction. A failure between steps leaves the merit list in a partial or empty state.
- **Impact:** High — partial merit list deletion without re-insertion means candidates lose their merit position with no record.
- **Suggested Fix:** Implement as a PostgreSQL stored procedure or RPC call that runs all three operations in a single transaction.

---

### BUG-17: `SESSION_SECRET` and `OFFICER_ACCESS_CODE` Not in `.env.example`
- **Location:** `frontend/.env.example`
- **Description:** The example environment file only documents Supabase variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). The critical `SESSION_SECRET` (JWT signing key) and `OFFICER_ACCESS_CODE` (officer authentication passcode) are not documented, making it easy to deploy without them.
- **Impact:** Medium — new developers or deployment environments may omit these variables, triggering BUG-11 (hardcoded secret) or causing officer login to fail.
- **Suggested Fix:** Add to `.env.example`:
  ```env
  SESSION_SECRET=your-strong-random-secret-here
  OFFICER_ACCESS_CODE=your-4-digit-code-here
  ```

---

### BUG-18: `seed_data.sql` Referenced in README But Missing from Repository
- **Location:** Repository root; referenced in `README.md`
- **Description:** The README mentions `seed_data.sql` for populating test data, but the file does not exist in the repository. The `.gitignore` may also be excluding it. Without seed data, the application cannot be tested end-to-end after a fresh database setup.
- **Impact:** Medium — blocks new developers from setting up a working test environment.
- **Suggested Fix:** Add a sanitized `seed_data.sql` with realistic but non-sensitive test records to the repository, or document the minimum required data setup in the README.

---

## Section 3 – Frontend / TypeScript Issues

### BUG-19: `NotificationRow` Interface Retains `cutoff_date` Field
- **Location:** `frontend/src/components/NotificationsTable.tsx` → `NotificationRow` interface (line 9)
- **Description:** The `NotificationRow` interface still declares `cutoff_date: string` even though the column is no longer displayed in the table. This is not a runtime bug but is a minor interface hygiene issue — the field is fetched from the API and stored in state unnecessarily.
- **Impact:** Very Low — no runtime error; just dead interface field.
- **Suggested Fix:** Either remove `cutoff_date` from the interface (if it will never be displayed) or mark it optional (`cutoff_date?: string`) since it still exists in the DB response.

---

### BUG-20: `colSpan` Values Were Stale After Removing Cutoff Date Column
- **Location:** `frontend/src/components/NotificationsTable.tsx` → empty-state `<td>` (line 52)
- **Description:** After removing the "Age Cutoff Date" `<th>` column, the `colSpan` values in the empty-state row were still set to `11` (canEdit) / `10` (no edit) instead of the correct `10` / `9`.
- **Status:** ✅ Fixed in this session.
- **Impact (before fix):** Low — cosmetic only; causes minor table rendering misalignment in the empty state.

---

### BUG-21: No Client-Side `minAge < maxAge` Validation in Notification Form
- **Location:** `frontend/src/app/notification/page.tsx` → `handleSubmit()`
- **Description:** The form submits without checking that the entered min age is less than max age. This duplicates the missing server-side validation (BUG-08) at the frontend level.
- **Impact:** Low — UX issue; the server should still reject it once BUG-08 is fixed.
- **Suggested Fix:** Add before `setSubmitting(true)`: `if (parseFloat(minAge) >= parseFloat(maxAge)) { setFormError('Min age must be less than max age.'); return; }`

---

### BUG-22: `branchId` State Not Reset Properly in `resetForm()`
- **Location:** `frontend/src/app/notification/page.tsx` → `resetForm()` (~line 73)
- **Description:** `resetForm()` does not reset `branchId` to its initial value (the first branch's ID loaded from the API). After cancelling an edit, `branchId` retains the last-edited branch, which could cause a new notification to be inadvertently assigned to the wrong branch.
- **Impact:** Low — UX bug; officer may not notice the branch has changed.
- **Suggested Fix:** In `resetForm()`, add: `setBranchId(branches.length > 0 ? String(branches[0].id) : '');`

---

## Summary Table

| ID | Severity | Layer | Title |
|----|----------|-------|-------|
| BUG-01 | 🔴 Critical | Database | Trigger passes silently when no eligibility rules exist |
| BUG-02 | 🟡 Low | Database | Age calculation uses approximate 365.25 divisor |
| BUG-03 | 🟠 Medium | Database | No unique constraint on `(candidate_id, level)` in `education` |
| BUG-04 | 🟠 Medium | Database | No `ON DELETE CASCADE` / `RESTRICT` on applications FK |
| BUG-05 | 🟡 Low-Med | Database | `chk_chest` constraint passes silently for NULL values |
| BUG-06 | ⚪ Cosmetic | Database | View returns decimal age without explicit formatting |
| BUG-07 | 🟠 Medium | Database | Test cleanup in `test_queries.sql` is not atomic |
| BUG-08 | 🔴 High | API | No `minAge < maxAge` validation in notification API |
| BUG-09 | 🟠 Medium | API | `cutoff_date` always equals `last_date` for new notifications |
| BUG-10 | 🟡 Low | API | No validation that `cutoffDate ≤ lastDate` |
| BUG-11 | 🔴 Critical | API | Hardcoded JWT secret fallback in source code |
| BUG-12 | 🔴 High | API | Middleware auto-creates candidate sessions without authentication |
| BUG-13 | 🔴 High | API | Incomplete rollback on registration failure |
| BUG-14 | 🟠 Medium | API | No server-side DOB validation |
| BUG-15 | 🟠 Medium | API | Officer can score any application (no scoping) |
| BUG-16 | 🔴 High | API | Merit list generation not atomic (no transaction) |
| BUG-17 | 🟠 Medium | Config | `SESSION_SECRET` and `OFFICER_ACCESS_CODE` missing from `.env.example` |
| BUG-18 | 🟠 Medium | Config | `seed_data.sql` missing from repository |
| BUG-19 | ⚪ Cosmetic | Frontend | `cutoff_date` retained in `NotificationRow` interface |
| BUG-20 | ⚪ Cosmetic | Frontend | Stale `colSpan` values (now fixed) |
| BUG-21 | 🟡 Low | Frontend | No client-side `minAge < maxAge` validation |
| BUG-22 | 🟡 Low | Frontend | `branchId` not reset in `resetForm()` |
