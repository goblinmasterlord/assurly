# Assurly API Contract

**Status:** Authoritative. Both backend (Claude Code) and frontend (Cursor) reference this doc.
**Version:** v1
**Backend base URL:** `http://localhost:8000` (local) / `https://assurly-frontend-400616570417.europe-west2.run.app` (Cloud Run production)

This document defines every HTTP endpoint the frontend calls. If the frontend needs a shape that isn't here, the fix is to **update this doc first**, then code follows. If the backend diverges from what's here, it's a backend bug.

---

## Conventions

### Authentication — magic-link + JWT Bearer

Assurly uses passwordless magic-link authentication. The full flow:

1. Frontend `POST`s the user's email to `/api/auth/request-magic-link`.
2. Backend generates a short-lived token, stores it on the `users` row (`magic_link_token`, `token_expires_at`), and emails the user a link.
3. User clicks the link → frontend calls `GET /api/auth/verify/{token}`.
4. Backend validates the token, clears it from the DB, creates a JWT, and returns it alongside the `UserResponse`.
5. Frontend stores the JWT and sends it on every subsequent request as `Authorization: Bearer <token>`.

**JWT payload** includes `sub` (user_id), `email`, `mat_id`, `school_id`, `exp`, `iat`. Tokens expire after 1 hour.

**All endpoints except `/api/auth/request-magic-link`, `/api/auth/verify/{token}`, and `/api/terms` require a valid Bearer token.** Unauthenticated requests receive `401`.

### MAT isolation

Every authenticated endpoint derives `mat_id` from the JWT — never from a client-supplied parameter. All queries filter by `mat_id`. If a resource belongs to a different MAT, the backend returns `403` or `404` (depending on the endpoint — see individual specs). The frontend never sends `mat_id`; it's implicit.

### Error envelope

All 4xx and 5xx responses use FastAPI's default shape:

```json
{
  "detail": "Human-readable error message"
}
```

`detail` is always a string. Some validation errors (Pydantic) return `detail` as an array of objects — these come from FastAPI's built-in validation and are not customised.

> **Future improvement:** structured error codes (like `{ "code": "assessment_not_found", "message": "..." }`) would improve frontend error handling. Not in scope for current work — this is a refactor decision, not a doc decision.

### British English

All user-facing strings — error messages, response messages, field descriptions — use British English (`organisation`, `colour`, `behaviour`).

### Timestamps

All timestamps are ISO 8601 UTC: `2026-04-20T14:32:01Z`. The backend stores timestamps as MySQL `TIMESTAMP` (UTC). The frontend handles UK timezone display.

### Pagination

No pagination exists today. All list endpoints return the full result set. Datasets are small (~12 schools, ~167 standards per MAT). Pagination will be added if/when data volumes require it.

### Rating scale

Ratings are integers, strictly **1–4**, enforced by DB CHECK constraint `chk_rating_range`. `null` means "not yet rated". There is no rating 5. The former "Exceptional" (5) value was purged in April 2026.

### `🚧 In-flight` tagging convention

Fields and endpoints tagged `🚧 In-flight — REQ-NNN` are part of the target state but have not yet shipped in the backend. Frontend can build against the target shape; backend will converge to it. Once a REQ ships, the tag is removed and the change log updated.

---

## Endpoints

---

### Auth

#### 1. Request magic link

```
POST /api/auth/request-magic-link
```

**Auth:** none required.

**Request body:**

```json
{
  "email": "admin@harbourlearning.org.uk",
  "redirect_url": "https://www.assurly.co.uk/dashboard"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string (email) | yes | |
| `redirect_url` | string | no | Where to send the user after login. Appended to the magic link URL. |

**Response 200:**

```json
{
  "message": "If this email is registered, you'll receive a login link shortly.",
  "email": "admin@harbourlearning.org.uk",
  "expires_in_minutes": 15,
  "status": "success"
}
```

The response is deliberately identical whether the email exists or not — prevents email enumeration.

**Response 403:** `"Account is disabled. Please contact support."` — user exists but `is_active = 0`.

**Response 500:** `"Failed to send email. Please try again."` — email service failure.

**Frontend notes:**
- Show a generic "check your email" confirmation regardless of the response. Don't distinguish between 200 and 403 in the UI unless the error is explicitly surfaced.

---

#### 2. Verify magic link

```
GET /api/auth/verify/{token}
```

**Auth:** none required.

**Path params:**

| Param | Type | Notes |
|---|---|---|
| `token` | string | The magic link token from the email URL. |

**Response 200:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "user_id": "user10",
    "email": "admin@harbourlearning.org.uk",
    "full_name": "Richard Briggs",
    "role_title": "MAT Administrator",
    "mat_id": "HLT",
    "school_id": "HLT-CENTRAL",
    "is_active": true,
    "last_login": "2026-04-20T14:32:01Z"
  }
}
```

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `access_token` | string | no | JWT. Store this; send as `Authorization: Bearer <token>` on all subsequent requests. |
| `token_type` | string | no | Always `"bearer"`. |
| `expires_in` | integer | no | Seconds until expiry. Currently 3600 (1 hour). |
| `user` | UserResponse | no | See UserResponse shape below. |

**Response 401:** `"Invalid or expired magic link"` — token not found in DB.
**Response 401:** `"Magic link has expired. Please request a new one."` — token found but past `token_expires_at`.
**Response 403:** `"Account is disabled. Please contact support."` — user inactive.

**Frontend notes:**
- On success, store `access_token`, redirect to the dashboard (or `redirect_url` if provided during request).
- On 401, show "Link expired" with a button to request a new one.

---

#### 3. Get current user

```
GET /api/auth/me
Authorization: Bearer <token>
```

**Auth:** required.

**Response 200:** `UserResponse`

```json
{
  "user_id": "user10",
  "email": "admin@harbourlearning.org.uk",
  "full_name": "Richard Briggs",
  "role_title": "MAT Administrator",
  "mat_id": "HLT",
  "school_id": "HLT-CENTRAL",
  "is_active": true,
  "last_login": "2026-04-20T14:32:01Z"
}
```

**UserResponse shape** (reused across auth endpoints):

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `user_id` | string | no | Mixed formats — see data model §2.1. |
| `email` | string | no | |
| `full_name` | string | yes | |
| `role_title` | string | yes | Free-text job title. All current users are `"MAT Administrator"`. Not a permission role. |
| `mat_id` | string | no | 3-letter MAT code. |
| `school_id` | string | yes | `null` for MAT-wide users. Today all active users point at their central office. |
| `is_active` | boolean | no | |
| `last_login` | string (ISO 8601) | yes | `null` if user has never logged in. |

**Response 401:** `"Authentication required"` or `"Invalid or expired token"`.

**Frontend notes:**
- This is the endpoint `auth-service.ts` calls to validate the session on page load. Use it, not `/api/users/me`.

---

#### 4. Logout

```
POST /api/auth/logout
Authorization: Bearer <token>
```

**Auth:** required.

**Response 200:**

```json
{
  "message": "Successfully logged out. Please remove the token from your client.",
  "status": "success"
}
```

**Frontend notes:**
- Logout is stateless on the backend (JWT-based). The frontend must delete the stored token. The backend does not invalidate the JWT — it remains valid until expiry. This is acceptable for the current user base.

---

### Schools

#### 5. List schools

```
GET /api/schools
Authorization: Bearer <token>
```

**Auth:** required.

**Query params:**

| Param | Type | Default | Notes |
|---|---|---|---|
| `include_central` | boolean | `false` | If `true`, includes the MAT central office row in results. |

**Response 200:**

```json
[
  {
    "school_id": "cedar-park-primary",
    "school_name": "Cedar Park Primary",
    "school_type": "primary",
    "is_central_office": 0,
    "is_active": 1
  },
  {
    "school_id": "HLT-CENTRAL",
    "school_name": "Harbour Learning Trust Central",
    "school_type": "central",
    "is_central_office": 1,
    "is_active": 1
  }
]
```

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `school_id` | string | no | Slug or code. |
| `school_name` | string | no | |
| `school_type` | string | no | One of `primary`, `secondary`, `all_through`, `special`, `central`. |
| `is_central_office` | integer (0/1) | no | `1` = MAT central office. Exactly one per MAT. |
| `is_active` | integer (0/1) | no | Always `1` in this response (inactive schools are filtered out). |

**Frontend notes:**
- `is_central_office` and `is_active` are returned as integers (`0`/`1`), not booleans. Coerce to boolean in TypeScript if needed.
- Default behaviour excludes central office. Pass `include_central=true` when the Trust view needs the central office row.

---

### Aspects

#### 6. List MAT aspects

```
GET /api/aspects
Authorization: Bearer <token>
```

**Auth:** required.

**Query params:**

| Param | Type | Default | Notes |
|---|---|---|---|
| `aspect_category` | string | — | Optional. `"ofsted"` or `"operational"`. |

**Response 200:**

```json
[
  {
    "mat_aspect_id": "HLT-EDU",
    "mat_id": "HLT",
    "aspect_code": "EDU",
    "aspect_name": "Education",
    "aspect_description": "Education quality and curriculum standards",
    "aspect_category": "ofsted",
    "sort_order": 1,
    "is_custom": 0,
    "is_modified": 0,
    "standards_count": 12
  }
]
```

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `mat_aspect_id` | string | no | `<MAT>-<CODE>` for adopted defaults; UUID for custom. |
| `mat_id` | string | no | |
| `aspect_code` | string | no | Uppercased. |
| `aspect_name` | string | no | |
| `aspect_description` | string | yes | |
| `aspect_category` | string | no | `"ofsted"` or `"operational"`. |
| `sort_order` | integer | no | |
| `is_custom` | integer (0/1) | no | `1` = created from scratch by the MAT. |
| `is_modified` | integer (0/1) | no | `1` = MAT has edited since adoption. |
| `standards_count` | integer | no | Count of active standards under this aspect. |

---

#### 7. Get single aspect

```
GET /api/aspects/{mat_aspect_id}
Authorization: Bearer <token>
```

**Auth:** required.

**Response 200:** same shape as a single item in the list response.

**Response 404:** `"Aspect not found or access denied"`.

---

#### 8. Create aspect

```
POST /api/aspects
Authorization: Bearer <token>
```

**Auth:** required.

**Request body:**

```json
{
  "aspect_code": "SAF",
  "aspect_name": "Safeguarding",
  "aspect_description": "Child protection and safeguarding standards",
  "aspect_category": "ofsted",
  "sort_order": 7,
  "source_aspect_id": null
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `aspect_code` | string | yes | Auto-uppercased by backend. |
| `aspect_name` | string | yes | |
| `aspect_description` | string | no | |
| `aspect_category` | string | no | Default `"operational"`. |
| `sort_order` | integer | no | Default `0`. |
| `source_aspect_id` | string | no | If copying from a default aspect. |

**Response 201:** the created aspect (same shape as GET response).

**Response 404:** `"Source aspect '...' not found"` — invalid `source_aspect_id`.
**Response 409:** `"Aspect with code '...' already exists for your MAT"`.

---

#### 9. Update aspect

```
PUT /api/aspects/{mat_aspect_id}
Authorization: Bearer <token>
```

**Auth:** required.

**Request body:** partial update — only include fields to change.

```json
{
  "aspect_name": "Safeguarding & Wellbeing",
  "sort_order": 8
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `aspect_name` | string | no | |
| `aspect_description` | string | no | |
| `aspect_category` | string | no | |
| `sort_order` | integer | no | |

**Response 200:** the updated aspect.

**Response 400:** `"No fields to update"`.
**Response 404:** `"Aspect not found or access denied"`.

---

#### 10. Delete aspect

```
DELETE /api/aspects/{mat_aspect_id}
Authorization: Bearer <token>
```

**Auth:** required.

**Response 200:**

```json
{
  "message": "Default aspect deactivated",
  "mat_aspect_id": "HLT-EDU",
  "is_custom": false,
  "archived_as": null,
  "can_reinstate": true
}
```

- **Default aspects:** `is_active = 0`, ID preserved, reinstatable.
- **Custom aspects:** archive-renamed (`<id>-deleted-<timestamp>`), not reinstatable.

**Response 404:** `"Aspect not found"`.
**Response 409:** `"Cannot delete aspect because it has N active standards. Delete the standards first."` — must deactivate child standards before deleting the parent aspect.

---

#### 11. Reinstate aspect

```
POST /api/aspects/{mat_aspect_id}/reinstate
Authorization: Bearer <token>
```

**Auth:** required.

**Response 200:**

```json
{
  "message": "Aspect reinstated successfully",
  "mat_aspect_id": "HLT-EDU"
}
```

**Response 400:** `"Aspect is already active"` or `"Custom aspects cannot be reinstated. Create a new aspect instead."`.
**Response 404:** `"Aspect not found"`.

---

#### 12. List inactive aspects

```
GET /api/aspects/inactive
Authorization: Bearer <token>
```

**Auth:** required.

Returns deactivated **default** aspects (not archived customs). Same response shape as the list endpoint.

---

### Standards

#### 13. List MAT standards

```
GET /api/standards
Authorization: Bearer <token>
```

**Auth:** required.

**Query params:**

| Param | Type | Default | Notes |
|---|---|---|---|
| `aspect_code` | string | — | Optional filter. |
| `standard_type` | string | — | Optional. `"assurance"` or `"risk"`. |

**Response 200:**

```json
[
  {
    "mat_standard_id": "HLT-AC1",
    "mat_id": "HLT",
    "standard_code": "AC1",
    "standard_name": "Attendance & Compliance",
    "standard_description": "Monitoring and improving school attendance rates",
    "standard_type": "assurance",
    "sort_order": 1,
    "is_custom": false,
    "is_modified": false,
    "mat_aspect_id": "HLT-EDU",
    "aspect_code": "EDU",
    "aspect_name": "Education",
    "version_id": "HLT-AC1-v1",
    "version_number": 1
  }
]
```

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `mat_standard_id` | string | no | `<MAT>-<CODE>`. |
| `mat_id` | string | no | |
| `standard_code` | string | no | |
| `standard_name` | string | no | |
| `standard_description` | string | yes | |
| `standard_type` | string | no | `"assurance"` or `"risk"`. **Drives RAG polarity** — see data model §2.5. |
| `sort_order` | integer | no | |
| `is_custom` | boolean | no | |
| `is_modified` | boolean | no | |
| `mat_aspect_id` | string | no | |
| `aspect_code` | string | no | |
| `aspect_name` | string | no | |
| `version_id` | string | yes | Current version ID. `null` if no version exists (shouldn't happen). |
| `version_number` | integer | yes | Current version number. |

---

#### 14. Get single standard

```
GET /api/standards/{mat_standard_id}
Authorization: Bearer <token>
```

**Auth:** required.

**Response 200:**

```json
{
  "mat_standard_id": "HLT-AC1",
  "standard_code": "AC1",
  "standard_name": "Attendance & Compliance",
  "standard_description": "...",
  "standard_type": "assurance",
  "sort_order": 1,
  "is_custom": false,
  "is_modified": false,
  "mat_aspect_id": "HLT-EDU",
  "aspect_code": "EDU",
  "aspect_name": "Education",
  "current_version": {
    "version_id": "HLT-AC1-v2",
    "version_number": 2,
    "effective_from": "2026-04-15T09:00:00Z",
    "effective_to": null
  },
  "version_history": [
    {
      "version_id": "HLT-AC1-v2",
      "version_number": 2,
      "standard_name": "Attendance & Compliance",
      "standard_description": "...",
      "effective_from": "2026-04-15T09:00:00Z",
      "effective_to": null,
      "change_reason": "Updated description for clarity",
      "created_by_name": "Richard Briggs"
    },
    {
      "version_id": "HLT-AC1-v1",
      "version_number": 1,
      "standard_name": "Attendance",
      "standard_description": "...",
      "effective_from": "2025-09-01T00:00:00Z",
      "effective_to": "2026-04-15T09:00:00Z",
      "change_reason": "Initial version",
      "created_by_name": null
    }
  ]
}
```

**Response 404:** `"Standard not found or access denied"`.

---

#### 15. Create standard

```
POST /api/standards
Authorization: Bearer <token>
```

**Auth:** required.

**Request body:**

```json
{
  "mat_aspect_id": "HLT-EDU",
  "standard_code": "NW1",
  "standard_name": "New Standard",
  "standard_description": "Description of the new standard",
  "standard_type": "assurance",
  "sort_order": 15,
  "source_standard_id": null
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `mat_aspect_id` | string | yes | Must belong to the user's MAT. |
| `standard_code` | string | yes | |
| `standard_name` | string | yes | |
| `standard_description` | string | no | |
| `standard_type` | string | no | Default `"assurance"`. |
| `sort_order` | integer | no | Default `0`. |
| `source_standard_id` | string | no | If adopting from a default standard. |

**Response 201:** the created standard with version info (same shape as list item).

**Response 404:** `"Aspect not found or access denied"`.
**Response 409:** `"Standard with code '...' already exists for this aspect"`.

---

#### 16. Update standard

```
PUT /api/standards/{mat_standard_id}
Authorization: Bearer <token>
```

**Auth:** required.

Updates a standard's definition by creating a **new version** (immutable history). The previous version's `effective_to` is set to `NOW()`.

**Request body:**

```json
{
  "standard_name": "Updated Name",
  "standard_description": "Updated description",
  "standard_type": "risk",
  "change_reason": "Reclassified as risk standard"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `standard_name` | string | no | Unchanged if omitted. |
| `standard_description` | string | no | |
| `standard_type` | string | no | `"assurance"` or `"risk"`. |
| `change_reason` | string | no | For version history. |

**Response 200:**

```json
{
  "message": "Standard updated successfully",
  "mat_standard_id": "HLT-AC1",
  "new_version_id": "HLT-AC1-v3",
  "version_number": 3,
  "previous_version_id": "HLT-AC1-v2"
}
```

**Response 400:** `"Cannot update inactive standard"`.
**Response 404:** `"Standard not found"`.

---

#### 17. Delete standard

```
DELETE /api/standards/{mat_standard_id}
Authorization: Bearer <token>
```

**Auth:** required.

- **Default standards** (`is_custom = false`): `is_active = 0`, ID preserved, reinstatable.
- **Custom standards** (`is_custom = true`): archive-renamed (`<id>-deleted-<timestamp>`), version IDs also renamed. Not reinstatable.

**Response 200:**

```json
{
  "message": "Custom standard archived",
  "mat_standard_id": "HLT-NW1",
  "is_custom": true,
  "archived_as": "HLT-NW1-deleted-1714200000",
  "can_reinstate": false
}
```

**Response 404:** `"Standard not found"`.

---

#### 18. Reinstate standard

```
POST /api/standards/{mat_standard_id}/reinstate
Authorization: Bearer <token>
```

**Auth:** required.

Only works for default standards (`is_custom = false`) that have been deactivated.

**Response 200:**

```json
{
  "message": "Standard reinstated successfully",
  "mat_standard_id": "HLT-AC1"
}
```

**Response 400:** `"Standard is already active"` or `"Custom standards cannot be reinstated."`.
**Response 404:** `"Standard not found"`.

---

#### 19. List inactive standards

```
GET /api/standards/inactive
Authorization: Bearer <token>
```

**Auth:** required.

Returns deactivated **default** standards only (not archived customs). Same shape as the list endpoint.

---

#### 20. Get version history

```
GET /api/standards/{mat_standard_id}/versions
Authorization: Bearer <token>
```

**Auth:** required.

**Response 200:**

```json
[
  {
    "version_id": "HLT-AC1-v2",
    "version_number": 2,
    "standard_code": "AC1",
    "standard_name": "Attendance & Compliance",
    "standard_description": "...",
    "standard_type": "assurance",
    "effective_from": "2026-04-15T09:00:00Z",
    "effective_to": null,
    "created_by_user_id": "user10",
    "change_reason": "Updated description"
  }
]
```

Ordered by `version_number` descending (newest first).

**Response 404:** `"Standard not found or access denied"`.

---

### Assessments

#### 21. List assessments (grouped)

```
GET /api/assessments
Authorization: Bearer <token>
```

**Auth:** required.

Returns assessment summaries grouped by (school, aspect, term).

**Query params:**

| Param | Type | Default | Notes |
|---|---|---|---|
| `school_id` | string | — | Optional filter. |
| `aspect_code` | string | — | Optional filter. |
| `term_id` | string | — | Short term ID, e.g. `T1`. |
| `academic_year` | string | — | e.g. `2025-26`. |
| `status` | string | — | `not_started`, `in_progress`, or `completed`. |

**Response 200:**

```json
[
  {
    "group_id": "cedar-park-primary-EDU-T1-2025-26",
    "school_id": "cedar-park-primary",
    "school_name": "Cedar Park Primary",
    "mat_aspect_id": "HLT-EDU",
    "aspect_code": "EDU",
    "aspect_name": "Education",
    "term_id": "T1",
    "academic_year": "2025-26",
    "due_date": "2025-12-20",
    "last_updated": "2026-04-20T14:32:01Z",
    "status": "in_progress",
    "total_standards": 12,
    "completed_standards": 8
  }
]
```

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `group_id` | string | no | Composite: `<school_id>-<ASPECT_CODE>-<unique_term_id>`. |
| `school_id` | string | no | |
| `school_name` | string | no | |
| `mat_aspect_id` | string | no | |
| `aspect_code` | string | no | Uppercased. |
| `aspect_name` | string | no | |
| `term_id` | string | no | Short form: `T1`, `T2`, `T3`. |
| `academic_year` | string | no | `2025-26`. |
| `due_date` | string (date) | yes | `YYYY-MM-DD`. Latest due date across standards in the group. |
| `last_updated` | string (ISO 8601) | yes | Most recent update across standards. |
| `status` | string | no | Computed: `not_started`, `in_progress`, or `completed`. |
| `total_standards` | integer | no | |
| `completed_standards` | integer | no | |

---

#### 22. Create assessments (batch)

```
POST /api/assessments
Authorization: Bearer <token>
```

**Auth:** required.

Creates assessment rows for every (school, standard, term) combination — one row per standard in the specified aspect.

**Request body:**

```json
{
  "school_ids": ["cedar-park-primary", "ermine-primary-academy"],
  "aspect_code": "EDU",
  "term_id": "T1-2025-26",
  "due_date": "2025-12-20",
  "assigned_to": "user10"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `school_ids` | string[] | yes | Must all belong to the user's MAT. |
| `aspect_code` | string | yes | |
| `term_id` | string | yes | Full unique_term_id format: `T1-2025-26`. |
| `due_date` | string (date) | no | `YYYY-MM-DD`. |
| `assigned_to` | string | no | User ID. Defaults to the current user. |

**Response 201:**

```json
{
  "message": "Created 24 assessments for 2 schools",
  "assessments_created": 24,
  "assessment_ids": ["cedar-park-primary-AC1-T1-2025-26", "..."],
  "schools": ["cedar-park-primary", "ermine-primary-academy"],
  "aspect_code": "EDU",
  "term_id": "T1-2025-26"
}
```

Skips existing (school, standard, term) combinations — does not overwrite.

**Response 403:** `"Cannot create assessments for schools outside your MAT: ..."`.
**Response 404:** `"No standards found for aspect: EDU"`.

---

#### 23. Get assessment details

```
GET /api/assessments/{assessment_id}
Authorization: Bearer <token>
```

**Auth:** required.

**Path params:**

| Param | Type | Notes |
|---|---|---|
| `assessment_id` | string | The virtual composite key: `<school_id>-<standard_code>-<unique_term_id>`. Example: `cedar-park-primary-ES1-T1-2024-25`. |

**Response 200:**

```json
{
  "id": "0ab66bc1-8800-4d1d-a643-eb6224668a3e",
  "assessment_id": "cedar-park-primary-ES1-T1-2024-25",
  "school_id": "cedar-park-primary",
  "school_name": "Cedar Park Primary",
  "mat_standard_id": "HLT-ES1",
  "standard_code": "ES1",
  "standard_name": "Estate Safety",
  "standard_description": "...",
  "standard_type": "assurance",
  "mat_aspect_id": "HLT-EST",
  "aspect_code": "EST",
  "aspect_name": "Estates",
  "version_id": "HLT-ES1-v1",
  "version_number": 1,
  "unique_term_id": "T1-2024-25",
  "academic_year": "2024-25",
  "rating": 3,
  "evidence_comments": "Building maintenance programme on track.",
  "actions": "Schedule roof inspection by end of term.",
  "status": "completed",
  "due_date": "2024-12-20",
  "assigned_to": "user10",
  "assigned_to_name": "Richard Briggs",
  "submitted_at": "2024-11-15T10:30:00Z",
  "submitted_by": "user10",
  "submitted_by_name": "Richard Briggs",
  "last_updated": "2024-11-15T10:30:00Z",
  "updated_by": "user10"
}
```

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | string | no | UUID v4 primary key. |
| `assessment_id` | string | no | Virtual composite key (read-only). |
| `school_id` | string | no | |
| `school_name` | string | no | |
| `mat_standard_id` | string | no | |
| `standard_code` | string | no | |
| `standard_name` | string | no | |
| `standard_description` | string | yes | |
| `standard_type` | string | no | `🚧 In-flight — REQ-004`. `"assurance"` or `"risk"`. Required by frontend for RAG polarity. Currently returned from the JOIN but not explicitly documented until REQ-004 ships. |
| `mat_aspect_id` | string | no | |
| `aspect_code` | string | no | |
| `aspect_name` | string | no | |
| `version_id` | string | yes | |
| `version_number` | integer | yes | |
| `unique_term_id` | string | no | |
| `academic_year` | string | no | |
| `rating` | integer | yes | 1–4 or `null`. |
| `evidence_comments` | string | yes | |
| `actions` | string | yes | `🚧 In-flight — REQ-002`. Free-text next-steps. |
| `status` | string | no | `not_started`, `in_progress`, `completed`, or `approved`. |
| `due_date` | string (date) | yes | `YYYY-MM-DD`. |
| `assigned_to` | string | yes | User ID. |
| `assigned_to_name` | string | yes | |
| `submitted_at` | string (ISO 8601) | yes | |
| `submitted_by` | string | yes | User ID. |
| `submitted_by_name` | string | yes | |
| `last_updated` | string (ISO 8601) | yes | |
| `updated_by` | string | yes | User ID. |

**Response 404:** `"Assessment not found"`.

---

#### 24. Get assessments by aspect

```
GET /api/assessments/by-aspect/{aspect_code}
Authorization: Bearer <token>
```

**Auth:** required.

Returns all standards within an aspect for a specific school and term, with their assessment data (if any). Powers the ratings form.

**Path params:**

| Param | Type | Notes |
|---|---|---|
| `aspect_code` | string | e.g. `EDU`, `HR`, `FIN`. |

**Query params:**

| Param | Type | Required | Notes |
|---|---|---|---|
| `school_id` | string | yes | |
| `term_id` | string | yes | Full `unique_term_id`: `T1-2025-26`. |

**Response 200:**

```json
{
  "school_id": "cedar-park-primary",
  "school_name": "Cedar Park Primary",
  "aspect_code": "EDU",
  "aspect_name": "Education",
  "mat_aspect_id": "HLT-EDU",
  "term_id": "T1-2025-26",
  "academic_year": "2025-26",
  "total_standards": 12,
  "completed_standards": 8,
  "status": "in_progress",
  "standards": [
    {
      "assessment_id": "cedar-park-primary-AC1-T1-2025-26",
      "id": "0ab66bc1-...",
      "mat_standard_id": "HLT-AC1",
      "standard_code": "AC1",
      "standard_name": "Attendance & Compliance",
      "standard_description": "...",
      "standard_type": "assurance",
      "sort_order": 1,
      "rating": 3,
      "evidence_comments": "Good attendance tracking in place.",
      "actions": "Review persistent absence intervention programme.",
      "version_id": "HLT-AC1-v2",
      "version_number": 2,
      "status": "completed",
      "due_date": "2025-12-20",
      "assigned_to": "user10",
      "assigned_to_name": "Richard Briggs",
      "submitted_at": "2025-11-15T10:30:00Z",
      "last_updated": "2025-11-15T10:30:00Z"
    }
  ]
}
```

Each standard in the `standards` array:

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `assessment_id` | string | yes | `null` if no assessment exists yet for this standard. |
| `id` | string | yes | UUID. `null` if no assessment. |
| `mat_standard_id` | string | no | |
| `standard_code` | string | no | |
| `standard_name` | string | no | |
| `standard_description` | string | yes | |
| `standard_type` | string | no | `🚧 In-flight — REQ-004`. `"assurance"` or `"risk"`. Needed for RAG polarity. |
| `sort_order` | integer | no | |
| `rating` | integer | yes | 1–4 or `null`. |
| `evidence_comments` | string | yes | |
| `actions` | string | yes | `🚧 In-flight — REQ-002`. |
| `version_id` | string | yes | |
| `version_number` | integer | yes | |
| `status` | string | no | Defaults to `"not_started"` if no assessment. |
| `due_date` | string (date) | yes | |
| `assigned_to` | string | yes | |
| `assigned_to_name` | string | yes | |
| `submitted_at` | string (ISO 8601) | yes | |
| `last_updated` | string (ISO 8601) | yes | |

**Response 404:** `"School or aspect not found in your MAT"`.

**Frontend notes:**
- Standards without assessments have `null` for `assessment_id`, `id`, `rating`, `evidence_comments`, `actions`. The frontend must handle these gracefully — they represent standards that exist in the MAT's framework but haven't been rated yet for this school/term.

---

#### 25. Update single assessment

```
PUT /api/assessments/{assessment_id}
Authorization: Bearer <token>
```

**Auth:** required.

**Path params:**

| Param | Type | Notes |
|---|---|---|
| `assessment_id` | string | Virtual composite key: `<school_id>-<standard_code>-<unique_term_id>`. |

**Request body:**

```json
{
  "rating": 4,
  "evidence_comments": "All targets met with strong evidence base.",
  "actions": "Maintain current approach; share best practice across trust."
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `rating` | integer | no | 1–4 or `null`. Setting a non-null rating changes status to `"completed"`; setting `null` changes it to `"in_progress"`. |
| `evidence_comments` | string | no | |
| `actions` | string | no | `🚧 In-flight — REQ-002`. |

**Response 200:**

```json
{
  "message": "Assessment updated successfully",
  "assessment_id": "cedar-park-primary-ES1-T1-2024-25",
  "status": "completed"
}
```

**Response 404:** `"Assessment not found"`.

**Frontend notes:**
- Auto-sets `submitted_by` and `updated_by` to the current user.

---

#### 26. Bulk update assessments

```
POST /api/assessments/bulk-update
Authorization: Bearer <token>
```

**Auth:** required.

**Request body:**

```json
{
  "updates": [
    {
      "assessment_id": "cedar-park-primary-ES1-T1-2024-25",
      "rating": 4,
      "evidence_comments": "Excellent",
      "actions": "No further action required."
    },
    {
      "assessment_id": "cedar-park-primary-ES2-T1-2024-25",
      "rating": 3,
      "evidence_comments": "Good progress"
    }
  ]
}
```

Each item in `updates`:

| Field | Type | Required | Notes |
|---|---|---|---|
| `assessment_id` | string | yes | Virtual composite key. |
| `rating` | integer | no | 1–4. |
| `evidence_comments` | string | no | |
| `actions` | string | no | `🚧 In-flight — REQ-002`. |

**Response 200:**

```json
{
  "message": "Updated 2 assessments",
  "updated_count": 2,
  "failed_count": 0
}
```

**Frontend notes:**
- `failed_count` reflects assessment_ids that didn't match any row (wrong ID or different MAT). There's no per-item error detail — check `failed_count` and retry or alert.

---

### Dashboard

#### 27. Dashboard schools summary

```
GET /api/dashboard/schools
Authorization: Bearer <token>
```

**Auth:** required.

The primary dashboard data endpoint. Returns per-school summary rows for the selected term.

**Query params:**

| Param | Type | Default | Notes |
|---|---|---|---|
| `term_id` | string | — | Full `unique_term_id`, e.g. `T2-2025-26`. If omitted, the backend selects the most recent term with assessment data. |
| `view` | string | `"school"` | `🚧 In-flight — REQ-005`. `"school"` = non-central schools only; `"trust"` = central office only. |

**Response 200 (target shape):**

```json
{
  "current_term": "T2-2025-26",
  "schools": [
    {
      "school_id": "cedar-park-primary",
      "school_name": "Cedar Park Primary",
      "school_type": "primary",
      "is_central_office": false,
      "current_term": "T2-2025-26",
      "status": "in_progress",
      "current_score": 3.25,
      "previous_terms": [
        {
          "term_id": "T1-2025-26",
          "academic_year": "2025-26",
          "avg_score": 3.10
        }
      ],
      "intervention_required": 2,
      "completed_standards": 30,
      "total_standards": 42,
      "completion_rate": "30/42",
      "last_updated": "2026-04-20T14:32:01Z",
      "actions": "Review safeguarding policy by May.",
      "evidence_count": 5
    }
  ]
}
```

Per-school row fields:

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `school_id` | string | no | |
| `school_name` | string | no | |
| `school_type` | string | no | `🚧 In-flight — REQ-005`. `primary`, `secondary`, `all_through`, `special`, `central`. |
| `is_central_office` | boolean | no | `🚧 In-flight — REQ-005`. |
| `current_term` | string | no | |
| `status` | string | no | Computed: `not_started`, `in_progress`, `completed`. |
| `current_score` | number | yes | Average rating (2dp). `null` if no ratings. |
| `previous_terms` | array | no | Up to 3 prior terms with `term_id`, `academic_year`, `avg_score`. |
| `intervention_required` | integer | no | Count of standards with a low rating. |
| `completed_standards` | integer | no | |
| `total_standards` | integer | no | |
| `completion_rate` | string | no | `"30/42"` format for display. |
| `last_updated` | string (ISO 8601) | yes | |
| `actions` | string | yes | `🚧 In-flight — REQ-002`. Aggregated or most recent actions text. |
| `evidence_count` | integer | no | `🚧 In-flight — REQ-003`. Total evidence items across all assessment cells for this school/term. |

**Response 200 (empty):**

```json
{
  "current_term": null,
  "schools": []
}
```

Returned when no assessment data exists for the MAT.

**Frontend notes:**
- The `view` param determines which schools appear. Default `"school"` excludes central office rows. `"trust"` returns only the central office row — there's exactly one per MAT.
- `previous_terms` is limited to 3 entries, newest first. Use for sparkline/trend display.
- `evidence_count` drives the Files column indicator: show paperclip + count when > 0, blank when 0.

---

### Evidence `🚧 In-flight — REQ-003`

All four evidence endpoints are in-flight. The path prefix is `/evidence/...` (not `/api/evidence/...`).

#### 28. Upload file evidence

```
POST /evidence/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Auth:** required.

**Form fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `mat_standard_id` | string | yes | Must belong to the user's MAT. |
| `school_id` | string | yes | Must belong to the user's MAT. |
| `unique_term_id` | string | yes | Must exist in `terms`. |
| `file` | file | yes | Max 25 MB. |

**Accepted file types:** PDF (`.pdf`), Word (`.doc`, `.docx`), Excel (`.xls`, `.xlsx`), images (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`).

**Response 201:** `EvidenceRecord` (see shape below).

**Response 400:** `"Invalid school_id or unique_term_id"`.
**Response 403:** `"mat_standard_id does not belong to your MAT"`.
**Response 413:** file exceeds 25 MB.
**Response 415:** unsupported file type.

**Frontend notes:**
- Validate file type and size client-side before uploading for better UX.
- Show progress indicator — large files may take a few seconds.

---

#### 29. Add link evidence

```
POST /evidence/link
Authorization: Bearer <token>
Content-Type: application/json
```

**Auth:** required.

**Request body:**

```json
{
  "mat_standard_id": "HLT-AC1",
  "school_id": "ermine-primary-academy",
  "unique_term_id": "T1-2025-26",
  "url": "https://docs.google.com/document/d/abc123"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `mat_standard_id` | string | yes | |
| `school_id` | string | yes | |
| `unique_term_id` | string | yes | |
| `url` | string | yes | Must start with `https://`. Max 2000 chars. `http://` rejected. |

**Response 201:** `EvidenceRecord`.

**Response 400:** `"URL must start with https://"` or `"URL exceeds maximum length"`.
**Response 403:** `"mat_standard_id does not belong to your MAT"`.

---

#### 30. List evidence for assessment cell

```
GET /evidence/{mat_standard_id}
Authorization: Bearer <token>
```

**Auth:** required.

**Path params:**

| Param | Type | Notes |
|---|---|---|
| `mat_standard_id` | string | Must belong to the user's MAT. |

**Query params:**

| Param | Type | Required | Notes |
|---|---|---|---|
| `school_id` | string | yes | |
| `unique_term_id` | string | yes | |

**Response 200:** array of `EvidenceRecord`, newest first.

```json
[
  {
    "id": "a1b2c3d4-...",
    "mat_standard_id": "HLT-AC1",
    "school_id": "ermine-primary-academy",
    "unique_term_id": "T1-2025-26",
    "evidence_type": "file",
    "file_path": "HLT/HLT-AC1/attendance-report.pdf",
    "url": null,
    "original_filename": "Attendance Report Q1.pdf",
    "uploaded_by": "user10",
    "uploaded_by_name": "Richard Briggs",
    "created_at": "2026-04-20T14:32:01Z",
    "download_url": "https://storage.googleapis.com/..."
  },
  {
    "id": "e5f6g7h8-...",
    "mat_standard_id": "HLT-AC1",
    "school_id": "ermine-primary-academy",
    "unique_term_id": "T1-2025-26",
    "evidence_type": "url",
    "file_path": null,
    "url": "https://docs.google.com/document/d/abc123",
    "original_filename": null,
    "uploaded_by": "user10",
    "uploaded_by_name": "Richard Briggs",
    "created_at": "2026-04-19T09:15:00Z",
    "download_url": null
  }
]
```

**EvidenceRecord shape:**

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | string | no | UUID v4. |
| `mat_standard_id` | string | no | |
| `school_id` | string | no | |
| `unique_term_id` | string | no | |
| `evidence_type` | string | no | `"file"` or `"url"`. |
| `file_path` | string | yes | GCS object path. `null` when `evidence_type = "url"`. Internal — don't display to users. |
| `url` | string | yes | External URL. `null` when `evidence_type = "file"`. |
| `original_filename` | string | yes | Uploader's original filename. `null` for URL evidence. |
| `uploaded_by` | string | no | User ID. |
| `uploaded_by_name` | string | no | Display name. Preserved even if user is soft-deleted. |
| `created_at` | string (ISO 8601) | no | |
| `download_url` | string | yes | Signed GCS URL, 15-minute expiry. Only for file evidence. `null` for URL evidence. |

**Frontend notes:**
- For file evidence, open `download_url` in a new tab. The signed URL expires after 15 minutes — if the user has had the page open longer, re-fetch the evidence list to get fresh URLs.
- For URL evidence, open `url` directly in a new tab (`target="_blank" rel="noopener noreferrer"`).
- Don't display `file_path` to users — it's an internal GCS key.

---

#### 31. Delete evidence

```
DELETE /evidence/{evidence_id}
Authorization: Bearer <token>
```

**Auth:** required.

**Path params:**

| Param | Type | Notes |
|---|---|---|
| `evidence_id` | string | UUID of the evidence record. |

**Response 204:** no body.

**Response 404:** evidence not found **or** belongs to a different MAT. The backend intentionally does not distinguish between "not found" and "wrong MAT" to avoid leaking existence.

**Frontend notes:**
- Show confirmation dialog before deleting ("Delete this file?" / "Remove this link?").
- Wait for server confirmation (204) before removing from the UI. No optimistic removal.

---

### Terms

#### 32. List terms

```
GET /api/terms
```

**Auth:** not required. Terms are public reference data.

**Query params:**

| Param | Type | Default | Notes |
|---|---|---|---|
| `academic_year` | string | — | Optional filter, e.g. `"2025-26"`. |

**Response 200:**

```json
[
  {
    "unique_term_id": "T1-2025-26",
    "term_id": "T1",
    "term_name": "Autumn Term",
    "start_date": "2025-09-01",
    "end_date": "2025-12-19",
    "academic_year": "2025-26",
    "is_current": true
  }
]
```

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `unique_term_id` | string | no | `T<n>-<academic_year>`. Primary key. |
| `term_id` | string | no | `T1`, `T2`, or `T3`. Not unique across years. |
| `term_name` | string | no | `"Autumn Term"`, `"Spring Term"`, `"Summer Term"`. |
| `start_date` | string (date) | no | `YYYY-MM-DD`. |
| `end_date` | string (date) | no | `YYYY-MM-DD`. |
| `academic_year` | string | no | `YYYY-YY` format. |
| `is_current` | boolean | no | `true` if today falls within `start_date`..`end_date`. |

Ordered by `academic_year` descending, then `T1 → T2 → T3`.

---

### Users

#### 33. List users

```
GET /api/users
Authorization: Bearer <token>
```

**Auth:** required.

**Query params:**

| Param | Type | Default | Notes |
|---|---|---|---|
| `school_id` | string | — | Optional filter. |
| `role_title` | string | — | Optional filter. |
| `include_inactive` | boolean | `false` | If `true`, includes soft-deleted users. |

**Response 200:**

```json
[
  {
    "user_id": "user10",
    "email": "admin@harbourlearning.org.uk",
    "full_name": "Richard Briggs",
    "role_title": "MAT Administrator",
    "school_id": "HLT-CENTRAL",
    "school_name": "Harbour Learning Trust Central",
    "mat_id": "HLT",
    "is_active": 1,
    "last_login": "2026-04-20T14:32:01Z",
    "created_at": "2025-09-01T00:00:00Z"
  }
]
```

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `user_id` | string | no | |
| `email` | string | no | |
| `full_name` | string | no | |
| `role_title` | string | yes | Free-text. All current users: `"MAT Administrator"`. |
| `school_id` | string | yes | |
| `school_name` | string | yes | Joined from `schools`. `null` if user has no school. |
| `mat_id` | string | no | |
| `is_active` | integer (0/1) | no | |
| `last_login` | string (ISO 8601) | yes | |
| `created_at` | string (ISO 8601) | yes | |

---

#### 34. Create user

```
POST /api/users
Authorization: Bearer <token>
```

**Auth:** required. **MAT Administrator only.**

**Request body:**

```json
{
  "email": "newuser@harbourlearning.org.uk",
  "full_name": "Jane Smith",
  "role_title": "MAT Administrator",
  "school_id": "cedar-park-primary"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string (email) | yes | Must be globally unique. |
| `full_name` | string | yes | Minimum 2 characters after trim. |
| `role_title` | string | yes | Must be one of: `"MAT Administrator"`, `"Department Head"`, `"School Leader"`. |
| `school_id` | string | no | Must belong to the user's MAT if provided. |

**Response 201:** the created user (same shape as list item, without `last_login`).

**Response 400:** `"A user with email '...' already exists in your MAT"` or `"School '...' not found in your MAT"`.
**Response 403:** `"Only MAT Administrators can perform this action"`.

---

#### 35. Update user

```
PUT /api/users/{user_id}
Authorization: Bearer <token>
```

**Auth:** required. **MAT Administrator only.**

**Request body:** partial update.

```json
{
  "full_name": "Jane Smith-Jones",
  "role_title": "School Leader",
  "school_id": "ermine-primary-academy"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `full_name` | string | no | |
| `role_title` | string | no | Same validation as create. |
| `school_id` | string | no | `null` to remove school assignment. |

**Response 200:**

```json
{
  "message": "User updated successfully",
  "user": { "...same shape as list item..." }
}
```

**Response 400:** `"No fields to update"` or `"School '...' not found in your MAT"`.
**Response 403:** `"Only MAT Administrators can perform this action"`.
**Response 404:** `"User not found"`.

---

#### 36. Delete user

```
DELETE /api/users/{user_id}
Authorization: Bearer <token>
```

**Auth:** required. **MAT Administrator only.**

Soft-deletes: sets `is_active = 0` and `deleted_at = NOW()`. Preserves user data for audit trail.

**Response 200:**

```json
{
  "message": "User successfully deleted",
  "user_id": "user10",
  "email": "admin@harbourlearning.org.uk",
  "full_name": "Richard Briggs",
  "deleted_at": "2026-04-20T14:32:01Z"
}
```

**Response 400:** `"You cannot delete your own account"` or `"User is already deleted"`.
**Response 403:** `"Only MAT Administrators can perform this action"`.
**Response 404:** `"User not found"`.

---

### Analytics

#### 37. Rating trends

```
GET /api/analytics/trends
Authorization: Bearer <token>
```

**Auth:** required.

**Query params:**

| Param | Type | Default | Notes |
|---|---|---|---|
| `school_id` | string | — | Optional filter. |
| `aspect_code` | string | — | Optional filter. |
| `aspect_category` | string | — | `"ofsted"` or `"operational"`. |
| `standard_type` | string | — | `"assurance"` or `"risk"`. |
| `from_term` | string | — | Start `unique_term_id`, e.g. `T1-2023-24`. |
| `to_term` | string | — | End `unique_term_id`. |

**Response 200:**

```json
{
  "mat_id": "HLT",
  "filters": {
    "school_id": null,
    "aspect_code": null,
    "from_term": null,
    "to_term": null
  },
  "summary": {
    "total_terms": 6,
    "overall_average": 3.15,
    "trend_direction": "improving",
    "improvement": 0.25
  },
  "trends": [
    {
      "unique_term_id": "T1-2024-25",
      "term_id": "T1",
      "academic_year": "2024-25",
      "assessments_count": 210,
      "rated_count": 198,
      "average_rating": 3.02,
      "min_rating": 1,
      "max_rating": 4,
      "rating_distribution": {
        "inadequate": 12,
        "requires_improvement": 45,
        "good": 98,
        "outstanding": 43,
        "exceptional": 0
      }
    }
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| `summary.trend_direction` | string | `"improving"`, `"declining"`, `"stable"`, or `"no_data"`. |
| `summary.improvement` | number | Delta between first and last term's average. |
| `trends[].rating_distribution` | object | Counts per rating value. Key names are legacy Ofsted labels — see Known Issues #5, #6. `exceptional` is always `0` (see Known Issues #5). |

**Frontend notes:**
- `rating_distribution` uses legacy label keys (`inadequate`, `requires_improvement`, `good`, `outstanding`, `exceptional`). Map these to rating integers (`1`, `2`, `3`, `4`) for display. The `exceptional` key is always `0` and should be ignored. These labels will be replaced with integer keys when REQ-004 ships.

---

## Deprecated endpoints

The following endpoints exist in `main.py` but should not be called by the frontend. They are documented here for completeness and to guide cleanup.

### `POST /api/assessments/{assessment_id}/submit` — DEPRECATED

References columns (`standard_id`, `term_id`) that no longer exist on the `assessments` table. Will fail at runtime. Frontend should use `PUT /api/assessments/{assessment_id}` for single updates or `POST /api/assessments/bulk-update` for batch updates.

### `GET /api/debug/assessment-parsing/{id}` — DEPRECATED

Debug-only endpoint. References non-existent columns (`standard_id`, `term_id`). No auth required. Recommend removal.

### `GET /api/users/me` — DEPRECATED

Returns a hardcoded `permissions` array and an empty `active_assessments` TODO. Never called by the frontend (`auth-service.ts` calls `/api/auth/me` instead). Different response shape from `UserResponse`. Recommend removal.

### `POST /api/auth/cleanup-expired-tokens` — NOT A FRONTEND ENDPOINT

Admin/cron utility. No auth required (security concern). Not called by the frontend.

---

## Known backend issues to remediate

| # | Location | Issue | Severity | Fix alongside |
|---|---|---|---|---|
| 1 | `GET /api/dashboard/schools` (main.py ~L1243) | Broken implementation: `schools` variable referenced before definition. The main current-term query is a placeholder comment (`# ... [keep existing current term query] ...`). Endpoint will raise `NameError` at runtime. | **Blocking** — prevents REQ-005 | REQ-002/003/005 batch |
| 2 | `POST /api/assessments/{assessment_id}/submit` (main.py ~L3124) | References `standard_id` and `term_id` columns that no longer exist on `assessments`. Will raise `OperationalError` at runtime. | **Broken** — endpoint is dead | Mark deprecated. Frontend uses `PUT /api/assessments/{assessment_id}`. |
| 3 | `GET /api/debug/assessment-parsing/{id}` (main.py ~L3066) | Same `standard_id`/`term_id` column issue. | **Broken** — debug only | Standalone removal |
| 4 | `GET /api/users/me` (main.py ~L2810) | Dead code. Hardcoded permissions array `["complete_assessments", "view_school_data"]` and `active_assessments: []` TODO. Never called by frontend. Different shape from `UserResponse`. | **Cosmetic** | Standalone removal |
| 5 | `GET /api/analytics/trends` (main.py ~L3454) | Returns `exceptional_count` counting `rating = 5` rows. DB constraint `chk_rating_range` makes `rating = 5` impossible. Field always returns `0`. | **Cosmetic** | REQ-004 |
| 6 | `GET /api/analytics/trends` response (main.py ~L3508-3514) | `rating_distribution` uses Ofsted-derived string keys (`inadequate`, `requires_improvement`, `good`, `outstanding`, `exceptional`). These labels have been retired. Should use integer keys (`1`, `2`, `3`, `4`). | **Cosmetic** | REQ-004 |
| 7 | `StandardRatingSubmission.rating` Pydantic comment (main.py ~L232) | Comment says `"1-5 or null"`. Correct range is `1-4` per `chk_rating_range`. | **Stale comment** | REQ-004 |
| 8 | `POST /api/auth/cleanup-expired-tokens` (main.py ~L731) | No auth requirement on an admin/cron endpoint. Anyone can call it. | **Low security** | Standalone |
| 9 | `GET /api/terms` (main.py ~L2402) | No auth requirement. Only unprotected data endpoint. Terms are public reference data so risk is low, but inconsistent with other endpoints. | **Low** | Standalone |
| 10 | `PUT /api/assessments/{assessment_id}` and `POST /api/assessments/bulk-update` | Neither endpoint currently accepts the `actions` field — only `rating` and `evidence_comments` are read from `update_data`. | **Blocking REQ-002** | REQ-002 |
| 11 | `GET /api/assessments/by-aspect/{aspect_code}` | Does not return `standard_type` or `actions` in the per-standard response. Both are needed (REQ-002 for `actions`, REQ-004 for `standard_type`/RAG polarity). `standard_type` is selected in the SQL but omitted from the response dict. | **Blocking REQ-002, REQ-004** | REQ-002/004 |
| 12 | `GET /api/standards/{mat_standard_id}` (single detail) | Selects `ms.standard_type` in the SQL but omits it from the `JSONResponse` content dict. The list endpoint (`GET /api/standards`) correctly returns it via `MatStandardResponse`. | **Cosmetic** — data is available, just not serialised | Standalone |
| 13 | `GET /api/assessments/{assessment_id}` (single detail) | Does not SELECT `ms.standard_type` or `a.actions`. Both needed for target state (REQ-002, REQ-004). | **Blocking REQ-002, REQ-004** | REQ-002/004 |

---

## Change log

| Version | Date | Change |
|---|---|---|
| v1 | 2026-04-27 | Initial contract. Documents all live endpoints from `main.py`, target state for REQ-002/003/004/005 with `🚧 In-flight` tags, deprecated endpoints, and known backend issues. |
