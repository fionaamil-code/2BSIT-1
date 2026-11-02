# Hope, Inc. ERP: what is built and what is left

## Built
**Sprint 1**: Log in, Register, Forgot / Reset password; app shell; Dashboard; User Management
(approve, edit, block/unblock, Rights dialog with 36 rights, Add user by email invite, last-Superadmin guard).
**Sprint 2**: Customers and Products with price history, soft delete and Restore, Status and Stamp columns for Admins.

Run order in Supabase SQL Editor: schema.sql, sprint1.sql, sprint2.sql.
Deploy the Edge Function in supabase/functions/admin-create-user (needed for Add user).

## Left to build
1. Sprint 3: Human Resources: departments, jobs, employees, employee profile, job history timeline.
   (The shared list in crud-list.js and the pattern in sprint2.sql are meant to be reused.)
2. Sprint 4: Sales and line items, payments and balances, 7 reports, audit log viewer (Superadmin).
3. Sprint 2 follow-up: block deleting a customer or product that has active sales (add the check when Sales exists).
4. Rights on Admin accounts (the design shows it; this build gives Admins every right).
5. System Settings (shown to Superadmin; currently a "coming soon" page).

- Xyd Caberto 11:54AM 11-2-2026