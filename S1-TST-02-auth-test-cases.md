# Test Cases: Authentication & Password Workflows (S1-TST-02)

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | User Registration | 1. Navigate to `register.html`<br>2. Fill in valid details and submit | User account is created with `Pending` status. | Pass |
| **TC-AUTH-02** | Login with Pending Account | 1. Navigate to `login.html`<br>2. Enter credentials for pending user | Access denied; clear error message displayed; no session created. | Pass |
| **TC-AUTH-03** | Valid User Login | 1. Enter valid credentials for approved user<br>2. Click Login | User authenticated, session token saved, redirected to dashboard. | Pass |
| **TC-AUTH-04** | Invalid Credentials | 1. Enter valid email with wrong password<br>2. Click Login | Access denied; error message shown; session not created. | Pass |
| **TC-AUTH-05** | Logout Session Clear | 1. Click Logout on header/sidebar | Session terminated, session storage cleared, user redirected to `login.html`. | Pass |
| **TC-AUTH-06** | Forgot Password Token | 1. Submit email on `forgot-password.html` | Reset token/email triggered successfully. | Pass |
| **TC-AUTH-07** | Reset Password Execution | 1. Open `reset-password.html` with valid token<br>2. Submit new password | Password updated successfully; user can log in with new password. | Pass |
| **TC-AUTH-08** | Reset with Expired Token | 1. Submit reset form using invalid/expired token | Request rejected with error notification. | Pass |