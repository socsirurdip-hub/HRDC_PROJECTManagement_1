# Project To-Do List & Roadmap

## User Authentication & Credential Lifecycle (CERT-In / GIGW 3.0 Compliance)

- [ ] **Mandatory First-Time Login Password Change (`mustChangePassword: true`)**
  - Add `mustChangePassword: { type: Boolean, default: true }` in `User` model.
  - When a user logs in with temporary credentials for the first time, intercept the session and route them to a mandatory password change screen before granting access to dashboard features.
  - Validate that the new password is not identical to the temporary password and satisfies CERT-In complexity requirements (minimum 8 characters, uppercase, lowercase, numbers, and special characters).

- [ ] **Auto-Generated Cryptographically Secure Temporary Password**
  - Option during Super Admin user creation to auto-generate a random secure temporary password (`crypto.randomBytes`) instead of requiring manual password input.

- [ ] **Email Dispatch via Official CSIR SMTP Relay**
  - Configure nodemailer / CSIR SMTP relay integration to securely email new administrative users their onboarding link and temporary credentials.

- [ ] **Self-Service "Forgot / Reset Password" Workflow**
  - Expose `/api/auth/forgot-password` and `/api/auth/reset-password` endpoints.
  - Generate a single-use crypto-secure token (`crypto.randomBytes(32)` hashed with SHA-256) with a 15-minute validity window.
  - Deliver password reset link to user's registered institutional email address.
  - Log all password reset requests and completions in the CERT-In immutable audit logs.

