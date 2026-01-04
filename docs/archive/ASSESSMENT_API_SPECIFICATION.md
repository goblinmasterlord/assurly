# Assessment API Specification

**Version:** 3.0.0
**Last Updated:** 2024-12-22

This document provides the **actual, current** schema and API specification for the Assurly assessment system. All examples are based on real database queries and response formats.

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [API Endpoints](#api-endpoints)
3. [Query Patterns](#query-patterns)
4. [Response Formats](#response-formats)
5. [Frontend Integration Guide](#frontend-integration-guide)

---

## Database Schema

### Core Tables

#### `assessments`
Individual assessment records for each standard within a school/term/year combination.

```sql
CREATE TABLE assessments (
    id                  VARCHAR(36) PRIMARY KEY,
    school_id           VARCHAR(36) NOT NULL,
    standard_id         VARCHAR(36) NOT NULL,
    term_id             VARCHAR(10) NOT NULL,
    academic_year       VARCHAR(20) NOT NULL,
    rating              INT DEFAULT 0,
    evidence_comments   TEXT,
    submitted_at        DATETIME NULL,
    submitted_by        VARCHAR(36) NULL,
    due_date            DATE NULL,
    assigned_to         VARCHAR(36) NULL,
    last_updated        DATETIME DEFAULT NOW(),
    updated_by          VARCHAR(36) NULL,

    FOREIGN KEY (school_id) REFERENCES schools(school_id),
    FOREIGN KEY (standard_id) REFERENCES standards(standard_id)
);
```

**Key Points:**
- Each row represents one standard's assessment within a school/term/year
- Multiple rows share the same (school_id, aspect_id, term_id, academic_year) = one "assessment"
- Composite assessment_id: `{school_id}-{aspect_id}-{term_id}-{academic_year}`

#### `standards`
Assessment criteria/standards belonging to aspects.

```sql
CREATE TABLE standards (
    standard_id         VARCHAR(36) PRIMARY KEY,
    aspect_id           VARCHAR(10) NOT NULL,
    standard_code       VARCHAR(50) NOT NULL,
    standard_name       VARCHAR(200) NOT NULL,
    standard_description TEXT,
    sort_order          INT DEFAULT 0,

    FOREIGN KEY (aspect_id) REFERENCES aspects(aspect_id)
);
```

#### `aspects`
Top-level categories (e.g., Education, Governance, Safety).

```sql
CREATE TABLE aspects (
    aspect_id           VARCHAR(10) PRIMARY KEY,
    aspect_code         VARCHAR(50) NOT NULL,
    aspect_name         VARCHAR(200) NOT NULL,
    aspect_description  TEXT,
    sort_order          INT DEFAULT 0
);
```

**Example Data:**
```sql
INSERT INTO aspects VALUES
    ('edu', 'EDU', 'Education', 'Educational standards and practices', 1),
    ('gov', 'GOV', 'Governance', 'Governance and leadership', 2),
    ('safe', 'SAFE', 'Safety', 'Health and safety standards', 3);
```

#### `schools`
Schools belonging to MATs (Multi-Academy Trusts).

```sql
CREATE TABLE schools (
    school_id           VARCHAR(36) PRIMARY KEY,
    school_name         VARCHAR(200) NOT NULL,
    mat_id              VARCHAR(36) NOT NULL,
    created_at          DATETIME DEFAULT NOW(),

    FOREIGN KEY (mat_id) REFERENCES mats(mat_id)
);
```

### Data Model Relationships

```
MAT
└── Schools
    └── Assessments (grouped by aspect + term + year)
        └── Individual Standard Ratings

Aspects
└── Standards
    └── Assessment Records (in assessments table)
```

---

## API Endpoints

### GET `/api/assessments`

Get list of assessments grouped by school, aspect, term, and academic year.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:**
- `school_id` (optional): Filter by school UUID
- `category` (optional): Filter by aspect_id (e.g., "edu", "gov")
- `term` (optional): Filter by term (e.g., "T1", "T2", "T3")
- `academic_year` (optional): Filter by year (e.g., "2024-2025")
- `status` (optional): Filter by status ("not_started", "in_progress", "submitted")

**SQL Query Pattern:**
```sql
SELECT
    CONCAT(a.school_id, '-', asp.aspect_id, '-', a.term_id, '-', a.academic_year) as assessment_id,
    a.school_id,
    sch.school_name,
    asp.aspect_id,
    asp.aspect_code,
    asp.aspect_name,
    a.term_id,
    a.academic_year,
    MAX(a.due_date) as due_date,
    MAX(a.assigned_to) as assigned_to,
    MAX(a.last_updated) as last_updated,
    MAX(a.updated_by) as updated_by,
    CASE
        WHEN COUNT(CASE WHEN a.rating IS NULL OR a.rating = 0 THEN 1 END) = COUNT(*) THEN 'not_started'
        WHEN COUNT(CASE WHEN a.submitted_at IS NOT NULL THEN 1 END) = COUNT(*) THEN 'submitted'
        ELSE 'in_progress'
    END as status,
    COUNT(*) as total_standards,
    COUNT(CASE WHEN a.rating > 0 THEN 1 END) as completed_standards
FROM assessments a
JOIN schools sch ON a.school_id = sch.school_id
JOIN standards st ON a.standard_id = st.standard_id
JOIN aspects asp ON st.aspect_id = asp.aspect_id
WHERE sch.mat_id = %s
GROUP BY a.school_id, asp.aspect_id, asp.aspect_code, asp.aspect_name,
         a.term_id, a.academic_year, sch.school_name
ORDER BY last_updated DESC
```

**Response Example:**
```json
[
    {
        "assessment_id": "550e8400-e29b-41d4-a716-446655440000-edu-T1-2024-2025",
        "school_id": "550e8400-e29b-41d4-a716-446655440000",
        "school_name": "Greenfield Primary School",
        "aspect_id": "edu",
        "aspect_code": "EDU",
        "aspect_name": "Education",
        "term_id": "T1",
        "academic_year": "2024-2025",
        "due_date": "2024-12-20",
        "assigned_to": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        "last_updated": "2024-12-22T10:30:00Z",
        "updated_by": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        "status": "in_progress",
        "total_standards": 25,
        "completed_standards": 18
    },
    {
        "assessment_id": "550e8400-e29b-41d4-a716-446655440000-gov-T1-2024-2025",
        "school_id": "550e8400-e29b-41d4-a716-446655440000",
        "school_name": "Greenfield Primary School",
        "aspect_id": "gov",
        "aspect_code": "GOV",
        "aspect_name": "Governance",
        "term_id": "T1",
        "academic_year": "2024-2025",
        "due_date": "2024-12-20",
        "assigned_to": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        "last_updated": "2024-12-21T15:45:00Z",
        "updated_by": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        "status": "submitted",
        "total_standards": 15,
        "completed_standards": 15
    }
]
```

**Response Fields:**
- `assessment_id`: Composite ID format `{school_id}-{aspect_id}-{term_id}-{academic_year}`
- `aspect_id`: Aspect identifier (e.g., "edu", "gov", "safe")
- `aspect_code`: Human-readable code (e.g., "EDU", "GOV")
- `aspect_name`: Display name (e.g., "Education")
- `status`: Calculated from individual standard ratings:
  - `not_started`: All ratings are 0 or NULL
  - `in_progress`: Some ratings > 0, not all submitted
  - `submitted`: All standards have submitted_at timestamp
- `total_standards`: Total number of standards in this aspect
- `completed_standards`: Number of standards with rating > 0

---

### GET `/api/assessments/{assessment_id}`

Get detailed assessment information including all standards and their ratings.

**Authentication:** Required (JWT Bearer token)

**Path Parameter:**
- `assessment_id`: Composite ID `{school_id}-{aspect_id}-{term_id}-{academic_year}`

**Example:** `/api/assessments/550e8400-e29b-41d4-a716-446655440000-edu-T1-2024-2025`

**SQL Query Pattern:**
```sql
-- First, parse assessment_id to extract components:
-- school_id: Parts before aspect_id
-- aspect_id: Part before term_id (e.g., "edu")
-- term_id: Part matching T\d+ pattern (e.g., "T1")
-- academic_year: Parts after term_id (e.g., "2024-2025")

SELECT
    %s as assessment_id,
    a.school_id,
    sch.school_name,
    a.term_id,
    a.academic_year,
    asp.aspect_id,
    asp.aspect_code,
    asp.aspect_name,
    a.standard_id,
    st.standard_name,
    a.rating,
    a.evidence_comments,
    a.submitted_at,
    a.submitted_by,
    a.due_date,
    a.assigned_to,
    a.last_updated,
    a.updated_by,
    CASE
        WHEN a.submitted_at IS NOT NULL THEN 'submitted'
        WHEN a.rating > 0 THEN 'in_progress'
        ELSE 'not_started'
    END as status,
    CASE WHEN EXISTS (
        SELECT 1 FROM assessment_attachments aa
        WHERE aa.assessment_id = a.id
    ) THEN 1 ELSE 0 END as has_attachments
FROM assessments a
JOIN schools sch ON a.school_id = sch.school_id
JOIN standards st ON a.standard_id = st.standard_id
JOIN aspects asp ON st.aspect_id = asp.aspect_id
WHERE a.school_id = %s
  AND asp.aspect_id = %s
  AND a.term_id = %s
  AND a.academic_year = %s
  AND sch.mat_id = %s
ORDER BY st.sort_order, st.standard_code
```

**Response Example:**
```json
{
    "assessment_id": "550e8400-e29b-41d4-a716-446655440000-edu-T1-2024-2025",
    "name": "Education Assessment - T1 2024-2025",
    "school_id": "550e8400-e29b-41d4-a716-446655440000",
    "school_name": "Greenfield Primary School",
    "aspect_id": "edu",
    "aspect_code": "EDU",
    "aspect_name": "Education",
    "term_id": "T1",
    "academic_year": "2024-2025",
    "status": "in_progress",
    "due_date": "2024-12-20",
    "assigned_to": ["6ba7b810-9dad-11d1-80b4-00c04fd430c8"],
    "last_updated": "2024-12-22T10:30:00Z",
    "updated_by": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "standards": [
        {
            "standard_id": "std-edu-001",
            "standard_name": "Curriculum Planning and Implementation",
            "description": "",
            "area_id": "edu",
            "rating": 4,
            "evidence_comments": "Excellent curriculum planning with clear learning objectives. Strong evidence of differentiation.",
            "submitted_at": "2024-12-20T14:30:00Z",
            "submitted_by": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
            "has_attachments": 1
        },
        {
            "standard_id": "std-edu-002",
            "standard_name": "Teaching Quality and Effectiveness",
            "description": "",
            "area_id": "edu",
            "rating": 3,
            "evidence_comments": "Good teaching quality observed. Some areas for improvement in lesson pacing.",
            "submitted_at": "2024-12-21T09:15:00Z",
            "submitted_by": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
            "has_attachments": 0
        },
        {
            "standard_id": "std-edu-003",
            "standard_name": "Student Progress and Achievement",
            "description": "",
            "area_id": "edu",
            "rating": 0,
            "evidence_comments": null,
            "submitted_at": null,
            "submitted_by": null,
            "has_attachments": 0
        }
    ]
}
```

**Response Fields:**
- `name`: Auto-generated from aspect_name, term_id, and academic_year
- `aspect_id`, `aspect_code`, `aspect_name`: Aspect details
- `status`: Overall assessment status (calculated from first standard row)
- `standards`: Array of all standards for this assessment
  - `area_id`: Same as `aspect_id` (for backwards compatibility)
  - `rating`: 0-4 scale (0 = not started)
  - `has_attachments`: 1 if attachments exist, 0 otherwise

---

### POST `/api/assessments`

Create new assessment(s) for specified schools and aspect/category.

**Authentication:** Required (JWT Bearer token)

**Request Body:**
```json
{
    "category": "edu",
    "school_ids": [
        "550e8400-e29b-41d4-a716-446655440000",
        "6ba7b810-9dad-11d1-80b4-00c04fd430c9"
    ],
    "term_id": "T1",
    "academic_year": "2024-2025",
    "due_date": "2024-12-20",
    "assigned_to": ["6ba7b810-9dad-11d1-80b4-00c04fd430c8"]
}
```

**Process:**
1. Validates all school_ids belong to user's MAT
2. Gets all standards for the specified aspect (category)
3. Creates assessment records for each (school, standard, term, year) combination
4. Initializes all ratings to 0

**Response:**
```json
{
    "message": "Created assessments for 2 schools in edu",
    "assessment_ids": [
        "550e8400-e29b-41d4-a716-446655440000-edu-T1-2024-2025",
        "6ba7b810-9dad-11d1-80b4-00c04fd430c9-edu-T1-2024-2025"
    ],
    "status": "success"
}
```

---

### POST `/api/assessments/{assessment_id}/submit`

Submit an assessment for review (marks all standards as submitted).

**Authentication:** Required (JWT Bearer token)

**Path Parameter:**
- `assessment_id`: Composite ID

**Response:**
```json
{
    "message": "Assessment submitted successfully",
    "assessment_id": "550e8400-e29b-41d4-a716-446655440000-edu-T1-2024-2025",
    "status": "submitted"
}
```

---

### PUT `/api/assessments/{assessment_id}/standards/{standard_id}`

Update a specific standard's rating and evidence within an assessment.

**Authentication:** Required (JWT Bearer token)

**Path Parameters:**
- `assessment_id`: Composite ID
- `standard_id`: Standard UUID

**Request Body:**
```json
{
    "rating": 4,
    "evidence_comments": "Excellent implementation with strong evidence of impact."
}
```

**SQL Query:**
```sql
UPDATE assessments
SET rating = %s,
    evidence_comments = %s,
    submitted_by = %s,
    last_updated = NOW(),
    updated_by = %s
WHERE school_id = %s
  AND standard_id = %s
  AND term_id = %s
  AND academic_year = %s
```

**Response:**
```json
{
    "message": "Standard updated successfully",
    "assessment_id": "550e8400-e29b-41d4-a716-446655440000-edu-T1-2024-2025",
    "standard_id": "std-edu-001",
    "status": "success"
}
```

---

### POST `/api/assessments/bulk-update`

Update multiple standards across different assessments in one request.

**Authentication:** Required (JWT Bearer token)

**Request Body:**
```json
{
    "updates": [
        {
            "standard_id": "std-edu-001",
            "rating": 4,
            "evidence_comments": "Excellent work"
        },
        {
            "standard_id": "std-edu-002",
            "rating": 3,
            "evidence_comments": "Good progress"
        },
        {
            "standard_id": "std-gov-001",
            "rating": 4,
            "evidence_comments": "Outstanding governance"
        }
    ]
}
```

**MAT Isolation:** Only updates assessments for schools in the user's MAT

**Response:**
```json
{
    "message": "Successfully updated 3 standards",
    "total_requested": 3,
    "status": "success"
}
```

---

## Query Patterns

### Composite Assessment ID

**Format:** `{school_id}-{aspect_id}-{term_id}-{academic_year}`

**Examples:**
```
550e8400-e29b-41d4-a716-446655440000-edu-T1-2024-2025
6ba7b810-9dad-11d1-80b4-00c04fd430c9-gov-T2-2023-2024
a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d-safe-T3-2024-2025
```

**Parsing Algorithm:**
```python
def parse_assessment_id(assessment_id: str):
    parts = assessment_id.split('-')

    # Find term index (matches T\d+ pattern)
    term_index = None
    for i, part in enumerate(parts):
        if part.startswith('T') and part[1:].isdigit():
            term_index = i
            break

    if term_index is None:
        raise ValueError("Invalid assessment_id: no term found")

    # Extract components
    school_id = '-'.join(parts[:term_index-1])
    aspect_id = parts[term_index-1]
    term_id = parts[term_index]
    academic_year = '-'.join(parts[term_index+1:])

    return {
        "school_id": school_id,
        "aspect_id": aspect_id,
        "term_id": term_id,
        "academic_year": academic_year
    }
```

**TypeScript Example:**
```typescript
interface AssessmentIdComponents {
    schoolId: string;
    aspectId: string;
    termId: string;
    academicYear: string;
}

function parseAssessmentId(assessmentId: string): AssessmentIdComponents {
    const parts = assessmentId.split('-');

    // Find term index
    const termIndex = parts.findIndex(p => /^T\d+$/.test(p));
    if (termIndex === -1) {
        throw new Error('Invalid assessment_id format');
    }

    return {
        schoolId: parts.slice(0, termIndex - 1).join('-'),
        aspectId: parts[termIndex - 1],
        termId: parts[termIndex],
        academicYear: parts.slice(termIndex + 1).join('-')
    };
}
```

### Status Calculation

**not_started:** All standards have `rating = 0` or `rating IS NULL`
```sql
COUNT(CASE WHEN a.rating IS NULL OR a.rating = 0 THEN 1 END) = COUNT(*)
```

**submitted:** All standards have `submitted_at IS NOT NULL`
```sql
COUNT(CASE WHEN a.submitted_at IS NOT NULL THEN 1 END) = COUNT(*)
```

**in_progress:** Everything else (some ratings > 0, not all submitted)

### MAT Isolation Pattern

All assessment queries enforce MAT isolation:
```sql
FROM assessments a
JOIN schools sch ON a.school_id = sch.school_id
WHERE sch.mat_id = %s  -- User's MAT ID from JWT
```

This ensures users can only access assessments for schools in their MAT.

---

## Response Formats

### Assessment List Item
```typescript
interface AssessmentListItem {
    assessment_id: string;           // Composite ID
    school_id: string;               // UUID
    school_name: string;             // Display name
    aspect_id: string;               // e.g., "edu", "gov"
    aspect_code: string;             // e.g., "EDU", "GOV"
    aspect_name: string;             // e.g., "Education"
    term_id: string;                 // e.g., "T1", "T2", "T3"
    academic_year: string;           // e.g., "2024-2025"
    due_date: string | null;         // ISO date "YYYY-MM-DD"
    assigned_to: string | null;      // User UUID
    last_updated: string | null;     // ISO datetime
    updated_by: string | null;       // User UUID
    status: 'not_started' | 'in_progress' | 'submitted';
    total_standards: number;         // Total standards in aspect
    completed_standards: number;     // Standards with rating > 0
}
```

### Assessment Detail
```typescript
interface AssessmentDetail {
    assessment_id: string;
    name: string;                    // Auto-generated display name
    school_id: string;
    school_name: string;
    aspect_id: string;
    aspect_code: string;
    aspect_name: string;
    term_id: string;
    academic_year: string;
    status: 'not_started' | 'in_progress' | 'submitted';
    due_date: string | null;
    assigned_to: string[];           // Array of user UUIDs
    last_updated: string | null;
    updated_by: string | null;
    standards: StandardRating[];
}

interface StandardRating {
    standard_id: string;
    standard_name: string;
    description: string;             // Currently empty, can be added
    area_id: string;                 // Same as aspect_id
    rating: number | null;           // 0-4 scale
    evidence_comments: string | null;
    submitted_at: string | null;     // ISO datetime
    submitted_by: string | null;     // User UUID
    has_attachments: 0 | 1;          // Boolean as int
}
```

### Rating Scale

```typescript
enum Rating {
    NOT_STARTED = 0,
    INADEQUATE = 1,
    REQUIRES_IMPROVEMENT = 2,
    GOOD = 3,
    OUTSTANDING = 4
}
```

---

## Frontend Integration Guide

### Fetching Assessment List

```typescript
async function fetchAssessments(filters?: {
    schoolId?: string;
    aspectId?: string;
    term?: string;
    academicYear?: string;
    status?: string;
}): Promise<AssessmentListItem[]> {
    const params = new URLSearchParams();
    if (filters?.schoolId) params.append('school_id', filters.schoolId);
    if (filters?.aspectId) params.append('category', filters.aspectId);
    if (filters?.term) params.append('term', filters.term);
    if (filters?.academicYear) params.append('academic_year', filters.academicYear);
    if (filters?.status) params.append('status', filters.status);

    const response = await fetch(`/api/assessments?${params}`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch assessments: ${response.statusText}`);
    }

    return await response.json();
}
```

### Fetching Assessment Details

```typescript
async function fetchAssessmentDetail(
    assessmentId: string
): Promise<AssessmentDetail> {
    const response = await fetch(`/api/assessments/${assessmentId}`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Assessment not found or access denied');
        }
        throw new Error(`Failed to fetch assessment: ${response.statusText}`);
    }

    return await response.json();
}
```

### Updating a Standard Rating

```typescript
async function updateStandardRating(
    assessmentId: string,
    standardId: string,
    rating: number,
    evidenceComments: string
): Promise<void> {
    const response = await fetch(
        `/api/assessments/${assessmentId}/standards/${standardId}`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rating,
                evidence_comments: evidenceComments
            })
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update standard');
    }
}
```

### Creating New Assessments

```typescript
async function createAssessment(data: {
    category: string;        // aspect_id
    schoolIds: string[];
    termId: string;
    academicYear: string;
    dueDate?: string;
    assignedTo?: string[];
}): Promise<string[]> {
    const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            category: data.category,
            school_ids: data.schoolIds,
            term_id: data.termId,
            academic_year: data.academicYear,
            due_date: data.dueDate,
            assigned_to: data.assignedTo
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create assessment');
    }

    const result = await response.json();
    return result.assessment_ids;
}
```

### Submitting an Assessment

```typescript
async function submitAssessment(assessmentId: string): Promise<void> {
    const response = await fetch(
        `/api/assessments/${assessmentId}/submit`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to submit assessment');
    }
}
```

### Bulk Update Standards

```typescript
interface BulkStandardUpdate {
    standardId: string;
    rating: number;
    evidenceComments: string;
}

async function bulkUpdateStandards(
    updates: BulkStandardUpdate[]
): Promise<number> {
    const response = await fetch('/api/assessments/bulk-update', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            updates: updates.map(u => ({
                standard_id: u.standardId,
                rating: u.rating,
                evidence_comments: u.evidenceComments
            }))
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to bulk update');
    }

    const result = await response.json();
    return result.total_requested;
}
```

### Display Progress

```typescript
function calculateProgress(assessment: AssessmentListItem): number {
    if (assessment.total_standards === 0) return 0;
    return Math.round(
        (assessment.completed_standards / assessment.total_standards) * 100
    );
}

// Usage
const progress = calculateProgress(assessment);
console.log(`${progress}% complete (${assessment.completed_standards}/${assessment.total_standards} standards)`);
```

### Parsing Assessment ID

Use the parsing function from [Query Patterns](#composite-assessment-id) section to extract components when needed.

---

## Common Integration Patterns

### Assessment List View

```typescript
// Fetch and display all assessments for current user's MAT
const assessments = await fetchAssessments();

assessments.forEach(assessment => {
    console.log(`
        ${assessment.aspect_name} - ${assessment.school_name}
        Term: ${assessment.term_id} ${assessment.academic_year}
        Status: ${assessment.status}
        Progress: ${calculateProgress(assessment)}%
    `);
});
```

### Filter by School and Term

```typescript
// Show only in-progress assessments for a specific school this term
const filtered = await fetchAssessments({
    schoolId: '550e8400-e29b-41d4-a716-446655440000',
    term: 'T1',
    academicYear: '2024-2025',
    status: 'in_progress'
});
```

### Assessment Detail View

```typescript
// Load and display individual assessment with all standards
const detail = await fetchAssessmentDetail(assessmentId);

console.log(`${detail.name}`);
console.log(`School: ${detail.school_name}`);
console.log(`Aspect: ${detail.aspect_name} (${detail.aspect_code})`);
console.log(`Status: ${detail.status}`);

detail.standards.forEach(standard => {
    console.log(`
        ${standard.standard_name}
        Rating: ${standard.rating ?? 'Not rated'}
        Evidence: ${standard.evidence_comments ?? 'No evidence'}
    `);
});
```

### Update Standard with Validation

```typescript
async function updateStandardWithValidation(
    assessmentId: string,
    standardId: string,
    rating: number,
    evidence: string
) {
    // Validate rating
    if (rating < 0 || rating > 4) {
        throw new Error('Rating must be between 0 and 4');
    }

    // Require evidence for high ratings
    if (rating >= 3 && !evidence.trim()) {
        throw new Error('Evidence required for ratings 3 and above');
    }

    await updateStandardRating(assessmentId, standardId, rating, evidence);
}
```

---

## Error Handling

### HTTP Status Codes

- `200 OK`: Successful GET/PUT request
- `201 Created`: Successful POST (create assessment)
- `400 Bad Request`: Invalid assessment_id format or invalid data
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Attempting to access assessment outside user's MAT
- `404 Not Found`: Assessment or standard not found
- `500 Internal Server Error`: Server error

### Example Error Response

```json
{
    "detail": "Assessment not found or access denied"
}
```

### Frontend Error Handling

```typescript
try {
    const assessment = await fetchAssessmentDetail(assessmentId);
} catch (error) {
    if (error.message.includes('404')) {
        showNotification('Assessment not found', 'error');
    } else if (error.message.includes('403')) {
        showNotification('Access denied to this assessment', 'error');
    } else {
        showNotification('Failed to load assessment', 'error');
    }
}
```

---

## Migration Notes from v2.x

### Breaking Changes

1. **Category → Aspect Fields**
   - Old: `category` (string, aspect name)
   - New: `aspect_id`, `aspect_code`, `aspect_name` (separate fields)

2. **Assessment ID Format**
   - Now includes `aspect_id` instead of aspect name
   - Format: `{school_id}-{aspect_id}-{term_id}-{academic_year}`

3. **Response Structure**
   - GET /api/assessments now returns `aspect_id`, `aspect_code`, `aspect_name`
   - Removed standalone `category` field (use `aspect_name` for display)

### Migration Checklist

- [ ] Update frontend to use `aspect_id` for filtering (still pass to `category` parameter)
- [ ] Display `aspect_name` instead of `category` in UI
- [ ] Update assessment ID parsing to handle new format
- [ ] Use `aspect_code` for compact display (e.g., badges)
- [ ] Handle `aspect_id` in assessment detail responses

---

## Support

For questions or issues:
- Review this specification document
- Check Swagger documentation at `/api/docs`
- Contact backend team for clarification

**Document Version:** 1.0.0
**API Version:** 3.0.0
**Last Reviewed:** 2024-12-22
