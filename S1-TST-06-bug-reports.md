# Bug Reports & Fix Verification (S1-TST-06)

## Bug Report Log

### Bug #01: Unapproved User Login Bypass
- **Severity:** High
- **Description:** Pending users were able to sign in if their email/password matched before explicit approval.
- **Status:** Resolved
- **Verification:** Tested logging in with a newly registered user account. System successfully rejected login with message: *"Account approval pending."*

---

### Bug #02: Audit Log Missing Rights Details
- **Severity:** Medium
- **Description:** Updating user permissions created an `audit_log` row but left the updated permissions payload blank.
- **Status:** Resolved
- **Verification:** Updated rights via the Rights Dialog and verified that `audit_log.action_details` now logs full module permission changes.

---

### Bug #03: Hidden Superadmin in Search Filter
- **Severity:** Medium
- **Description:** Searching by name in `users.html` as a regular Admin caused hidden Superadmin accounts to appear in search results.
- **Status:** Resolved
- **Verification:** Verified that filtering on `users.js` applies the Superadmin exclusion rule prior to string search queries.