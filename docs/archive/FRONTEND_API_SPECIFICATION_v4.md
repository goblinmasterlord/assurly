# Assurly Frontend API Specification

**Version:** 4.0.0  
**Last Updated:** 2025-12-29  
**Base URL:** `https://api.assurly.app` (Production) | `http://localhost:8000` (Development)

This document provides the complete API reference for frontend integration with the Assurly assessment platform.

---

## Table of Contents

1. [Authentication](#authentication)
2. [ID Conventions](#id-conventions)
3. [Common Patterns](#common-patterns)
4. [Endpoints](#endpoints)
   - [Authentication](#authentication-endpoints)
   - [Assessments](#assessment-endpoints)
   - [Standards](#standards-endpoints)
   - [Aspects](#aspects-endpoints)
   - [Schools](#schools-endpoints)
   - [Terms](#terms-endpoints)
   - [Analytics](#analytics-endpoints)
5. [TypeScript Interfaces](#typescript-interfaces)
6. [Error Handling](#error-handling)
7. [Example Flows](#example-flows)

---

## Authentication

All API requests (except `/api/auth/login`) require a valid JWT token.

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### JWT Payload Structure

```json
{
    "user_id": "user7",
    "email": "tom@thetransformative.com",
    "mat_id": "OLT",
    "school_id": null,
    "exp": 1735488000
}
```

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | User identifier |
| `email` | string | User's email address |
| `mat_id` | string | MAT tenant identifier (used for data isolation) |
| `school_id` | string \| null | `null` = trust-wide access, specific ID = school-restricted |
| `exp` | number | Token expiration timestamp |

---

## ID Conventions

All IDs follow human-readable patterns:

| Entity | Format | Examples |
|--------|--------|----------|
| MAT | `{CODE}` | `OLT`, `HLT` |
| School | `{slug}` | `cedar-park-primary`, `oak-hill-academy` |
| Central Office | `{MAT}-CENTRAL` | `OLT-CENTRAL`, `HLT-CENTRAL` |
| User | `user{N}` | `user7`, `user10` |
| Aspect (global) | `{CODE}` | `EDU`, `HR`, `FIN`, `EST`, `GOV`, `IT` |
| Standard (global) | `{CODE}` | `ES1`, `HR2`, `FM3`, `BO1`, `EG1`, `IS1` |
| MAT Aspect | `{MAT}-{CODE}` | `OLT-EDU`, `HLT-HR` |
| MAT Standard | `{MAT}-{CODE}` | `OLT-ES1`, `HLT-FM3` |
| Standard Version | `{MAT}-{CODE}-v{N}` | `OLT-ES1-v1`, `HLT-FM3-v2` |
| Term | `{TERM}-{YEAR}` | `T1-2024-25`, `T2-2023-24` |
| Assessment ID | `{school}-{code}-{term}` | `cedar-park-primary-ES1-T1-2024-25` |
| Group ID | `{school}-{aspect}-{term}` | `cedar-park-primary-EDU-T1-2024-25` |

---

## Common Patterns

### Pagination

Currently, endpoints return all matching records. Pagination will be added in a future version.

### Filtering

Query parameters use exact matching unless otherwise specified.

### MAT Isolation

All data is automatically filtered by the authenticated user's `mat_id`. Users can only access data belonging to their MAT.

### Date Formats

- **Dates:** `YYYY-MM-DD` (e.g., `2024-12-20`)
- **Timestamps:** ISO 8601 (e.g., `2024-12-22T10:30:00Z`)

### Rating Scale

| Value | Label | Description |
|-------|-------|-------------|
| `1` | Inadequate | Significant concerns requiring immediate action |
| `2` | Requires Improvement | Areas identified for development |
| `3` | Good | Solid performance meeting expected standards |
| `4` | Outstanding | Exemplary practice exceeding expectations |
| `null` | Not Rated | Assessment not yet completed |

---

## Endpoints

---

## Authentication Endpoints

### POST `/api/auth/login`

Request a magic link for passwordless authentication.

**Request:**
```json
{
    "email": "tom@thetransformative.com"
}
```

**Response:**
```json
{
    "message": "Magic link sent to your email",
    "email": "tom@thetransformative.com"
}
```

---

### GET `/api/auth/verify`

Verify magic link token and receive JWT.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | Yes | Magic link token from email |

**Response:**
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "user": {
        "user_id": "user7",
        "email": "tom@thetransformative.com",
        "full_name": "Tom Walch",
        "mat_id": "OLT",
        "school_id": null,
        "role_title": "MAT Administrator"
    }
}
```

---

### GET `/api/auth/me`

Get current authenticated user details.

**Response:**
```json
{
    "user_id": "user7",
    "email": "tom@thetransformative.com",
    "full_name": "Tom Walch",
    "mat_id": "OLT",
    "mat_name": "Opal Learning Trust",
    "school_id": null,
    "school_name": null,
    "role_title": "MAT Administrator",
    "is_active": true,
    "last_login": "2025-12-29T13:14:48Z"
}
```

---

## Assessment Endpoints

### GET `/api/assessments`

List assessments grouped by school, aspect, and term.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `school_id` | string | No | Filter by school slug |
| `aspect_code` | string | No | Filter by aspect code (EDU, HR, etc.) |
| `term_id` | string | No | Filter by term (T1, T2, T3) |
| `academic_year` | string | No | Filter by academic year (2024-25) |
| `status` | string | No | Filter by status (not_started, in_progress, completed) |

**Response:**
```json
[
    {
        "group_id": "cedar-park-primary-EDU-T1-2024-25",
        "school_id": "cedar-park-primary",
        "school_name": "Cedar Park Primary",
        "mat_aspect_id": "OLT-EDU",
        "aspect_code": "EDU",
        "aspect_name": "Education",
        "term_id": "T1",
        "academic_year": "2024-25",
        "status": "in_progress",
        "total_standards": 6,
        "completed_standards": 4,
        "due_date": "2024-12-20",
        "last_updated": "2024-12-22T10:30:00Z"
    },
    {
        "group_id": "cedar-park-primary-HR-T1-2024-25",
        "school_id": "cedar-park-primary",
        "school_name": "Cedar Park Primary",
        "mat_aspect_id": "OLT-HR",
        "aspect_code": "HR",
        "aspect_name": "Human Resources",
        "term_id": "T1",
        "academic_year": "2024-25",
        "status": "completed",
        "total_standards": 5,
        "completed_standards": 5,
        "due_date": "2024-12-20",
        "last_updated": "2024-12-21T15:45:00Z"
    }
]
```

**Status Calculation:**
- `not_started`: All ratings are null
- `in_progress`: Some ratings exist, not all complete
- `completed`: All standards have ratings

---

### GET `/api/assessments/{assessment_id}`

Get a single assessment detail.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `assessment_id` | string | Format: `{school}-{standard_code}-{term}` |

**Example:** `GET /api/assessments/cedar-park-primary-ES1-T1-2024-25`

**Response:**
```json
{
    "id": "b54453a5-df51-11f0-adf2-42010a400005",
    "assessment_id": "cedar-park-primary-ES1-T1-2024-25",
    "school_id": "cedar-park-primary",
    "school_name": "Cedar Park Primary",
    "mat_standard_id": "OLT-ES1",
    "standard_code": "ES1",
    "standard_name": "Quality of Education",
    "standard_description": "Curriculum intent, implementation, and impact. Focus on sequencing, ambition, progression, and outcomes across all key stages.",
    "mat_aspect_id": "OLT-EDU",
    "aspect_code": "EDU",
    "aspect_name": "Education",
    "version_id": "OLT-ES1-v1",
    "version_number": 1,
    "unique_term_id": "T1-2024-25",
    "academic_year": "2024-25",
    "rating": 3,
    "evidence_comments": "Good progress observed. Curriculum planning shows clear intent with appropriate sequencing.",
    "status": "completed",
    "due_date": "2024-12-20",
    "assigned_to": "user7",
    "assigned_to_name": "Tom Walch",
    "submitted_at": "2024-12-14T00:00:00Z",
    "submitted_by": "user7",
    "submitted_by_name": "Tom Walch",
    "last_updated": "2024-12-14T00:00:00Z"
}
```

---

### GET `/api/assessments/by-aspect/{aspect_code}`

Get all assessments for an aspect (all standards within that aspect) for a specific school and term. Used for the assessment form view.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `aspect_code` | string | Aspect code (EDU, HR, FIN, etc.) |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `school_id` | string | Yes | School slug |
| `term_id` | string | Yes | Unique term ID (T1-2024-25) |

**Example:** `GET /api/assessments/by-aspect/EDU?school_id=cedar-park-primary&term_id=T1-2024-25`

**Response:**
```json
{
    "school_id": "cedar-park-primary",
    "school_name": "Cedar Park Primary",
    "aspect_code": "EDU",
    "aspect_name": "Education",
    "mat_aspect_id": "OLT-EDU",
    "term_id": "T1-2024-25",
    "academic_year": "2024-25",
    "total_standards": 6,
    "completed_standards": 4,
    "status": "in_progress",
    "standards": [
        {
            "assessment_id": "cedar-park-primary-ES1-T1-2024-25",
            "mat_standard_id": "OLT-ES1",
            "standard_code": "ES1",
            "standard_name": "Quality of Education",
            "standard_description": "Curriculum intent, implementation...",
            "sort_order": 1,
            "rating": 3,
            "evidence_comments": "Good progress observed...",
            "version_id": "OLT-ES1-v1",
            "version_number": 1,
            "status": "completed"
        },
        {
            "assessment_id": "cedar-park-primary-ES2-T1-2024-25",
            "mat_standard_id": "OLT-ES2",
            "standard_code": "ES2",
            "standard_name": "Behaviour & Attitudes",
            "standard_description": "Standards of behaviour...",
            "sort_order": 2,
            "rating": null,
            "evidence_comments": null,
            "version_id": "OLT-ES2-v1",
            "version_number": 1,
            "status": "not_started"
        }
    ]
}
```

---

### PUT `/api/assessments/{assessment_id}`

Update an assessment's rating and evidence.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `assessment_id` | string | Format: `{school}-{standard_code}-{term}` |

**Request:**
```json
{
    "rating": 4,
    "evidence_comments": "Excellent implementation with strong evidence of impact across all year groups."
}
```

**Response:**
```json
{
    "message": "Assessment updated successfully",
    "assessment_id": "cedar-park-primary-ES1-T1-2024-25",
    "status": "completed"
}
```

**Notes:**
- Setting `rating` to a value (1-4) automatically sets status to `completed`
- Setting `rating` to `null` sets status to `in_progress`

---

### POST `/api/assessments`

Create assessments for schools/aspect/term combination.

**Request:**
```json
{
    "school_ids": ["cedar-park-primary", "oak-hill-academy"],
    "aspect_code": "EDU",
    "term_id": "T1-2025-26",
    "due_date": "2025-12-20",
    "assigned_to": "user7"
}
```

**Response:**
```json
{
    "message": "Created 12 assessments for 2 schools",
    "assessments_created": 12,
    "schools": ["cedar-park-primary", "oak-hill-academy"],
    "aspect_code": "EDU",
    "term_id": "T1-2025-26"
}
```

**Notes:**
- Creates one assessment per standard in the aspect, per school
- Skips if assessment already exists for that school/standard/term combination
- `term_id` must be in format `T1-2024-25` (unique_term_id)

---

### POST `/api/assessments/bulk-update`

Update multiple assessments in a single request.

**Request:**
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
        },
        {
            "assessment_id": "oak-hill-academy-ES1-T1-2024-25",
            "rating": 3,
            "evidence_comments": "Solid foundation"
        }
    ]
}
```

**Response:**
```json
{
    "message": "Updated 3 assessments",
    "updated_count": 3,
    "failed_count": 0
}
```

---

## Standards Endpoints

### GET `/api/standards`

List all standards for the MAT.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `aspect_code` | string | No | Filter by aspect code |

**Response:**
```json
[
    {
        "mat_standard_id": "OLT-ES1",
        "standard_code": "ES1",
        "standard_name": "Quality of Education",
        "standard_description": "Curriculum intent, implementation, and impact...",
        "sort_order": 1,
        "is_custom": false,
        "is_modified": false,
        "mat_aspect_id": "OLT-EDU",
        "aspect_code": "EDU",
        "aspect_name": "Education",
        "current_version_id": "OLT-ES1-v1",
        "current_version": 1
    },
    {
        "mat_standard_id": "OLT-ES2",
        "standard_code": "ES2",
        "standard_name": "Behaviour & Attitudes",
        "standard_description": "Standards of behaviour, attendance...",
        "sort_order": 2,
        "is_custom": false,
        "is_modified": false,
        "mat_aspect_id": "OLT-EDU",
        "aspect_code": "EDU",
        "aspect_name": "Education",
        "current_version_id": "OLT-ES2-v1",
        "current_version": 1
    }
]
```

---

### GET `/api/standards/{mat_standard_id}`

Get a single standard with version history.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `mat_standard_id` | string | Format: `{MAT}-{CODE}` (e.g., `OLT-ES1`) |

**Response:**
```json
{
    "mat_standard_id": "OLT-ES1",
    "standard_code": "ES1",
    "standard_name": "Quality of Education",
    "standard_description": "Curriculum intent, implementation, and impact...",
    "sort_order": 1,
    "is_custom": false,
    "is_modified": false,
    "mat_aspect_id": "OLT-EDU",
    "aspect_code": "EDU",
    "aspect_name": "Education",
    "created_at": "2025-12-22T00:08:34Z",
    "updated_at": "2025-12-22T00:08:34Z",
    "current_version": {
        "version_id": "OLT-ES1-v1",
        "version_number": 1,
        "effective_from": "2025-12-22T00:08:34Z",
        "effective_to": null
    },
    "version_history": [
        {
            "version_id": "OLT-ES1-v1",
            "version_number": 1,
            "standard_name": "Quality of Education",
            "standard_description": "Curriculum intent, implementation...",
            "effective_from": "2025-12-22T00:08:34Z",
            "effective_to": null,
            "change_reason": "Initial version - migrated from v1 schema",
            "created_by_name": null
        }
    ]
}
```

---

### PUT `/api/standards/{mat_standard_id}`

Update a standard (creates a new version).

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `mat_standard_id` | string | Format: `{MAT}-{CODE}` (e.g., `OLT-ES1`) |

**Request:**
```json
{
    "standard_name": "Quality of Education (Updated)",
    "standard_description": "Updated description with clearer assessment criteria for the 2025-26 academic year.",
    "change_reason": "Clarified requirements based on DfE guidance updates"
}
```

**Response:**
```json
{
    "message": "Standard updated successfully",
    "mat_standard_id": "OLT-ES1",
    "new_version_id": "OLT-ES1-v2",
    "version_number": 2,
    "previous_version_id": "OLT-ES1-v1"
}
```

**Notes:**
- Does NOT modify existing version - creates a new one
- Previous assessments remain linked to their original version
- Sets `is_modified = true` on the standard

---

## Aspects Endpoints

### GET `/api/aspects`

List all aspects for the MAT.

**Response:**
```json
[
    {
        "mat_aspect_id": "OLT-EDU",
        "aspect_code": "EDU",
        "aspect_name": "Education",
        "aspect_description": "Quality of teaching, learning, and educational outcomes",
        "sort_order": 1,
        "is_custom": false,
        "standards_count": 6
    },
    {
        "mat_aspect_id": "OLT-HR",
        "aspect_code": "HR",
        "aspect_name": "Human Resources",
        "aspect_description": "Staff management, recruitment, and workforce planning",
        "sort_order": 2,
        "is_custom": false,
        "standards_count": 5
    },
    {
        "mat_aspect_id": "OLT-FIN",
        "aspect_code": "FIN",
        "aspect_name": "Finance & Procurement",
        "aspect_description": "Financial governance, planning, and value for money",
        "sort_order": 3,
        "is_custom": false,
        "standards_count": 8
    },
    {
        "mat_aspect_id": "OLT-EST",
        "aspect_code": "EST",
        "aspect_name": "Estates",
        "aspect_description": "Buildings, facilities, health & safety, and asset management",
        "sort_order": 4,
        "is_custom": false,
        "standards_count": 6
    },
    {
        "mat_aspect_id": "OLT-GOV",
        "aspect_code": "GOV",
        "aspect_name": "Governance",
        "aspect_description": "Strategic leadership, accountability, and regulatory compliance",
        "sort_order": 5,
        "is_custom": false,
        "standards_count": 6
    },
    {
        "mat_aspect_id": "OLT-IT",
        "aspect_code": "IT",
        "aspect_name": "IT & Information Services",
        "aspect_description": "Data protection, systems management, and digital strategy",
        "sort_order": 6,
        "is_custom": false,
        "standards_count": 10
    }
]
```

---

## Schools Endpoints

### GET `/api/schools`

List all schools in the MAT.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `include_central` | boolean | No | `false` | Include Central Office pseudo-school |

**Response:**
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
        "school_id": "maple-grove-school",
        "school_name": "Maple Grove School",
        "school_type": "primary",
        "is_central_office": false,
        "is_active": true
    },
    {
        "school_id": "oak-hill-academy",
        "school_name": "Oak Hill Academy",
        "school_type": "primary",
        "is_central_office": false,
        "is_active": true
    },
    {
        "school_id": "willow-high-school",
        "school_name": "Willow High School",
        "school_type": "secondary",
        "is_central_office": false,
        "is_active": true
    }
]
```

**With `include_central=true`:**
```json
[
    {
        "school_id": "OLT-CENTRAL",
        "school_name": "Opal Learning Trust - Central Office",
        "school_type": "central",
        "is_central_office": true,
        "is_active": true
    },
    {
        "school_id": "cedar-park-primary",
        "school_name": "Cedar Park Primary",
        "school_type": "primary",
        "is_central_office": false,
        "is_active": true
    }
]
```

---

## Terms Endpoints

### GET `/api/terms`

List available academic terms.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `academic_year` | string | No | Filter by academic year (e.g., `2024-25`) |

**Response:**
```json
[
    {
        "unique_term_id": "T1-2025-26",
        "term_id": "T1",
        "term_name": "Autumn Term",
        "start_date": "2025-09-01",
        "end_date": "2025-12-31",
        "academic_year": "2025-26",
        "is_current": true
    },
    {
        "unique_term_id": "T3-2024-25",
        "term_id": "T3",
        "term_name": "Summer Term",
        "start_date": "2025-04-02",
        "end_date": "2025-08-31",
        "academic_year": "2024-25",
        "is_current": false
    },
    {
        "unique_term_id": "T2-2024-25",
        "term_id": "T2",
        "term_name": "Spring Term",
        "start_date": "2025-01-01",
        "end_date": "2025-04-01",
        "academic_year": "2024-25",
        "is_current": false
    },
    {
        "unique_term_id": "T1-2024-25",
        "term_id": "T1",
        "term_name": "Autumn Term",
        "start_date": "2024-09-01",
        "end_date": "2024-12-31",
        "academic_year": "2024-25",
        "is_current": false
    }
]
```

**Notes:**
- `is_current` is `true` if today's date falls within the term's date range
- Results ordered by academic year (descending) then term (T1, T2, T3)

---

## Analytics Endpoints

### GET `/api/analytics/trends`

Get rating trends over time for the analytics dashboard.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `school_id` | string | No | Filter to single school (omit for trust-wide) |
| `aspect_code` | string | No | Filter to single aspect |
| `from_term` | string | No | Start term (e.g., `T1-2023-24`) |
| `to_term` | string | No | End term (e.g., `T1-2025-26`) |

**Response:**
```json
{
    "mat_id": "OLT",
    "filters": {
        "school_id": null,
        "aspect_code": null,
        "from_term": "T1-2023-24",
        "to_term": "T1-2025-26"
    },
    "summary": {
        "total_terms": 7,
        "overall_average": 2.85,
        "trend_direction": "improving",
        "improvement": 1.4
    },
    "trends": [
        {
            "unique_term_id": "T1-2023-24",
            "term_id": "T1",
            "academic_year": "2023-24",
            "assessments_count": 164,
            "rated_count": 164,
            "average_rating": 2.1,
            "min_rating": 1,
            "max_rating": 3,
            "rating_distribution": {
                "inadequate": 25,
                "requires_improvement": 98,
                "good": 41,
                "outstanding": 0
            }
        },
        {
            "unique_term_id": "T2-2023-24",
            "term_id": "T2",
            "academic_year": "2023-24",
            "assessments_count": 164,
            "rated_count": 164,
            "average_rating": 2.4,
            "min_rating": 2,
            "max_rating": 3,
            "rating_distribution": {
                "inadequate": 0,
                "requires_improvement": 105,
                "good": 59,
                "outstanding": 0
            }
        },
        {
            "unique_term_id": "T1-2025-26",
            "term_id": "T1",
            "academic_year": "2025-26",
            "assessments_count": 164,
            "rated_count": 164,
            "average_rating": 3.5,
            "min_rating": 3,
            "max_rating": 4,
            "rating_distribution": {
                "inadequate": 0,
                "requires_improvement": 0,
                "good": 82,
                "outstanding": 82
            }
        }
    ]
}
```

**Summary Fields:**
- `trend_direction`: `"improving"` | `"declining"` | `"stable"` | `"no_data"`
- `improvement`: Difference between last and first term's average rating

---

## TypeScript Interfaces

```typescript
// ============================================================================
// Core Types
// ============================================================================

type AssessmentStatus = 'not_started' | 'in_progress' | 'completed' | 'approved';
type Rating = 1 | 2 | 3 | 4 | null;
type SchoolType = 'primary' | 'secondary' | 'all_through' | 'special' | 'central';
type TrendDirection = 'improving' | 'declining' | 'stable' | 'no_data';

// ============================================================================
// User & Auth
// ============================================================================

interface User {
    user_id: string;
    email: string;
    full_name: string;
    mat_id: string;
    mat_name?: string;
    school_id: string | null;
    school_name?: string | null;
    role_title: string | null;
    is_active: boolean;
    last_login: string | null;
}

interface AuthResponse {
    access_token: string;
    token_type: 'bearer';
    user: User;
}

// ============================================================================
// Assessments
// ============================================================================

interface AssessmentGroup {
    group_id: string;               // cedar-park-primary-EDU-T1-2024-25
    school_id: string;
    school_name: string;
    mat_aspect_id: string;          // OLT-EDU
    aspect_code: string;            // EDU
    aspect_name: string;
    term_id: string;                // T1
    academic_year: string;          // 2024-25
    status: AssessmentStatus;
    total_standards: number;
    completed_standards: number;
    due_date: string | null;
    last_updated: string;
}

interface Assessment {
    id: string;
    assessment_id: string;          // cedar-park-primary-ES1-T1-2024-25
    school_id: string;
    school_name: string;
    mat_standard_id: string;        // OLT-ES1
    standard_code: string;          // ES1
    standard_name: string;
    standard_description: string;
    mat_aspect_id: string;          // OLT-EDU
    aspect_code: string;            // EDU
    aspect_name: string;
    version_id: string;             // OLT-ES1-v1
    version_number: number;
    unique_term_id: string;         // T1-2024-25
    academic_year: string;          // 2024-25
    rating: Rating;
    evidence_comments: string | null;
    status: AssessmentStatus;
    due_date: string | null;
    assigned_to: string | null;
    assigned_to_name: string | null;
    submitted_at: string | null;
    submitted_by: string | null;
    submitted_by_name: string | null;
    last_updated: string;
}

interface AssessmentByAspect {
    school_id: string;
    school_name: string;
    aspect_code: string;
    aspect_name: string;
    mat_aspect_id: string;
    term_id: string;
    academic_year: string;
    total_standards: number;
    completed_standards: number;
    status: AssessmentStatus;
    standards: AssessmentStandard[];
}

interface AssessmentStandard {
    assessment_id: string;
    mat_standard_id: string;
    standard_code: string;
    standard_name: string;
    standard_description: string;
    sort_order: number;
    rating: Rating;
    evidence_comments: string | null;
    version_id: string;
    version_number: number;
    status: AssessmentStatus;
}

interface AssessmentUpdate {
    rating: Rating;
    evidence_comments: string;
}

interface AssessmentCreate {
    school_ids: string[];
    aspect_code: string;
    term_id: string;                // unique_term_id format: T1-2024-25
    due_date?: string;
    assigned_to?: string;
}

interface BulkUpdate {
    assessment_id: string;
    rating: Rating;
    evidence_comments: string;
}

// ============================================================================
// Standards
// ============================================================================

interface Standard {
    mat_standard_id: string;        // OLT-ES1
    standard_code: string;          // ES1
    standard_name: string;
    standard_description: string;
    sort_order: number;
    is_custom: boolean;
    is_modified: boolean;
    mat_aspect_id: string;          // OLT-EDU
    aspect_code: string;            // EDU
    aspect_name: string;
    current_version_id: string;     // OLT-ES1-v1
    current_version: number;
}

interface StandardDetail extends Standard {
    created_at: string;
    updated_at: string;
    current_version: StandardVersion;
    version_history: StandardVersion[];
}

interface StandardVersion {
    version_id: string;             // OLT-ES1-v1
    version_number: number;
    standard_name: string;
    standard_description: string;
    effective_from: string;
    effective_to: string | null;
    change_reason: string | null;
    created_by_name: string | null;
}

interface StandardUpdate {
    standard_name: string;
    standard_description: string;
    change_reason?: string;
}

// ============================================================================
// Aspects
// ============================================================================

interface Aspect {
    mat_aspect_id: string;          // OLT-EDU
    aspect_code: string;            // EDU
    aspect_name: string;
    aspect_description: string;
    sort_order: number;
    is_custom: boolean;
    standards_count: number;
}

// ============================================================================
// Schools
// ============================================================================

interface School {
    school_id: string;              // cedar-park-primary
    school_name: string;
    school_type: SchoolType;
    is_central_office: boolean;
    is_active: boolean;
}

// ============================================================================
// Terms
// ============================================================================

interface Term {
    unique_term_id: string;         // T1-2024-25
    term_id: string;                // T1
    term_name: string;              // Autumn Term
    start_date: string;
    end_date: string;
    academic_year: string;          // 2024-25
    is_current: boolean;
}

// ============================================================================
// Analytics
// ============================================================================

interface TrendData {
    mat_id: string;
    filters: {
        school_id: string | null;
        aspect_code: string | null;
        from_term: string | null;
        to_term: string | null;
    };
    summary: {
        total_terms: number;
        overall_average: number;
        trend_direction: TrendDirection;
        improvement: number;
    };
    trends: TermTrend[];
}

interface TermTrend {
    unique_term_id: string;
    term_id: string;
    academic_year: string;
    assessments_count: number;
    rated_count: number;
    average_rating: number | null;
    min_rating: number | null;
    max_rating: number | null;
    rating_distribution: RatingDistribution;
}

interface RatingDistribution {
    inadequate: number;
    requires_improvement: number;
    good: number;
    outstanding: number;
}

// ============================================================================
// API Responses
// ============================================================================

interface ApiSuccess<T = void> {
    message: string;
    data?: T;
}

interface ApiError {
    detail: string;
    error_code?: string;
}

interface CreateAssessmentResponse {
    message: string;
    assessments_created: number;
    schools: string[];
    aspect_code: string;
    term_id: string;
}

interface UpdateAssessmentResponse {
    message: string;
    assessment_id: string;
    status: AssessmentStatus;
}

interface BulkUpdateResponse {
    message: string;
    updated_count: number;
    failed_count: number;
}

interface UpdateStandardResponse {
    message: string;
    mat_standard_id: string;
    new_version_id: string;
    version_number: number;
    previous_version_id: string;
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| `200` | OK | Successful GET, PUT |
| `201` | Created | Successful POST (create) |
| `400` | Bad Request | Invalid request body or parameters |
| `401` | Unauthorized | Missing or invalid JWT token |
| `403` | Forbidden | Accessing data outside user's MAT |
| `404` | Not Found | Resource doesn't exist |
| `422` | Unprocessable Entity | Validation error |
| `500` | Internal Server Error | Server-side error |

### Error Response Format

```json
{
    "detail": "Assessment not found",
    "error_code": "NOT_FOUND"
}
```

### Frontend Error Handling Example

```typescript
async function apiRequest<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        
        switch (response.status) {
            case 401:
                // Redirect to login
                window.location.href = '/login';
                break;
            case 403:
                throw new Error('You do not have permission to access this resource');
            case 404:
                throw new Error(error.detail || 'Resource not found');
            default:
                throw new Error(error.detail || 'An error occurred');
        }
    }

    return response.json();
}
```

---

## Example Flows

### 1. Load Assessment Dashboard

```typescript
// On dashboard mount
async function loadDashboard() {
    const [schools, aspects, terms, assessments] = await Promise.all([
        api.get<School[]>('/api/schools'),
        api.get<Aspect[]>('/api/aspects'),
        api.get<Term[]>('/api/terms'),
        api.get<AssessmentGroup[]>('/api/assessments'),
    ]);
    
    // Find current term
    const currentTerm = terms.find(t => t.is_current);
    
    // Render dashboard with data
    setState({ schools, aspects, terms, assessments, currentTerm });
}
```

### 2. Open Assessment Form (All Standards in an Aspect)

```typescript
async function openAssessmentForm(schoolId: string, aspectCode: string, termId: string) {
    const data = await api.get<AssessmentByAspect>(
        `/api/assessments/by-aspect/${aspectCode}?school_id=${schoolId}&term_id=${termId}`
    );
    
    // Render form with all standards
    setState({ 
        formData: data,
        standards: data.standards 
    });
}
```

### 3. Save Assessment Rating

```typescript
async function saveRating(assessmentId: string, rating: number, evidence: string) {
    await api.put<UpdateAssessmentResponse>(
        `/api/assessments/${assessmentId}`,
        { rating, evidence_comments: evidence }
    );
    
    // Refresh the form data
    await refreshAssessmentForm();
}
```

### 4. Bulk Save All Ratings in Form

```typescript
async function saveAllRatings(standards: AssessmentStandard[]) {
    const updates = standards
        .filter(s => s.rating !== null)
        .map(s => ({
            assessment_id: s.assessment_id,
            rating: s.rating,
            evidence_comments: s.evidence_comments || ''
        }));
    
    const result = await api.post<BulkUpdateResponse>(
        '/api/assessments/bulk-update',
        { updates }
    );
    
    showNotification(`Saved ${result.updated_count} assessments`);
}
```

### 5. Create New Assessment Round

```typescript
async function createAssessmentRound(
    schoolIds: string[],
    aspectCode: string,
    termId: string,
    dueDate: string
) {
    const result = await api.post<CreateAssessmentResponse>(
        '/api/assessments',
        {
            school_ids: schoolIds,
            aspect_code: aspectCode,
            term_id: termId,
            due_date: dueDate
        }
    );
    
    showNotification(result.message);
    await refreshDashboard();
}
```

### 6. Load Analytics Chart

```typescript
async function loadTrendsChart(filters: {
    schoolId?: string;
    aspectCode?: string;
    fromTerm?: string;
    toTerm?: string;
}) {
    const params = new URLSearchParams();
    if (filters.schoolId) params.set('school_id', filters.schoolId);
    if (filters.aspectCode) params.set('aspect_code', filters.aspectCode);
    if (filters.fromTerm) params.set('from_term', filters.fromTerm);
    if (filters.toTerm) params.set('to_term', filters.toTerm);
    
    const data = await api.get<TrendData>(`/api/analytics/trends?${params}`);
    
    // Render chart
    renderTrendChart(data.trends);
    renderSummaryCards(data.summary);
}
```

---

## Changelog

### v4.0.0 (2025-12-29)
- Complete migration to human-readable IDs
- Added MAT tenant isolation to all endpoints
- Added standard versioning support
- New endpoints: `/api/assessments/by-aspect`, `/api/analytics/trends`
- Updated all response formats

### v3.0.0 (2024-12-22)
- Initial multi-tenant support
- UUID-based IDs (deprecated)

---

**Document Version:** 4.0.0  
**API Version:** 4.0.0  
**Last Updated:** 2025-12-29
