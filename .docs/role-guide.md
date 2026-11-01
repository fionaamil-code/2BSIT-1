# Role Guide

| Role | Member | Responsibilities | Sprint 1 tasks |
|---|---|---|---|
| Scrum Master | Fiona Joy M. Amil | Runs the process, removes blockers, keeps the board and sheet current, writes sprint reports | S1-SM-01 to SM-05 |
| UI/UX Designer | Dorothy Faith P. Cosa | Design system, wireframes, hi-fi mockups, handoff notes, usability review | S1-UIX-01 to UIX-05 |
| DB Admin | Bervelyn Kim M. Dollesin | Database, migrations, seed data, audit function, queries | S1-DBA-01 to DBA-06 |
| Developer | Xyd Roddney M. Caberto | Builds features, enforces rights on the server | S1-DEV-01 to DEV-08 |
| Tester | Xyd Roddney M. Caberto | Test plan, test cases, automation, bug reports, fix verification | S1-TST-01 to TST-06 |

## Who reviews whose PRs
Nobody approves their own PR. Proposed reviewers:

| Author | Reviewer |
|---|---|
| Amil | Cosa |
| Cosa | Amil |
| Dollesin | Caberto |
| Caberto | Dollesin |

## Handoffs
- UI/UX hands finished designs to the Developer through a link and notes.
- DB Admin migrations must be merged before dependent Developer tasks are finished.
- The Developer tells the Tester when a feature is ready. The Tester logs bugs as issues.
