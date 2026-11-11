# CSIR-HRDC Training Portal: MeitY & CERT-In Compliance Architecture

## Executive Summary

This document outlines the architectural decisions, regulatory standards, compliance matrix, and phased implementation roadmap for aligning the **CSIR-HRDC Training Program Management & Analytics Portal** with:
- **MeitY Guidelines for Indian Government Websites (GIGW 3.0)**
- **CERT-In Cyber Security Directions (2022 Mandates & Safe-to-Host VAPT Checklist)**
- **Digital Personal Data Protection Act (DPDPA 2023)**

---

## 1. Compliance Standards & Regulatory Mapping

| Mandate / Regulation | Governing Body | Core Requirements Addressed |
| :--- | :--- | :--- |
| **CERT-In Directions (April 2022)** | CERT-In, MeitY | 180-day log retention within India, IST / NPL / NIC NTP synchronization, incident reporting readiness, brute-force mitigation |
| **GIGW 3.0 / STQC Certification** | MeitY & NIC | Bilingual UI (Hindi & English), WCAG 2.1 Level AA accessibility, National identity header, mandatory policies footer, WIM info |
| **Safe-to-Host (VAPT)** | CERT-In Empaneled Auditors | OWASP Top 10 mitigation, strict Content Security Policy (CSP), HSTS, no-sniff, clickjacking defense, secure session expiration |
| **DPDPA 2023** | Ministry of Law & Justice / MeitY | Encrypted storage of trainee PII at rest (AES-256), data masking in view/export tiers, immutable audit trails |

---

## 2. Key Architectural Decisions (ADRs)

### ADR-01: Centralized IST Daily-Rotating Log Transport (180-Day Retention)
- **Context:** CERT-In Clause 2(v) mandates retention of server/system logs for a rolling period of at least 180 days within Indian jurisdiction, and Clause 2(i) mandates standard Indian Standard Time (IST) time synchronization.
- **Decision:** Implemented `winston-daily-rotate-file` in the backend logger with `maxFiles: '180d'`, automatic gzip compression (`zippedArchive: true`), and explicit `Asia/Kolkata` timestamp formatting (`IST`).
- **Files Affected:** `backend/src/utils/logger.js`, `backend/logs/`.

### ADR-02: Hardened HTTP Security Headers & Information Cloaking
- **Context:** Safe-to-Host guidelines prohibit server fingerprinting and require defense-in-depth headers against XSS, clickjacking, and MIME sniffing.
- **Decision:** Configured `helmet` with:
  - Custom Content Security Policy (`scriptSrc: ["'self'"]`, `styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com']`, `objectSrc: ["'none'"]`).
  - HSTS enabled (`maxAge: 31536000`, `includeSubDomains: true`, `preload: true`).
  - `frameguard: { action: 'deny' }` (`X-Frame-Options: DENY`).
  - Explicit disabling of `x-powered-by`.
- **Files Affected:** `backend/src/server.js`.

### ADR-03: Session Lifetime & Account Lockout Thresholds
- **Context:** Administrative portals handling government/employee records must enforce session timeouts on inactivity (15–30 minutes) and thwart brute-force password guessing.
- **Decision:**
  - Lowered `JWT_EXPIRE` from `7d` to `30m`.
  - Added dedicated endpoint rate-limiter on `/api/auth/login` (maximum 5 attempts per IP per 15 minutes).
  - Integrated 30-minute account lockout on 5 consecutive invalid credential attempts via Mongoose schema hooks.
- **Files Affected:** `backend/.env`, `backend/src/server.js`, `backend/src/controllers/authController.js`, `backend/src/models/User.js`.

### ADR-04: Government Identity & Accessibility Tier (GIGW 3.0)
- **Context:** GIGW 3.0 requires standard government identity headers (National Emblem / CSIR affiliation), bilingual support, and WCAG 2.1 AA accessibility controls.
- **Decision:** Maintain a dedicated accessibility strip (`A-`, `A`, `A+`, High Contrast toggle, Skip to Main Content) and bilingual language toggling on the frontend layout without coupling state to backend services.
- **Files Affected:** `frontend/src/components/layout/AppLayout.tsx`, `frontend/src/components/layout/Topbar.tsx`, `frontend/index.html`.

### ADR-05: PII Encryption & Data Masking (DPDPA 2023)
- **Context:** Trainee phone numbers, email addresses, and social category details must be shielded from unauthorized data leakage in storage and display tiers.
- **Decision:** Use AES-256 field-level encryption at rest for sensitive trainee attributes and mask phone/identity digits in general list/reporting views.
- **Files Affected:** `backend/src/models/Trainee.js`, `backend/src/controllers/traineeController.js`.

---

## 3. Implementation Phases & Roadmap

```
                               ROADMAP PHASES
                               
  +-------------------------------------------------------------------+
  | Phase 1: Backend Security Hardening (CERT-In / OWASP)             |  [COMPLETED]
  |  - 180-day rotating IST audit logs (winston-daily-rotate-file)    |
  |  - 30-minute session expiry & inactivity timeout                  |
  |  - Strict login rate limiting (5 attempts / 15 mins) & lockout    |
  |  - Strict CSP, HSTS, X-Frame-Options & header lockdown            |
  +----------------------------------+--------------------------------+
                                     |
                                     v
  +-------------------------------------------------------------------+
  | Phase 2: Frontend GIGW 3.0 Compliance & Accessibility             |  [COMPLETED]
  |  - Official bilingual header (CSIR-HRDC / Govt of India emblem)   |
  |  - Accessibility toolbar (A-, A, A+, High Contrast, Skip to Main) |
  |  - Standard government footer (WIM contact, CAP, CMP, policies)   |
  |  - WCAG 2.1 AA color contrast & keyboard focus indicator audit    |
  +----------------------------------+--------------------------------+
                                     |
                                     v
  +-------------------------------------------------------------------+
  | Phase 3: PII Protection & Data Privacy (DPDPA 2023)               |  [COMPLETED]
  |  - Field-level encryption for trainee records (AES-256)           |
  |  - Masking PII in export and view endpoints (phone, identifiers)  |
  |  - Automated audit trails for all sensitive data read/write ops   |
  +----------------------------------+--------------------------------+
                                     |
                                     v
  +-------------------------------------------------------------------+
  | Phase 4: Production Deployment & Third-Party Audit Preparation     |  [PLANNED]
  |  - Deployment on MeitY-empaneled Cloud (NIC / MeghRaj / AWS India)|
  |  - NTP clock sync with National Physical Laboratory (NPL) servers |
  |  - Engagement with CERT-In empaneled auditor for VAPT             |
  |  - Submission for STQC Website Quality Certification              |
  +-------------------------------------------------------------------+
```

---

## 4. Phase Breakdown & Deliverables

### Phase 1: Backend Security Hardening (Completed)
- [x] Install and configure `winston-daily-rotate-file` with 180-day retention and IST timestamps.
- [x] Reduce JWT session expiration window to 30 minutes in `.env`.
- [x] Implement strict brute-force rate-limiting on `/api/auth/login`.
- [x] Hardened helmet configuration (CSP, HSTS, anti-clickjacking, MIME sniffing).
- [x] Verify audit log write events on login, logout, and sensitive state changes.

### Phase 2: Frontend GIGW 3.0 Compliance (Completed)
- [x] Add bilingual top identity header with CSIR-HRDC official insignia.
- [x] Implement WCAG 2.1 AA accessibility strip (Text size resizing, contrast toggle, skip navigation).
- [x] Implement mandatory footer containing:
  - Website Information Manager (WIM) contact details
  - Privacy Policy, Hyperlinking Policy, Copyright, Terms & Conditions, Disclaimer
  - Content Archival Policy (CAP) & Contingency Management Plan (CMP)
  - Last updated date timestamp
- [x] Ensure full keyboard accessibility and screen-reader `aria-*` tags across all form controls and data tables.

### Phase 3: PII Protection & Privacy Controls (Completed)
- [x] Implement AES-256-GCM encryption & decryption utility (`backend/src/utils/crypto.js`).
- [x] Mask contact numbers (`98XXXXXX06`) and email addresses (`d***i@example.com`) for non-superadmin views.
- [x] Export audit records with role-based masking when bulk trainee data is downloaded (Excel/CSV).
- [x] Automatically create `VIEW_PII` audit trail records whenever individual trainee records are inspected.

### Phase 4: Hosting, Verification & Audit Readiness
- [ ] Configure environment for hosting on MeitY-empaneled Cloud / NIC server within India.
- [ ] Configure server NTP daemon to synchronize against `time.nplindia.org` / NIC NTP servers.
- [ ] Conduct automated dynamic security scan (OWASP ZAP / SonarQube).
- [ ] Facilitate third-party CERT-In empaneled VAPT audit to obtain the **Safe-to-Host** certificate.

