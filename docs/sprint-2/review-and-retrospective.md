# Sprint 2 Review and Retrospective

## 1. Sprint goal
Deliver the Customers and Products modules of the HOPE ERP: customer and product lists with search and filter, create and edit forms, soft delete and restore, price history and the current-price display, per-action rights checks, and the validation, views, indexes and demo data behind them, with wireframes, mockups, tests and a usability review.

## 2. Sprint review

### Results
| Status | Count |
|---|---|
| Merged | 21 / 30 |
| Not completed | 9 |
| Sprint 1 carryover (S1-DBA-02 to S1-DBA-06) | 5 / 5 merged |

Including the carryover, 26 of 35 tasks are merged (74%).

### Results by role
| Role | Member | Merged / total |
|---|---|---|
| Scrum Master | Fiona Joy M. Amil | 4/5 |
| UI/UX Designer | Dorothy Faith P. Cosa | 5/5 |
| DB Admin | Bervelyn Kim M. Dollesin | 6/6 |
| Developer | Xyd Roddney M. Caberto | 6/8 |
| Tester | Xyd Roddney M. Caberto | 0/6 |

### Task-by-task status
| Task ID | Task | Owner | Due day | Status | PR |
|---|---|---|---|---|---|
| S2-SM-01 | Plan Sprint 2 and set up the board | Amil | 1 | Merged | #196 |
| S2-DBA-01 | Customer and product active views and indexes | Dollesin | 2 | Merged | #185 |
| S2-DEV-01 | Customer list with search and filter | Caberto | 2 | Merged | #154 |
| S2-UIX-01 | Customer screen wireframes | Cosa | 2 | Merged | #90 |
| S2-DEV-02 | Customer create and edit form | Caberto | 3 | Merged | #155 |
| S2-SM-02 | Follow up on Sprint 1 retrospective actions | Amil | 3 | Merged | #197 |
| S2-TST-01 | Test the customer module | Caberto | 3 | In progress |  |
| S2-UIX-02 | Product and price history wireframes | Cosa | 3 | Merged | #91 |
| S2-DBA-02 | Query: current price as of a date | Dollesin | 4 | Merged | #186 |
| S2-DEV-03 | Customer soft delete and restore | Caberto | 4 | Merged | #156 |
| S2-DBA-03 | Validation constraints (payTerms, unit) | Dollesin | 5 | Merged | #187 |
| S2-DEV-04 | Product list with search and filter | Caberto | 5 | Merged | #157 |
| S2-SM-03 | Mid-sprint check and impediment log | Amil | 5 | In progress | #200 |
| S2-TST-02 | Test products and price history | Caberto | 5 | In progress |  |
| S2-UIX-03 | Hi-fi mockups and handoff notes | Cosa | 5 | Merged | #168 |
| S2-DBA-04 | Verify delete checks for customer and product | Dollesin | 6 | Merged | #188 |
| S2-DEV-05 | Product create and edit form | Caberto | 6 | Merged | #158 |
| S2-DBA-05 | Demo data for customer, product and price history | Dollesin | 7 | Merged | #190 |
| S2-DEV-06 | Product soft delete and restore | Caberto | 7 | Merged | #159 |
| S2-TST-03 | Test soft delete, restore and blocked delete | Caberto | 7 | In progress |  |
| S2-UIX-04 | Empty, error and confirm-delete states | Cosa | 7 | Merged | #178 |
| S2-DEV-07 | Price history: add, edit and delete price | Caberto | 8 | Merged |  |
| S2-SM-04 | Update velocity and burndown | Amil | 8 | Merged | #201 |
| S2-TST-04 | Per-right permission tests for customer and product | Caberto | 8 | In progress |  |
| S2-DBA-06 | Search performance check and index tuning | Dollesin | 9 | Merged | #193 |
| S2-DEV-08 | Current-price display and per-action rights checks | Caberto | 9 | Merged |  |
| S2-TST-05 | Regression test of Sprint 1 | Caberto | 9 | In progress |  |
| S2-TST-06 | Report bugs and verify fixes | Caberto | 9 | In progress |  |
| S2-UIX-05 | Usability review of built screens | Cosa | 9 | Merged | #182 |
| S2-SM-05 | Sprint 2 review and retrospective report | Amil | 10 | In progress | This PR |

Status values: Merged, In review, In progress, Not started.

### Completed deliverables
- **Scrum Master:** Sprint 2 planning notes and board, Sprint 1 retrospective follow-up, mid-sprint check and impediment log, velocity and burndown.
- **UI/UX Designer:** customer screen wireframes, product and price history wireframes, hi-fi mockups with handoff notes, empty, error and confirm-delete states, and the usability review of the built screens.
- **Developer:** customer list, create/edit and soft delete/restore; product list, create/edit and soft delete/restore; price history (add, edit, delete); current-price display and per-action rights checks.
- **DB Admin:** the Sprint 1 carryover (base tables, user and rights schema, reset-token table, seed data, audit user), customer and product active views and indexes, current-price query, validation constraints, delete-check verification, demo data, and the search performance check.
- **Tester:** None
### Carried over to Sprint 3
| Task ID | Task | Owner | Reason | New plan |
|---|---|---|---|---|
| S2-TST-01 | Test the customer module | Caberto | Focused on Dev tasks | Sprint 3 by Day 2 |
| S2-TST-02 | Test products and price history | Caberto | Focused on Dev tasks | Sprint 3 by Day 2 |
| S2-TST-03 | Test soft delete, restore and blocked delete | Caberto | Focused on Dev tasks | Sprint 3 by Day 2 |
| S2-TST-04 | Per-right permission tests for customer and product | Caberto | Focused on Dev tasks | Sprint 3 by Day 2 |
| S2-TST-05 | Regression test of Sprint 1 | Caberto | Focused on Dev tasks | Sprint 3 by Day 2 |
| S2-TST-06 | Report bugs and verify fixes | Caberto | Focused on Dev tasks | Sprint 3 by Day 2 |


### Testing Summary
- Test cases executed: 0; passed: 0; failed: 0
- Bugs found: 0; fixed and verified: 0; open: 0

### Impediments
Summary of the impediment log:
- **Testing behind schedule.** At the Day 5 check none of the six Tester tasks was merged; S2-TST-01 (due Day 3) and S2-TST-02 (due Day 5) were overdue. 
- **Workload on one member.** The Developer/Tester again held 14 of the 30 tasks, and all testing sat with the person who built the features.
- **Sprint 1 carryover.** The five Sprint 1 DB tasks were finished early in Sprint 2, so the Sprint 2 DB work was not blocked.

### What went well
- Developer completed 6 of 8 tasks, DB Admin 6 of 6, and UI/UX Designer 5 of 5.
- The Sprint 1 DB carryover (5 tasks) was cleared, so the database work no longer blocks the developer.
- Design, database and development work were all merged by Day 5, ahead of the ideal burndown.
- One task per PR and the review rule kept each change linked to an issue and approved by another member.

### What did not go well
- None of the six Tester tasks was merged by Day 5, so the finished features went untested for most of the sprint.
- One member held both the Developer and Tester roles (14 of 30 tasks), which made testing slow and independent review harder.
- The burndown looked healthy (9 tasks remaining at Day 5 against an ideal of 17.5), but all the remaining work was testing and end-of-sprint reports.

### Improvements for Sprint 3
| Action | Owner | Due | How we will know it worked |
|---|---|---|---|
| Test each feature right after it is merged, not at the end of the sprint | Caberto | Every Sprint 3 feature | Each S3-TST task merged within a day of its feature |
| Move one testing task to another member so one person is not building and testing everything | Amil | Sprint 3 Day 1 | Sprint 3 board shows testing split between members |
| Finish the Sprint 2 testing carryover first | Caberto | Sprint 3 Day 2 | S2-TST tasks merged before new Sprint 3 test tasks |
| Review the board every second day, not only at mid-sprint | Amil | Every 2 days | Overdue tasks are raised within two days |
| One task per PR, checked at review | All | Every PR | Files changed shows only that task |

## Sprint 3 outlook
- **Scope:** Human Resources: jobs, departments, employees and job history (S3 tasks).
- **Carryover:** [S2-TST-01 to S2-TST-06 that are still open].
- **Risks:** Tester capacity and the testing carryover; the employee records need the Sprint 1 user and rights tables; Sprint 4 (Sales and Reports) is heavy, so unfinished work should not roll over again.

## Links
- Board: [Sprint 2 board](https://github.com/users/fionaamil-code/projects/3)
- Merged PRs: https://github.com/fionaamil-code/2BSIT-1/pulls?q=is%3Apr+is%3Amerged
- Mid-sprint check: [`docs/sprint-2/mid-sprint-check.md`](https://github.com/fionaamil-code/2BSIT-1/blob/main/docs/sprint-2/mid-sprint-check.md)
- Impediment log: [`docs/sprint-2/impediment-log.md`](https://github.com/fionaamil-code/2BSIT-1/blob/main/docs/sprint-2/impediment-log.md)
- Velocity and burndown: [`docs/sprint-2/velocity-and-burndown.md`](https://github.com/fionaamil-code/2BSIT-1/blob/main/docs/sprint-2/velocity-and-burndown.md)
