# Test Cases: User Management (S1-TST-03)

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- |
| **TC-UM-01** | User List Display | 1. Open `users.html` as Admin | List loads displaying all registered users (excluding Superadmins). | Pass |
| **TC-UM-02** | Add New User | 1. Click "Add User"<br>2. Enter details and save | User is created and added to table list. | Pass |
| **TC-UM-03** | Edit User Details | 1. Select a user and click Edit<br>2. Update user name/details and save | Changes persist in the system and reflect in UI. | Pass |
| **TC-UM-04** | Block User | 1. Click "Block" on an active user | User status updates to `Blocked`; user cannot sign in. | Pass |
| **TC-UM-05** | Unblock User | 1. Click "Unblock" on a blocked user | User status updates to `Active`; user can sign in. | Pass |
| **TC-UM-06** | Approve Pending User | 1. Log in as Superadmin<br>2. Approve pending user | Account status changes to `Active`. | Pass |