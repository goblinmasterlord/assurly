# Assessment API Specification

**Version:** 4.0.0  
**Last Updated:** 2025-12-29  
**Schema Version:** Production v2.0 (Multi-Tenant)

This document provides the complete API specification for the Assurly assessment system with multi-tenant MAT support, versioned standards, and human-readable IDs.

---

## Table of Contents

1. [ID Naming Convention](#id-naming-convention)
2. [Database Schema](#database-schema)
3. [Authentication & MAT Isolation](#authentication--mat-isolation)
4. [API Endpoints](#api-endpoints)
5. [Query Patterns](#query-patterns)
6. [Response Formats](#response-formats)
7. [Frontend Integration Guide](#frontend-integration-guide)
8. [Migration Notes from v3.x](#migration-notes-from-v3x)

---

## ID Naming Convention

All IDs follow a human-readable, hierarchical pattern:

| Entity | Format | Examples |
|--------|--------|----------|
| MAT | `{CODE}` | `OLT`, `HLT` |
| School | `{slug}` or `{MAT}-CENTRAL` | `cedar-park-primary`, `OLT-CENTRAL` |
| User | `user{N}` | `user7`, `user10` |
| Global Aspect | `{CODE}` | `EDU`, `HR`, `FIN`, `EST`, `GOV`, `IT` |
| Global Standard | `{CODE}` | `ES1`, `HR2`, `FM3`, `BO1`, `EG1`, `IS1` |
| MAT Aspect | `{MAT}-{CODE}` | `OLT-EDU`, `HLT-HR` |
| MAT Standard | `{MAT}-{CODE}` | `OLT-ES1`, `HLT-FM3` |
| Standard Version | `{MAT}-{CODE}-v{N}` | `OLT-ES1-v1`, `HLT-FM3-v2` |
| Term | `{TERM}-{YEAR}` | `T1-2024-25`, `T2-2023-24` |
| Assessment | `{SCHOOL}-{CODE}-{TERM}` | `cedar-park-primary-ES1-T1-2024-25` |

### Benefits
- **Readable**: Instantly understand what an ID refers to
- **Debuggable**: Easy to query and troubleshoot
- **Hierarchical**: IDs encode relationships (OLT-ES1 belongs to OLT)
- **Consistent**: Same pattern across all entities

---

## Database Schema

### Entity Relationship Overview

```
Global Defaults (Read-Only)          MAT-Specific (Copy-on-Write)
========================          ============================
aspects (EDU, HR, FIN...)    →    mat_aspects (OLT-EDU, HLT-HR...)
    │                                     │
    ▼                                     ▼
standards (ES1, HR1, FM1...)  →    mat_standards (OLT-ES1, HLT-HR1...)
                                          │
                                          ▼
                                   standard_versions (OLT-ES1-v1, v2...)
                                          │
                                          ▼
mats (OLT, HLT)                    assessments
    │                              (cedar-park-primary-ES1-T1-2024-25)
    ▼
schools (cedar-park-primary)
    │
    ▼
users (user7)
```

### Core Tables

#### `mats` - Multi-Academy Trusts
```sql
CREATE TABLE mats (
    mat_id              VARCHAR(36) PRIMARY KEY,  -- e.g., 'OLT', 'HLT'
    mat_name            VARCHAR(255) NOT NULL,
    mat_code            VARCHAR(50) UNIQUE,
    onboarding_status   ENUM('pending', 'in_progress', 'completed'),
    is_active           BOOLEAN DEFAULT TRUE,
    logo_url            VARCHAR(500),
    primary_colour      VARCHAR(7),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `schools`
```sql
CREATE TABLE schools (
    school_id           VARCHAR(36) PRIMARY KEY,  -- e.g., 'cedar-park-primary'
    school_name         VARCHAR(255) NOT NULL,
    mat_id              VARCHAR(36) NOT NULL,
    school_type         ENUM('primary', 'secondary', 'all_through', 'special', 'central'),
    is_central_office   BOOLEAN DEFAULT FALSE,
    is_active           BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (mat_id) REFERENCES mats(mat_id)
);
```

#### `users`
```sql
CREATE TABLE users (
    user_id             VARCHAR(36) PRIMARY KEY,  -- e.g., 'user7'
    email               VARCHAR(255) NOT NULL UNIQUE,
    full_name           VARCHAR(255) NOT NULL,
    mat_id              VARCHAR(36) NOT NULL,
    school_id           VARCHAR(36),              -- NULL = trust-wide access
    role_title          VARCHAR(100),
    is_active           BOOLEAN DEFAULT TRUE,
    magic_link_token    VARCHAR(255),
    token_expires_at    TIMESTAMP,
    last_login          TIMESTAMP,
    
    FOREIGN KEY (mat_id) REFERENCES mats(mat_id),
    FOREIGN KEY (school_id) REFERENCES schools(school_id)
);
```

#### `aspects` (Global Defaults)
```sql
CREATE TABLE aspects (
    aspect_id           VARCHAR(10) PRIMARY KEY,  -- e.g., 'EDU', 'HR'
    aspect_code         VARCHAR(50) NOT NULL,
    aspect_name         VARCHAR(200) NOT NULL,
    aspect_description  TEXT,
    sort_order          INT DEFAULT 0
);
```

#### `standards` (Global Defaults)
```sql
CREATE TABLE standards (
    standard_id         VARCHAR(20) PRIMARY KEY,  -- e.g., 'ES1', 'HR2'
    aspect_id           VARCHAR(10) NOT NULL,
    standard_code       VARCHAR(50) NOT NULL,
    standard_name       VARCHAR(200) NOT NULL,
    standard_description TEXT,
    sort_order          INT DEFAULT 0,
    
    FOREIGN KEY (aspect_id) REFERENCES aspects(aspect_id)
);
```

#### `mat_aspects` (MAT-Specific)
```sql
CREATE TABLE mat_aspects (
    mat_aspect_id       VARCHAR(36) PRIMARY KEY,  -- e.g., 'OLT-EDU'
    mat_id              VARCHAR(36) NOT NULL,
    source_aspect_id    VARCHAR(10),              -- e.g., 'EDU' (NULL if custom)
    aspect_code         VARCHAR(50) NOT NULL,
    aspect_name         VARCHAR(200) NOT NULL,
    aspect_description  TEXT,
    sort_order          INT DEFAULT 0,
    is_custom           BOOLEAN DEFAULT FALSE,
    is_modified         BOOLEAN DEFAULT FALSE,
    is_active           BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (mat_id) REFERENCES mats(mat_id),
    FOREIGN KEY (source_aspect_id) REFERENCES aspects(aspect_id)
);
```

#### `mat_standards` (MAT-Specific with Versioning)
```sql
CREATE TABLE mat_standards (
    mat_standard_id     VARCHAR(36) PRIMARY KEY,  -- e.g., 'OLT-ES1'
    mat_id              VARCHAR(36) NOT NULL,
    mat_aspect_id       VARCHAR(36) NOT NULL,     -- e.g., 'OLT-EDU'
    source_standard_id  VARCHAR(20),              -- e.g., 'ES1' (NULL if custom)
    standard_code       VARCHAR(50) NOT NULL,
    standard_name       VARCHAR(200) NOT NULL,
    standard_description TEXT,
    sort_order          INT DEFAULT 0,
    is_custom           BOOLEAN DEFAULT FALSE,
    is_modified         BOOLEAN DEFAULT FALSE,
    is_active           BOOLEAN DEFAULT TRUE,
    current_version_id  VARCHAR(36),              -- e.g., 'OLT-ES1-v1'
    
    FOREIGN KEY (mat_id) REFERENCES mats(mat_id),
    FOREIGN KEY (mat_aspect_id) REFERENCES mat_aspects(mat_aspect_id),
    FOREIGN KEY (source_standard_id) REFERENCES standards(standard_id)
);
```

#### `standard_versions` (Immutable History)
```sql
CREATE TABLE standard_versions (
    version_id          VARCHAR(36) PRIMARY KEY,  -- e.g., 'OLT-ES1-v1'
    mat_standard_id     VARCHAR(36) NOT NULL,     -- e.g., 'OLT-ES1'
    version_number      INT NOT NULL DEFAULT 1,
    standard_code       VARCHAR(50) NOT NULL,
    standard_name       VARCHAR(200) NOT NULL,
    standard_description TEXT,
    parent_version_id   VARCHAR(36),
    effective_from      TIMESTAMP NOT NULL,
    effective_to        TIMESTAMP,                -- NULL = current version
    change_reason       TEXT,
    created_by_user_id  VARCHAR(36),
    
    FOREIGN KEY (mat_standard_id) REFERENCES mat_standards(mat_standard_id),
    UNIQUE KEY (mat_standard_id, version_number)
);
```

#### `terms` (Global Reference)
```sql
CREATE TABLE terms (
    unique_term_id      VARCHAR(20) PRIMARY KEY,  -- e.g., 'T1-2024-25'
    term_id             VARCHAR(10) NOT NULL,     -- e.g., 'T1'
    term_name           VARCHAR(50) NOT NULL,
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    academic_year       VARCHAR(9) NOT NULL       -- e.g., '2024-25'
);
```

#### `assessments`
```sql
CREATE TABLE assessments (
    id                  VARCHAR(36) PRIMARY KEY,
    school_id           VARCHAR(36) NOT NULL,
    mat_standard_id     VARCHAR(36) NOT NULL,     -- e.g., 'OLT-ES1'
    version_id          VARCHAR(36) NOT NULL,     -- e.g., 'OLT-ES1-v1'
    unique_term_id      VARCHAR(20) NOT NULL,     -- e.g., 'T1-2024-25'
    academic_year       VARCHAR(9) NOT NULL,
    rating              INT CHECK (rating IS NULL OR rating BETWEEN 1 AND 4),
    evidence_comments   TEXT,
    status              ENUM('not_started', 'in_progress', 'completed', 'approved'),
    due_date            DATE,
    submitted_at        TIMESTAMP,
    submitted_by        VARCHAR(36),
    approved_at         TIMESTAMP,
    approved_by         VARCHAR(36),
    assigned_to         VARCHAR(36),
    last_updated        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by          VARCHAR(255),
    
    -- Generated readable ID
    assessment_id       VARCHAR(100) AS (
        CONCAT(school_id, '-', SUBSTRING_INDEX(mat_standard_id, '-', -1), '-', unique_term_id)
    ) VIRTUAL,
    
    FOREIGN KEY (school_id) REFERENCES schools(school_id),
    FOREIGN KEY (mat_standard_id) REFERENCES mat_standards(mat_standard_id),
    FOREIGN KEY (version_id) REFERENCES standard_versions(version_id),
    FOREIGN KEY (unique_term_id) REFERENCES terms(unique_term_id),
    
    UNIQUE KEY (school_id, mat_standard_id, unique_term_id)
);
```

**Assessment ID Examples:**
- `cedar-park-primary-ES1-T1-2024-25`
- `oak-hill-academy-FM3-T2-2023-24`
- `willow-high-school-HR1-T3-2024-25`

---

## Authentication & MAT Isolation

### JWT Token Structure

```json
{
    "user_id": "user7",
    "email": "tom@thetransformative.com",
    "mat_id": "OLT",
    "school_id": null,
    "exp": 1735488000
}
```

**Fields:**
- `user_id`: User identifier
- `mat_id`: MAT tenant identifier (CRITICAL for isolation)
- `school_id`: `null` = trust-wide access, specific ID = school-restricted

### MAT Isolation Middleware

Every API endpoint MUST filter by the user's MAT:

```python
from fastapi import Depends, HTTPException

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    # Decode and validate JWT
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    return User(**payload)

async def get_mat_id(user: User = Depends(get_current_user)) -> str:
    return user.mat_id

# Usage in endpoints
@app.get("/api/assessments")
async def get_assessments(mat_id: str = Depends(get_mat_id)):
    query = """
        SELECT a.* FROM assessments a
        JOIN schools s ON a.school_id = s.school_id
        WHERE s.mat_id = %s
    """
    # Execute with mat_id parameter
```

### Access Control Logic

```python
def can_access_school(user: User, school_id: str) -> bool:
    """Check if user can access a specific school."""
    if user.school_id is None:
        # Trust-wide access - can see all schools in their MAT
        return True
    return user.school_id == school_id
```

---

## API Endpoints

### Assessment Endpoints

#### GET `/api/assessments`

List assessments grouped by school, aspect, term.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `school_id` | string | Filter by school |
| `aspect_code` | string | Filter by aspect (EDU, HR, etc.) |
| `term_id` | string | Filter by term (T1, T2, T3) |
| `academic_year` | string | Filter by year (2024-25) |
| `status` | string | Filter by status |

**SQL Query:**
```sql
SELECT
    CONCAT(s.school_id, '-', ma.aspect_code, '-', a.unique_term_id) as group_id,
    s.school_id,
    s.school_name,
    ma.mat_aspect_id,
    ma.aspect_code,
    ma.aspect_name,
    SUBSTRING(a.unique_term_id, 1, 2) as term_id,
    a.academic_year,
    MAX(a.due_date) as due_date,
    MAX(a.last_updated) as last_updated,
    CASE
        WHEN COUNT(CASE WHEN a.rating IS NULL THEN 1 END) = COUNT(*) THEN 'not_started'
        WHEN COUNT(CASE WHEN a.status = 'completed' THEN 1 END) = COUNT(*) THEN 'completed'
        ELSE 'in_progress'
    END as status,
    COUNT(*) as total_standards,
    COUNT(CASE WHEN a.rating IS NOT NULL THEN 1 END) as completed_standards
FROM assessments a
JOIN schools s ON a.school_id = s.school_id
JOIN mat_standards ms ON a.mat_standard_id = ms.mat_standard_id
JOIN mat_aspects ma ON ms.mat_aspect_id = ma.mat_aspect_id
WHERE s.mat_id = %s
GROUP BY s.school_id, s.school_name, ma.mat_aspect_id, ma.aspect_code, 
         ma.aspect_name, a.unique_term_id, a.academic_year
ORDER BY a.academic_year DESC, a.unique_term_id DESC, s.school_name
```

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
        "due_date": "2024-12-20",
        "last_updated": "2024-12-22T10:30:00Z",
        "status": "in_progress",
        "total_standards": 6,
        "completed_standards": 4
    }
]
```

---

#### GET `/api/assessments/{assessment_id}`

Get detailed assessment with all standards.

**Path Parameter:**
- `assessment_id`: Format `{school_id}-{standard_code}-{unique_term_id}`
- Example: `cedar-park-primary-ES1-T1-2024-25`

**SQL Query:**
```sql
SELECT
    a.id,
    a.assessment_id,
    a.school_id,
    s.school_name,
    a.mat_standard_id,
    ms.standard_code,
    ms.standard_name,
    ms.standard_description,
    ma.mat_aspect_id,
    ma.aspect_code,
    ma.aspect_name,
    a.version_id,
    sv.version_number,
    a.unique_term_id,
    a.academic_year,
    a.rating,
    a.evidence_comments,
    a.status,
    a.due_date,
    a.assigned_to,
    u_assigned.full_name as assigned_to_name,
    a.submitted_at,
    a.submitted_by,
    u_submitted.full_name as submitted_by_name,
    a.last_updated
FROM assessments a
JOIN schools s ON a.school_id = s.school_id
JOIN mat_standards ms ON a.mat_standard_id = ms.mat_standard_id
JOIN mat_aspects ma ON ms.mat_aspect_id = ma.mat_aspect_id
JOIN standard_versions sv ON a.version_id = sv.version_id
LEFT JOIN users u_assigned ON a.assigned_to = u_assigned.user_id
LEFT JOIN users u_submitted ON a.submitted_by = u_submitted.user_id
WHERE a.assessment_id = %s
  AND s.mat_id = %s
```

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
    "standard_description": "Curriculum intent, implementation...",
    "mat_aspect_id": "OLT-EDU",
    "aspect_code": "EDU",
    "aspect_name": "Education",
    "version_id": "OLT-ES1-v1",
    "version_number": 1,
    "unique_term_id": "T1-2024-25",
    "academic_year": "2024-25",
    "rating": 3,
    "evidence_comments": "Good progress observed...",
    "status": "completed",
    "due_date": "2024-12-20",
    "assigned_to": "user7",
    "assigned_to_name": "Tom Walch",
    "submitted_by": "user7",
    "submitted_by_name": "Tom Walch",
    "submitted_at": "2024-12-14T00:00:00Z",
    "last_updated": "2024-12-14T00:00:00Z"
}
```

---

#### GET `/api/assessments/by-aspect/{aspect_code}`

Get all assessments for an aspect (all standards) for a school/term.

**Path Parameter:**
- `aspect_code`: e.g., `EDU`, `HR`, `FIN`

**Query Parameters:**
- `school_id`: Required
- `term_id`: Required (e.g., `T1-2024-25`)

**Response:**
```json
{
    "school_id": "cedar-park-primary",
    "school_name": "Cedar Park Primary",
    "aspect_code": "EDU",
    "aspect_name": "Education",
    "term_id": "T1-2024-25",
    "academic_year": "2024-25",
    "status": "in_progress",
    "total_standards": 6,
    "completed_standards": 4,
    "standards": [
        {
            "assessment_id": "cedar-park-primary-ES1-T1-2024-25",
            "mat_standard_id": "OLT-ES1",
            "standard_code": "ES1",
            "standard_name": "Quality of Education",
            "rating": 3,
            "evidence_comments": "Good progress...",
            "version_id": "OLT-ES1-v1",
            "version_number": 1,
            "status": "completed"
        },
        {
            "assessment_id": "cedar-park-primary-ES2-T1-2024-25",
            "mat_standard_id": "OLT-ES2",
            "standard_code": "ES2",
            "standard_name": "Behaviour & Attitudes",
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

#### PUT `/api/assessments/{assessment_id}`

Update a single assessment (rating and evidence).

**Request Body:**
```json
{
    "rating": 4,
    "evidence_comments": "Excellent implementation with strong evidence of impact."
}
```

**SQL Query:**
```sql
UPDATE assessments a
JOIN schools s ON a.school_id = s.school_id
SET 
    a.rating = %s,
    a.evidence_comments = %s,
    a.status = CASE WHEN %s IS NOT NULL THEN 'completed' ELSE 'in_progress' END,
    a.submitted_by = %s,
    a.last_updated = NOW(),
    a.updated_by = %s
WHERE a.assessment_id = %s
  AND s.mat_id = %s
```

**Response:**
```json
{
    "message": "Assessment updated successfully",
    "assessment_id": "cedar-park-primary-ES1-T1-2024-25",
    "status": "completed"
}
```

---

#### POST `/api/assessments`

Create assessments for a school/aspect/term combination.

**Request Body:**
```json
{
    "school_ids": ["cedar-park-primary", "oak-hill-academy"],
    "aspect_code": "EDU",
    "term_id": "T1-2025-26",
    "due_date": "2025-12-20",
    "assigned_to": "user7"
}
```

**Process:**
1. Validate schools belong to user's MAT
2. Get all mat_standards for the aspect
3. Create assessment records for each (school, standard, term)
4. Initialize with current version_id

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

---

#### POST `/api/assessments/bulk-update`

Update multiple assessments in one request.

**Request Body:**
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

**Response:**
```json
{
    "message": "Updated 2 assessments",
    "updated_count": 2,
    "failed_count": 0
}
```

---

### Standards Endpoints

#### GET `/api/standards`

Get MAT's active standards (from mat_standards).

**Query Parameters:**
- `aspect_code`: Filter by aspect (optional)

**SQL Query:**
```sql
SELECT
    ms.mat_standard_id,
    ms.standard_code,
    ms.standard_name,
    ms.standard_description,
    ms.sort_order,
    ms.is_custom,
    ms.is_modified,
    ma.mat_aspect_id,
    ma.aspect_code,
    ma.aspect_name,
    sv.version_id as current_version_id,
    sv.version_number as current_version
FROM mat_standards ms
JOIN mat_aspects ma ON ms.mat_aspect_id = ma.mat_aspect_id
LEFT JOIN standard_versions sv ON ms.current_version_id = sv.version_id
WHERE ms.mat_id = %s
  AND ms.is_active = TRUE
  AND ma.is_active = TRUE
ORDER BY ma.sort_order, ms.sort_order
```

**Response:**
```json
[
    {
        "mat_standard_id": "OLT-ES1",
        "standard_code": "ES1",
        "standard_name": "Quality of Education",
        "standard_description": "Curriculum intent...",
        "sort_order": 1,
        "is_custom": false,
        "is_modified": false,
        "mat_aspect_id": "OLT-EDU",
        "aspect_code": "EDU",
        "aspect_name": "Education",
        "current_version_id": "OLT-ES1-v1",
        "current_version": 1
    }
]
```

---

#### GET `/api/standards/{mat_standard_id}`

Get a single standard with version history.

**Response:**
```json
{
    "mat_standard_id": "OLT-ES1",
    "standard_code": "ES1",
    "standard_name": "Quality of Education",
    "standard_description": "Curriculum intent...",
    "mat_aspect_id": "OLT-EDU",
    "aspect_code": "EDU",
    "is_custom": false,
    "is_modified": false,
    "current_version": {
        "version_id": "OLT-ES1-v1",
        "version_number": 1,
        "effective_from": "2025-12-22T00:08:34Z"
    },
    "version_history": [
        {
            "version_id": "OLT-ES1-v1",
            "version_number": 1,
            "effective_from": "2025-12-22T00:08:34Z",
            "effective_to": null,
            "change_reason": "Initial version"
        }
    ]
}
```

---

#### PUT `/api/standards/{mat_standard_id}`

Update a standard (creates new version).

**Request Body:**
```json
{
    "standard_name": "Quality of Education (Updated)",
    "standard_description": "Updated description...",
    "change_reason": "Clarified requirements for 2025-26"
}
```

**Process:**
1. Set current version's `effective_to = NOW()`
2. Create new version with `version_number + 1`
3. Update `mat_standards.current_version_id`
4. Set `is_modified = TRUE`
5. Log to `standard_edit_log`

**Response:**
```json
{
    "message": "Standard updated",
    "mat_standard_id": "OLT-ES1",
    "new_version_id": "OLT-ES1-v2",
    "version_number": 2
}
```

---

### Aspects Endpoints

#### GET `/api/aspects`

Get MAT's active aspects.

**Response:**
```json
[
    {
        "mat_aspect_id": "OLT-EDU",
        "aspect_code": "EDU",
        "aspect_name": "Education",
        "aspect_description": "Quality of teaching...",
        "sort_order": 1,
        "is_custom": false,
        "standards_count": 6
    },
    {
        "mat_aspect_id": "OLT-HR",
        "aspect_code": "HR",
        "aspect_name": "Human Resources",
        "aspect_description": "Staff management...",
        "sort_order": 2,
        "is_custom": false,
        "standards_count": 5
    }
]
```

---

### Schools Endpoints

#### GET `/api/schools`

Get schools in user's MAT.

**Query Parameters:**
- `include_central`: boolean (default: false) - Include Central Office

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
        "school_id": "oak-hill-academy",
        "school_name": "Oak Hill Academy",
        "school_type": "primary",
        "is_central_office": false,
        "is_active": true
    }
]
```

---

### Terms Endpoints

#### GET `/api/terms`

Get available terms.

**Query Parameters:**
- `academic_year`: Filter by year (optional)

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
        "unique_term_id": "T2-2024-25",
        "term_id": "T2",
        "term_name": "Spring Term",
        "start_date": "2025-01-01",
        "end_date": "2025-04-01",
        "academic_year": "2024-25",
        "is_current": false
    }
]
```

---

### Analytics Endpoints

#### GET `/api/analytics/trends`

Get rating trends over time.

**Query Parameters:**
- `school_id`: Optional (omit for trust-wide)
- `aspect_code`: Optional
- `from_term`: Start term (e.g., `T1-2023-24`)
- `to_term`: End term (e.g., `T1-2025-26`)

**Response:**
```json
{
    "trends": [
        {
            "term_id": "T1-2023-24",
            "average_rating": 2.1,
            "assessments_count": 164
        },
        {
            "term_id": "T2-2023-24",
            "average_rating": 2.4,
            "assessments_count": 164
        },
        {
            "term_id": "T1-2025-26",
            "average_rating": 3.5,
            "assessments_count": 164
        }
    ],
    "overall_improvement": 1.4
}
```

---

## Query Patterns

### Parsing Assessment ID

```python
def parse_assessment_id(assessment_id: str) -> dict:
    """
    Parse assessment ID: cedar-park-primary-ES1-T1-2024-25
    Returns: {school_id, standard_code, term_id, academic_year}
    """
    parts = assessment_id.rsplit('-', 4)  # Split from right
    
    # Last 4 parts: standard_code, term, year_start, year_end
    # Everything before: school_id
    
    if len(parts) < 5:
        raise ValueError(f"Invalid assessment_id format: {assessment_id}")
    
    # Reconstruct
    year_end = parts[-1]      # "25"
    year_start = parts[-2]    # "2024"
    term = parts[-3]          # "T1"
    standard_code = parts[-4] # "ES1"
    school_id = '-'.join(parts[:-4])  # "cedar-park-primary"
    
    return {
        "school_id": school_id,
        "standard_code": standard_code,
        "term_id": term,
        "academic_year": f"{year_start}-{year_end}",
        "unique_term_id": f"{term}-{year_start}-{year_end}"
    }

# Example
parse_assessment_id("cedar-park-primary-ES1-T1-2024-25")
# Returns:
# {
#     "school_id": "cedar-park-primary",
#     "standard_code": "ES1",
#     "term_id": "T1",
#     "academic_year": "2024-25",
#     "unique_term_id": "T1-2024-25"
# }
```

### Finding Assessment by Parsed ID

```python
async def get_assessment_by_id(assessment_id: str, mat_id: str):
    parsed = parse_assessment_id(assessment_id)
    
    query = """
        SELECT a.* 
        FROM assessments a
        JOIN schools s ON a.school_id = s.school_id
        JOIN mat_standards ms ON a.mat_standard_id = ms.mat_standard_id
        WHERE a.school_id = %s
          AND ms.standard_code = %s
          AND a.unique_term_id = %s
          AND s.mat_id = %s
    """
    
    return await db.fetch_one(query, [
        parsed["school_id"],
        parsed["standard_code"],
        parsed["unique_term_id"],
        mat_id
    ])
```

---

## Response Formats

### Standard Error Response

```json
{
    "detail": "Assessment not found",
    "error_code": "NOT_FOUND",
    "assessment_id": "cedar-park-primary-ES1-T1-2024-25"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid data) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (MAT isolation violation) |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Server Error |

---

## Frontend Integration Guide

### TypeScript Interfaces

```typescript
// Core types
interface Assessment {
    id: string;
    assessment_id: string;  // cedar-park-primary-ES1-T1-2024-25
    school_id: string;
    school_name: string;
    mat_standard_id: string;  // OLT-ES1
    standard_code: string;    // ES1
    standard_name: string;
    mat_aspect_id: string;    // OLT-EDU
    aspect_code: string;      // EDU
    aspect_name: string;
    version_id: string;       // OLT-ES1-v1
    version_number: number;
    unique_term_id: string;   // T1-2024-25
    academic_year: string;    // 2024-25
    rating: number | null;
    evidence_comments: string | null;
    status: 'not_started' | 'in_progress' | 'completed' | 'approved';
    due_date: string | null;
    assigned_to: string | null;
    submitted_at: string | null;
    submitted_by: string | null;
    last_updated: string;
}

interface AssessmentGroup {
    group_id: string;  // cedar-park-primary-EDU-T1-2024-25
    school_id: string;
    school_name: string;
    mat_aspect_id: string;
    aspect_code: string;
    aspect_name: string;
    term_id: string;
    academic_year: string;
    status: 'not_started' | 'in_progress' | 'completed';
    total_standards: number;
    completed_standards: number;
    due_date: string | null;
    last_updated: string;
}

interface Standard {
    mat_standard_id: string;  // OLT-ES1
    standard_code: string;    // ES1
    standard_name: string;
    standard_description: string;
    mat_aspect_id: string;    // OLT-EDU
    aspect_code: string;      // EDU
    aspect_name: string;
    current_version_id: string;
    current_version: number;
    is_custom: boolean;
    is_modified: boolean;
}

interface Aspect {
    mat_aspect_id: string;  // OLT-EDU
    aspect_code: string;    // EDU
    aspect_name: string;
    aspect_description: string;
    standards_count: number;
    is_custom: boolean;
}
```

### API Client

```typescript
class AssurlyAPI {
    private baseUrl = '/api';
    private token: string;
    
    constructor(token: string) {
        this.token = token;
    }
    
    private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                ...options?.headers
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'API Error');
        }
        
        return response.json();
    }
    
    // Assessments
    async getAssessments(filters?: {
        school_id?: string;
        aspect_code?: string;
        term_id?: string;
        academic_year?: string;
    }): Promise<AssessmentGroup[]> {
        const params = new URLSearchParams(filters as any);
        return this.fetch(`/assessments?${params}`);
    }
    
    async getAssessment(assessmentId: string): Promise<Assessment> {
        return this.fetch(`/assessments/${assessmentId}`);
    }
    
    async updateAssessment(assessmentId: string, data: {
        rating: number;
        evidence_comments: string;
    }): Promise<void> {
        await this.fetch(`/assessments/${assessmentId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    // Standards
    async getStandards(aspectCode?: string): Promise<Standard[]> {
        const params = aspectCode ? `?aspect_code=${aspectCode}` : '';
        return this.fetch(`/standards${params}`);
    }
    
    // Aspects
    async getAspects(): Promise<Aspect[]> {
        return this.fetch('/aspects');
    }
    
    // Schools
    async getSchools(): Promise<School[]> {
        return this.fetch('/schools');
    }
}
```

### Parsing Assessment ID (Frontend)

```typescript
function parseAssessmentId(assessmentId: string): {
    schoolId: string;
    standardCode: string;
    termId: string;
    academicYear: string;
} {
    // cedar-park-primary-ES1-T1-2024-25
    const parts = assessmentId.split('-');
    
    // Work backwards from the end
    const yearEnd = parts.pop()!;     // "25"
    const yearStart = parts.pop()!;   // "2024"
    const term = parts.pop()!;        // "T1"
    const standardCode = parts.pop()!; // "ES1"
    const schoolId = parts.join('-'); // "cedar-park-primary"
    
    return {
        schoolId,
        standardCode,
        termId: term,
        academicYear: `${yearStart}-${yearEnd}`
    };
}
```

---

## Migration Notes from v3.x

### Breaking Changes

1. **ID Format Changes**
   - Old: `5b9400ca-deca-11f0-adf2-42010a400005`
   - New: `OLT-ES1`

2. **Table References**
   - Old: `standards.standard_id`
   - New: `mat_standards.mat_standard_id`

3. **New Required Fields**
   - `version_id` on assessments
   - All queries must filter by MAT

4. **Assessment ID Format**
   - Old: `{uuid}-{aspect_id}-{term}-{year}`
   - New: `{school_id}-{standard_code}-{unique_term_id}`

### Migration Checklist

- [ ] Update all ID references to new format
- [ ] Add MAT filtering to all queries
- [ ] Include version_id in assessment operations
- [ ] Update frontend types and API client
- [ ] Test assessment CRUD with new IDs
- [ ] Verify analytics queries work with versioning

---

## Support

- API Documentation: `/api/docs` (Swagger UI)
- OpenAPI Spec: `/api/openapi.json`

**Document Version:** 4.0.0  
**API Version:** 4.0.0  
**Last Reviewed:** 2025-12-29
