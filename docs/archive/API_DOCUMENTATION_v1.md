# Assurly API Documentation

**Version:** 1.0  
**Base URL:** `https://assurly-frontend-400616570417.europe-west2.run.app/api`  
**Backend:** Google Cloud Run (Python/FastAPI)  
**Last Updated:** December 21, 2025

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Assessment Endpoints](#assessment-endpoints)
  - [School Endpoints](#school-endpoints)
  - [Standards & Aspects Endpoints](#standards--aspects-endpoints)
  - [User Endpoints](#user-endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Frontend Integration](#frontend-integration)

---

## Overview

The Assurly API provides a comprehensive RESTful interface for managing school maturity assessments across Multi-Academy Trusts (MATs). The API supports:

- Passwordless authentication via magic links
- Assessment creation, retrieval, and submission
- Standards and aspects management
- School and user data access
- Real-time progress tracking and analytics

### Key Features

- **JWT-based authentication** with automatic token refresh
- **Optimistic UI updates** for instant feedback
- **Request caching** with stale-while-revalidate pattern
- **CORS-enabled** for secure cross-origin requests
- **Production-ready** with comprehensive error handling

---

## Authentication

All API requests (except authentication endpoints) require a valid JWT token in the `Authorization` header.

### Authentication Flow

1. User requests magic link via email
2. User clicks link in email
3. Frontend verifies token and receives JWT
4. JWT is stored in `localStorage` as `assurly_auth_token`
5. All subsequent requests include: `Authorization: Bearer <token>`

### Token Storage

- **Storage Location:** `localStorage.assurly_auth_token`
- **Token Type:** JWT (JSON Web Token)
- **Automatic Inclusion:** The `api-client.ts` automatically includes the token in all requests
- **Token Refresh:** Automatic retry on 401 responses

---

## Endpoints

### Authentication Endpoints

#### POST /api/auth/request-magic-link

Request a magic link for passwordless authentication.

**Request Body:**
```json
{
  "email": "user@example.com",
  "redirect_url": "https://www.assurly.co.uk/auth/verify"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Magic link sent to email"
}
```

**Errors:**
- `400 Bad Request` - Invalid email format
- `404 Not Found` - Email not found in system
- `429 Too Many Requests` - Rate limit exceeded

**Notes:**
- Magic link expires after 15 minutes
- Only one active magic link per user at a time
- Does not require authentication

---

#### GET /api/auth/verify/{token}

Verify magic link token and receive JWT.

**Path Parameters:**
- `token` (string, required) - Magic link token from email

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "user123",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "mat_admin",
    "school_id": "school-123"
  },
  "expires_at": "2025-12-22T12:00:00Z"
}
```

**Errors:**
- `400 Bad Request` - Invalid token format
- `401 Unauthorized` - Token expired or invalid
- `404 Not Found` - Token not found

**Notes:**
- Token is single-use only
- JWT expires after 24 hours
- User object structure varies by role

---

#### GET /api/auth/me

Get current authenticated user information.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response (200 OK):**
```json
{
  "user_id": "user123",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "mat_admin",
  "school_id": "school-123"
}
```

**Errors:**
- `401 Unauthorized` - Invalid or expired token
- `403 Forbidden` - Insufficient permissions

**Notes:**
- Used for session validation
- Called on app initialization and page refresh

---

#### POST /api/auth/logout

Logout current user and invalidate token.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

**Errors:**
- `401 Unauthorized` - Invalid token

**Notes:**
- Frontend clears `localStorage` token regardless of API response
- Token is invalidated on server

---

### Assessment Endpoints

#### GET /api/assessments

Retrieve all assessments with optional filtering.

**Query Parameters:**
- `school_id` (string, optional) - Filter by school ID
- `category` (string, optional) - Filter by assessment category
- `term` (string, optional) - Filter by term (T1, T2, T3)
- `academic_year` (string, optional) - Filter by year (e.g., "2024-25")
- `status` (string, optional) - Filter by status: completed, in_progress, not_started

**Response (200 OK):**
```json
[
  {
    "assessment_id": "cedar-park-primary-education-T1-2024-25",
    "name": "Education Assessment",
    "category": "education",
    "school_id": "cedar-park-primary",
    "school_name": "Cedar Park Primary School",
    "mat_id": "OLT",
    "status": "in_progress",
    "completed_standards": 3,
    "total_standards": 6,
    "completion_percentage": 50.0,
    "overall_score": 2.67,
    "due_date": "2025-04-30",
    "assigned_to": ["user123"],
    "last_updated": "2025-03-20T10:00:00Z",
    "updated_by": "user123",
    "term_id": "T1",
    "academic_year": "2024-25"
  }
]
```

**Response Fields:**
- `assessment_id` - Composite key: `{school_id}-{category}-{term_id}-{academic_year}`
- `status` - Enum: `completed`, `in_progress`, `not_started`, `overdue`
- `overall_score` - Average rating (1-4) across completed standards
- `completion_percentage` - Percent of standards completed (0-100)

**Example Requests:**
```bash
# Get all assessments
curl -H "Authorization: Bearer <token>" \
  https://assurly-frontend-400616570417.europe-west2.run.app/api/assessments

# Filter by school
curl -H "Authorization: Bearer <token>" \
  "https://assurly-frontend-400616570417.europe-west2.run.app/api/assessments?school_id=cedar-park-primary"

# Multiple filters
curl -H "Authorization: Bearer <token>" \
  "https://assurly-frontend-400616570417.europe-west2.run.app/api/assessments?school_id=cedar-park-primary&status=in_progress&academic_year=2024-25"
```

**Notes:**
- Returns assessment summaries only (no detailed standards)
- Cached with stale-while-revalidate pattern in frontend
- Supports cross-school queries for MAT admins

---

#### GET /api/assessments/{assessment_id}

Retrieve detailed assessment including all standards.

**Path Parameters:**
- `assessment_id` (string, required) - Full assessment identifier

**Assessment ID Format:**  
`{school_id}-{category}-{term_id}-{academic_year}`  
Example: `cedar-park-primary-education-T1-2024-25`

**Response (200 OK):**
```json
{
  "assessment_id": "cedar-park-primary-education-T1-2024-25",
  "name": "Education Assessment",
  "category": "education",
  "school_id": "cedar-park-primary",
  "school_name": "Cedar Park Primary School",
  "status": "in_progress",
  "due_date": "2025-04-30",
  "assigned_to": ["user123"],
  "last_updated": "2025-03-20T10:00:00Z",
  "updated_by": "user123",
  "term_id": "T1",
  "academic_year": "2024-25",
  "standards": [
    {
      "standard_id": "ES1",
      "standard_name": "Quality of Education",
      "description": "",
      "area_id": "education",
      "rating": 3,
      "evidence_comments": "Our curriculum sequencing shows clear progression...",
      "submitted_at": "2025-03-18T14:30:00Z",
      "submitted_by": "user123",
      "has_attachments": false
    }
  ]
}
```

**Standard Fields:**
- `rating` - Integer 1-4 or null (1=Inadequate, 2=Requires Improvement, 3=Good, 4=Outstanding)
- `evidence_comments` - Text evidence supporting the rating
- `has_attachments` - Boolean (currently always false, reserved for future use)

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
  https://assurly-frontend-400616570417.europe-west2.run.app/api/assessments/cedar-park-primary-education-T1-2024-25
```

**Errors:**
- `404 Not Found` - Assessment doesn't exist
- `403 Forbidden` - User doesn't have access to this school

---

#### POST /api/assessments

Create new assessments for specified schools.

**Request Body:**
```json
{
  "category": "education",
  "school_ids": ["cedar-park-primary", "maple-grove-school"],
  "due_date": "2025-04-30",
  "term_id": "T1",
  "academic_year": "2024-25",
  "assigned_to": ["user123"]
}
```

**Request Fields:**
- `category` - Valid assessment category (education, hr, finance, estates, governance, it, is)
- `school_ids` - Array of school IDs to create assessments for
- `term_id` - T1 (Autumn), T2 (Spring), T3 (Summer)
- `academic_year` - Format: "2024-25"
- `assigned_to` - Array of user IDs (optional)

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Assessments created successfully",
  "assessment_ids": [
    "cedar-park-primary-education-T1-2024-25",
    "maple-grove-school-education-T1-2024-25"
  ]
}
```

**Errors:**
- `400 Bad Request` - Invalid category or school_ids
- `409 Conflict` - Assessment already exists for this combination
- `403 Forbidden` - User not authorized to create assessments

**Notes:**
- Creates assessment records with all standards for the category
- Standards are initially unrated (rating=null)
- Only MAT admins can create assessments

---

#### POST /api/assessments/{assessment_id}/submit

Submit or update ratings for one or multiple standards. Uses UPSERT logic to create or update records.

**Path Parameters:**
- `assessment_id` (string, required) - Assessment identifier

**Request Body:**
```json
{
  "assessment_id": "cedar-park-primary-education-T1-2024-25",
  "standards": [
    {
      "standard_id": "ES1",
      "rating": 4,
      "evidence_comments": "Excellent curriculum implementation...",
      "submitted_by": "user123"
    },
    {
      "standard_id": "ES2",
      "rating": 3,
      "evidence_comments": "Good teaching quality...",
      "submitted_by": "user123"
    }
  ]
}
```

**Request Fields:**
- `assessment_id` - Must match path parameter
- `standards` - Array of 1 or more standards
  - `standard_id` - Standard code (e.g., "ES1", "HR3")
  - `rating` - Integer 1-4 or null
  - `evidence_comments` - Supporting evidence text
  - `submitted_by` - User ID

**UPSERT Logic:**
- If standard rating doesn't exist: Creates new record
- If standard rating exists: Updates existing record
- Identification: `(school_id, standard_id, term_id, academic_year)`

**Response (200 OK):**
```json
{
  "message": "Successfully updated 2 standards",
  "assessment_id": "cedar-park-primary-education-T1-2024-25",
  "updated_standards": ["ES1", "ES2"],
  "status": "success"
}
```

**Use Cases:**
- **Progressive auto-save**: Save individual standards as completed
- **Bulk submission**: Submit all standards at once
- **Draft saving**: Save partial progress
- **Form auto-save**: Automatically save changes

**Example Requests:**

**Single standard (auto-save):**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "assessment_id": "cedar-park-primary-education-T1-2024-25",
    "standards": [{
      "standard_id": "ES1",
      "rating": 4,
      "evidence_comments": "Progressive save",
      "submitted_by": "user123"
    }]
  }' \
  https://assurly-frontend-400616570417.europe-west2.run.app/api/assessments/cedar-park-primary-education-T1-2024-25/submit
```

**Multiple standards (bulk):**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "assessment_id": "cedar-park-primary-education-T1-2024-25",
    "standards": [
      {"standard_id": "ES1", "rating": 4, "evidence_comments": "Excellent", "submitted_by": "user123"},
      {"standard_id": "ES2", "rating": 3, "evidence_comments": "Good", "submitted_by": "user123"}
    ]
  }' \
  https://assurly-frontend-400616570417.europe-west2.run.app/api/assessments/cedar-park-primary-education-T1-2024-25/submit
```

**Errors:**
- `400 Bad Request` - Invalid rating or standard_id
- `404 Not Found` - Assessment or standard doesn't exist
- `403 Forbidden` - User not assigned to this assessment

---

### School Endpoints

#### GET /api/schools

Retrieve list of schools, optionally filtered by MAT.

**Query Parameters:**
- `mat_id` (string, optional) - Filter by Multi-Academy Trust ID

**Response (200 OK):**
```json
[
  {
    "school_id": "cedar-park-primary",
    "school_name": "Cedar Park Primary",
    "school_code": "CED",
    "mat_id": "OLT",
    "mat_name": "Opal Learning Trust"
  },
  {
    "school_id": "maple-grove-school",
    "school_name": "Maple Grove School",
    "school_code": "MAP",
    "mat_id": "OLT",
    "mat_name": "Opal Learning Trust"
  }
]
```

**Response Fields:**
- `school_id` - Unique school identifier (kebab-case)
- `school_code` - 3-letter school code (auto-generated)
- `mat_id` - Multi-Academy Trust identifier
- `mat_name` - MAT display name

**Example Requests:**
```bash
# Get all schools
curl -H "Authorization: Bearer <token>" \
  https://assurly-frontend-400616570417.europe-west2.run.app/api/schools

# Get schools for specific MAT
curl -H "Authorization: Bearer <token>" \
  "https://assurly-frontend-400616570417.europe-west2.run.app/api/schools?mat_id=OLT"
```

**Use Cases:**
- Populate school selection dropdowns
- Filter assessments by school
- Display school information in dashboards

**Notes:**
- Schools rarely change, cached with long TTL in frontend
- Department heads see only their assigned schools
- MAT admins see all schools in their trust

---

### Standards & Aspects Endpoints

#### GET /api/aspects

Retrieve all assessment aspects/categories.

**Response (200 OK):**
```json
[
  {
    "aspect_id": "education",
    "aspect_name": "Education",
    "description": "Quality of education and curriculum",
    "standards_count": 12,
    "is_custom": false
  },
  {
    "aspect_id": "safeguarding",
    "aspect_name": "Safeguarding",
    "description": "Safeguarding policies and practices",
    "standards_count": 8,
    "is_custom": true
  }
]
```

**Response Fields:**
- `aspect_id` - Unique aspect identifier (lowercase)
- `aspect_name` - Display name
- `standards_count` - Number of standards in this aspect
- `is_custom` - Whether this is a custom aspect (not built-in)

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
  https://assurly-frontend-400616570417.europe-west2.run.app/api/aspects
```

**Notes:**
- Aspects group related standards together
- Built-in aspects: education, hr, finance, estates, governance, it, is
- Custom aspects can be created by MAT admins

---

#### POST /api/aspects

Create a new custom aspect.

**Request Body:**
```json
{
  "aspect_id": "wellbeing",
  "aspect_name": "Wellbeing"
}
```

**Request Fields:**
- `aspect_id` - Unique identifier (lowercase, no spaces)
- `aspect_name` - Display name

**Response (200 OK):**
```json
{
  "aspect_id": "wellbeing",
  "aspect_name": "Wellbeing",
  "description": "",
  "standards_count": 0,
  "is_custom": true
}
```

**Errors:**
- `409 Conflict` - Aspect ID already exists
- `400 Bad Request` - Invalid aspect_id format
- `403 Forbidden` - Only MAT admins can create aspects

**Notes:**
- Only MAT admins have access
- New aspects start with 0 standards
- Frontend automatically refreshes aspect list after creation

---

#### PUT /api/aspects/{aspect_id}

Update an existing aspect.

**Path Parameters:**
- `aspect_id` (string, required) - Aspect to update

**Request Body:**
```json
{
  "aspect_name": "Education & Curriculum"
}
```

**Response (200 OK):**
```json
{
  "aspect_id": "education",
  "aspect_name": "Education & Curriculum",
  "description": "Quality of education and curriculum",
  "standards_count": 12,
  "is_custom": false
}
```

**Errors:**
- `404 Not Found` - Aspect doesn't exist
- `403 Forbidden` - Cannot modify built-in aspects (depends on backend config)

---

#### DELETE /api/aspects/{aspect_id}

Delete a custom aspect.

**Path Parameters:**
- `aspect_id` (string, required) - Aspect to delete

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Aspect deleted successfully"
}
```

**Errors:**
- `404 Not Found` - Aspect doesn't exist
- `409 Conflict` - Cannot delete aspect with standards
- `403 Forbidden` - Cannot delete built-in aspects

**Notes:**
- Must delete all standards in aspect first
- Frontend shows confirmation dialog before deletion

---

#### GET /api/standards

Retrieve standards, optionally filtered by aspect.

**Query Parameters:**
- `aspect_id` (string, optional) - Filter by aspect

**Response (200 OK):**
```json
[
  {
    "standard_id": "ES1",
    "standard_name": "Quality of Education",
    "aspect_id": "education",
    "aspect_name": "Education",
    "description": "The quality of education provided to pupils",
    "sort_order": 1
  },
  {
    "standard_id": "ES2",
    "standard_name": "Behaviour and Attitudes",
    "aspect_id": "education",
    "aspect_name": "Education",
    "description": "The behaviour and attitudes of pupils",
    "sort_order": 2
  }
]
```

**Response Fields:**
- `standard_id` - Unique identifier (e.g., "ES1", "HR3")
- `sort_order` - Display order within aspect (1-based)
- `aspect_id` - Parent aspect identifier

**Example Requests:**
```bash
# Get all standards
curl -H "Authorization: Bearer <token>" \
  https://assurly-frontend-400616570417.europe-west2.run.app/api/standards

# Get education standards only
curl -H "Authorization: Bearer <token>" \
  "https://assurly-frontend-400616570417.europe-west2.run.app/api/standards?aspect_id=education"
```

**Notes:**
- Standards define the individual criteria rated in assessments
- Frontend caches by aspect for better performance
- Sorted by `sort_order` field

---

#### POST /api/standards

Create a new standard.

**Request Body:**
```json
{
  "standard_id": "ES10",
  "standard_name": "STEM Excellence",
  "aspect_id": "education",
  "description": "Quality of STEM education provision"
}
```

**Request Fields:**
- `standard_id` - Unique identifier (must be unique)
- `standard_name` - Display name
- `aspect_id` - Parent aspect
- `description` - Detailed description (optional)

**Response (200 OK):**
```json
{
  "standard_id": "ES10",
  "standard_name": "STEM Excellence",
  "aspect_id": "education",
  "aspect_name": "Education",
  "description": "Quality of STEM education provision",
  "sort_order": 13
}
```

**Errors:**
- `409 Conflict` - Standard ID already exists
- `404 Not Found` - Aspect doesn't exist
- `400 Bad Request` - Invalid standard_id format

**Notes:**
- `sort_order` is auto-assigned (max + 1 within aspect)
- Frontend invalidates both standards and aspects cache

---

#### PUT /api/standards/{standard_id}

Update an existing standard.

**Path Parameters:**
- `standard_id` (string, required) - Standard to update

**Request Body:**
```json
{
  "standard_name": "Quality of Education (Updated)",
  "description": "Updated description",
  "aspect_id": "education",
  "sort_order": 5
}
```

**Request Fields (all optional):**
- `standard_name` - New display name
- `description` - New description
- `aspect_id` - Move to different aspect
- `sort_order` - New sort order

**Response (200 OK):**
```json
{
  "standard_id": "ES1",
  "standard_name": "Quality of Education (Updated)",
  "aspect_id": "education",
  "aspect_name": "Education",
  "description": "Updated description",
  "sort_order": 5
}
```

**Errors:**
- `404 Not Found` - Standard doesn't exist
- `400 Bad Request` - Invalid aspect_id

**Notes:**
- Used for both editing and reordering
- Reordering updates multiple standards in parallel
- Frontend uses optimistic updates for reordering

---

#### DELETE /api/standards/{standard_id}

Delete a standard.

**Path Parameters:**
- `standard_id` (string, required) - Standard to delete

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Standard deleted successfully"
}
```

**Errors:**
- `404 Not Found` - Standard doesn't exist
- `409 Conflict` - Standard is used in assessments
- `403 Forbidden` - Only MAT admins can delete

**Notes:**
- Cannot delete standards used in any assessments
- Frontend shows warning with usage count

---

### User Endpoints

#### GET /api/users

Retrieve system users with optional filtering.

**Query Parameters:**
- `school_id` (string, optional) - Filter by school
- `role` (string, optional) - Filter by role (mat_admin, department_head)

**Response (200 OK):**
```json
[
  {
    "user_id": "user123",
    "email": "john.doe@example.com",
    "full_name": "John Doe",
    "role": "mat_admin",
    "school_id": null
  },
  {
    "user_id": "user456",
    "email": "jane.smith@example.com",
    "full_name": "Jane Smith",
    "role": "department_head",
    "school_id": "cedar-park-primary"
  }
]
```

**Response Fields:**
- `user_id` - Unique user identifier
- `role` - Either `mat_admin` or `department_head`
- `school_id` - Associated school (null for MAT admins)

**Example Requests:**
```bash
# Get all users
curl -H "Authorization: Bearer <token>" \
  https://assurly-frontend-400616570417.europe-west2.run.app/api/users

# Get users for specific school
curl -H "Authorization: Bearer <token>" \
  "https://assurly-frontend-400616570417.europe-west2.run.app/api/users?school_id=cedar-park-primary"

# Get department heads
curl -H "Authorization: Bearer <token>" \
  "https://assurly-frontend-400616570417.europe-west2.run.app/api/users?role=department_head"
```

**Use Cases:**
- Populate user assignment dropdowns
- Display user information in interfaces
- Validate user permissions

---

## Data Models

### Assessment Categories

Valid assessment categories:
- `education` - Education & Curriculum
- `hr` - Human Resources
- `finance` - Finance & Procurement
- `estates` - Estates & Facilities
- `governance` - Governance
- `it` - IT & Information Services
- `is` - Information Standards
- `safeguarding` - Safeguarding (custom)
- `faith` - Faith (custom)

### Academic Terms

- `T1` / `Autumn` - September to December
- `T2` / `Spring` - January to April
- `T3` / `Summer` - May to July

### Rating Scale

| Rating | Label | Description |
|--------|-------|-------------|
| 1 | Inadequate | Significant weaknesses requiring immediate intervention |
| 2 | Requires Improvement | Basic standards met with notable areas for development |
| 3 | Good | Consistent, effective practice with some areas of strength |
| 4 | Outstanding | Exemplary, sector-leading practice with sustained impact |
| null | Not Rated | Assessment not yet completed |

### Assessment Status

- `not_started` - No standards rated
- `in_progress` - Some standards rated (1+)
- `completed` - All standards rated
- `overdue` - Due date passed and not completed

### User Roles

- `mat_admin` - MAT Administrator (full access)
- `department_head` - Department Head (school-specific access)

---

## Error Handling

### Standard Error Response Format

```json
{
  "detail": "Error message description",
  "status_code": 400,
  "error_type": "ValidationError"
}
```

### HTTP Status Codes

| Code | Meaning | When it Occurs |
|------|---------|----------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data or parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | User doesn't have permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists or constraint violated |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 502 | Bad Gateway | Upstream service error |
| 503 | Service Unavailable | Service temporarily down |
| 504 | Gateway Timeout | Upstream service timeout |

### Frontend Error Handling

The frontend `api-client.ts` automatically:
- Retries 5xx errors (server errors)
- Attempts token refresh on 401 errors
- Provides user-friendly error messages
- Logs errors for debugging

**Example Error Messages:**
- `400`: "Invalid request. Please check your input and try again."
- `401`: "Authentication required. Please log in and try again."
- `403`: "You don't have permission to perform this action."
- `404`: "The requested resource was not found."
- `429`: "Too many requests. Please wait a moment and try again."
- `500`: "Server error. Our team has been notified. Please try again later."

---

## Rate Limiting

### Current Limits

- **Authentication endpoints**: 5 requests per minute per IP
- **Read operations (GET)**: 100 requests per minute per user
- **Write operations (POST/PUT/DELETE)**: 30 requests per minute per user

### Rate Limit Headers

Responses include rate limit information:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Handling Rate Limits

When rate limit is exceeded:
- Status: `429 Too Many Requests`
- Response includes `Retry-After` header (seconds)
- Frontend should implement exponential backoff

---

## Frontend Integration

### API Client Configuration

**Base URL:**
- **Production**: `https://assurly-frontend-400616570417.europe-west2.run.app/api`
- **Development**: Proxied via Vite to avoid CORS (configured in `vite.config.ts`)

**Configuration:**
```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'https://assurly-frontend-400616570417.europe-west2.run.app',
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path,
  }
}
```

### Request Caching

The frontend uses a custom `requestCache` with stale-while-revalidate:

**Cache Keys:**
- `assessments` - All assessments
- `assessment_detail` - Individual assessment (by ID)
- `schools` - All schools
- `standards` - Standards (by aspect_id)
- `aspects` - All aspects

**Cache Behavior:**
- Returns cached data immediately if available
- Refreshes in background if stale
- Notifies subscribers of updates
- Invalidates on mutations

**Example:**
```typescript
// Cached GET with automatic refresh
const assessments = await assessmentService.getAssessments();

// Subscribe to updates
const unsubscribe = assessmentService.subscribeToAssessments((data) => {
  console.log('Assessments updated:', data);
});
```

### Optimistic Updates

The frontend performs optimistic updates for:
- Assessment submissions (immediate UI update before API confirmation)
- Standard reordering (drag-and-drop)
- Filter changes

**Benefits:**
- Instant user feedback
- Better perceived performance
- Graceful error recovery (revert on failure)

### Authentication Integration

**Token Storage:**
```typescript
// Store token after login
localStorage.setItem('assurly_auth_token', token);

// Token is automatically included in all requests by api-client.ts
```

**Automatic Token Refresh:**
```typescript
// On 401 error, api-client automatically:
// 1. Calls authService.refreshSession()
// 2. Retries failed request with new token
// 3. If refresh fails, redirects to login
```

### Data Transformers

Backend data is transformed to frontend format via `data-transformers.ts`:

**Transformations:**
- `assessment_id` → `id`
- `school_name` → `school.name`
- `term_id` → `term` (T1 → Autumn)
- `academic_year` → expanded format (2024-25 → 2024-2025)
- `status` → title case (in_progress → In Progress)

**Example:**
```typescript
import { transformAssessmentSummary } from '@/lib/data-transformers';

const frontendAssessment = transformAssessmentSummary(apiResponse);
```

### Service Layer Architecture

**Three-tier architecture:**

1. **`api-client.ts`** - Low-level HTTP client with interceptors
2. **`assessment-service.ts`** - Direct API calls with basic transformations
3. **`enhanced-assessment-service.ts`** - Caching, optimistic updates, subscriptions

**Usage:**
```typescript
import { assessmentService } from '@/services/enhanced-assessment-service';

// Use enhanced service in components (includes caching)
const assessments = await assessmentService.getAssessments();

// Submit with optimistic update
await assessmentService.submitAssessment(id, standards, userId);
```

---

## Versioning

**Current Version:** 1.0

The API uses URL-based versioning (future):
- Current: `/api/...` (v1 implicit)
- Future: `/api/v2/...`

**Breaking Changes:**
- Communicated 30 days in advance
- Old version supported for 90 days after new version release
- Frontend updated before old version deprecation

---

## Support & Resources

**Frontend Repository:** Assurly Web Application  
**Backend API:** Google Cloud Run (Python/FastAPI)  
**Documentation Location:** `/API_DOCUMENTATION.md`  
**Migration Docs:** `/PRODUCTION_API_MIGRATION.md`

**For Issues:**
1. Check browser console for detailed error messages
2. Verify authentication token is valid
3. Check network tab for API request/response details
4. Review error response `detail` field for specific errors
5. File issues with reproduction steps

**Debugging Tips:**
- Enable debug mode: Set `VITE_DEBUG_API=true` in environment
- Check `localStorage.assurly_auth_token` for token presence
- Use browser DevTools Network tab to inspect requests
- Review frontend console logs for API call tracking

---

## Changelog

### Version 1.0 (December 21, 2025)
- Initial comprehensive API documentation
- Consolidated from multiple sources
- Added detailed request/response examples
- Documented frontend integration patterns
- Added error handling guide
- Included rate limiting information

---

**Document Status:** Current and Active  
**Last Review:** December 21, 2025  
**Next Review:** March 21, 2026

