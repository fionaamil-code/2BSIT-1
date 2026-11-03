# Sprint 1 Mid-Sprint Check (Sprint Day 5)

## Progress summary
| Status | Count |
|---|---|
| Merged | 17 |
| In review | 0 |
| In progress | 4 |
| Not started | 9 |
| **Total** | 30 |

## Progress by role
| Role | Member | Merged / total | Notes |
|---|---|---|---|
| Scrum Master | Amil | 3/5 | S1-SM-04 and SM-05 still open |
| UI/UX Designer | Cosa | 3/5 | |
| DB Admin | Dollesin | 0/6 | No DB task is done yet |
| Developer | Caberto | 8/8 | Built without the final team database in place |
| Tester | Caberto | 3/6 | Remaining tests wait on DB and developer work |

## Due by Day 5 but not merged
| Task ID | Owner | Due day | Status | Reason / next step |
|---|---|---|---|---|
| S1-DBA-01 | Dollesin | 2 | In Progress| Team database, migration runner and setup README. [reason]. Next step: [what and by when]. |
| S1-DBA-02 | Dollesin | 3 | In Progress| Base tables and sample data. Depends on S1-DBA-01. |
| S1-DBA-03 | Dollesin | 4 | In Progress | User, role and rights schema. Depends on S1-DBA-01. |
| S1-DBA-04 | Dollesin | 5 | In Progress | Password reset token table. Needed by S1-DEV-04. |
| S1-DBA-05 | Dollesin | 5 | In Progress | Seed accounts, modules and 36 rights. Depends on S1-DBA-03 and S1-DBA-04. Needed by S1-DEV-03. |

## On track
- Developer: 8/8 tasks merged.
- Scrum Master and UI/UX Designer: the Day 1-4 tasks are merged.
- S1-DBA-06 (audit user, due Day 8) is not due yet.

## At risk
- **The whole DB Admin workstream is behind.** None of the six DB tasks is merged, and five of them were due by Day 5. Every other role depends on the database.
- **Developer work is not verified against the team database.** The developer tasks are marked merged, but login, reset, user management and rights need the real tables, token table and seed accounts (S1-DBA-02 to DBA-05).
- **Tester tasks are blocked.** S1-TST-02 to TST-05 can't be fully run until the database and seed accounts exist.
- **Day 8-9 crunch.** Most remaining Sprint 1 tasks are due on Days 8 and 9, and the DB work has to be finished first.
- **Tester workload.** Caberto owns both the Developer and Tester tasks.

## Decisions made
- DB Admin does the tasks in dependency order: DBA-01, DBA-02, DBA-03, DBA-04, then DBA-05.]
- Test tasks are reviewed by someone other than Caberto.

## Follow-up actions
| Action | Owner | Due |
|---|---|---|
| Merge S1-DBA-01 (team database and migration runner) | Dollesin | Day 6 |
| Merge S1-DBA-02 and S1-DBA-03 | Dollesin | Day 6 |
| Merge S1-DBA-04 and S1-DBA-05 | Dollesin | Day 7 |
| Re-test login, reset and user management against the real database | Caberto | Day 8 |
