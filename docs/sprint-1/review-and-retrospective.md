# Sprint 1 Review and Retrospective

## 1. Sprint goal
Deliver the foundation of the HOPE ERP: the database, registration and login, password reset, User Management, the Rights dialog and the role-aware main page, with the design system and wireframes behind them and a test plan around them.

## 2. Sprint review

### Results
| Status | Count |
|---|---|
| Merged | 24 / 30 |
| Not completed | 6 |

### Results by role
| Role | Member | Merged / total |
|---|---|---|
| Scrum Master | Fiona Joy M. Amil | 4/5 |
| UI/UX Designer | Dorothy Faith P. Cosa | 5/5 |
| DB Admin | Bervelyn Kim M. Dollesin | 1/6 |
| Developer | Xyd Roddney M. Caberto | 8/8 |
| Tester | Xyd Roddney M. Caberto | 6/6 |

### Task-by-task status
| Task ID | Task | Owner | Due day | Status | PR |
|---|---|---|---|---|---|
| S1-SM-01 | Repo setup, templates | Amil | 1 | Merged | #2 |
| S1-SM-02 | Sprint 1 board and module roadmap | Amil | 1 | Merged | #32 |
| S1-DEV-01 | Project scaffold | Caberto | 2 | Merged | #36 |
| S1-DBA-01 | Team database, migration runner, setup README | Dollesin | 2 | Merged | #58 |
| S1-UIX-01 | Design system | Cosa | 2 | Merged | #34 |
| S1-SM-03 | Working agreement, DoD, role guide | Amil | 2 | Merged | #33 |
| S1-DBA-02 | HOPE base tables and sample data | Dollesin | 3 | In progress |  |
| S1-TST-01 | Sprint 1 test plan | Caberto | 3 | Merged | #47 |
| S1-UIX-02 | Authentication wireframes | Cosa | 3 | Merged | #35 |
| S1-DEV-02 | Registration (Pending users) | Caberto | 4 | Merged | #37 |
| S1-DBA-03 | User, role and rights schema | Dollesin | 4 | In progress |  |
| S1-UIX-03 | Main page, User Management, Rights wireframes | Cosa | 4 | Merged | #43 |
| S1-DBA-04 | Password reset token table | Dollesin | 5 | In progress |  |
| S1-DBA-05 | Seed accounts, modules, 36 rights | Dollesin | 5 | In progress |  |
| S1-SM-04 | Mid-sprint check and impediment log | Amil | 5 | Merged | #57 |
| S1-DEV-03 | Login, logout, first password setup | Caberto | 6 | Merged | #38 |
| S1-UIX-04 | Hi-fi mockups and handoff notes | Cosa | 6 | Merged | #55 |
| S1-DEV-04 | Password reset | Caberto | 7 | Merged | #41 |
| S1-TST-02 | Auth and password test cases | Caberto | 7 | Merged | #48 |
| S1-DEV-05 | User Management screen | Caberto | 8 | Merged | #42 |
| S1-DEV-06 | Superadmin approvals, last-Superadmin guard | Caberto | 8 | Merged | #44 |
| S1-DBA-06 | Audit user in audit_log | Dollesin | 8 | In progress |  |
| S1-TST-03 | User Management test cases | Caberto | 8 | Merged | #50 |
| S1-DEV-07 | Rights dialog | Caberto | 9 | Merged | #44 |
| S1-DEV-08 | Role-aware main page | Caberto | 9 | Merged | #45 |
| S1-TST-04 | Permission matrix tests | Caberto | 9 | Merged | #51 |
| S1-TST-05 | Automated smoke test | Caberto | 9 | Merged | #52 |
| S1-TST-06 | Bug reports and fix verification | Caberto | 9 | Merged | #53 |
| S1-UIX-05 | Usability review of built screens | Cosa | 9 | Merged | #55 |
| S1-SM-05 | Sprint 1 review and retrospective | Amil | 10 | In progress | This PR |

Status values: Merged, In review, In progress, Not started.

### Completed deliverables
- **Scrum Master:** repository workflow and templates (#1), Sprint 1 board and module roadmap (#3), working agreement, Definition of Done and role guide (#7), mid-sprint check and impediment log.
- **UI/UX Designer:** design system (#6), authentication wireframes, main page, User Management and Rights wireframes, hi-fi mockups with handoff notes, and the usability review of the built screens.
- **Developer:** project scaffold (#4), registration with Pending users, login and logout with first password setup, password reset, User Management screen, Superadmin approvals with the last-Superadmin guard, the Rights dialog, and the role-aware main page.
- **Tester:** Sprint 1 test plan, authentication and password test cases, User Management test cases, permission matrix tests, automated smoke test, and bug reports with fix verification.
- **DB Admin:** team database setup, migration runner script and setup README.  

| Task ID | Task | Owner | Reason | New plan |
|---|---|---|---|---|
| S1-DBA-02 | HOPE base tables and sample data | Dollesin | [reason] | Sprint 2 by Day 3 |
| S1-DBA-03 | User, role and rights schema | Dollesin | [reason] | Sprint 2 by Day 3 |
| S1-DBA-04 | Password reset token table | Dollesin | [reason] | Sprint 2 by Day 3 |
| S1-DBA-05 | Seed accounts, modules, 36 rights | Dollesin | [reason] | Sprint 2 by Day 3 |
| S1-DBA-06 | Audit user in audit_log | Dollesin | [reason] | Sprint 2 by Day 3 |

S1-SM-05 (this report) completes with this PR.

### Testing Summary
- Test cases executed: 22; passed: 22; failed: 0
- Bugs found: 3; fixed and verified: 3; open: 0

### Impediments
Summary of the impediment log:
- **Database tasks behind schedule.** At the Day 5 check none of the six DB tasks was merged, although five of them were due. S1-DBA-01 (team database, migration runner and setup README) was merged later in the sprint, but the other five tasks (S1-DBA-02 to DBA-06) remain open and are carried over to Sprint 2. Developer and Tester work that depends on the tables, the reset-token table and the seed accounts was verified against the developer's own Supabase setup, not against the DB Admin's migrations.
- **Workload on one member.** One person held both the Developer and Tester roles (14 of 30 tasks), and the same person cannot approve their own PRs. Resolution: [how reviews were arranged].
- **Repository setup problems.** The issue-template folder was first created with the wrong name (a trailing space), so GitHub did not detect the templates, and it also stopped Windows users from pulling. It was fixed in a follow-up PR.

## 3. Retrospective
Held on November 2 with [all members]. Everyone answered the same three questions. The points below come from the sprint results and need the team's confirmation.

### What went well
- Developer completed 8 of 8 tasks, Tester 6 of 6, and UI/UX Designer 5 of 5.
- The PR template and the review rule meant each change was linked to an issue and approved by another member.
- Design system, wireframes and mockups were available to the developer.

### What did not go well
- Only one of the six DB tasks (S1-DBA-01) was merged, which blocked verification of the work that depends on the database
- Branch, folder and file naming rules were not written down early, which caused rework (for example the template folder name).
- One member held both the Developer and Tester roles (14 of 30 tasks), which made independent review harder.

### Improvements for Sprint 2
| Action | Owner | Due | How we will know it worked |
|---|---|---|---|
| Do DB tasks first in each sprint and merge them by Day 3 | Dollesin | Sprint 2 Day 3 | S2-DBA tasks merged before the dependent developer tasks |
| Agree and write down branch, folder and file naming before the sprint starts | Amil | Sprint 2 Day 1 | Rules appear in the working agreement |
| Assign a second reviewer for every Tester PR | Amil | Sprint 2 Day 1 | Each PR is approved by someone other than the author |
| One task per PR, checked at review | All | Every PR | Files changed shows only that task |

## 4. Sprint 2 outlook
- **Scope:** Customers, Products and price history (S2-DEV, S2-DBA, S2-TST, S2-UIX, S2-SM tasks).
- **Carryover:** S1-DBA-02 to S1-DBA-06 (five DB Admin tasks).
- **Risks:** the carried-over DB work could delay Sprint 2's own DB tasks (views, indexes, price queries) because they need the Sprint 1 tables; Tester capacity; Customer and Product screens depend on the Sprint 1 login and rights.

## 5. Links
- Board: [[link]](https://github.com/users/fionaamil-code/projects/2)
- Merged PRs: https://github.com/fionaamil-code/2BSIT-1/pulls?q=is%3Apr+is%3Amerged
- Mid-sprint check: [`docs/sprint-1/mid-sprint-check.md`](https://github.com/fionaamil-code/2BSIT-1/blob/main/docs/sprint-1/mid-sprint-check.md)
- Impediment log: [`docs/sprint-1/impediment-log.md`](https://github.com/fionaamil-code/2BSIT-1/blob/main/docs/sprint-1/impediment-log.md)
- Roadmap: [`docs/roadmap.md`](https://github.com/fionaamil-code/2BSIT-1/blob/main/docs/roadmap.md)
