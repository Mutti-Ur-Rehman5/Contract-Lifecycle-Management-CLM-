# PRD.md — Product Requirements Document
## Enterprise Contract Lifecycle Management (CLM) Platform

---

## 1. What We're Building

A **multi-tenant SaaS web platform** that lets enterprises create, negotiate, approve, digitally sign, monitor, renew, and archive contracts — replacing manual, paper-based, and scattered-document contract handling with one centralized, auditable system.

This is being built as a MERN stack project (**MongoDB, Express.js, React, Node.js**) using **plain JavaScript** (no TypeScript) across frontend and backend.

---

## 2. Why This Exists (The Problem)

A multinational company with **25,000 active contracts**, **8 regional offices**, **3,500 employees**, and **2,000 vendors** currently struggles with:

- Lost or misplaced contract documents
- Expired agreements nobody noticed in time
- Slow, manual, email-based approval chains
- Duplicate/conflicting contract versions
- Missed renewal deadlines
- No compliance tracking or audit trail
- No single source of truth (no centralized repository)

**Goal:** Digitize the entire contract lifecycle — draft → review → approve → sign → track → renew/archive — with security, compliance, and full auditability built in.

---

## 3. Who It's For (Users / Personas)

| Role | Needs From The System |
|---|---|
| **Org Admin** | Set up organization, departments, teams, branch offices; manage users & roles |
| **Contract Creator / Drafter** | Build contracts from templates, insert clauses/variables, generate PDF |
| **Internal Reviewer** | Review draft contracts, leave comments, approve/reject |
| **Legal Reviewer** | Review legal clauses, flag risk, approve/reject |
| **Finance Approver** | Approve budget/payment terms of a contract |
| **Executive Approver** | Final sign-off before publishing |
| **Signatory** | Digitally sign a contract (sequentially or in parallel with others) |
| **Compliance Officer** | Monitor expiring contracts, compliance violations, renewal calendar |
| **Vendor / Employee / Client (external party)** | Views and signs their own contract, sees status |

---

## 4. Core Modules & Features (User Stories)

### 4.1 Organization Management (Multi-Tenant)
- As an Org Admin, I can register my organization on the platform (multi-tenant SaaS — each org's data is isolated).
- As an Org Admin, I can create Departments, Teams, and Branch Offices under my organization.
- As an Org Admin, I can invite users and assign roles (Admin, Drafter, Reviewer, Legal, Finance, Executive, Signatory, Compliance Officer).

### 4.2 Contract Repository
- As a user, I can store and browse contracts by type:
  - Employment Contracts
  - Vendor Agreements
  - NDAs
  - Service Agreements
  - Purchase Contracts
  - Partnership Agreements
  - Client Contracts
- As a user, I can search/filter contracts (by type, status, department, date, party name).
- As a user, I can view a single contract's full detail page (metadata, current version, status, history, signatories).

### 4.3 Contract Builder
- As a Drafter, I can create a new contract from a **dynamic template**.
- As a Drafter, I can insert **variables** (e.g., `{{party_name}}`, `{{start_date}}`) that get filled in automatically.
- As a Drafter, I can pick clauses from a **Clause Library** and insert them into the contract.
- As a Drafter, I can edit contract content using a **Rich Text Editor**.
- As a Drafter, I can generate a **PDF** of the contract at any stage.
- As a Drafter, every save creates a new entry in **Version History**.

### 4.4 Approval Workflow Engine
- As an Org Admin, I can configure a custom approval workflow (which steps, in what order, who approves each step) per contract type.
- Default workflow stages: `Draft → Internal Review → Legal Review → Finance Approval → Executive Approval → Digital Signature → Published → Archived`.
- As a Reviewer/Approver, I can approve, reject, or request changes at my stage, with comments.
- As a user, I can see the current stage and full approval trail of any contract.
- System must support **configurable** (not hardcoded) workflows — different contract types can have different stage sequences.

### 4.5 Digital Signature Module
- As a Signatory, I can digitally sign a contract assigned to me.
- System supports **Sequential Signing** (Signatory B can only sign after A signs) and **Parallel Signing** (all signatories sign independently, any order).
- As a user, I can see **Signature Status** per signatory (Pending / Signed / Declined).
- System keeps a **Signature Audit Trail** (who signed, when, from what IP/device — timestamped, tamper-evident).

### 4.6 Obligation Management
- As a Compliance Officer / Contract Owner, I can track obligations tied to a contract:
  - Deliverables
  - Payment Milestones
  - Renewal Dates
  - Compliance Tasks
  - SLA Commitments
- As a user, I get notified before an obligation's due date.

### 4.7 Version Control
- System maintains **complete revision history** of every contract.
- As a user, I can compare two versions (change comparison / diff view).
- As a user with permission, I can **rollback** to a previous version.
- System keeps an **approval history** tied to each version.

### 4.8 Compliance Dashboard
- As a Compliance Officer, I see a dashboard showing:
  - Expiring Contracts (e.g., next 30/60/90 days)
  - Compliance Violations
  - Pending Approvals
  - Renewal Calendar (calendar view)
  - Risk Categories (High / Medium / Low)

### 4.9 Notification Center
- Users receive notifications (in-app + email) for:
  - Approval Requests assigned to them
  - Renewal Reminders
  - Expiring Contracts
  - Compliance Deadlines
  - Signature Pending requests
- Notifications delivered in real-time via **Socket.IO** and persisted so users can view notification history.

---

## 5. Non-Functional Requirements

- Must be designed to conceptually support **100,000 contracts** and **10,000 concurrent users** (architecture should not block scaling — actual load testing not required for internship scope, but design decisions should not prevent it).
- High Availability / Horizontal Scaling — stateless backend services, background jobs offloaded to workers (BullMQ).
- Secure file storage (S3-compatible / MinIO concept) — contract PDFs and attachments never stored in the app server's local disk in production design.
- Full **Audit Logging** — every create/update/approve/sign/delete action is logged (who, what, when).
- **API-First Design** — backend exposes REST APIs consumed by the frontend; APIs should be usable independently of the UI.
- Multi-tenant data isolation — one organization must never see another organization's data.

---

## 6. Out of Scope (for this internship build)

- Real payment gateway integration (payment milestones are tracked, not actually processed)
- Real blockchain signature verification (conceptual/bonus only)
- Real OCR engine integration unless attempted as a bonus challenge
- Production-grade Kubernetes deployment (Docker Compose is sufficient)
- Real S3 — MinIO (self-hosted S3-compatible) or local disk abstraction behind an S3-like interface is acceptable

---

## 7. Bonus Challenges (Optional, Pick 1+)

- AI Clause Risk Analysis
- AI Contract Summarization
- OCR for Scanned Contracts
- Smart Clause Recommendation
- Multi-Language Contract Generation
- Blockchain-Based Signature Verification (concept only)

---

## 8. Deliverables Checklist

- [ ] Complete source code (frontend + backend)
- [ ] Contract Builder (working)
- [ ] Workflow Engine (configurable, working)
- [ ] Digital Signature Module (working)
- [ ] Compliance Dashboard (working)
- [ ] REST APIs (documented)
- [ ] Architecture Diagram
- [ ] Database Schema
- [ ] Deployment Guide
- [ ] README
- [ ] Technical Presentation
- [ ] Live Demonstration

---

## 9. Evaluation Criteria (Know What's Graded)

| Criteria | Weight |
|---|---|
| Software Architecture | 20% |
| Workflow Engine | 20% |
| Contract Management Logic | 20% |
| Performance | 15% |
| Security | 10% |
| Documentation | 10% |
| Presentation | 5% |

**Implication for build priority:** Architecture + Workflow Engine + Contract Logic = 60% of the grade. These must be rock solid before polishing UI or adding bonus features.
