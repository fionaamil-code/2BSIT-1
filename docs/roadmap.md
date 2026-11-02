# HOPE ERP Roadmap (8 Weeks)

The six modules from the Student Guide (section 1.1) are mapped to four two-week sprints.

## Module-to-sprint map

| # | Guide module | Sprint | Weeks | Main tables |
|---|---|---|---|---|
| 1 | User Management (accounts, roles, rights) | 1 | 1-2 | USERS, RIGHTS, USERRIGHTS |
| 2 | Customers | 2 | 3-4 | CUSTOMER |
| 3 | Products (with price history) | 2 | 3-4 | PRODUCT, PRICEHIST |
| 4 | Human Resources | 3 | 5-6 | EMPLOYEE, JOB, DEPARTMENT, JOBHISTORY |
| 5 | Sales (with payments) | 4 | 7-8 | SALES, SALESDETAIL, PAYMENT |
| 6 | Reports (7 reports) | 4 | 7-8 | Reads all of the above |

## Sprint plan

| Sprint | Weeks | Goal | Key deliverables | Depends on |
|---|---|---|---|---|
| 1 | 1-2 | Secure foundation: people can register, log in and be given rights | Database and migrations, seed data, register, login/logout, password reset, User Management, Rights dialog, role-aware main page, audit user | Nothing (starts the project) |
| 2 | 3-4 | First data modules, which set the pattern for later ones | Customers and Products: list, search, add, edit, soft delete, restore, price history, current price, per-action rights | Sprint 1 login and rights |
| 3 | 5-6 | Employee data with restricted salary visibility | Departments, Jobs, Employees, Job History, employee profile, View Job History right | Sprint 1 rights, Sprint 2 pattern |
| 4 | 7-8 | Transactions and reporting, then release | Sales and line items, payments and balances, all 7 reports with Print / Save as PDF, audit log viewer, final regression | Customers, Products and Employees from Sprints 2-3 |

## Notes
- The order follows the guide's suggested build order (section 4.1), with one difference: the guide builds User Management last, but we build it first, because every later screen needs to know who is logged in and what they may do.
- Rights are enforced in every sprint. Each sprint's tests include per-right checks for its modules.
- Sales needs customers, employees and priced products to exist, and Reports read from every module, so they are built last.
- Risk: Sprint 4 is the heaviest. Re-check its scope at the Sprint 3 review.
- Anything that slips moves to the next sprint's backlog.
