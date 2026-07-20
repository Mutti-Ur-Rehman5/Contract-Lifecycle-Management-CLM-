# Rules.md — Coding Conventions & Guardrails

> These rules apply to every file the AI generates or edits in this project. If a rule here conflicts with a general best practice you know, **follow this file** — it reflects project-specific and grading requirements.

---

## 1. Language Rule (Non-Negotiable)

- **Use plain JavaScript ONLY.** No TypeScript.
- Do NOT create `.ts` or `.tsx` files.
- Do NOT add `typescript`, `ts-node`, `@types/*` packages.
- Do NOT add `tsconfig.json`.
- If you (the AI) default to generating TypeScript out of habit, stop and rewrite in JavaScript before presenting the file.
- Use `.jsx` for React components that contain JSX, `.js` for plain logic files.
- Use JSDoc comments (`/** @param {string} name */`) for documenting function signatures instead of TS types — this is encouraged, not required.

---

## 2. Project Structure Rules

- Always follow the folder structure defined in `Architecture.md`. Do not invent a different structure or flatten folders "for simplicity."
- Respect the layering: `routes → controllers → services → repositories → models`.
  - Controllers must NOT contain business logic or direct Mongoose queries.
  - Services must NOT directly call `Model.find()` — go through the repository layer.
  - Repositories are the ONLY layer allowed to import Mongoose models directly.
- One file = one responsibility. Do not dump multiple unrelated models/controllers into a single file.

---

## 3. Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `ContractBuilderPage.jsx` |
| Files (non-component JS) | camelCase.role.js | `contract.service.js`, `auth.middleware.js` |
| React components | PascalCase | `WorkflowStepper` |
| Functions/variables | camelCase | `getContractById` |
| MongoDB collections/models | PascalCase singular | `Contract`, `WorkflowInstance` |
| Redux slices | camelCase + `Slice` | `contractSlice.js` |
| Constants | UPPER_SNAKE_CASE | `MAX_UPLOAD_SIZE_MB` |
| Route paths | kebab-case | `/api/v1/contract-templates` |
| Env variables | UPPER_SNAKE_CASE | `MONGO_URI`, `JWT_SECRET` |

---

## 4. Backend Rules

- Every route handler must be wrapped with `asyncHandler` (from `utils/asyncHandler.js`) — no unhandled promise rejections.
- Every API response must go through `utils/apiResponse.js` helpers for a consistent shape.
- Every mutating endpoint (create/update/delete/approve/sign) must write an entry to `AuditLog` via `auditLog.service.js`.
- Every DB query touching org-scoped collections MUST filter by `organizationId`. Never trust `organizationId` from the request body — always take it from `req.organizationId` (set by `tenant.middleware.js` from the authenticated JWT).
- Passwords must always be hashed with bcrypt — never store or log plaintext passwords.
- Never log JWT tokens, passwords, or full request bodies containing sensitive fields.
- Input validation happens at the route level (`validate.middleware.js` + Joi/express-validator schema) before it reaches the controller.
- Do not put secrets (API keys, DB URIs, JWT secret) directly in code — always read from `process.env` via `config/env.js`. Always update `.env.example` when adding a new env var (with a placeholder value, never the real value).

---

## 5. Frontend Rules

- Server state (data from the API) goes through **React Query**. Do not duplicate server data into Redux.
- Redux (Redux Toolkit) is only for **client/UI state**: auth session, current organization context, UI flags (modal open/closed), notification badge counts.
- No inline styles for anything beyond a one-off dynamic value. Follow whatever styling approach is set in `Design.md`.
- Components should be small and composable. If a component file exceeds ~200 lines, consider splitting it.
- Never call `axios`/`fetch` directly inside a component — always go through the `features/<domain>/*Api.js` layer (React Query hooks wrapping axios calls via `lib/axiosClient.js`).
- Form validation uses a schema (Yup or Zod-in-JS, no TS types) paired with React Hook Form — do not hand-roll manual validation logic per form.

---

## 6. Security Rules

- Never disable JWT verification "temporarily for testing" and leave it disabled.
- Never expose internal MongoDB `_id` structure or stack traces to the client in production error responses — use `error.middleware.js` to sanitize error output.
- File uploads must be validated for type and size before accepting (Multer config + explicit checks).
- Always use pre-signed URLs for S3/MinIO uploads/downloads — do not make the bucket public.
- Rate-limit auth endpoints (`/login`, `/register`) — do not skip this even in early phases.

---

## 7. Workflow Engine Rules (Critical — 20% of Grade)

- The workflow engine must be **data-driven**, reading from `WorkflowDefinition` documents. Do NOT hardcode stage sequences as `if (status === 'draft') { ... } else if (status === 'internal_review') { ... }` chains scattered across the codebase.
- All stage-transition logic lives in `workflowEngine.service.js`. No other file should mutate `WorkflowInstance.currentStageKey` directly.
- Every stage transition must emit an event through the event bus — do not directly call notification/audit code inline inside the workflow engine (keep it decoupled).

---

## 8. Git & Commit Rules

- Commit messages: `<type>(<scope>): <short description>` — e.g. `feat(contracts): add version comparison endpoint`, `fix(auth): correct JWT expiry check`.
- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.
- Do not commit `.env`, `node_modules`, or files inside `uploads/` (local dev artifacts) — ensure `.gitignore` covers these from Phase 1.
- Do not squash-rewrite history on shared branches.

---

## 9. Things NOT To Touch / Do

- Do NOT switch the DB from MongoDB to a relational DB, even if it seems easier for a particular feature (schema is defined in `Architecture.md`).
- Do NOT introduce TypeScript, even partially, even in "just this one utility file."
- Do NOT remove the Repository Pattern layer to "save time" — it's explicitly graded under Architecture (20%).
- Do NOT hardcode organization/user IDs anywhere for convenience — always derive from auth context.
- Do NOT skip the audit log on approval/signature actions — it's core to the "Security" and "Compliance" grading criteria.
- Do NOT change agreed-upon folder structure without updating `Architecture.md` to match (keep docs and code in sync).
- Do NOT invent new npm packages outside the stack listed in `Architecture.md` without a clear reason noted in `Memory.md`.

---

## 10. When Making Changes Across Sessions

- Before starting new work, read `Memory.md` to see what's already been decided/built.
- After finishing a meaningful chunk of work, log it in `Memory.md` (decision made, what was built, any bugs fixed, what's next) — see `Memory.md` for the exact format.
- If a rule in this file seems to block a needed feature, don't silently break the rule — flag it and propose an update to `Rules.md` first.
