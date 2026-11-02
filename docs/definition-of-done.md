# Definition of Done

A task is Done only when all of these are true:

1. All acceptance criteria in the issue are met.
2. The work is tested or verified, and the proof (screenshots, logs, test results) is in the PR.
3. The PR is linked to its issue with `Closes #n`.
4. The PR covers one task only, with no unrelated changes, and is more than a trivial change.
5. No passwords, secret keys or `.env` files are committed, and debug code is removed.
6. A teammate who is not the author has approved the PR.
7. The PR is merged to `main`, and the task status and PR link are updated in the task sheet.

## Extra checks by role
- **Developer:** feature works locally, server enforces the rights, no unrelated files.
- **DB Admin:** migration runs from scratch on a clean database, and a verification query is included.
- **Tester:** test cases have expected vs actual results, and bugs are logged as issues.
- **UI/UX Designer:** the design link is shared and handoff notes are included.
- **Scrum Master:** documents are committed and the team has seen them.
