# M1 Frontend Audit — REQ-006 → REQ-009, REQ-011

**Date:** 2026-08-26  
**Branch:** `sprint-2.0`  
**Contract:** `docs/api/assurly-api-contract.md` **v2.5**  
**Plan:** `docs/milestones/assurly-milestone-plan.md` **v2.3**  
**Scope:** Diagnostic only. No application code changed. Contracts and data-model docs not modified.

---

## REQ-006 — Evidence upload not firing

### Current behaviour

On assessment detail, “Supporting Documents” uses `FileUpload` (`assurly-frontend/src/components/ui/file-upload.tsx`). Selecting a file:

1. Builds a local `FileAttachment` with a random client id and `uploadedAt: new Date().toISOString()`.
2. Calls `onFilesChange` → `handleAttachmentsChange` in `AssessmentDetail.tsx`, which only updates React state.
3. **Never constructs `FormData`, never calls `apiClient`, never hits `POST /evidence/upload`.**

There is no evidence service, no `EvidenceModal`, and no `/evidence/*` client on this branch. Navigating away clears the in-memory attachments; reload correctly shows nothing attached. That matches “no logged POST”.

### Root cause

**Confidence: high.**

The upload request is not dispatched at all. The live UI is a client-only mock.

A working client did exist: commit `8676c15` (`Feature: frontend-requirements v1`) added `EvidenceModal.tsx`, `evidence-service.ts` (`POST /evidence/upload` multipart), and `types/evidence.ts`. Follow-ups on the same line (`e268686`, `215e19a`, `e1f7d3a`) wired counts and download into `AssessmentDetail`. Those commits live only on branch `claude/review-backend-brief-mjtms` and are **not ancestors of `main` or `sprint-2.0`**. On the programme branch, the pre-integration `FileUpload` + `attachments` state remains.

Contract §28–31 document live evidence endpoints under `/evidence/...`. Backend support is assumed present per contract; the frontend gap alone explains the missing POST.

### Files / components affected

| Path | Role |
|---|---|
| `assurly-frontend/src/components/ui/file-upload.tsx` | Local-only file picker; no network |
| `assurly-frontend/src/pages/AssessmentDetail.tsx` | `attachments` / `handleAttachmentsChange` / `FileUpload` wiring |
| *Missing on branch:* `EvidenceModal.tsx`, `services/evidence-service.ts`, `types/evidence.ts` | Working implementation on unmerged branch |

### Proposed fix

Restore (or re-port) the evidence client from `claude/review-backend-brief-mjtms`: `evidence-service` → `POST /evidence/upload`, `GET /evidence/{mat_standard_id}`, delete/link as per contract; replace `FileUpload` mock with `EvidenceModal` (or equivalent) keyed by `mat_standard_id`, `school_id`, `unique_term_id`; load/list on open and refresh counts after close.

### Blast radius

Assessment detail edit/read paths only. Rating save / bulk-update unchanged. Dashboard `evidence_count` already assumes real evidence rows once uploads work.

### Backend / contract change required?

**No** — if backend matches contract §28–31. Frontend-only restore. If upload still fails after a real POST lands in network logs, escalate to backend/GCS (out of this audit’s frontend scope).

---

## REQ-007 — Request a Rating: due date

### Current behaviour

`AssessmentInvitationSheet` is a real sheet (not a dead stub). It includes a custom `SimpleDatePicker`, holds `dueDate` in state, and on send calls:

```ts
createAssessments({ ..., due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined, ... })
```

`assessment-service.createAssessments` includes `due_date` in `POST /api/assessments`. Contract §22 accepts optional `due_date`; data model has `assessments.due_date`.

**Recipient surfaces today:**

| Surface | Behaviour |
|---|---|
| Dept-head Ratings table (`Assessments.tsx`) | Renders `assessment.due_date` from grouped list (`transformAssessmentGroup` preserves API `due_date`) |
| Assessment detail header | Reads `assessment.dueDate`; shows “No due date” when absent |
| Detail load via group id (`useAssessment` → by-aspect) | `transformAssessmentByAspectToAssessment` **hardcodes** `due_date: null` / `dueDate: undefined`, discarding per-standard `due_date` from contract §23 |
| MAT admin school expand (`SchoolPerformanceView`) | Stores `dueDate` on category rows; expanded aspect table does not surface due date |

### Root cause

**Confidence: medium** (frontend wiring is partial; “mock / never wired” in the plan does not match current FE send path).

Frontend **does** send `due_date` on create. Gaps are on the read/display path for the primary recipient flow (detail opened by group id), and possibly backend persistence (not verified in this frontend-only pass).

**Raised discrepancy:** plan REQ-007 says the selector is a mock and nothing was ever wired. Current code sends `due_date` on create. Contract wins for shape; product should confirm whether the defect is “create never persisted” (backend) vs “create works but recipient never sees it” (frontend transform/UI).

### Files / components affected

| Path | Role |
|---|---|
| `assurly-frontend/src/components/AssessmentInvitationSheet.tsx` | Date UI + create payload |
| `assurly-frontend/src/services/assessment-service.ts` | `createAssessments` includes `due_date` |
| `assurly-frontend/src/hooks/use-assessments.ts` | `transformAssessmentByAspectToAssessment` nulls due date |
| `assurly-frontend/src/pages/AssessmentDetail.tsx` | Header Due Date display |
| `assurly-frontend/src/pages/Assessments.tsx` | List due date column (dept-head) |
| `assurly-frontend/src/lib/data-transformers.ts` | Group transform keeps `due_date` |

### Proposed fix

1. Confirm with backend audit that `POST /api/assessments` persists `due_date` and that list/by-aspect return it.
2. Frontend: stop nulling due date in `transformAssessmentByAspectToAssessment` (derive group-level due date from standards’ `due_date`, matching list semantics).
3. Ensure recipient UI shows it on detail (and optionally MAT admin aspect rows). Replace or keep `SimpleDatePicker` as polish only.

### Blast radius

Invitation sheet, assessment list/detail transforms, overdue derivation (`isOverdue` uses `due_date`).

### Backend / contract change required?

**Possibly.** Schema/column and create contract already allow `due_date`. If create does not persist or by-aspect omits `due_date`, that is a backend defect — do not invent a client-only store. If persistence works, frontend-only transform/UI fix.

---

## REQ-008 — Aspect filter on the Ratings page

### Current behaviour

Aspect filtering is **entirely client-side**. `useAssessments` / `getAssessments()` are called **without** `aspect_code` (or other filter query params). Changing the Aspects multi-select does not trigger a new network request — consistent with an empty Network tab for that control.

**MAT admin path** (`SchoolPerformanceView`, the main Ratings surface for `mat-admin`):

```ts
matchesCategory = activeFilters.category.some(category =>
  school.assessmentsByCategory.some(cat => cat.category === category)
);
```

That keeps **schools** that have the selected aspect, then the expanded table still maps **all** `school.assessmentsByCategory` with no category filter applied. Result: nearly every school remains visible (most have every aspect), and expanding still shows every aspect — “everything for every school”.

**Dept-head path** (`Assessments.tsx`): filters rows with `activeFilters.category.includes(assessment.category)`. That path is row-per-(school, aspect) and can work if values align; MAT admin collapse is the distinctive failure mode.

Contract §21 does accept `aspect_code` as an optional server filter; the Ratings UI simply does not use it.

### Root cause

**Confidence: high.**

Broken client-side predicate / presentation scope — not a missing request. Unlike school/performance filters (naturally school-scoped), aspect must constrain **aspect rows inside schools**, not only school inclusion. Current code only does school inclusion via `.some()`, then renders unfiltered aspect children.

### What is different from filters that work

| Filter | Level applied | Effect on expanded aspects |
|---|---|---|
| School | School id | Correct |
| Performance | School score | Correct |
| Status | School kept if any aspect matches (also wrong — REQ-009) | All aspects still shown |
| **Aspect** | School kept if any aspect matches | **All aspects still shown** — same collapse pattern, wrong for an aspect dimension |

### Files / components affected

| Path | Role |
|---|---|
| `assurly-frontend/src/components/SchoolPerformanceView.tsx` | `matchesCategory`; expanded `assessmentsByCategory.map` unfiltered |
| `assurly-frontend/src/pages/Assessments.tsx` | Dept-head category filter + legacy category value map |
| `assurly-frontend/src/lib/data-transformers.ts` | `aspectCodeToCategory` for `assessment.category` |
| `assurly-frontend/src/services/assessment-service.ts` | Supports `aspect_code` query param; unused by list hook |

### Proposed fix

Client-side (preferred for this page’s current architecture): when aspect filters are active, (1) keep schools that have a matching aspect, and (2) **filter `assessmentsByCategory` (and expanded rows) to matching aspects only**. Align filter option values with `assessment.category` (legacy map vs raw code) in one place.

Optional later: pass `aspect_code` to `GET /api/assessments` — not required to fix the observed bug if client filtering is corrected.

### Blast radius

Ratings filters and expanded aspect tables only. No write APIs.

### Backend / contract change required?

**No.**

---

## REQ-009 — Status filter operates at the wrong level

### Current behaviour

On MAT admin Ratings (`SchoolPerformanceView`):

1. Rows are **schools**. Aspects are nested under expand.
2. Status filter:

```ts
school.assessmentsByCategory.some(cat => { switch (status) { ... } })
```

A school is included if **any** aspect matches; expanded UI still lists **every** aspect. Mixed schools are not split by status.

3. School-level status is also collapsed via `calculateSchoolStatus(...)` when building from assessments, and dashboard overlay sets `status: dash.status` (school-level from `GET /api/dashboard/schools`).

4. **Overdue:** not returned as an API status. Contract list/group status is `not_started` \| `in_progress` \| `completed` only. Client helper `isOverdue` in `utils/assessment.ts` derives overdue as: has `due_date`, status not completed/approved, and `new Date() > due_date`.

   In `SchoolPerformanceView` status filter, overdue is **wrongly** implemented as `cat.status === "not_started"` (comment: “derived, not stored”) — it does **not** call `isOverdue` / check `dueDate`. Dept-head `Assessments.tsx` correctly uses `isOverdue(assessment)`.

### Root cause

**Confidence: high** for school-vs-aspect collapse; **high** that overdue is client-derived; **high** that MAT admin overdue filter predicate is incorrect.

Collapse happens in `filteredSchoolData` (school `.some` + unfiltered aspect render) and in `calculateSchoolStatus` / dashboard `dash.status` for school badge semantics.

### Files / components affected

| Path | Role |
|---|---|
| `assurly-frontend/src/components/SchoolPerformanceView.tsx` | Status filter; school collapse; broken overdue case |
| `assurly-frontend/src/lib/assessment-utils.tsx` | `calculateSchoolStatus` |
| `assurly-frontend/src/utils/assessment.ts` | `isOverdue` / `getDisplayStatus` |
| `assurly-frontend/src/pages/Assessments.tsx` | Dept-head status filter (aspect-row level; uses `isOverdue`) |

### Proposed fix

When status filters are active, filter **aspect rows** (same pattern as REQ-008), and include the school if any remaining aspect matches. Use `isOverdue({ status, due_date })` for overdue — not `status === "not_started"`. Decide product behaviour for school header badge when filters are active (show filtered subset vs collapsed school status).

### Blast radius

Ratings status filter and overdue badges/counts. Interacts with REQ-007 if due dates are missing (overdue never true).

### Backend / contract change required?

**No** for per-aspect filtering. Overdue remains client-derived unless product later adds an API status (would be a contract change — not required to meet current REQ-009 wording).

---

## REQ-011 — “Updated” date always reports today

### Current behaviour

On **Standards management** cards (`SortableStandardCard.tsx`):

```ts
Updated {format(new Date(standard.updated_at || new Date()), 'MMM d, yyyy')}
```

If `updated_at` is missing/undefined, **`new Date()` is today**. Contract §13 `GET /api/standards` response shape does **not** include `updated_at` (fields stop at version metadata). Data model has `mat_standards.updated_at`, but the list contract does not expose it. Frontend therefore almost always falls through to today — matching “every standard … displays today’s date”.

**Assessment detail** “Updated” column uses `s.last_updated || s.updated_at || s.updatedAt` and shows “—” when absent — does not fabricate today. Group-level `last_updated` in `transformAssessmentByAspectToAssessment` falls back to `new Date().toISOString()` when no standard timestamps exist (separate, aspect-header risk).

### Root cause

**Confidence: high** for Standards Management (primary reading of the requirement).

Date is **generated client-side** when the returned field is absent, via `|| new Date()`. Not “API always returns today” from the frontend’s perspective — the list contract omits the field, so the fallback fires.

### Files / components affected

| Path | Role |
|---|---|
| `assurly-frontend/src/components/admin/standards/SortableStandardCard.tsx` | `updated_at \|\| new Date()` |
| `assurly-frontend/src/types/assessment.ts` | Optional `updated_at` on `Standard` |
| `docs/api/assurly-api-contract.md` §13 | List standards response lacks `updated_at` |
| `assurly-frontend/src/hooks/use-assessments.ts` | Group `last_updated` today-fallback (adjacent) |

### Proposed fix

1. Stop using `new Date()` as display fallback — show “—” / “Unknown” when absent.
2. If product needs real update times on standards admin: **contract + backend** must return `updated_at` (and/or version effective dates) on `GET /api/standards`; then bind the card to that field only.

### Blast radius

Standards admin cards; optionally assessment header if group fallback is cleaned up. M6 timestamp trust depends on not fabricating dates.

### Backend / contract change required?

**Yes, if real timestamps must display.** Frontend can stop lying without a contract change (show empty). Surfacing true `updated_at` requires contract §13 (and implementation) to include the field. Do not invent timestamps client-side.

---

## Findings — flagged, not fixed

1. **Evidence working tree never merged** into `main` / `sprint-2.0` (`claude/review-backend-brief-mjtms` only). Programme branch never had the live upload client.
2. **REQ-007 plan vs code:** plan calls the due-date control an unwired mock; FE already POSTs `due_date`. Needs product/backend confirmation before implementation.
3. **Dept-head filter restore bug** (`Assessments.tsx`): localStorage validation compares saved category values to raw aspect codes (`edu`), while options use legacy names (`education`) — restored aspect filters are stripped.
4. **SchoolPerformanceView overdue filter** equates overdue with `not_started` — incorrect even after per-aspect filtering is fixed unless `isOverdue` is used.
5. **`transformAssessmentByAspectToAssessment`** also nulls `due_date` and invents group `last_updated` when standards lack timestamps.
6. **`project-structure.md`** still descriptive/out of date (DOC-002); not used as authority for this audit.

---

## Stop

Audit complete. No application code, contract, or data-model changes made. Implementation awaits per-requirement briefs and sequencing (backend gate where noted).
