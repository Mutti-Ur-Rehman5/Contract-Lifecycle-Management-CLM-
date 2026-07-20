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

<!-- New entries go above this line, newest first -->
