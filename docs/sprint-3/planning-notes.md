# Sprint 3 Planning Notes

**Sprint:** 3 (Weeks 5-6)  
**Date:** November 17, 2026
**Prepared by:** Fiona Joy M. Amil (Scrum Master)

## Sprint goal
Deliver the Human Resources module: departments, jobs, employees, soft delete and restore, job history and employee profile, with salary and job history visible only to users who have the View Job History right.

## Scope
| Role | Member | Tasks | Count |
|---|---|---|---|
| Developer | Caberto | S3-DEV-01 to S3-DEV-08 | 8 |
| DB Admin | Dollesin | S3-DBA-01 to S3-DBA-06 | 6 |
| Tester | Caberto | S3-TST-01 to S3-TST-06 | 6 |
| UI/UX Designer | Cosa | S3-UIX-01 to S3-UIX-05 | 5 |
| Scrum Master | Amil | S3-SM-01 to S3-SM-05 | 5 |

## Carryover into this sprint

| Task ID | Task | Owner | Sprint 2 due | Depends on | Priority | New due (Sprint 3) |
|---|---|---|---|---|---|---|
| S2-TST-01 | Test the customer module | Xyd Roddney M. Caberto | Day 3 | S2-DEV-01, S2-DEV-02 | Must | Day 1 |
| S2-TST-02 | Test products and price history | Xyd Roddney M. Caberto | Day 5 | S2-DEV-04, S2-DEV-05, S2-DEV-07 | Must | Day 2 |
| S2-TST-03 | Test soft delete, restore and blocked delete | Xyd Roddney M. Caberto | Day 7 | S2-DEV-03, S2-DEV-06, S2-DBA-04 | Must | Day 3 |
| S2-TST-04 | Per-right permission tests for customer and product | Xyd Roddney M. Caberto | Day 8 | S2-DEV-08, S2-TST-01, S2-TST-02 | Must | Day 3 |
| S2-TST-05 | Regression test of Sprint 1 | Xyd Roddney M. Caberto | Day 9 | S2-DEV-08, S1-TST-02 to S1-TST-05 | Should | Day 4 |
| S2-TST-06 | Report bugs and verify fixes | Xyd Roddney M. Caberto | Day 9 | S2-TST-01 to S2-TST-05 | Must | Day 5 |

## Risks
- [Carryover delays Sprint 3's DB work]
- [Salary visibility must be enforced on the server]
- [other risks from the team]