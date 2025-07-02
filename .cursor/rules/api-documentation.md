# Endpoints v2 Tom

Status: Backlog

# Assessment API Documentation

## Overview

The Assessment API provides endpoints to retrieve assessment data from the system. All endpoints return JSON responses and follow RESTful conventions.

**Base URL:** `https://assurly-backend-400616570417.europe-west2.run.app/api`

## Endpoints

### 1. Get All Assessments

**Endpoint:** `GET /api/assessments`

**Description:** Retrieves a list of assessment summaries with optional filtering capabilities.

**Query Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `school_id` | string | No | Filter by specific school ID |
| `category` | string | No | Filter by assessment category/aspect |
| `term` | string | No | Filter by term (e.g., "T1", "T2", "T3") |
| `academic_year` | string | No | Filter by academic year (e.g., "2024-25") |
| `status` | string | No | Filter by status: "completed", "in_progress", "not_started" |

**Example Requests:**

```bash
# Get all assessments
curl -X GET "<https://assurly-backend-400616570417.europe-west2.run.app/api/assessments>"

# Filter by school
curl -X GET "<https://assurly-backend-400616570417.europe-west2.run.app/api/assessments?school_id=cedar-park-primary>"

# Multiple filters
curl -X GET "<https://assurly-backend-400616570417.europe-west2.run.app/api/assessments?school_id=cedar-park-primary&status=in_progress&academic_year=2024-25>"
```

**Response format**

```json
[
  {
    "assessment_id": "cedar-park-primary-Education-T1-2024-25",
    "name": "Education Assessment",
    "category": "Education",
    "school_id": "cedar-park-primary",
    "school_name": "Cedar Park Primary School",
    "mat_id": "MAT123",
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

- `assessment_id`: Unique identifier for the assessment (composite key)
- `name`: Human-readable assessment name
- `category`: Assessment category/aspect
- `school_id`: School identifier
- `school_name`: School display name
- `mat_id`: Multi-Academy Trust identifier
- `status`: Assessment completion status
- `completed_standards`: Number of standards completed
- `total_standards`: Total number of standards in assessment
- `completion_percentage`: Percentage of completion
- `overall_score`: Average rating across completed standards
- `due_date`: Assessment due date (YYYY-MM-DD format)
- `assigned_to`: Array of user IDs assigned to this assessment
- `last_updated`: Last modification timestamp (ISO 8601 format)
- `updated_by`: User who last updated the assessment
- `term_id`: Term identifier
- `academic_year`: Academic year

### 2. Get Assessment Details

**Endpoint:** `GET /api/assessments/{assessment_id}`

**Description:** Retrieves detailed information for a specific assessment, including all standards within that assessment.

**Path Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| assessment_id | string | Yes | Unique assessment identifier |

**Assessment ID Format:**
The `assessment_id` follows the pattern: `{school_id}-{category}-{term_id}-{academic_year}`

Example: `cedar-park-primary-Education-T1-2024-25`

**Example Request**

```bash
curl -X GET "https://assurly-backend-400616570417.europe-west2.run.app/api/assessments/cedar-park-primary-Education-T1-2024-25"
```

**Response Format:**

```json
{
  "assessment_id": "cedar-park-primary-Education-T1-2024-25",
  "name": "Education Assessment",
  "category": "Education",
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
      "area_id": "Education",
      "rating": 3,
      "evidence_comments": "Our curriculum sequencing shows clear progression...",
      "submitted_at": "2025-03-18T14:30:00Z",
      "submitted_by": "user123",
      "has_attachments": false
    }
  ]
}
```

**Response Fields:**

- **Assessment Level:**
    - `assessment_id`: Unique identifier
    - `name`: Assessment display name
    - `category`: Assessment category
    - `school_id`: School identifier
    - `school_name`: School display name
    - `status`: Overall assessment status
    - `due_date`: Due date
    - `assigned_to`: Array of assigned users
    - `last_updated`: Last modification timestamp
    - `updated_by`: Last user to update
    - `term_id`: Term identifier
    - `academic_year`: Academic year
- **Standards Array:**
    - `standard_id`: Unique standard identifier
    - `standard_name`: Standard display name
    - `description`: Standard description (currently empty)
    - `area_id`: Area/aspect the standard belongs to
    - `rating`: Numeric rating (1-4, null if not rated)
    - `evidence_comments`: Evidence text provided
    - `submitted_at`: When the standard was last submitted
    - `submitted_by`: User who submitted the standard
    - `has_attachments`: Whether files are attached (currently false)

## How to Get Assessment IDs

### Method 1: Extract from List Response

The most common way to get valid `assessment_id` values is to call the list endpoint first:

```bash
# Get all assessment IDs for a school
curl -X GET "https://assurly-backend-400616570417.europe-west2.run.app/api/assessments?school_id=cedar-park-primary" | jq '.[].assessment_id'

# Response example:
# "cedar-park-primary-Education-T1-2024-25"
# "cedar-park-primary-Safeguarding-T1-2024-25"
# "cedar-park-primary-Leadership-T2-2024-25"
```

**To find available categories/aspects for a school:**

```bash
curl -X GET "https://assurly-backend-400616570417.europe-west2.run.app/api/assessments?school_id=cedar-park-primary" | jq '.[].category' | sort | uniq
```

**To find available terms:**

```bash
curl -X GET "https://assurly-backend-400616570417.europe-west2.run.app/api/assessments?school_id=cedar-park-primary" | jq '.[].term_id' | sort | uniq
```

**To find available academic years:**

```bash
curl -X GET "[https://assurly-backend-400616570417.europe-west2.run.app/api/assessments?school_id=cedar-park-primary](https://assurly-backend-400616570417.europe-west2.run.app/api/assessments?school_id=cedar-park-primary)" | jq '.[].academic_year' | sort | uniq
```