# Session — M1-AUD-FE — Frontend

**Date:** 2026-08-26
**Agent:** Cursor
**Milestone:** M1
**Version after this session:** no bump
**Contract version worked against:** assurly-api-contract.md v2.5

---

## What this session was for

Diagnostic-only frontend audit of M1 live defects REQ-006, REQ-007, REQ-008, REQ-009 and REQ-011: establish current behaviour, root cause, and whether fixes need backend/contract work before any implementation.

## What changed

- Added `docs/milestones/m1-audit-frontend.md` with per-requirement findings.
- Added this dev-log entry.

**Schema changes:** none.

**Contract changes:** none.

## What was deliberately not changed

- No application code under `assurly-frontend/`.
- No edits to `docs/api/assurly-api-contract.md`, `docs/assurly-data-model.md`, or `docs/project-structure.md`.
- Did not merge or cherry-pick evidence work from `claude/review-backend-brief-mjtms`.
- Did not verify backend persistence of `due_date` or GCS upload behaviour at runtime (frontend network-layer diagnosis only).

## Root cause

Summaries (detail in the audit file):

- **REQ-006:** Upload UI never dispatches HTTP; working evidence client exists only on an unmerged branch.
- **REQ-007:** Create path already sends `due_date`; recipient detail path nulls it after by-aspect load. Plan’s “unwired mock” conflicts with current FE — raised, not resolved.
- **REQ-008:** Client-side aspect filter keeps schools via `.some()` then still renders all aspects; no backend request expected.
- **REQ-009:** Same school-level collapse; overdue is client-derived from `due_date`, but MAT admin filter incorrectly treats overdue as `not_started`.
- **REQ-011:** Standards cards use `updated_at || new Date()` while list standards contract omits `updated_at`.

## Assumptions made

- Backend evidence endpoints match contract §28–31 on the deployed API (not exercised in browser this session).
- Primary “Ratings page” defect surface for aspect/status is MAT admin `SchoolPerformanceView` (dept-head table is a secondary path).
- REQ-011’s “every standard within every aspect” refers primarily to Standards Management cards, not assessment-detail Updated column (which shows “—” when missing).

## Findings — flagged, not fixed

See Findings section in `docs/milestones/m1-audit-frontend.md` (unmerged evidence branch; REQ-007 plan/code mismatch; localStorage aspect filter restore; overdue predicate; by-aspect due-date/`last_updated` transform).

## What the next session needs to know

- Implementation should be **one commit per REQ** on `sprint-2.0`, message `REQ-00N: …`.
- REQ-006 can start frontend-only by porting evidence client from `claude/review-backend-brief-mjtms`; confirm POST appears before touching backend.
- REQ-007 needs a product/backend answer on create persistence before FE display work; do not workaround with local-only due dates.
- REQ-008 and REQ-009 share the school-vs-aspect filter pattern in `SchoolPerformanceView` but must remain separate commits.
- REQ-011: removing the `new Date()` fallback is safe frontend-only; exposing real timestamps needs a contract change first.

## Verification

Static code and git-history review only. No browser Network tab session in this pass. Claims about missing POST / client-side filters are from call-graph and branch ancestry (`merge-base --is-ancestor` of evidence commits vs HEAD).

---

## Notes for the release summary

*Audit only — no user-facing change.*
