# Assurly — Backend Implementation Brief (April 2026)

> **Audience:** Claude Code, implementing FastAPI/Pydantic/MySQL changes on the Assurly backend.
>
> **Companion reference:** `assurly-data-model.md` is the source of truth for the schema. Read it first if unsure about a column, constraint, or relationship. This brief assumes familiarity with it.
>
> **Stack:** FastAPI (Python), Pydantic, MySQL 8, GCP Cloud Run (`europe-west2`), project `assurly-455412`. GCS bucket for evidence is already provisioned in `europe-west2`.
>
> **Status:** All DB schema changes for these four REQs have already been applied manually. No further DDL is required. Scope of this brief is API layer, Pydantic models, and endpoint logic only.

---

## Table of contents

1. [Global conventions and constraints](#1-global-conventions-and-constraints)
2. [REQ-002 — Expose `actions` field via API](#2-req-002--expose-actions-field-via-api)
3. [REQ-003 — Evidence file upload endpoints](#3-req-003--evidence-file-upload-endpoints)
4. [REQ-004 — Rating scale audit and RAG polarity](#4-req-004--rating-scale-audit-and-rag-polarity)
5. [REQ-005 — Dashboard view filter (Trust / School)](#5-req-005--dashboard-view-filter-trust--school)
6. [Acceptance criteria — consolidated checklist](#6-acceptance-criteria--consolidated-checklist)

---

## 1. Global conventions and constraints

These apply across all four REQs.

### 1.1 MAT isolation

Every endpoint that reads or writes data tied to a MAT **must**:

1. Derive `mat_id` from the authenticated user's session (session-based auth is live).
2. Apply `WHERE mat_id = :session_mat_id` (or equivalent join) to every query.
3. For operations on child entities, verify the entity's owning MAT matches the session MAT before proceeding.

Never accept `mat_id` as a request parameter from the frontend without cross-checking it against the session.

### 1.2 Column name: `last_updated` (not `updated_at`)

The `assessments` table uses `last_updated` as its "updated at" column — unlike most other tables which use `updated_at`. Don't normalise it in responses unless frontend already expects one or the other.

### 1.3 Soft-delete and archive-rename filtering

Queries listing `mat_standards` for user-facing purposes must filter:

```sql
WHERE is_active = 1
  AND mat_standard_id NOT LIKE '%-deleted-%'
```

### 1.4 British English spelling

All user-facing strings (error messages, response messages) use British English (`organisation`, `colour`).

### 1.5 Rating integrity (relevant for REQ-002, REQ-004)

`assessments.rating` is enforced by the DB-level CHECK constraint `chk_rating_range`: allowed values are NULL or integers 1–4. Keep Pydantic validation aligned:

```python
rating: Optional[int] = Field(default=None, ge=1, le=4)
```

---

## 2. REQ-002 — Expose `actions` field via API

### Context
The `actions` column (`TEXT NULL`) already exists in production on `assessments`, positioned after `evidence_comments`. It needs to be readable and writable via the API.

### Tasks

1. **Pydantic models.** In every response and request model that currently includes `evidence_comments`, add `actions: Optional[str] = None` alongside it. Mirror the nullability and default behaviour of `evidence_comments` exactly.

2. **SELECT queries.** In every query that returns `evidence_comments`, also return `actions`. This includes:
   - The main assessment GET endpoint(s).
   - The dashboard summary endpoint (same endpoint REQ-005 touches — coordinate).
   - Any backing query for `v_assessments_full` (the view is deprecated per the data model doc; if the endpoint uses raw joins, just add `actions` to the column list).

3. **UPSERT logic.** The assessments UPSERT endpoint must accept `actions` in the request body and persist it on both INSERT and UPDATE branches, handling NULL correctly (an omitted field should not overwrite an existing value to NULL — follow whatever pattern `evidence_comments` already uses).

### Acceptance
- GET endpoints that return `evidence_comments` now also return `actions`.
- UPSERT endpoint accepts and persists `actions` correctly on both create and update.
- No regression to `evidence_comments` behaviour.
- Pydantic models reflect `actions` as `Optional[str]`.

---

## 3. REQ-003 — Evidence file upload endpoints

### Context
The `standard_evidence` table is live. The GCS bucket is provisioned in `europe-west2`. This work implements four endpoints, wires MAT isolation, and handles GCS interaction.

### Schema recap (see data-model §17 for full details)

Key columns on `standard_evidence`:
- `id` (CHAR(36), PK) — generate as UUID v4 in application layer.
- `mat_id`, `mat_standard_id`, `school_id`, `unique_term_id` — the four-part scoping tuple.
- `evidence_type` ENUM('file', 'url').
- `file_path` (VARCHAR(1000), nullable) — GCS object path for file evidence.
- `url` (VARCHAR(2000), nullable) — external URL for link evidence.
- `original_filename` (VARCHAR(500), nullable) — preserve the uploader's filename for display.
- `uploaded_by` (CHAR(36), NOT NULL) — the user doing the upload. No FK by design (users are soft-deleted, never hard-deleted).
- `created_at` (TIMESTAMP).

Enforcement already in place at DB level:
- `chk_evidence_type_fields` — XOR constraint: if type=file then file_path is set and url is null; and vice versa.
- FKs with CASCADE on parent delete (except terms = RESTRICT).

### GCS convention

- Bucket: a single bucket in `europe-west2` (pre-provisioned — the exact name is available via environment config; do not hardcode).
- Object key format: `{mat_id}/{mat_standard_id}/{sanitised_filename}`.
- Filename sanitisation: strip path separators, control chars, and any characters in `< > : " / \ | ? *`. Preserve UTF-8. Preserve file extension. If collision, append `-<short_uuid>` before the extension.
- Preserve the original uploader-supplied filename in `original_filename`; use the sanitised one in the GCS path.
- Use GCP default service account auth on Cloud Run (no explicit credentials in code).
- Set `Content-Type` from the uploaded file where possible; use `application/octet-stream` as the fallback.

### Endpoints

All endpoints require authentication. All derive `mat_id` from session.

#### 3.1 `POST /evidence/upload`

**Request:** `multipart/form-data`
- `mat_standard_id` (form field, required)
- `school_id` (form field, required)
- `unique_term_id` (form field, required)
- `file` (file upload, required)

**Acceptable file types:** PDF, Word (.doc, .docx), Excel (.xls, .xlsx), images (.png, .jpg, .jpeg, .gif, .webp, .svg). Reject anything else with 415.

**Size limit:** 25 MB per file. Reject with 413 if exceeded.

**Logic:**
1. Validate MAT isolation: confirm `mat_standard_id` belongs to session's MAT (`SELECT 1 FROM mat_standards WHERE mat_standard_id = :id AND mat_id = :session_mat_id`). 403 if not.
2. Validate `school_id` belongs to session's MAT, and `unique_term_id` exists in `terms`. 400 if either fails.
3. Validate file type and size.
4. Upload to GCS at `{mat_id}/{mat_standard_id}/{sanitised_filename}`.
5. Insert row: `evidence_type='file'`, `file_path=<gcs_object_path>`, `url=NULL`, `original_filename=<uploader_supplied>`, `uploaded_by=<session_user_id>`.
6. Return 201 with the full evidence record (shape in §3.5).

**Error handling:** if GCS upload succeeds but DB insert fails, delete the GCS object before returning 500. (Simpler to implement as: upload to GCS first; if DB insert fails, best-effort delete the object and log if that also fails.)

#### 3.2 `POST /evidence/link`

**Request:** `application/json`
```json
{
  "mat_standard_id": "HLT-AC1",
  "school_id": "ermine-primary-academy",
  "unique_term_id": "T1-2025-26",
  "url": "https://docs.google.com/document/d/abc123"
}
```

**Logic:**
1. Validate MAT isolation (same as 3.1).
2. Validate URL: must start with `https://` (reject `http://` — we don't store unencrypted links); max length 2000 chars. 400 on failure.
3. Insert row: `evidence_type='url'`, `file_path=NULL`, `url=<submitted>`, `original_filename=NULL`, `uploaded_by=<session_user_id>`.
4. Return 201 with the full evidence record.

#### 3.3 `GET /evidence/{mat_standard_id}`

**Query params:**
- `school_id` (required)
- `unique_term_id` (required)

Filtering by all three scoping fields returns just the evidence list for that specific assessment cell.

**Logic:**
1. Validate MAT isolation: the `mat_standard_id` must belong to session's MAT.
2. Return the evidence rows, newest first.

**Response shape:** array of evidence records (see §3.5).

#### 3.4 `DELETE /evidence/{evidence_id}`

**Logic:**
1. Fetch the row. 404 if not found.
2. Validate MAT isolation: `row.mat_id` must equal `session_mat_id`. 403 if not. **Do this check even on 404 detection to avoid leaking existence** — if row not found OR not in session's MAT, return 404 either way (don't differentiate).
3. If `evidence_type = 'file'`, delete the GCS object. Log but don't fail if GCS delete returns 404 (object already gone).
4. Delete the DB row.
5. Return 204.

#### 3.5 Evidence record response shape

```json
{
  "id": "uuid",
  "mat_standard_id": "HLT-AC1",
  "school_id": "ermine-primary-academy",
  "unique_term_id": "T1-2025-26",
  "evidence_type": "file",
  "file_path": "HLT/HLT-AC1/my-document.pdf",
  "url": null,
  "original_filename": "My Document.pdf",
  "uploaded_by": "user10",
  "uploaded_by_name": "Richard Briggs",
  "created_at": "2026-04-20T14:32:01Z",
  "download_url": "https://storage.googleapis.com/..."
}
```

Notes:
- `uploaded_by_name` is joined from `users.full_name`. If user is soft-deleted, return their name anyway — historical attribution matters.
- `download_url` is a **signed URL** for file evidence, valid for 15 minutes. For URL evidence, return the `url` field and omit `download_url`. Generate lazily on response serialisation — don't store signed URLs.

### Evidence count (for REQ-005 dashboard integration)

Frontend needs a way to know how many evidence items exist per assessment cell, to render the `Files` column indicator. Two options:

**Option A (preferred):** extend the dashboard summary endpoint to include `evidence_count` per row via a LEFT JOIN aggregate:

```sql
LEFT JOIN (
  SELECT mat_standard_id, school_id, unique_term_id, COUNT(*) AS evidence_count
  FROM standard_evidence
  WHERE mat_id = :session_mat_id
  GROUP BY mat_standard_id, school_id, unique_term_id
) ev ON ev.mat_standard_id = a.mat_standard_id
  AND ev.school_id = a.school_id
  AND ev.unique_term_id = a.unique_term_id
```

**Option B (fallback):** dedicated `GET /evidence/count` endpoint returning `{mat_standard_id, school_id, unique_term_id, count}` tuples for the current MAT. Only implement if Option A creates a performance problem (it shouldn't — the index `idx_evidence_lookup` covers this query).

### Acceptance
- `standard_evidence` table is used correctly (don't add new columns, don't bypass the XOR CHECK).
- All four endpoints return correct HTTP status codes.
- MAT isolation enforced on every endpoint, including 404-before-403 pattern on DELETE.
- GCS objects land under `{mat_id}/{mat_standard_id}/{sanitised_filename}`.
- Signed URLs in responses are 15-minute expiry.
- The dashboard summary endpoint includes `evidence_count` per row.

---

## 4. REQ-004 — Rating scale audit and RAG polarity

### Context
Three things here:
1. The DB constraint `chk_rating_range` already enforces 1–4. No schema change needed.
2. Pydantic validation needs to align.
3. There's an audit task: **check whether any backend code computes RAG colour**, and if so, ensure it uses `standard_type` polarity correctly.

### Tasks

#### 4.1 Pydantic validation alignment

In every request/response model that includes `rating`:

```python
rating: Optional[int] = Field(default=None, ge=1, le=4)
```

Remove any legacy references to string labels (`'Outstanding'`, `'Good'`, `'Requires Improvement'`, `'Inadequate'`, `'Exceptional'`). Rating values are integers only throughout the API surface.

If any endpoint currently accepts string labels for backwards compatibility, that code should be deleted — the frontend is being updated to send integers only.

#### 4.2 RAG polarity audit

Per the data model doc, RAG polarity depends on `mat_standards.standard_type`:
- `assurance`: `4`=green, `3`=amber-green, `2`=amber, `1`=red.
- `risk`: `4`=red, `3`=amber, `2`=amber-green, `1`=green.

**Audit task:** search the codebase for any backend-side RAG computation. Likely locations:
- Anything involving the word `rag`, `status_colour`, `traffic_light`, or similar.
- Anywhere `rating` is mapped to a string or colour.
- The dashboard summary endpoint's aggregation logic.

If no such code exists (RAG entirely computed client-side): no change.

If such code exists: ensure every function computing RAG takes `standard_type` as an input and inverts polarity for `'risk'` standards. Assuming `assurance` polarity silently is wrong — 17 of 167 current mat_standards are `risk` and will show incorrect colours.

Include `standard_type` in every API response that returns a rating where the frontend might render a colour. It's already in `mat_standards`; just ensure the JOIN and projection carry it through.

#### 4.3 Remove legacy "Exceptional" references

Grep the codebase for `Exceptional`, `5` used as a rating literal, or any `Enum.EXCEPTIONAL` kind of construct. Remove these entirely. The value has been purged from data, the DB rejects it, and the frontend no longer supports it. Leaving stale constants invites regression.

### Acceptance
- Every Pydantic model validates rating as `Optional[int]`, `ge=1`, `le=4`.
- No backend code references the string labels or "Exceptional".
- If backend RAG logic exists, it takes `standard_type` and handles both polarities.
- Every endpoint returning a rating value also returns the `standard_type` of the corresponding mat_standard, so the frontend can compute RAG correctly.

---

## 5. REQ-005 — Dashboard view filter (Trust / School)

### Context
The dashboard summary endpoint needs a `view` query parameter that filters assessments by the school's `is_central_office` flag.

### Tasks

#### 5.1 Add `view` query parameter

```
GET /dashboard/summary?view=school|trust&...
```

- `view=school` → return assessments where `schools.is_central_office = 0`.
- `view=trust` → return assessments where `schools.is_central_office = 1`.
- Omitted → default to `school`.

Pydantic validation: `view: Literal['school', 'trust'] = 'school'`.

#### 5.2 Apply filter in the query

Extend the existing dashboard query:

```sql
SELECT ...
FROM assessments a
JOIN schools s ON s.school_id = a.school_id
JOIN mat_standards ms ON ms.mat_standard_id = a.mat_standard_id
JOIN mat_aspects   ma ON ma.mat_aspect_id   = ms.mat_aspect_id
WHERE s.mat_id = :session_mat_id                     -- MAT isolation
  AND s.is_central_office = :is_central_office_flag  -- view filter
  AND a.unique_term_id = :term_id
  AND ms.is_active = 1
  AND ms.mat_standard_id NOT LIKE '%-deleted-%'
ORDER BY ma.sort_order, ms.sort_order;
```

Where `:is_central_office_flag` is `0` when `view=school`, `1` when `view=trust`.

#### 5.3 Response payload additions

Include on each school object in the response:
- `is_central_office` (bool)
- `school_type` (string — may be `primary`, `secondary`, `all_through`, `special`, `central`)

This lets the frontend client-side-filter or style differently if needed without another round trip.

#### 5.4 Response shape considerations for Trust view

In `view=trust`, there is **one central office school** per MAT. The response structure can stay identical to `view=school` (the frontend will render per-school-comparative columns conditionally — that's the frontend's job, not the backend's). Don't collapse or reshape the response based on `view`.

#### 5.5 Integration with REQ-002 and REQ-003

The dashboard summary endpoint is the same one touched by:
- **REQ-002** (add `actions` to the SELECT projection and response model).
- **REQ-003** (add `evidence_count` via LEFT JOIN aggregate).

Coordinate so all three changes land together. Do not ship the endpoint three separate times.

### Acceptance
- `?view=school` returns only assessments where `schools.is_central_office = 0`.
- `?view=trust` returns only assessments where `schools.is_central_office = 1`.
- Omitting `view` defaults to school behaviour.
- MAT isolation is maintained — the `mat_id` filter is applied alongside the `view` filter, not replaced by it.
- Each school object in the response includes `is_central_office` and `school_type`.
- The endpoint also returns `actions` (REQ-002) and `evidence_count` (REQ-003).

---

## 6. Acceptance criteria — consolidated checklist

### REQ-002 (actions field)
- [ ] Every Pydantic response model that includes `evidence_comments` also includes `actions: Optional[str] = None`.
- [ ] Every SELECT query returning `evidence_comments` also returns `actions`.
- [ ] UPSERT endpoint accepts and persists `actions` on both create and update.
- [ ] No regression to `evidence_comments`.

### REQ-003 (evidence endpoints)
- [ ] `POST /evidence/upload` working — multipart form, file validation, GCS upload, DB insert, 201 with record.
- [ ] `POST /evidence/link` working — JSON body, https:// validation, DB insert, 201 with record.
- [ ] `GET /evidence/{mat_standard_id}?school_id=&unique_term_id=` returns array of records newest first.
- [ ] `DELETE /evidence/{evidence_id}` works, deletes GCS object, returns 204.
- [ ] MAT isolation enforced on all four endpoints (with 404-before-403 on DELETE).
- [ ] Signed URLs for file evidence in GET responses (15-minute expiry).
- [ ] Dashboard summary endpoint includes `evidence_count` per row.
- [ ] GCS object paths are `{mat_id}/{mat_standard_id}/{sanitised_filename}`.

### REQ-004 (rating scale)
- [ ] Every Pydantic rating field is `Optional[int]`, `ge=1`, `le=4`.
- [ ] Legacy string labels removed from backend code.
- [ ] "Exceptional" and `5` rating literals removed from backend code.
- [ ] `standard_type` is included in every API response where the frontend might render RAG.
- [ ] Any backend RAG computation takes `standard_type` and correctly inverts polarity for `risk`.

### REQ-005 (dashboard view)
- [ ] Endpoint accepts `view` query param, validated as `'school' | 'trust'`, defaulting to `'school'`.
- [ ] Filter applied as `schools.is_central_office = 0|1` in the query.
- [ ] MAT isolation maintained alongside the view filter.
- [ ] Response includes `is_central_office` and `school_type` on school objects.
- [ ] Endpoint ships with REQ-002 (`actions`) and REQ-003 (`evidence_count`) changes together.
