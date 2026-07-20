# Phases.md — Build Roadmap
## Enterprise Contract Lifecycle Management (CLM) Platform

**Total Duration:** 4 Weeks | **Team Size:** 2 MERN Engineers

> Build incrementally. Do not jump ahead to a later phase's features until the current phase's core is working end-to-end. After completing each phase, log progress in `Memory.md`.

---

## Phase 0 — Project Setup (Day 1)

**Goal:** Empty-but-running skeleton for both frontend and backend, wired together, with Docker.

- [ ] Initialize `backend/` (Express app, ESM JS, folder structure per `Architecture.md`)
- [ ] Initialize `frontend/` (Vite + React, JS only)
- [ ] Set up `docker-compose.yml` with mongo, redis, minio, backend, frontend
- [ ] Connect backend to MongoDB (`config/db.js`) and Redis (`config/redis.js`)
- [ ] Set up `.env.example` with all known variables
- [ ] Basic health-check route: `GET /api/v1/health`
- [ ] Frontend calls health-check route and displays "API Connected" — confirms full stack wiring
- [ ] Set up ESLint + Prettier (JS config, no TS)
- [ ] Initialize git repo, `.gitignore`, first commit

**Exit criteria:** `docker-compose up` brings up the whole stack; frontend successfully calls backend.

---

## Phase 1 — Auth, Organizations & Multi-Tenancy (Days 2–4)

**Goal:** Users can register an organization, log in, and the system enforces tenant isolation.

- [ ] `User` and `Organization` models
- [ ] Register organization + first admin user
- [ ] Login (JWT access + refresh token)
- [ ] `auth.middleware.js` + `tenant.middleware.js` + `role.middleware.js`
- [ ] Department / Team / Branch Office CRUD (org-scoped)
- [ ] Invite additional users to org, assign roles
- [ ] Frontend: Login page, Register page, protected route wrapper, basic app shell (sidebar/navbar)
- [ ] Frontend: Org settings page (departments/teams/branches CRUD)

**Exit criteria:** Two different organizations can register; each only sees its own departments/users. Role-based route guarding works.

---

## Phase 2 — Contract Repository & Contract Builder (Days 5–9)

**Goal:** Users can create, store, and edit contracts using templates and a rich text editor.

- [ ] `Contract`, `ContractVersion`, `ContractTemplate`, `Clause` models
- [ ] CRUD for Contract Templates (org-scoped)
- [ ] CRUD for Clause Library
- [ ] Contract creation from template, with variable substitution (`{{party_name}}` etc.)
- [ ] Contract Builder UI: Rich Text Editor (TipTap) + insert-clause panel + insert-variable panel
- [ ] Save contract → creates a `ContractVersion` (version history starts here)
- [ ] Contract Repository UI: list view with filters (type, status, department, date)
- [ ] Contract Detail page: shows current version content, metadata, status
- [ ] PDF generation on demand (`pdfGenerator.service.js` + BullMQ job) → stored in MinIO
- [ ] BullMQ + Redis job queue wired up and working (first real background job)

**Exit criteria:** A user can pick a template, fill variables, add clauses, save, and download a generated PDF. Multiple versions visible in history.

---

## Phase 3 — Workflow Engine & Approval Chain (Days 10–15)

**Goal:** Contracts move through a configurable, multi-stage approval process. **This is the highest-weighted grading area — allocate real time here.**

- [ ] `WorkflowDefinition`, `WorkflowInstance`, `ApprovalStep` models
- [ ] `workflowEngine.service.js`: data-driven stage engine (`advance()`, `getCurrentStage()`, `canUserAct()`)
- [ ] Default workflow definitions seeded per contract type (Draft → Internal Review → Legal Review → Finance Approval → Executive Approval → Digital Signature → Published → Archived)
- [ ] Org Admin UI: build/edit a custom `WorkflowDefinition` (add/remove/reorder stages, assign approver role per stage)
- [ ] Submit-for-approval action on a contract → creates `WorkflowInstance`
- [ ] Approval Inbox page: shows contracts pending the logged-in user's decision
- [ ] Approve / Reject / Request Changes actions with comment
- [ ] Event bus (`events/eventBus.js`) wired: stage-change events fire on every transition
- [ ] Audit log entries written on every workflow action

**Exit criteria:** A contract can be pushed through a full custom-defined multi-role approval chain by different logged-in users, with a visible trail of who approved what and when.

---

## Phase 4 — Digital Signature & Version Control (Days 16–19)

**Goal:** Approved contracts can be signed (sequential or parallel), and version comparison/rollback works.

- [ ] `Signature` model
- [ ] Signature request creation when workflow reaches "Digital Signature" stage
- [ ] Sequential signing logic (enforce order)
- [ ] Parallel signing logic (any order, all required)
- [ ] Signature UI: simple signature pad / typed-signature confirmation + audit metadata capture (timestamp, IP)
- [ ] Signature status view (who signed, who's pending)
- [ ] Version comparison UI (diff between two `ContractVersion` entries)
- [ ] Rollback to previous version (creates a new version copying old content, does not destroy history)
- [ ] Contract auto-moves to `published` status once all required signatures are complete

**Exit criteria:** A contract with 2+ signatories can be fully signed (both modes tested), and a user can view/compare/rollback versions.

---

## Phase 5 — Obligations, Compliance Dashboard & Notifications (Days 20–24)

**Goal:** The system proactively tracks obligations and surfaces compliance risk; users get notified.

- [ ] `Obligation` model + CRUD (deliverables, payment milestones, renewal dates, compliance tasks, SLA commitments)
- [ ] `renewalScan.worker.js` — scheduled BullMQ job scanning for contracts nearing `endDate` / obligations nearing `dueDate`
- [ ] `Notification` model + notification creation on: approval assigned, renewal reminder, expiring contract, compliance deadline, signature pending
- [ ] Socket.IO real-time delivery of notifications (`sockets/notification.socket.js`, org-scoped rooms)
- [ ] Frontend: Notification bell + dropdown + notification history page
- [ ] Compliance Dashboard page: expiring contracts widget, compliance violations widget, pending approvals widget, renewal calendar view, risk category breakdown

**Exit criteria:** Creating a contract with a near-term end date triggers a real-time notification and shows up correctly on the Compliance Dashboard.

---

## Phase 6 — Polish, Security Hardening, Docs & Demo Prep (Days 25–28)

**Goal:** Production-quality polish and everything needed for submission/grading.

- [ ] Full audit log review — confirm every mutating action is logged
- [ ] Rate limiting on auth routes; input validation coverage pass on all endpoints
- [ ] Error handling pass (`error.middleware.js` sanitizes all responses, no stack traces leaked)
- [ ] UI/UX pass against `Design.md` (consistent spacing, states: loading/empty/error on every page)
- [ ] Write final `README.md` (setup instructions, run with Docker Compose, env vars)
- [ ] Write `deployment-guide.md`
- [ ] Draw and export Architecture Diagram (can be created with an artifact/diagram tool)
- [ ] Export Database Schema diagram (ERD)
- [ ] Prepare Technical Presentation slides
- [ ] Rehearse Live Demo script (which flows to click through, in what order)
- [ ] (Optional, if time remains) Implement one Bonus Challenge

**Exit criteria:** Everything in the PRD.md "Deliverables Checklist" is checked off.

---

## Suggested Two-Person Split (Reference Only — Adjust As Needed)

- **Engineer A:** Backend-heavy — models, services, workflow engine, background jobs, security.
- **Engineer B:** Frontend-heavy — pages, components, Redux/React Query wiring, Design.md implementation.
- Both pair on Phase 3 (Workflow Engine) since it's the highest-weighted and most architecturally central piece.
