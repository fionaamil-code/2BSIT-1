# Permission Matrix Test Execution (S1-TST-04)

## Permission Matrix Checklist

| Role | Module | Read | Create | Edit | Delete | Expected UI Behavior | Result |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **Superadmin** | All Modules | Full | Full | Full | Full | Full access to all modules and system settings. | Pass |
| **Admin** | Customer | Yes | Yes | Yes | Yes | Customer module visible and fully actionable. | Pass |
| **Admin** | Product | Yes | Yes | Yes | No | Delete button hidden/disabled for product items. | Pass |
| **User (Limited)**| HR | No | No | No | No | HR tile and sidebar link hidden. | Pass |
| **User (Limited)**| Sales | Yes | No | No | No | View-only interface; edit/create actions hidden. | Pass |

## Action & Audit Verification
- [x] **Rights Dialog All/None Toggle:** Toggling "All" checks every permission; toggling "None" unchecks all checkboxes correctly.
- [x] **Superadmin Protection Check:** System blocks attempt to remove, disable, or demote the last remaining Superadmin.
- [x] **Audit Log Tracking:** Modifying user rights appends a record into `audit_log` with correct `user_id`, target `modified_user_id`, `timestamp`, and `action_details`.