# Architecture.md — System Architecture
## Enterprise Contract Lifecycle Management (CLM) Platform

> Language note: **Plain JavaScript everywhere** (frontend and backend). No TypeScript, no `.ts`/`.tsx` files, no type annotations. Use JSDoc comments for documentation where helpful, but do not introduce TS tooling (no `tsconfig.json`, no `ts-node`, no `.d.ts` files).

---

## 1. Tech Stack

### Frontend
- **React** (JavaScript, `.jsx` files — Vite as build tool)
- **Redux Toolkit** — global state (auth, current org, workflow state, notifications)
- **React Query (TanStack Query)** — server state, caching, data fetching
- **React Router** — routing
- **Rich Text Editor** — TipTap or React-Quill (TipTap preferred, easier to extend for variables/clauses)
- **Axios** — HTTP client
- **Socket.IO Client** — real-time notifications
- **React Hook Form + Zod (JS schema, not TS types)** or **Yup** — form validation

### Backend
- **Node.js + Express.js** (plain JavaScript, CommonJS or ESM — pick ESM, `"type": "module"` in package.json)
- **MongoDB** with **Mongoose** — primary database
- **Redis** — caching, session/rate-limit store, BullMQ queue backend
- **BullMQ** — background job queues (notifications, PDF generation, reminders)
- **Socket.IO** — real-time server (notifications, live status updates)
- **JWT (jsonwebtoken)** — authentication
- **bcrypt** — password hashing
- **Multer** — file upload handling
- **AWS SDK v3 (S3 client) pointed at MinIO** — object storage for contract PDFs/attachments
- **Puppeteer** or **pdf-lib** — PDF generation from contract HTML content
- **express-validator** or **Joi** — request validation
- **winston** or **pino** — logging (feeds into audit log)

### Infrastructure
- **Docker + Docker Compose** — local dev environment (mongo, redis, minio, backend, frontend all as services)
- **MinIO** — S3-compatible object storage (self-hosted)

---

## 2. High-Level Architecture Pattern

- **Clean Architecture** — separate layers: `routes → controllers → services → repositories → models`. Business logic lives in **services**, not controllers. Controllers only handle HTTP req/res.
- **Repository Pattern** — all direct Mongoose/DB calls go through a `repository` layer. Services never call `Model.find()` directly; they call `contractRepository.findById()`. This makes it possible to swap/mock the DB layer later.
- **Event-Driven Architecture** — key actions (`contract.approved`, `contract.signed`, `contract.expiring`) emit events via a simple in-process event emitter (or Redis pub/sub for scale) that trigger side effects (notifications, audit logs) without coupling that logic into the main request flow.
- **Workflow Engine** — a dedicated module (not hardcoded if/else chains) that reads a workflow **definition** (stored per contract type/org) and drives a contract through stages. See Section 5.
- **Version Control Engine** — a dedicated module that snapshots contract content on every meaningful change and supports diff/rollback.
- **Background Workers** — BullMQ workers, separate Node process (or same process in dev), handle: PDF generation, email/notification dispatch, renewal-reminder scheduled scans.
- **Multi-Tenant Design** — every collection that holds org-specific data includes an `organizationId` field. All queries are scoped by `organizationId` (enforced via middleware, never optional).

---

## 3. Folder Structure

```
clm-platform/
├── docker-compose.yml
├── README.md
├── docs/
│   ├── PRD.md
│   ├── Architecture.md
│   ├── Rules.md
│   ├── Phases.md
│   ├── Design.md
│   └── Memory.md
│
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── server.js                  # entry point, starts HTTP + Socket.IO
│   │   ├── app.js                     # express app setup, middleware mounting
│   │   ├── config/
│   │   │   ├── db.js                  # mongoose connection
│   │   │   ├── redis.js               # redis client
│   │   │   ├── s3.js                  # MinIO/S3 client setup
│   │   │   └── env.js                 # centralized env var loading/validation
│   │   │
│   │   ├── models/                    # Mongoose schemas
│   │   │   ├── Organization.model.js
│   │   │   ├── Department.model.js
│   │   │   ├── Team.model.js
│   │   │   ├── BranchOffice.model.js
│   │   │   ├── User.model.js
│   │   │   ├── Contract.model.js
│   │   │   ├── ContractVersion.model.js
│   │   │   ├── ContractTemplate.model.js
│   │   │   ├── Clause.model.js
│   │   │   ├── WorkflowDefinition.model.js
│   │   │   ├── WorkflowInstance.model.js
│   │   │   ├── ApprovalStep.model.js
│   │   │   ├── Signature.model.js
│   │   │   ├── Obligation.model.js
│   │   │   ├── Notification.model.js
│   │   │   └── AuditLog.model.js
│   │   │
│   │   ├── repositories/              # DB access layer (repository pattern)
│   │   │   ├── contract.repository.js
│   │   │   ├── user.repository.js
│   │   │   ├── workflow.repository.js
│   │   │   ├── signature.repository.js
│   │   │   ├── obligation.repository.js
│   │   │   └── ...
│   │   │
│   │   ├── services/                  # business logic
│   │   │   ├── auth.service.js
│   │   │   ├── organization.service.js
│   │   │   ├── contract.service.js
│   │   │   ├── contractBuilder.service.js
│   │   │   ├── workflowEngine.service.js   # core workflow engine logic
│   │   │   ├── signature.service.js
│   │   │   ├── versionControl.service.js
│   │   │   ├── obligation.service.js
│   │   │   ├── compliance.service.js
│   │   │   ├── notification.service.js
│   │   │   ├── pdfGenerator.service.js
│   │   │   └── auditLog.service.js
│   │   │
│   │   ├── controllers/               # HTTP handlers only
│   │   │   ├── auth.controller.js
│   │   │   ├── organization.controller.js
│   │   │   ├── contract.controller.js
│   │   │   ├── workflow.controller.js
│   │   │   ├── signature.controller.js
│   │   │   ├── obligation.controller.js
│   │   │   ├── compliance.controller.js
│   │   │   └── notification.controller.js
│   │   │
│   │   ├── routes/
│   │   │   ├── index.js               # mounts all routes under /api
│   │   │   ├── auth.routes.js
│   │   │   ├── organization.routes.js
│   │   │   ├── contract.routes.js
│   │   │   ├── workflow.routes.js
│   │   │   ├── signature.routes.js
│   │   │   ├── obligation.routes.js
│   │   │   ├── compliance.routes.js
│   │   │   └── notification.routes.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js     # verifies JWT
│   │   │   ├── tenant.middleware.js   # enforces organizationId scoping
│   │   │   ├── role.middleware.js     # RBAC check
│   │   │   ├── error.middleware.js    # centralized error handler
│   │   │   └── validate.middleware.js
│   │   │
│   │   ├── events/
│   │   │   ├── eventBus.js            # simple EventEmitter or Redis pub/sub wrapper
│   │   │   └── listeners/
│   │   │       ├── onContractApproved.js
│   │   │       ├── onContractSigned.js
│   │   │       └── onContractExpiring.js
│   │   │
│   │   ├── jobs/                      # BullMQ queues + workers
│   │   │   ├── queues.js
│   │   │   ├── workers/
│   │   │   │   ├── notification.worker.js
│   │   │   │   ├── pdfGeneration.worker.js
│   │   │   │   └── renewalScan.worker.js
│   │   │   └── schedulers/
│   │   │       └── renewalReminder.scheduler.js
│   │   │
│   │   ├── sockets/
│   │   │   └── notification.socket.js
│   │   │
│   │   └── utils/
│   │       ├── apiResponse.js
│   │       ├── asyncHandler.js
│   │       └── logger.js
│   │
│   └── tests/
│       ├── unit/
│       └── integration/
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── app/
        │   ├── store.js                # redux store
        │   └── queryClient.js          # react-query client
        │
        ├── features/                   # redux slices, grouped by domain
        │   ├── auth/
        │   │   ├── authSlice.js
        │   │   └── authApi.js
        │   ├── organization/
        │   ├── contracts/
        │   ├── workflow/
        │   ├── signatures/
        │   ├── obligations/
        │   ├── compliance/
        │   └── notifications/
        │
        ├── pages/
        │   ├── auth/
        │   │   ├── LoginPage.jsx
        │   │   └── RegisterPage.jsx
        │   ├── dashboard/
        │   │   └── ComplianceDashboardPage.jsx
        │   ├── contracts/
        │   │   ├── ContractListPage.jsx
        │   │   ├── ContractDetailPage.jsx
        │   │   └── ContractBuilderPage.jsx
        │   ├── workflow/
        │   │   └── ApprovalInboxPage.jsx
        │   ├── organization/
        │   │   └── OrgSettingsPage.jsx
        │   └── NotFoundPage.jsx
        │
        ├── components/
        │   ├── ui/                     # generic reusable components (buttons, modals, badges)
        │   ├── layout/                 # sidebar, navbar, app shell
        │   ├── contract/
        │   │   ├── RichTextEditor.jsx
        │   │   ├── ClauseLibraryPanel.jsx
        │   │   ├── VariableInserter.jsx
        │   │   └── VersionHistoryPanel.jsx
        │   ├── workflow/
        │   │   ├── WorkflowStepper.jsx
        │   │   └── ApprovalActionCard.jsx
        │   ├── signature/
        │   │   └── SignaturePad.jsx
        │   └── notifications/
        │       └── NotificationBell.jsx
        │
        ├── hooks/
        │   ├── useAuth.js
        │   ├── useSocket.js
        │   └── ...
        │
        ├── lib/
        │   ├── axiosClient.js
        │   └── socketClient.js
        │
        └── styles/
            └── globals.css
```

---

## 4. Database Schema (MongoDB / Mongoose)

> All org-scoped collections include `organizationId` (ObjectId, indexed).

### `Organization`
```
{
  name, slug, industry, plan,
  createdAt, updatedAt
}
```

### `Department` / `Team` / `BranchOffice`
```
{
  organizationId, name, parentDepartmentId (for Department),
  createdAt
}
```

### `User`
```
{
  organizationId, name, email, passwordHash,
  role: enum [admin, drafter, reviewer, legal, finance, executive, signatory, compliance_officer],
  departmentId, isActive,
  createdAt
}
```

### `Contract`
```
{
  organizationId, title, type: enum [employment, vendor, nda, service, purchase, partnership, client],
  status: enum [draft, internal_review, legal_review, finance_approval,
                executive_approval, pending_signature, published, archived, rejected],
  currentVersionId,        // ref -> ContractVersion
  templateId,
  workflowInstanceId,      // ref -> WorkflowInstance
  ownerId,                 // ref -> User (drafter)
  parties: [{ name, email, role }],
  startDate, endDate,
  createdAt, updatedAt
}
```

### `ContractVersion`
```
{
  contractId, versionNumber, content (rich text JSON/HTML),
  pdfFileUrl, changeSummary, createdBy, createdAt
}
```

### `ContractTemplate`
```
{
  organizationId, name, contractType, contentTemplate (with {{variables}}),
  defaultWorkflowDefinitionId, createdAt
}
```

### `Clause`
```
{
  organizationId, title, category, content, tags: [String], createdAt
}
```

### `WorkflowDefinition`
```
{
  organizationId, name, contractType,
  stages: [
    { key: "internal_review", label, approverRole, order, isRequired }
  ],
  createdAt
}
```

### `WorkflowInstance`  (a running workflow attached to one contract)
```
{
  contractId, workflowDefinitionId, currentStageKey,
  status: enum [in_progress, completed, rejected],
  createdAt
}
```

### `ApprovalStep`
```
{
  workflowInstanceId, stageKey, assignedToUserId,
  status: enum [pending, approved, rejected, skipped],
  comment, decidedAt, createdAt
}
```

### `Signature`
```
{
  contractId, signerId, signOrder (for sequential),
  mode: enum [sequential, parallel],
  status: enum [pending, signed, declined],
  signedAt, ipAddress, signatureImageUrl,
  auditTrail: [{ action, timestamp, ipAddress }]
}
```

### `Obligation`
```
{
  contractId, organizationId, type: enum [deliverable, payment_milestone,
                renewal_date, compliance_task, sla_commitment],
  title, dueDate, status: enum [pending, completed, overdue],
  assignedToUserId, createdAt
}
```

### `Notification`
```
{
  organizationId, userId, type, title, message,
  relatedContractId, isRead, createdAt
}
```

### `AuditLog`
```
{
  organizationId, userId, action, entityType, entityId,
  metadata (JSON), ipAddress, createdAt
}
```

---

## 5. Workflow Engine Design (Core of the 20% grading weight)

**This must NOT be hardcoded if/else logic.** Design it as a data-driven state machine:

1. A `WorkflowDefinition` document defines an ordered list of `stages` for a given contract type.
2. When a contract is submitted, a `WorkflowInstance` is created, pointing to `currentStageKey = stages[0].key`.
3. `workflowEngine.service.js` exposes:
   - `advance(workflowInstanceId, decision, actorId, comment)` — moves to the next stage on approval, or marks rejected.
   - `getCurrentStage(workflowInstanceId)`
   - `canUserAct(workflowInstanceId, userId)` — checks if the current stage's `approverRole` matches the user's role.
4. On every stage transition, emit an event (`contract.stage_changed`) — listeners handle notifications + audit logging.
5. This design lets the **same engine** run different workflows (e.g., NDAs might skip Finance Approval; Vendor Agreements might require it) without code changes — only different `WorkflowDefinition` data.

---

## 6. Authentication & Authorization

- JWT-based auth (access token + refresh token).
- `auth.middleware.js` verifies token, attaches `req.user`.
- `tenant.middleware.js` attaches `req.organizationId` from the authenticated user and **every** repository query must filter by it.
- `role.middleware.js` — simple RBAC: `requireRole(['admin', 'legal'])` guards routes.

---

## 7. Real-Time Layer

- Socket.IO server initialized in `server.js`, namespaced per organization room (`org:<organizationId>`).
- Events pushed to clients: `notification:new`, `contract:status_changed`, `signature:completed`.
- Frontend `useSocket.js` hook joins the org room on login and updates Redux/React Query cache on incoming events.

---

## 8. Background Jobs (BullMQ)

| Queue | Job | Trigger |
|---|---|---|
| `pdf-generation` | Convert contract HTML content → PDF, upload to MinIO | On contract publish or manual "Generate PDF" |
| `notifications` | Send email + create in-app notification | On workflow event (approval assigned, signed, etc.) |
| `renewal-scan` | Daily cron: scan contracts nearing `endDate`, create obligation reminders | Scheduled (BullMQ repeatable job) |

---

## 9. File Storage

- MinIO (S3-compatible) bucket per environment: `clm-contracts`.
- Files stored as `org/{organizationId}/contracts/{contractId}/v{versionNumber}.pdf`.
- Backend generates pre-signed URLs for frontend upload/download — files never proxied through the app server unnecessarily.

---

## 10. API Design Convention

- Base path: `/api/v1/...`
- REST resources: `/api/v1/contracts`, `/api/v1/contracts/:id/versions`, `/api/v1/workflows/:id/advance`, `/api/v1/signatures/:id/sign`, `/api/v1/obligations`, `/api/v1/compliance/dashboard`
- All responses follow a consistent shape via `utils/apiResponse.js`:
```js
{ success: true, data: {...}, message: "" }
{ success: false, error: { code, message } }
```

---

## 11. Deployment (Docker Compose Services)

```
services:
  mongo
  redis
  minio
  backend      (Node/Express API + Socket.IO)
  worker       (BullMQ workers, separate process, same codebase)
  frontend     (Vite build served via nginx, or dev server)
```
