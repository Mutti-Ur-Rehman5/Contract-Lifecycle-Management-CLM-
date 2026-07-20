# Memory.md — Running Project Log

> Purpose: this file is the project's memory across chat sessions. Every time you (AI assistant) finish a meaningful chunk of work, add an entry here — **before** ending the session if possible. When starting a new session, **read this file first** before touching code, so context isn't lost.

---

## How To Use This File

- Add a new entry under the current date, newest at the top.
- Keep entries short and factual: what was decided, what was built, what broke and how it was fixed, what's left.
- Never delete old entries — this is a log, not a status doc. If something changes, add a new entry noting the change instead of editing history.
- Use this format:

```
### YYYY-MM-DD — Short Title
**Phase:** (reference Phases.md phase number/name)
**Did:**
- ...
**Decisions:**
- ...
**Bugs / Issues Found & Fixed:**
- ...
**Open / Next:**
- ...
```

---

## Project Setup Log

### 2026-07-19 — Docs Initialized
**Phase:** Phase 0 (pre-code)
**Did:**
- Created all 6 planning docs: `PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`, `Memory.md` based on the Ezitech CLM case study (MERN-011).
**Decisions:**
- Stack confirmed: React (JS, not TS) + Redux Toolkit + React Query on frontend; Node/Express + MongoDB + Redis on backend; BullMQ for jobs; Socket.IO for real-time; MinIO for object storage.
- **Language decision:** Plain JavaScript across the entire codebase — no TypeScript, per explicit project requirement (overrides any AI default preference for TS).
- Workflow Engine designed as data-driven (reads `WorkflowDefinition` documents) rather than hardcoded if/else — required to score well on the 20%-weighted Workflow Engine grading criterion.
- Design identity named "Ledger" — warm paper background, deep emerald accent, Fraunces + Inter type pairing, Stage Rail as the signature recurring UI element tied to workflow status colors.
- Two-column detail-page layout chosen (document + sticky metadata panel) to mirror how legal/compliance users actually work.
**Bugs / Issues Found & Fixed:**
- N/A (pre-code phase)
**Open / Next:**
- Begin Phase 0: scaffold `backend/` and `frontend/`, wire up `docker-compose.yml`, confirm health-check round trip before writing any feature code.

---

### 2026-07-20 — Phase 0 Complete: Project Skeleton
**Phase:** Phase 0 (Project Setup)
**Did:**
- Initialized `backend/` with full folder structure per Architecture.md (all models, repositories, services, controllers, routes, middleware, config, events, jobs, sockets, utils)
- All models defined: Organization, Department, Team, BranchOffice, User, Contract, ContractVersion, ContractTemplate, Clause, WorkflowDefinition, WorkflowInstance, ApprovalStep, Signature, Obligation, Notification, AuditLog
- Config layer: `db.js` (Mongoose), `redis.js` (ioredis), `s3.js` (AWS SDK v3 / MinIO), `env.js` (centralized env validation)
- Utility layer: `asyncHandler.js`, `apiResponse.js` (consistent `{ success, data, error }` shape), `logger.js` (pino)
- Middleware: `auth.middleware.js` (JWT verification), `tenant.middleware.js` (org scoping), `role.middleware.js` (RBAC), `error.middleware.js` (centralized), `validate.middleware.js` (Joi)
- Event bus: `eventBus.js` (EventEmitter) with listeners for contract approved/signed/expiring
- BullMQ queues: pdf-generation, notifications, renewal-scan — all with worker placeholders
- Socket.IO: server in `server.js` with org-scoped rooms, `notification.socket.js` helper
- Workflow engine: `workflowEngine.service.js` — data-driven advance/getCurrentStage/canUserAct
- Auth service: `auth.service.js` — register org + admin, login with JWT access+refresh tokens
- `docker-compose.yml`: mongo:7, redis:7-alpine, minio, backend (Express API), worker (BullMQ), frontend (Vite build via nginx)
- Frontend `vite.config.js` proxies `/api` to backend for dev
- Health-check route `GET /api/v1/health` returns `{ success: true, data: { status: 'ok' } }`
- Frontend `useHealthCheck` hook calls `/api/v1/health` and displays "API Connected" / error state
- ESLint flat config (no TS), Prettier config, `.gitignore`, `.env.example`
- Initialized git repo and committed scaffold (109 files)
**Decisions:**
- Used `bcryptjs` instead of `bcrypt` to avoid native compilation issues on Windows
- Used `@aws-sdk/client-s3` (v3) instead of `aws-sdk` v2 as specified in Architecture.md
- Used Joi for request validation (over express-validator) since it pairs naturally with the existing schema pattern
- Structured `server.js` as the entry point that bootstraps DB + event listeners + HTTP + Socket.IO
- Frontend Docker image uses multi-stage build (Vite build → nginx serve) with proxy passthrough for API
**Bugs / Issues Found & Fixed:**
- `bcrypt` failed to compile on Windows (missing build tools) — replaced with `bcryptjs` (pure JS)
- ESLint flat config initially used top-level `await import(...)` which is not supported — switched to static imports
- `error.middleware.js` referenced `config` without importing it — added import
- `aws-sdk` v2 is deprecated — switched to `@aws-sdk/client-s3` v3 per Architecture.md
**Open / Next:**
- Phase 1: Auth, Organizations & Multi-Tenancy — models already in place, need full CRUD endpoints and frontend auth pages

---

<!-- New entries go above this line, newest first -->
