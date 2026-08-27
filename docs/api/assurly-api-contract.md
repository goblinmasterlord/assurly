# Assurly API Contract

**Status:** Authoritative. Both backend (Claude Code) and frontend (Cursor) reference this doc.
**Version:** v2.6
**Last updated:** 26 August 2026
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

**All endpoints except `/api/auth/request-magic-link`, `/api/auth/verify/{token}`, `/api/terms` and `/api/auth/cleanup-expired-tokens` require a valid Bearer token.** Unauthenticated requests receive `401`.

`/api/auth/cleanup-expired-tokens` is listed here for accuracy, not by design — see **Authorisation tiers** below and Known Issue #8. It is not a frontend endpoint.

### Authorisation tiers

Authentication (a valid Bearer token) is not the same as authorisation. Three tiers exist in the backend, enforced by FastAPI dependencies. **The OpenAPI spec advertises only `HTTPBearer` and cannot express the second and third tiers, so the spec understates the protection on the endpoints that carry them. Read this table, not the spec, for the security posture.**

| Tier | Dependency | Check | Rejection |
|---|---|---|---|
| **Authenticated** | `get_current_user` | Valid, unexpired JWT. | `401` |
| **MAT administrator** | `verify_mat_admin` | `role_title == "MAT Administrator"`. | `403 "Only MAT Administrators can perform this action"` |
| **Super admin** | `verify_super_admin` | Caller's email is on the `SUPER_ADMIN_EMAILS` allow-list. | `403 "Super admin access required"` |

**The `SUPER_ADMIN_EMAILS` mechanism.** A comma-separated list of emails supplied as an environment variable, read once at import into a case-insensitive, whitespace-trimmed set. It is **not a database role**, so promoting or demoting a super admin is a deployment, not a data change. Quoting `assurly-backend/.env.example`:

> Comma-separated emails granted access to `/api/admin/*` tooling (mock-data generate/wipe). Case-insensitive; whitespace trimmed. **Leave unset to deny everyone — no DB-level super-admin role exists.**

**Deny by default.** An unset or empty `SUPER_ADMIN_EMAILS` produces an empty allow-list, and every caller is refused. Misconfiguration therefore fails closed, never open. `verify_super_admin` additionally depends on `get_current_user`, so a caller must hold a valid token *before* the allow-list is consulted — an anonymous request to a super-admin endpoint is rejected at the authentication layer with `401`, not at the allow-list with `403`.

**Unauthorised attempts are logged at `WARNING`** with the caller's user ID, email and the requested path, so probing is visible in logs.

**Which endpoints carry which tier:**

| Tier | Endpoints |
|---|---|
| Super admin | `POST /api/admin/mock-data/generate`, `DELETE /api/admin/mock-data/wipe` |
| MAT administrator | `DELETE /api/users/{user_id}` |
| Authenticated | Everything else, including `DELETE /api/standards/{mat_standard_id}`, `DELETE /api/aspects/{mat_aspect_id}` and `DELETE /api/assessments/{assessment_id}/actions/{action_id}` |
| **None** | `POST /api/auth/request-magic-link`, `GET /api/auth/verify/{token}` (both public by design), `GET /api/terms` (Known Issue #9), `POST /api/auth/cleanup-expired-tokens` (Known Issue #8) |

> **Note on the delete endpoints in the Authenticated row.** Any authenticated user in the MAT may delete standards, aspects and action items. That is consistent with the Internal tier of the role model, which holds full write access within its MAT — it is not an oversight. The External (trustee/governor) tier, which must have no write access anywhere, **does not yet exist**; until it does, read-only access cannot be granted to anyone. That is REQ-013.

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

Returns all active schools for the authenticated user's MAT, including the central office row. No query params.

**Response 200:**

```json
[
  {
    "school_id": "cedar-park-primary",
    "school_name": "Cedar Park Primary",
    "school_type": "primary",
    "is_central_office": false,
    "is_active": true
  },
  {
    "school_id": "HLT-CENTRAL",
    "school_name": "Harbour Learning Trust Central",
    "school_type": "central",
    "is_central_office": true,
    "is_active": true
  }
]
```

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `school_id` | string | no | Slug or code. |
| `school_name` | string | no | |
| `school_type` | string | no | One of `primary`, `secondary`, `all_through`, `special`, `central`. |
| `is_central_office` | boolean | no | `true` for the MAT central office row. Exactly one per MAT. |
| `is_active` | boolean | no | Always `true` in this response (inactive schools are filtered out). |

**Frontend notes:**
- The central office row is always included — identify it by `is_central_office === true` (or `school_type === 'central'`).

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
| `aspect_category` | string | — | Optional. `"strategic"` or `"operational"`. |

**Response 200:**

```json
[
  {
    "mat_aspect_id": "HLT-EDU",
    "mat_id": "HLT",
    "aspect_code": "EDU",
    "aspect_name": "Education",
    "aspect_description": "Education quality and curriculum standards",
    "aspect_category": "strategic",
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
| `aspect_category` | string | no | `"strategic"` or `"operational"`. |
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
  "aspect_category": "strategic",
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
    "school_type": "primary",
    "is_central_office": false,
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
| `school_type` | string | no | `primary`, `secondary`, `all_through`, `special`, `central`. |
| `is_central_office` | boolean | no | `true` for the MAT's central office row. Drives the Trust/School selector on the Assessments screen. |
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
| `standard_type` | string | no | `"assurance"` or `"risk"`. Required by frontend for RAG polarity. |
| `mat_aspect_id` | string | no | |
| `aspect_code` | string | no | |
| `aspect_name` | string | no | |
| `version_id` | string | yes | |
| `version_number` | integer | yes | |
| `unique_term_id` | string | no | |
| `academic_year` | string | no | |
| `rating` | integer | yes | 1–4 or `null`. |
| `evidence_comments` | string | yes | |
| `status` | string | no | `not_started`, `in_progress`, `completed`, or `approved`. |
| `due_date` | string (date) | yes | `YYYY-MM-DD`. |
| `assigned_to` | string | yes | User ID. |
| `assigned_to_name` | string | yes | |
| `submitted_at` | string (ISO 8601) | yes | |
| `submitted_by` | string | yes | User ID. |
| `submitted_by_name` | string | yes | |
| `last_updated` | string (ISO 8601) | yes | |
| `updated_by` | string | yes | User ID. |

Action checklist items are not embedded in this response — fetch them via `GET /api/assessments/{assessment_id}/actions` (see §32a).

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
| `standard_type` | string | no | `"assurance"` or `"risk"`. Needed for RAG polarity. |
| `sort_order` | integer | no | |
| `rating` | integer | yes | 1–4 or `null`. |
| `evidence_comments` | string | yes | |
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
- Standards without assessments have `null` for `assessment_id`, `id`, `rating`, `evidence_comments`. The frontend must handle these gracefully — they represent standards that exist in the MAT's framework but haven't been rated yet for this school/term.
- Action checklist items are not embedded here. Fetch them per-assessment via `GET /api/assessments/{assessment_id}/actions` (see §32a).

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
  "evidence_comments": "All targets met with strong evidence base."
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `rating` | integer | no | 1–4 or `null`. Setting a non-null rating changes status to `"completed"`; setting `null` changes it to `"in_progress"`. |
| `evidence_comments` | string | no | |

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
- Action checklist items are not managed here — use the dedicated `/api/assessments/{assessment_id}/actions` endpoints (§32a–d).

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
      "evidence_comments": "Excellent"
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

Action checklist items are not managed here — use the dedicated `/api/assessments/{assessment_id}/actions` endpoints (§32a–d).

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
| `view` | string | `"school"` | `"school"` = non-central schools only; `"trust"` = central office only. The toggle is a server-side re-fetch — clients must re-request with the chosen `view`, not filter client-side. |

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
      "assurance_score": 3.40,
      "risk_score": 3.00,
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
      "evidence_count": 5,
      "outstanding_actions_count": 3
    }
  ]
}
```

Per-school row fields:

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `school_id` | string | no | |
| `school_name` | string | no | |
| `school_type` | string | no | `primary`, `secondary`, `all_through`, `special`, `central`. |
| `is_central_office` | boolean | no | `true` for the MAT central office row. |
| `current_term` | string | no | |
| `status` | string | no | Computed: `not_started`, `in_progress`, `completed`. |
| `current_score` | number | yes | Raw average of all standards' ratings for this school + term (2dp). All ratings are on the 1–4 "higher is better" scale regardless of `standard_type` (label semantics in `assurly-frontend/src/utils/rating-labels.ts`). `null` if no ratings. |
| `assurance_score` | number | yes | Raw average of ratings for assurance-type standards only (2dp). Higher = more assured. `null` if no assurance standards exist for this school. |
| `risk_score` | number | yes | Raw average of ratings for risk-type standards only (2dp). Higher = less risky (rating 4 on a risk standard means "No risk or mitigated"). `null` if no risk standards exist for this school. |
| `previous_terms` | array | no | Up to 3 prior terms with `term_id`, `academic_year`, `avg_score`. |
| `intervention_required` | integer | no | Count of standards rated exactly 1 (the lowest rung on the 1–4 scale — "Inadequate" for assurance, "Critical risk" for risk) for this school + term. Applies uniformly regardless of `standard_type`. Rating 2 ("Needs work" / "Major risk") is concerning but does NOT count toward this flag — the metric is reserved for genuinely urgent cases. |
| `completed_standards` | integer | no | |
| `total_standards` | integer | no | |
| `completion_rate` | string | no | `"30/42"` format for display. |
| `last_updated` | string (ISO 8601) | yes | |
| `evidence_count` | integer | no | Total evidence items across all assessment cells for this school/term. `0` when none exist. |
| `outstanding_actions_count` | integer | no | Count of incomplete `assessment_actions` rows across this school's assessments for the current term (active, non-archived standards only). `0` when none exist. |

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
- `outstanding_actions_count` drives the Actions column indicator. Replaces the prior `actions` string field (REQ-002 rework — actions are now per-assessment checklist items, fetched via the endpoints in the next section).
- All three scores (`current_score`, `assurance_score`, `risk_score`) are plain averages on the same 1–4 scale and "higher is better" in all three cases. `current_score` averages across every standard regardless of `standard_type`; `assurance_score` and `risk_score` restrict to one type each. The shared "higher is better" reading falls out of the risk label semantics — rating 4 on a risk standard means "No risk or mitigated", rating 1 means "Critical risk" — so a high `risk_score` is good news. Use the same colour palette for all three.

---

### Assessment actions (checklist)

REQ-002 ships actions as a checklist of items per assessment, not a free-text field. Items live in the `assessment_actions` table (one row per item, FK to `assessments.id`, ON DELETE CASCADE). The four endpoints below are MAT-isolated: a token from one MAT cannot read or mutate actions on an assessment in another MAT. All ownership misses return **404** (we do not differentiate "not yours" from "not found").

The path-level `{assessment_id}` is the composite virtual key — same form used by `GET /api/assessments/{assessment_id}` and `PUT /api/assessments/{assessment_id}`.

#### 32a. List action items for an assessment

```
GET /api/assessments/{assessment_id}/actions
Authorization: Bearer <token>
```

**Auth:** required.

**Path params:**

| Param | Type | Notes |
|---|---|---|
| `assessment_id` | string | Composite, e.g. `cedar-park-primary-ES1-T1-2024-25`. |

**Response 200:**

```json
[
  {
    "id": "5f1f6a9f-...",
    "text": "Schedule roof inspection by end of term.",
    "is_completed": false,
    "sort_order": 0,
    "created_at": "2026-05-28T10:30:00Z",
    "created_by": "user10",
    "completed_at": null,
    "completed_by": null
  }
]
```

Ordered by `sort_order` then `created_at`.

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | string | no | UUID v4. |
| `text` | string | no | |
| `is_completed` | boolean | no | |
| `sort_order` | integer | no | |
| `created_at` | string (ISO 8601) | no | |
| `created_by` | string | yes | User ID. Nullable because `created_by` has no FK (users are only soft-deleted). |
| `completed_at` | string (ISO 8601) | yes | `null` until `is_completed` flips true. |
| `completed_by` | string | yes | User ID. |

**Response 404:** `"Assessment not found"`.

#### 32b. Create action item

```
POST /api/assessments/{assessment_id}/actions
Authorization: Bearer <token>
Content-Type: application/json
```

**Auth:** required.

**Path params:** same as §32a.

**Request body:**

```json
{
  "text": "Schedule roof inspection by end of term.",
  "sort_order": 0
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `text` | string | yes | Non-empty. |
| `sort_order` | integer | no | Defaults to `MAX(existing sort_order) + 1` for the assessment. |

**Response 201:** the created `ActionItem` (same shape as the list items in §32a).

**Response 404:** `"Assessment not found"`.

#### 32c. Update action item

```
PUT /api/assessments/{assessment_id}/actions/{action_id}
Authorization: Bearer <token>
Content-Type: application/json
```

**Auth:** required.

**Path params:**

| Param | Type | Notes |
|---|---|---|
| `assessment_id` | string | Composite. |
| `action_id` | string | UUID of the action item. |

**Request body:** any subset of:

```json
{
  "text": "Updated text.",
  "is_completed": true,
  "sort_order": 2
}
```

Transition semantics: when `is_completed` flips from `false` → `true`, the backend sets `completed_at = NOW()` and `completed_by = <caller>`. Flipping back to `false` nulls both.

**Response 200:** the updated `ActionItem`.

**Response 404:** `"Assessment not found"` or `"Action not found"`.

#### 32d. Delete action item

```
DELETE /api/assessments/{assessment_id}/actions/{action_id}
Authorization: Bearer <token>
```

**Auth:** required.

Hard-deletes the row (actions are ephemeral UI items, not historical records).

**Response 204:** empty body.

**Response 404:** `"Assessment not found"` or `"Action not found"`.

---

### Evidence

The four evidence endpoints are live. The path prefix is `/evidence/...` (not `/api/evidence/...`).

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
    "is_active": true,
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
| `is_active` | boolean | no | |
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
| `aspect_category` | string | — | `"strategic"` or `"operational"`. |
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
        "concerning": 45,
        "good": 98,
        "strong": 43
      }
    }
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| `summary.trend_direction` | string | `"improving"`, `"declining"`, `"stable"`, or `"no_data"`. |
| `summary.improvement` | number | Delta between first and last term's average. |
| `trends[].rating_distribution` | object | Counts per rating value on the 1–4 scale. Keys: `inadequate` (rating 1), `concerning` (rating 2), `good` (rating 3), `strong` (rating 4). `inadequate` aligns with the dashboard's `intervention_required` semantic (rating 1 only). `concerning` (rating 2) is tracked for trend richness but is NOT the headline "Requires Attention" metric. Key names are polarity-neutral and apply to both `assurance` and `risk` standards — see Known Issues #6 for the planned integer-keyed migration. |

**Frontend notes:**
- `rating_distribution` uses polarity-neutral string keys (`inadequate`, `concerning`, `good`, `strong`) covering the live 1–4 rating scale. Map these to rating integers (`1`, `2`, `3`, `4`) for display if you need numeric keys. These string labels will be replaced with integer keys when REQ-004 ships.

---

### Admin tooling — mock data

> ⚠️ **Super-admin only. Destructive operations.** Both endpoints below are gated by the `SUPER_ADMIN_EMAILS` allow-list (comma-separated emails, set via env var; see `assurly-backend/auth_config.py`). The standard MAT-administrator role does NOT grant access — this is a tighter tier. Unauthorised attempts are logged at WARNING. The mechanism, including its deny-by-default behaviour, is documented under **Conventions → Authorisation tiers**.
>
> **The OpenAPI spec does not show this gate.** It advertises `HTTPBearer` on these endpoints and nothing more, so a reader working from the spec alone would conclude that any authenticated user can wipe a MAT's assessments. They cannot — the guard is real and was verified present on both endpoints on 26 August 2026 — but the spec cannot express it.
>
> Not exposed in the frontend. Triggered manually via Swagger / curl when populating or clearing demo data for a MAT.

Both endpoints share the same request shape:

```json
{
  "mat_id": "HLT",
  "confirm_mat_id": "HLT",
  "term_ids": ["T2-2025-26", "T1-2025-26", "T3-2024-25", "T2-2024-25", "T1-2024-25"]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `mat_id` | string | yes | Target MAT identifier. |
| `confirm_mat_id` | string | yes | Must equal `mat_id` exactly. Anti-fat-finger safeguard against switching MATs mid-call. |
| `term_ids` | string[] | yes | Non-empty list of `unique_term_id` values. Each must exist in `terms`. |

**Common error responses:**
- `400 "confirm_mat_id must match mat_id"` — `confirm_mat_id` did not equal `mat_id`.
- `400 "Invalid term_ids: [...]"` — one or more term IDs are not in the `terms` table; full list of offenders included.
- `403 "Super admin access required"` — caller is not on the `SUPER_ADMIN_EMAILS` allow-list.
- `404 "MAT not found: <id>"` — the MAT id does not exist.

#### Admin-1. Generate mock assessments

```
POST /api/admin/mock-data/generate
Authorization: Bearer <super-admin token>
Content-Type: application/json
```

UPSERT every active `(school × mat_standard × term)` combination for the target MAT. For each combination:

- `rating` ← uniform random integer in `[1, 4]` (Python `random.randint`).
- `evidence_comments` ← `[MOCK YYYY-MM-DD] Generated mock data` (UTC date of the call), so rows are visually identifiable in the UI.
- `status` ← `"completed"`.
- `submitted_by` / `updated_by` ← the caller's `user_id`.
- `submitted_at` / `last_updated` ← `NOW()`.

Existing rows for the same natural key (`uk_assessment` on `school_id, mat_standard_id, unique_term_id`) are overwritten. Inserts use a freshly generated UUID for `id`.

Soft-deleted standards (`mat_standards.is_active = 0` or `mat_standard_id LIKE '%-deleted-%'`) and inactive schools are skipped — the grid size matches what the dashboard considers "active".

**Response 200:**

```json
{
  "mat_id": "HLT",
  "terms_generated": ["T2-2025-26", "T1-2025-26", "T3-2024-25", "T2-2024-25", "T1-2024-25"],
  "rows_upserted": 1640,
  "rows_per_term": {
    "T2-2025-26": 328,
    "T1-2025-26": 328,
    "T3-2024-25": 328,
    "T2-2024-25": 328,
    "T1-2024-25": 328
  }
}
```

`rows_per_term[term]` equals the cardinality of the active `(school × mat_standard)` grid for the MAT and is identical across terms (per-term grid is invariant in the current design).

**Response 400:** also `"No active schools × standards found for MAT <id>"` if the grid is empty.

#### Admin-2. Wipe mock assessments

```
DELETE /api/admin/mock-data/wipe
Authorization: Bearer <super-admin token>
Content-Type: application/json
```

Hard-deletes **every** `assessments` row for the target MAT and the supplied term(s). Does NOT inspect the `[MOCK …]` marker — every assessment in scope is removed regardless of whether it was generated by the tool or written by a real user. Use deliberately.

**Cascade behaviour:**
- `assessment_actions` rows linked to deleted assessments are removed via `fk_actions_assessment ON DELETE CASCADE`. The response reports the cascaded count so you can sanity-check.
- `standard_evidence` rows are **not** cascaded — their FKs target `mat_standards` / `schools` / `terms`, not `assessments.id`. Evidence is treated as a separately tracked artefact and survives a wipe. The response reports the surviving evidence count for the same MAT × term scope.

**Response 200:**

```json
{
  "mat_id": "HLT",
  "terms_wiped": ["T2-2025-26", "T1-2025-26", "T3-2024-25", "T2-2024-25", "T1-2024-25"],
  "rows_deleted": 1640,
  "rows_per_term": {
    "T2-2025-26": 328,
    "T1-2025-26": 328,
    "T3-2024-25": 328,
    "T2-2024-25": 328,
    "T1-2024-25": 328
  },
  "cascaded_actions_deleted": 0,
  "evidence_rows_remaining": 0
}
```

Wiping a scope with no rows returns `rows_deleted: 0` and is not an error.

---

## Deprecated endpoints

The following endpoints exist in `main.py` but should not be called by the frontend. They are documented here for completeness and to guide cleanup.

### `GET /api/users/me` — DEPRECATED

Returns a hardcoded `permissions` array and an empty `active_assessments` TODO. Never called by the frontend (`auth-service.ts` calls `/api/auth/me` instead). Different response shape from `UserResponse`. Recommend removal.

### `POST /api/auth/cleanup-expired-tokens` — NOT A FRONTEND ENDPOINT

Admin/cron utility. Not called by the frontend.

**The handler declares no dependencies at all** (`main.py:777`) — no `get_current_user`, no tier check, nothing. It is not that the endpoint is authenticated-but-unauthorised; it is entirely open, and anyone who can reach the service can call it. Verified 26 August 2026 by enumerating the dependency list of every route in `main.py`; it is one of only four routes with no dependencies, and the only one of those four that is neither public by design nor already recorded as a known issue for a different reason.

**Harm is low** — the endpoint deletes only already-expired magic-link tokens, which are useless by definition, so the worst outcome is unnecessary database load. It is nonetheless the only *unintentionally* unauthenticated endpoint in the API. See Known Issue #8. **Whether this is deliberate has not been confirmed** and is an open question for the product owner, not an assumption to be made either way.

---

## Known backend issues to remediate

| # | Location | Issue | Severity | Fix alongside |
|---|---|---|---|---|
| 1 | `GET /api/dashboard/schools` (main.py ~L1243) | **Resolved 2026-05-27** (commit `539664d`). The placeholder-comment defect was fixed by restoring the per-school summary query in its REQ-005 polarity-aware form; `view`, `actions`, `evidence_count`, `school_type`, `is_central_office` all now ship. See changelog v1.2. | Resolved | — |
| 2 | `POST /api/assessments/{assessment_id}/submit` | **Resolved 2026-06-04** (changelog v2.3). Endpoint deleted along with its `StandardRatingSubmission` / `AssessmentSubmission` Pydantic models. Frontend uses `PUT /api/assessments/{assessment_id}` and `POST /api/assessments/bulk-update`. | Resolved | — |
| 3 | `GET /api/debug/assessment-parsing/{id}` | **Resolved 2026-06-04** (changelog v2.3). Debug endpoint deleted. | Resolved | — |
| 4 | `GET /api/users/me` (main.py ~L2810) | Dead code. Hardcoded permissions array `["complete_assessments", "view_school_data"]` and `active_assessments: []` TODO. Never called by frontend. Different shape from `UserResponse`. | **Cosmetic** | Standalone removal |
| 5 | `GET /api/analytics/trends` | **Resolved 2026-06-04** (changelog v2.5). The dead `exceptional_count` / `exceptional` bucket counting impossible `rating = 5` rows has been dropped. | Resolved | — |
| 6 | `GET /api/analytics/trends` response | `rating_distribution` still uses string keys (`inadequate`, `concerning`, `good`, `strong`). Keys are now polarity-neutral and aligned with the live 1–4 scale (as of v2.5), but the planned REQ-004 migration to integer keys (`1`, `2`, `3`, `4`) is still future work. | **Cosmetic** | REQ-004 |
| 7 | `StandardRatingSubmission.rating` Pydantic comment | **Resolved 2026-06-04** (changelog v2.3). The `StandardRatingSubmission` model was deleted alongside the `POST /api/assessments/{assessment_id}/submit` endpoint that used it. | Resolved | — |
| 8 | `POST /api/auth/cleanup-expired-tokens` (main.py:777) | No auth requirement on an admin/cron endpoint. Anyone can call it. **Confirmed 26 August 2026 (SEC-001):** the handler declares no dependencies at all. Harm is low — it deletes only already-expired tokens — but it is the only unintentionally unauthenticated endpoint in the API. Whether it is deliberate is unconfirmed. | **Low security** | Standalone |
| 9 | `GET /api/terms` (main.py ~L2402) | No auth requirement. Only unprotected data endpoint. Terms are public reference data so risk is low, but inconsistent with other endpoints. | **Low** | Standalone |
| 10 | `PUT /api/assessments/{assessment_id}` and `POST /api/assessments/bulk-update` | **Resolved 2026-05-28** — superseded by the REQ-002 rework. Actions are no longer a free-text field on the assessment; they live in the `assessment_actions` child table and are managed via the dedicated endpoints in §32a-d. | Resolved | — |
| 11 | `GET /api/assessments/by-aspect/{aspect_code}` | **Resolved 2026-05-28** — `standard_type` is now added to the per-standard response dict. `actions` is no longer part of this payload (see §32a-d). | Resolved | — |
| 12 | `GET /api/standards/{mat_standard_id}` (single detail) | Selects `ms.standard_type` in the SQL but omits it from the `JSONResponse` content dict. The list endpoint (`GET /api/standards`) correctly returns it via `MatStandardResponse`. | **Cosmetic** — data is available, just not serialised | Standalone |
| 13 | `GET /api/assessments/{assessment_id}` (single detail) | **Resolved 2026-05-28** — `ms.standard_type` added to the SELECT and flows through `process_row_for_json` into the response. `actions` is no longer part of this payload (see §32a-d). | Resolved | — |

---

## Change log

| Version | Date | Change |
|---|---|---|
| v2.6 | 2026-08-26 | **SEC-001.** Documentation only — no endpoint, shape or behaviour changed. Added a **Authorisation tiers** section under Conventions, documenting the three dependency-enforced tiers (`get_current_user`, `verify_mat_admin`, `verify_super_admin`), the `SUPER_ADMIN_EMAILS` mechanism and its **deny-by-default** behaviour (unset ⇒ empty allow-list ⇒ everyone refused), and a table of which endpoints carry which tier. This exists because **the OpenAPI spec advertises only `HTTPBearer` and cannot express the upper two tiers**, so the spec understates the protection on the destructive admin endpoints — an earlier audit read the spec and concluded `DELETE /api/admin/mock-data/wipe` was unguarded. It is not; the guard was verified present on both admin endpoints. Corrected the Authentication section's list of endpoints not requiring a Bearer token, which omitted `POST /api/auth/cleanup-expired-tokens` — that endpoint declares no dependencies at all, which is now stated in its Deprecated-endpoints entry and in Known Issue #8, with the caveat that whether it is deliberate remains unconfirmed. |
| v1 | 2026-04-27 | Initial contract. Documents all live endpoints from `main.py`, target state for REQ-002/003/004/005 with `🚧 In-flight` tags, deprecated endpoints, and known backend issues. |
| v1.1 | 2026-05-21 | Renamed `aspect_category` enum value `"ofsted"` → `"strategic"` wherever it appears as a request body field, response field, or query param (List Aspects, Create Aspect, Update Aspect, Analytics Trends) and in JSON examples. Allowed values are now `"operational"` / `"strategic"`. |
| v1.2 | 2026-05-27 | `GET /api/assessments` response now includes `school_type` (string) and `is_central_office` (boolean) on each group row, sourced from the `schools` table. Restores the Trust/School selector on the Assessments screen. |
| v1.3 | 2026-05-28 | `GET /api/schools` now returns the central office row by default. Removed the `include_central` query param and the `AND is_central_office = FALSE` default filter — the endpoint always returns all active schools for the MAT. Callers that previously passed `include_central=true` will see no change in behaviour. |
| v1.4 | 2026-05-28 | Standardised `is_central_office` and `is_active` on `GET /api/schools` and `is_active` on `GET /api/users` / `POST /api/users` / `PUT /api/users/{user_id}` to JSON booleans (`true`/`false`) instead of `0`/`1`. Other endpoints (`/api/dashboard/schools`, `/api/assessments`, `/api/auth/*`) already returned booleans. Frontend no longer needs to coerce integers client-side. |
| v1.5 | 2026-05-28 | Doc reconciliation pass. Dropped `🚧 In-flight — REQ-002/003/005` tags from `GET /api/dashboard/schools` `view` param and `school_type` / `is_central_office` / `actions` / `evidence_count` fields — all now shipped. Marked Known Issue #1 (dashboard placeholder-comment defect) as **Resolved**. No new endpoints, no shape changes. |
| v1.6 | 2026-05-28 | REQ-002 rework. `actions` is no longer a free-text field on `assessments` — it's now a checklist of items in a new `assessment_actions` child table, managed via four new endpoints (§32a-d: `GET`/`POST` list/create + `PUT`/`DELETE` per item). `GET /api/dashboard/schools` returns `outstanding_actions_count` (integer) in place of the old `actions` (string). `GET /api/assessments/{id}` and `GET /api/assessments/by-aspect/{aspect_code}` no longer document `actions`; both now return `standard_type` on the per-standard rows. Known Issues #10, #11, #13 resolved. |
| v1.7 | 2026-05-30 | Removed stale `actions` field references from §25 and §26 (the actions work shipped as dedicated endpoints in §32a–d, not as a field on the assessment write endpoints). Doc-only cleanup; no shape change to deployed endpoints. |
| v1.8 | 2026-05-30 | Promoted the Evidence section (endpoints §28–31) from `🚧 In-flight — REQ-003` to live. REQ-003 shipped some time ago; preamble and section header updated to present tense. No endpoint-shape changes. |
| v1.9 | 2026-05-30 | Renumbered the four action-checklist endpoints from §31a–d to §32a–d to resolve a section-number collision with §31 (`DELETE /evidence/{evidence_id}`). Cross-references updated in §23, §24, §25, §26, Known Issues #10/#11/#13, and the v1.6/v1.7 changelog entries. Endpoint shapes and paths unchanged — only the doc section numbers. |
| v2.0 | 2026-05-30 | `GET /api/dashboard/schools` (§27) now returns two new per-school fields alongside `current_score`: `assurance_score` (raw average of assurance-type ratings) and `risk_score` (raw average of risk-type ratings). Both are `number \| null` — null when no standards of that type exist for the school. All three scores read "higher is better" on a 1–4 scale; `current_score` remains the only polarity-corrected one. Additive change — no existing field shape modified. |
| v2.1 | 2026-05-30 | `GET /api/dashboard/schools` (§27): simplified `current_score` and `intervention_required` to plain rating-based formulas. `current_score` is now `AVG(rating)` over all standards (was: risk ratings inverted via `5 - rating` before averaging). `intervention_required` now counts standards with `rating <= 2` (was: a polarity-branched check that flagged risk ratings >= 3). Both formulas were carrying obsolete polarity logic — under the current label convention (rating 4 = best for both `assurance` and `risk`, see `rating-labels.ts` and data-model bible §2.5), the inversion and branching produced wrong numbers. No shape changes; values shift toward the directionally correct semantics. |
| v2.2 | 2026-05-30 | Added two super-admin tooling endpoints: `POST /api/admin/mock-data/generate` and `DELETE /api/admin/mock-data/wipe` (see new "Admin tooling — mock data" section). Both gated by the `SUPER_ADMIN_EMAILS` env-var allow-list, not the existing MAT-administrator role. Generate UPSERTs random ratings across the active grid; wipe hard-deletes assessments for a MAT × term(s) with `assessment_actions` cascading and `standard_evidence` surviving by FK design. No frontend exposure — Swagger only. |
| v2.3 | 2026-05-30 | Removed two deprecated endpoints: `POST /api/assessments/{assessment_id}/submit` and `GET /api/debug/assessment-parsing/{id}`. Both referenced `assessments` columns (`standard_id`, `term_id`) renamed in the v2 schema rework; calls would have raised AttributeError or SQL errors. Frontend was not using either. Dropped from the "Deprecated endpoints" section. Pydantic models `StandardRatingSubmission` and `AssessmentSubmission` (only used by the removed submit endpoint) also deleted. No active functionality affected. |
| v2.4 | 2026-06-04 | `GET /api/dashboard/schools` (§27): `intervention_required` threshold tightened from `rating <= 2` to `rating = 1`. Product decision — the headline "Requires Attention" metric should flag only genuinely critical standards ("Inadequate" / "Critical risk"), not also "Needs work" / "Major risk". Per-school values will drop accordingly (a school with 3 rating-2 standards and 1 rating-1 standard previously returned 4; now returns 1). Field shape unchanged. No other dashboard fields touched. |
| v2.5 | 2026-06-04 | `GET /api/analytics/trends` `rating_distribution` realigned with the v2.4 intervention semantic and the live 1–4 scale. Dropped `exceptional` (counted impossible `rating = 5`, always `0` — see Known Issues #5, now resolved). Renamed `requires_improvement` → `concerning` (rating 2 is tracked for trend richness but is NOT the headline "Requires Attention" metric — that's `inadequate` / rating 1 only, matching `intervention_required`). Renamed `outstanding` → `strong` to match the polarity-neutral band vocabulary in `assurly-frontend/src/utils/performance-bands.ts`. Kept `inadequate` (rating 1) and `good` (rating 3). Final shape: `{inadequate, concerning, good, strong}`. SQL bucket aliases renamed in lockstep (`requires_improvement_count` → `concerning_count`, `outstanding_count` → `strong_count`, `exceptional_count` dropped). Frontend type `RatingDistribution` updated to match. Frontend has no live consumer of `rating_distribution` field shape (the type is declared but no component reads it), so this is a contract-only change with no UI impact. |
