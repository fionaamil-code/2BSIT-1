# Sprint 1 Test Plan & Acceptance Criteria

## 1. Overview
This document outlines the testing strategy, scope, and acceptance criteria for Sprint 1. The focus of this sprint is core authentication, account approval workflows, superadmin permissions, granular module rights, and dashboard rendering.

## 2. Scope of Testing
- **User Authentication:** Registration, login, logout, session persistence, and password reset flows.
- **Account Management:** Status enforcement (Pending, Approved, Blocked), user CRUD operations, and Superadmin safeguards.
- **Access Control:** Per-action module rights dialog, audit logging, role-based dashboard rendering, and server-side permission checks.

## 3. General Acceptance Criteria
- [ ] Users cannot access protected pages without a valid session.
- [ ] Pending or Blocked users are strictly denied login access with clear feedback.
- [ ] Superadmin accounts remain hidden from standard Admin views.
- [ ] System prevents deleting, disabling, or demoting the last remaining Superadmin.
- [ ] All access right modifications generate a corresponding entry in the `audit_log` database table.
- [ ] Restricted UI elements (tiles/sidebar options) are hidden based on user roles and explicit module rights.