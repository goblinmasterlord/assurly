# Assurly API v3.0 - Frontend Migration Guide

## Overview

This guide covers the major refactor from v2.x to v3.0, which introduces a multi-tenant architecture with MAT (Multi-Academy Trust) isolation, immutable versioning for standards, and copy-on-write customization patterns.

**Key Changes:**
- Multi-tenant architecture with MAT isolation
- Copy-on-write pattern for aspects and standards customization
- Immutable versioning system for standards
- Soft deletes (is_active flags)
- Enhanced JWT tokens with MAT context
- Comprehensive Swagger documentation at `/api/docs`

---

## Breaking Changes

### 1. Authentication Token Structure

**Old JWT Payload:**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "exp": 1234567890
}
```

**New JWT Payload:**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "mat_id": "uuid-of-mat",
  "school_id": "uuid-of-school-or-null",
  "exp": 1234567890,
  "iat": 1234567890,
  "type": "access"
}
```

**Migration:** Update your token parsing to extract `mat_id` and `school_id`. These are used for tenant isolation throughout the API.

### 2. User Response Structure

**Old Fields:**
- `role` (string)

**New Fields:**
- `role_title` (string) - Replaces `role`
- `mat_id` (string, required)
- `school_id` (string, nullable)

**Migration:**
```typescript
// Old
const userRole = user.role;

// New
const userRole = user.role_title;
const userMAT = user.mat_id;
const userSchool = user.school_id; // May be null for MAT-wide users
```

### 3. Aspects and Standards IDs

**Old:**
- Global aspects and standards tables
- IDs: `aspect_id`, `standard_id`

**New:**
- MAT-specific tables: `mat_aspects`, `mat_standards`
- IDs: `mat_aspect_id`, `mat_standard_id`
- Source tracking: `source_aspect_id`, `source_standard_id`

**Migration:** Update all references from `aspect_id` → `mat_aspect_id` and `standard_id` → `mat_standard_id`.

---

## Schema Changes

### Multi-Tenant Architecture

```
MAT (Organization)
├── mat_aspects (Customizable categories)
│   └── mat_standards (Versioned criteria)
├── schools (MAT members)
└── users (MAT staff, optional school assignment)
```

### New Tables

#### `mat_aspects`
```sql
mat_aspect_id         VARCHAR(36)  PRIMARY KEY
mat_id                VARCHAR(36)  NOT NULL (tenant isolation)
aspect_code           VARCHAR(50)  NOT NULL
aspect_name           VARCHAR(200) NOT NULL
aspect_description    TEXT
sort_order            INT
source_aspect_id      VARCHAR(36)  NULL (tracks customization source)
is_active             TINYINT(1)   DEFAULT 1 (soft delete)
created_at            DATETIME
updated_at            DATETIME
```

**Key Concepts:**
- `source_aspect_id IS NULL`: Custom aspect created by this MAT
- `source_aspect_id IS NOT NULL`: Copied/customized from another aspect

#### `mat_standards`
```sql
mat_standard_id       VARCHAR(36)  PRIMARY KEY
mat_id                VARCHAR(36)  NOT NULL (tenant isolation)
mat_aspect_id         VARCHAR(36)  NOT NULL
standard_code         VARCHAR(50)  NOT NULL
sort_order            INT
source_standard_id    VARCHAR(36)  NULL (tracks customization source)
is_active             TINYINT(1)   DEFAULT 1 (soft delete)
created_at            DATETIME
updated_at            DATETIME
```

**Key Concepts:**
- `source_standard_id IS NULL`: Custom standard created by this MAT
- `source_standard_id IS NOT NULL`: Copied/customized from another standard
- Content (name, description) stored in `standard_versions` table

#### `standard_versions`
```sql
version_id            VARCHAR(36)  PRIMARY KEY
mat_standard_id       VARCHAR(36)  NOT NULL (FK to mat_standards)
version_number        INT          NOT NULL (auto-increments)
standard_code         VARCHAR(50)  NOT NULL
standard_name         VARCHAR(200) NOT NULL
standard_description  TEXT
effective_from        DATETIME     NOT NULL
effective_to          DATETIME     NULL (NULL = current version)
created_by_user_id    VARCHAR(36)  NOT NULL
change_reason         TEXT
created_at            DATETIME
```

**Key Concepts:**
- Immutable versioning: Updates create new versions instead of modifying
- Current version: `effective_to IS NULL`
- Complete audit trail of all changes
- Point-in-time accuracy

---

## API Endpoints Reference

### Authentication

#### POST `/api/auth/request-magic-link`
Request a passwordless login link.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Magic link sent to user@example.com",
  "email": "user@example.com"
}
```

#### GET `/api/auth/verify/{token}`
Verify magic link token and get JWT.

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role_title": "Teacher",
    "mat_id": "mat-uuid",
    "school_id": "school-uuid-or-null"
  }
}
```

#### GET `/api/auth/me`
Get current authenticated user.

**Headers:** `Authorization: Bearer {token}`

**Response:** Same as verify endpoint's user object.

#### POST `/api/auth/logout`
Invalidate current JWT token.

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

---

### Aspects

All aspect endpoints require authentication and enforce MAT isolation.

#### GET `/api/aspects`
Get all aspects for the user's MAT.

**Response:**
```json
[
  {
    "mat_aspect_id": "uuid",
    "aspect_code": "EDU",
    "aspect_name": "Education",
    "aspect_description": "Educational standards and practices",
    "sort_order": 1,
    "is_custom": true,
    "is_modified": false,
    "standards_count": 25,
    "created_at": "2024-01-15T10:00:00",
    "updated_at": "2024-01-15T10:00:00"
  }
]
```

**Fields:**
- `is_custom`: `true` if created by this MAT, `false` if copied
- `is_modified`: `true` if customized from source
- `standards_count`: Number of active standards in this aspect

#### GET `/api/aspects/{mat_aspect_id}`
Get a specific aspect.

**Response:** Single aspect object (same structure as list).

#### POST `/api/aspects`
Create a new aspect or copy an existing one.

**Request (New Aspect):**
```json
{
  "aspect_code": "GOV",
  "aspect_name": "Governance",
  "aspect_description": "Governance standards",
  "sort_order": 2
}
```

**Request (Copy Existing):**
```json
{
  "aspect_code": "EDU",
  "aspect_name": "Education (Customized)",
  "aspect_description": "Our customized education standards",
  "sort_order": 1,
  "source_aspect_id": "source-uuid"
}
```

**Response:** Created aspect object with 201 status.

#### PUT `/api/aspects/{mat_aspect_id}`
Update an existing aspect.

**Request:**
```json
{
  "aspect_name": "Updated Name",
  "aspect_description": "Updated description",
  "sort_order": 3
}
```

**Response:** Updated aspect object.

#### DELETE `/api/aspects/{mat_aspect_id}`
Soft delete an aspect (sets `is_active = 0`).

**Response:** 204 No Content

---

### Standards

All standard endpoints require authentication and enforce MAT isolation.

#### GET `/api/standards`
Get all standards for the user's MAT, with optional filtering.

**Query Parameters:**
- `mat_aspect_id` (optional): Filter by aspect

**Response:**
```json
[
  {
    "mat_standard_id": "uuid",
    "mat_aspect_id": "aspect-uuid",
    "standard_code": "EDU-001",
    "standard_name": "Curriculum Planning",
    "standard_description": "Effective curriculum planning processes",
    "sort_order": 1,
    "is_custom": false,
    "is_modified": true,
    "version_number": 3,
    "version_id": "version-uuid",
    "aspect_code": "EDU",
    "aspect_name": "Education",
    "created_at": "2024-01-15T10:00:00",
    "updated_at": "2024-03-20T14:30:00"
  }
]
```

**Fields:**
- `version_number`: Current version number (increments on updates)
- `version_id`: ID of current version record
- `is_custom`: Created by this MAT vs. copied
- `is_modified`: Customized from source standard

#### GET `/api/standards/{mat_standard_id}`
Get a specific standard (current version).

**Response:** Single standard object (same structure as list).

#### POST `/api/standards`
Create a new standard.

**Request:**
```json
{
  "mat_aspect_id": "aspect-uuid",
  "standard_code": "EDU-001",
  "standard_name": "Curriculum Planning",
  "standard_description": "Effective curriculum planning processes",
  "sort_order": 1,
  "source_standard_id": "source-uuid-or-null",
  "change_reason": "Initial version"
}
```

**Response:** Created standard object (version 1) with 201 status.

#### PUT `/api/standards/{mat_standard_id}`
Update a standard (creates new version).

**Request:**
```json
{
  "standard_name": "Updated Curriculum Planning",
  "standard_description": "Updated description with new requirements",
  "change_reason": "Added 2024 curriculum requirements"
}
```

**Response:** Updated standard object with incremented `version_number`.

**Important:** Updates create a new version record. The old version is preserved with `effective_to` timestamp.

#### DELETE `/api/standards/{mat_standard_id}`
Soft delete a standard (sets `is_active = 0`).

**Response:** 204 No Content

#### GET `/api/standards/{mat_standard_id}/versions`
Get complete version history for a standard.

**Response:**
```json
[
  {
    "version_id": "uuid",
    "version_number": 3,
    "standard_code": "EDU-001",
    "standard_name": "Curriculum Planning v3",
    "standard_description": "Latest version with 2024 requirements",
    "effective_from": "2024-03-20T14:30:00",
    "effective_to": null,
    "created_by_user_id": "user-uuid",
    "change_reason": "Added 2024 curriculum requirements"
  },
  {
    "version_id": "uuid",
    "version_number": 2,
    "standard_code": "EDU-001",
    "standard_name": "Curriculum Planning v2",
    "standard_description": "Second version",
    "effective_from": "2024-02-01T09:00:00",
    "effective_to": "2024-03-20T14:30:00",
    "created_by_user_id": "user-uuid",
    "change_reason": "Updated based on feedback"
  },
  {
    "version_id": "uuid",
    "version_number": 1,
    "standard_code": "EDU-001",
    "standard_name": "Curriculum Planning",
    "standard_description": "Initial version",
    "effective_from": "2024-01-15T10:00:00",
    "effective_to": "2024-02-01T09:00:00",
    "created_by_user_id": "user-uuid",
    "change_reason": "Initial version"
  }
]
```

**Note:** Versions are returned in descending order (newest first). Current version has `effective_to: null`.

---

### Assessments

Assessment endpoints enforce both MAT isolation and school-level access control.

#### GET `/api/assessments`
Get assessments for schools in the user's MAT.

**Query Parameters:**
- `school_id` (optional): Filter by specific school
- `term_id` (optional): Filter by term (e.g., "T1", "T2")
- `academic_year` (optional): Filter by year (e.g., "2024-2025")

**Response:**
```json
[
  {
    "assessment_id": "composite-id",
    "school_id": "school-uuid",
    "school_name": "Example Primary School",
    "term_id": "T1",
    "academic_year": "2024-2025",
    "status": "in_progress",
    "standards": [
      {
        "standard_id": "standard-uuid",
        "standard_code": "EDU-001",
        "standard_name": "Curriculum Planning",
        "aspect_name": "Education",
        "rating": 3,
        "evidence_comments": "Good progress shown",
        "submitted_by": "user-uuid",
        "last_updated": "2024-03-20T14:30:00"
      }
    ]
  }
]
```

#### POST `/api/assessments`
Create a new assessment.

**Request:**
```json
{
  "school_id": "school-uuid",
  "term_id": "T1",
  "academic_year": "2024-2025"
}
```

**Response:** Created assessment with all standards initialized to rating 0.

#### GET `/api/assessments/{assessment_id}`
Get a specific assessment.

**Path Parameter:** `assessment_id` is composite: `{school_id}-{category}-{term_id}-{academic_year}`

**Response:** Single assessment object (same structure as list).

#### POST `/api/assessments/{assessment_id}/submit`
Submit an assessment for review.

**Response:**
```json
{
  "message": "Assessment submitted successfully",
  "assessment_id": "composite-id",
  "status": "submitted"
}
```

#### PUT `/api/assessments/{assessment_id}/standards/{standard_id}`
Update a specific standard within an assessment.

**Request:**
```json
{
  "rating": 4,
  "evidence_comments": "Excellent implementation of new curriculum"
}
```

**Response:**
```json
{
  "message": "Standard updated successfully",
  "assessment_id": "composite-id",
  "standard_id": "standard-uuid",
  "status": "success"
}
```

#### POST `/api/assessments/bulk-update`
Update multiple standards across different assessments.

**Request:**
```json
{
  "updates": [
    {
      "standard_id": "standard-uuid-1",
      "rating": 3,
      "evidence_comments": "Good progress"
    },
    {
      "standard_id": "standard-uuid-2",
      "rating": 4,
      "evidence_comments": "Excellent work"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Successfully updated 2 standards",
  "total_requested": 2,
  "status": "success"
}
```

---

### Schools

#### GET `/api/schools`
Get all schools in the user's MAT.

**Response:**
```json
[
  {
    "school_id": "uuid",
    "school_name": "Example Primary School",
    "mat_id": "mat-uuid",
    "created_at": "2024-01-15T10:00:00"
  }
]
```

---

### Users

#### GET `/api/users`
Get users in the user's MAT.

**Query Parameters:**
- `school_id` (optional): Filter by school
- `role_title` (optional): Filter by role

**Response:**
```json
[
  {
    "user_id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role_title": "Teacher",
    "mat_id": "mat-uuid",
    "school_id": "school-uuid-or-null"
  }
]
```

#### GET `/api/users/me`
Get current authenticated user (alias for `/api/auth/me`).

---

### Terms

#### GET `/api/terms`
Get all academic terms and periods.

**Response:**
```json
[
  {
    "term_id": "T1",
    "term_name": "Autumn Term",
    "start_date": "2024-09-01",
    "end_date": "2024-12-20",
    "academic_year": "2024-2025",
    "is_current": true
  }
]
```

---

## Migration Checklist

### 1. Update Authentication Flow

- [ ] Parse `mat_id` and `school_id` from JWT tokens
- [ ] Update user profile components to show `role_title` instead of `role`
- [ ] Store MAT context in application state

### 2. Update API Calls

- [ ] Replace all `aspect_id` with `mat_aspect_id`
- [ ] Replace all `standard_id` with `mat_standard_id`
- [ ] Update aspect/standard response parsing for new fields
- [ ] Handle `is_custom` and `is_modified` flags in UI

### 3. Handle Versioning

- [ ] Display current `version_number` in standard UI
- [ ] Add UI to view version history (`/api/standards/{id}/versions`)
- [ ] Show `change_reason` when viewing version history
- [ ] Handle version updates (new version created on PUT)

### 4. Implement MAT Isolation

- [ ] Remove any client-side MAT filtering (handled by API)
- [ ] Update error handling for 403 responses (cross-tenant access)
- [ ] Show MAT context in UI (optional, for clarity)

### 5. Update Forms

- [ ] Aspect create/edit forms: add `source_aspect_id` option
- [ ] Standard create/edit forms: add `source_standard_id` and `change_reason`
- [ ] Assessment forms: ensure school selection is MAT-scoped

### 6. Testing

- [ ] Test with multiple MAT users to verify isolation
- [ ] Test aspect/standard customization (copy-on-write)
- [ ] Test standard versioning and history
- [ ] Test soft deletes (deleted items not visible)
- [ ] Test bulk operations

---

## Common Patterns

### Copy-on-Write Customization

When a MAT wants to customize a standard:

```typescript
// 1. List available standards (shows is_custom flag)
const standards = await fetch('/api/standards');

// 2. Copy a standard by providing source_standard_id
await fetch('/api/standards', {
  method: 'POST',
  body: JSON.stringify({
    mat_aspect_id: aspectId,
    standard_code: 'EDU-001-CUSTOM',
    standard_name: 'Our Custom Curriculum Planning',
    standard_description: 'Customized for our MAT',
    source_standard_id: originalStandardId, // Links to source
    change_reason: 'Customized for our MAT requirements'
  })
});

// 3. The copied standard will have is_custom=false, is_modified=true
```

### Updating Standards with Versioning

```typescript
// Update creates a new version
await fetch(`/api/standards/${standardId}`, {
  method: 'PUT',
  body: JSON.stringify({
    standard_name: 'Updated Standard Name',
    standard_description: 'Updated description',
    change_reason: 'Updated based on 2024 requirements' // Required
  })
});

// View history
const versions = await fetch(`/api/standards/${standardId}/versions`);
// Returns all versions with effective_from/effective_to timestamps
```

### MAT Isolation

All endpoints automatically filter by the user's MAT:

```typescript
// These calls only return data for the user's MAT
const aspects = await fetch('/api/aspects');
const standards = await fetch('/api/standards');
const schools = await fetch('/api/schools');

// Attempting to access another MAT's data returns 403
await fetch(`/api/aspects/${otherMatAspectId}`); // 403 Forbidden
```

---

## Error Handling

### Common HTTP Status Codes

- `200 OK`: Successful GET/PUT request
- `201 Created`: Successful POST request
- `204 No Content`: Successful DELETE request
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Cross-tenant access attempt
- `404 Not Found`: Resource not found or not in your MAT
- `500 Internal Server Error`: Server error

### Example Error Response

```json
{
  "detail": "Standard not found or not accessible in your MAT"
}
```

### Frontend Error Handling Example

```typescript
async function fetchStandards() {
  try {
    const response = await fetch('/api/standards', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 403) {
      // Cross-tenant access attempt
      showError('Access denied to this resource');
    } else if (response.status === 401) {
      // Token expired or invalid
      redirectToLogin();
    } else if (!response.ok) {
      const error = await response.json();
      showError(error.detail);
    }

    return await response.json();
  } catch (error) {
    showError('Network error occurred');
  }
}
```

---

## Swagger Documentation

Full interactive API documentation is available at:

- **Swagger UI:** `http://your-domain/api/docs`
- **ReDoc:** `http://your-domain/api/redoc`
- **OpenAPI JSON:** `http://your-domain/api/openapi.json`

The Swagger UI provides:
- Try-it-out functionality for all endpoints
- Request/response examples
- Authentication flow testing
- Schema documentation

---

## Support

For questions or issues:
- Review the Swagger documentation at `/api/docs`
- Check the API code in `main.py`
- Contact the backend team for clarification

**Version:** 3.0.0
**Last Updated:** 2024-03-20
