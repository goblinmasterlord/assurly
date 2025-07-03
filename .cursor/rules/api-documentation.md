## Data Validation Rules

### Rating Values

- **Valid values:** `1`, `2`, `3`, `4`, or `null`
- **Meaning:**
    - `1` = Inadequate
    - `2` = Requires Improvement
    - `3` = Good
    - `4` = Outstanding
    - `null` = Not yet rated

### Evidence Comments

- **Type:** String
- **Max length:** No enforced limit (database dependent)
- **Required:** No (can be empty string)
- **HTML:** Not sanitized (frontend should handle)

### Standard IDs

- **Format:** Alphanumeric strings (e.g., "ES1", "SS2", "LM3")
- **Case sensitive:** Yes
- **Must exist:** In the database for the specified assessment

# Overview - Assessments

The Assessment API provides endpoints to retrieve assessment data from the system. All endpoints return JSON responses and follow RESTful conventions.

**Base URL:** `https://assurly-frontend-400616570417.europe-west2.run.app/api`

# Endpoints

## 1. GET All Assessments

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
curl -X GET "<https://assurly-frontend-400616570417.europe-west2.run.app/api/assessments>"

# Filter by school
curl -X GET "<https://assurly-frontend-400616570417.europe-west2.run.app/api/assessments?school_id=cedar-park-primary>"

# Multiple filters
curl -X GET "<https://assurly-frontend-400616570417.europe-west2.run.app/api/assessments?school_id=cedar-park-primary&status=in_progress&academic_year=2024-25>"
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

## 2. GET Assessment Details

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
curl -X GET "https://assurly-frontend-400616570417.europe-west2.run.app/api/assessments/cedar-park-primary-Education-T1-2024-25"
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
curl -X GET "https://assurly-frontend-400616570417.europe-west2.run.app/api/assessments?school_id=cedar-park-primary" | jq '.[].assessment_id'

# Response example:
# "cedar-park-primary-Education-T1-2024-25"
# "cedar-park-primary-Safeguarding-T1-2024-25"
# "cedar-park-primary-Leadership-T2-2024-25"
```

**To find available categories/aspects for a school:**

```bash
curl -X GET "https://assurly-frontend-400616570417.europe-west2.run.app/api/assessments?school_id=cedar-park-primary" | jq '.[].category' | sort | uniq
```

**To find available terms:**

```bash
curl -X GET "https://assurly-frontend-400616570417.europe-west2.run.app/api/assessments?school_id=cedar-park-primary" | jq '.[].term_id' | sort | uniq
```

**To find available academic years:**

```bash
curl -X GET "[https://assurly-frontend-400616570417.europe-west2.run.app/api/assessments?school_id=cedar-park-primary](https://assurly-backend-400616570417.europe-west2.run.app/api/assessments?school_id=cedar-park-primary)" | jq '.[].academic_year' | sort | uniq
```

## 3. GET Schools

**Endpoint:** `GET /api/schools`

**Description:** Retrieve a list of schools, optionally filtered by Multi-Academy Trust (MAT). This endpoint provides basic school information needed for dropdowns, filters, and school selection interfaces.

**Use Cases:**

- Populate school selection dropdowns
- Filter data by specific MAT
- Display school information in dashboards
- Validate school access permissions

**Query Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `mat_id` | string | No | Filter schools by MAT identifier |

**Example Requests:**

```bash
# Get all schools
curl -X GET "<https://assurly-frontend-400616570417.europe-west2.run.app/api/schools>"

# Get schools for specific MAT
curl -X GET "<https://assurly-frontend-400616570417.europe-west2.run.app/api/schools?mat_id=OLT>"
```

**Success Response (200):**

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

- `school_id`: Unique school identifier
- `school_name`: Human-readable school name
- `school_code`: 3-letter school code (auto-generated)
- `mat_id`: Multi-Academy Trust identifier
- `mat_name`: MAT display name

## 4. GET Standards

**Endpoint:** `GET /api/standards`

**Description:** Retrieve assessment standards/criteria, optionally filtered by assessment area. Standards represent the individual criteria that are rated within assessments.

**Use Cases:**

- Display available standards for assessment forms
- Filter standards by assessment category
- Build dynamic assessment interfaces
- Show standard details and descriptions

**Parameters**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `aspect_id` | string | No | Filter standards by assessment area/aspect |

**Example requests**

```bash
# Get all standards
curl -X GET "https://assurly-frontend-400616570417.europe-west2.run.app/api/standards"

# Get education standards only
curl -X GET "https://assurly-frontend-400616570417.europe-west2.run.app/api/standards?aspect_id=education"

# Get HR standards
curl -X GET "https://assurly-frontend-400616570417.europe-west2.run.app/api/standards?aspect_id=hr"
```

## 5. Get Assessment Areas

**Endpoint:** `GET /api/areas`

**Description:** Retrieve all assessment areas/categories/aspects. Areas group related standards together and represent different aspects of school performance.

**Use Cases:**

- Display assessment categories in navigation
- Show area-based performance summaries
- Filter assessments and data by category
- Create assessment category selectors

**Example Request:**

```
curl -X GET "https://assurly-frontend-400616570417.europe-west2.run.app/api/areas"
```

## 6. Get Academic Terms

**Endpoint:** `GET /api/terms`

**Description:** Retrieve academic terms and periods with date ranges. Terms define the assessment periods within academic years.

**Use Cases:**

- Display term selectors in filters
- Show current/active term
- Validate assessment due dates
- Build academic year navigation

**Example Request:**

```bash
curl -X GET "https://assurly-frontend-400616570417.europe-west2.run.app/api/terms"
```

## 6. Get Academic Terms

**Endpoint:** `GET /api/terms`

**Description:** Retrieve academic terms and periods with date ranges. Terms define the assessment periods within academic years.

**Use Cases:**

- Display term selectors in filters
- Show current/active term
- Validate assessment due dates
- Build academic year navigation

**Example Request:**

```bash
curl -X GET "https://assurly-frontend-400616570417.europe-west2.run.app/api/terms"
```

## 7. Get Users

**Endpoint:** `GET /api/users`

**Description:** Retrieve system users with optional filtering by school and role. Used for user management, assignment, and permission checking.

**Use Cases:**

- Populate user assignment dropdowns
- Filter users by school or role
- Display user management interfaces
- Validate user permissions and access
    
    ![Screenshot 2025-07-03 at 14.59.28.png](attachment:a338e468-84d0-4df4-a233-ff468f131e7b:Screenshot_2025-07-03_at_14.59.28.png)
    

**Example Requests:**

```bash
# Get all users
curl -X GET "https://assurly-frontend-400616570417.europe-west2.run.app/api/users"

# Get users for specific school
curl -X GET "https://assurly-frontend-400616570417.europe-west2.run.app/api/users?school_id=cedar-park-primary"

# Get department heads
curl -X GET "https://assurly-frontend-400616570417.europe-west2.run.app/api/users?role=department-head"
```

## 8. Get Current User

**Endpoint:** `GET /api/users/me`

**Description:** Retrieve information about the currently authenticated user. Provides user context for the application session.

**Use Cases:**

- Display current user information
- Check user permissions and access levels
- Determine user's school and MAT context
- Show personalized content and navigation

**Example Request:**

```bash
curl -X GET "https://assurly-frontend-400616570417.europe-west2.run.app/api/users/me"
```

## 9. Create Assessments

**Endpoint:** `POST /api/assessments`

**Description:** Create new assessment records for specified schools and assessment category. This endpoint generates assessment records for all standards within the specified area across multiple schools.

**Use Cases:**

- Bulk create assessments for new term
- Set up assessments for multiple schools at once
- Initialize assessment framework for specific categories
- Administrative assessment setup

**Request Body:**

```bash
{
  "category": "education",
  "school_ids": ["cedar-park-primary", "maple-grove-school"],
  "due_date": "2025-04-30",
  "term_id": "T1", 
  "academic_year": "2024-25",
  "assigned_to": ["user1"]
}
```

## 10. POST - Submit/Update Assessment Ratings (Single or Multiple Standards)

## Overview

These endpoints allow submitting, updating, and saving assessment ratings and evidence. The POST endpoint handles both single and multiple standard updates with automatic UPSERT logic.

**Endpoint:** `POST /api/assessments/{assessment_id}/submit`

**Description:** Submit or update ratings for one or multiple standards within an assessment. This endpoint uses intelligent UPSERT logic - it will automatically create new records or update existing ones based on the combination of school_id, standard_id, term_id, and academic_year. Perfect for progressive auto-save functionality where users can save individual standards or multiple standards at once.

**Use Cases:**

- **Progressive auto-save**: Save individual standards as user completes them
- **Bulk updates**: Submit multiple completed standards at once
- **Draft saving**: Save partial progress without losing work
- **Form auto-save**: Automatically save changes as user types/selects ratings
- **Recovery workflow**: Continue where user left off after page refresh/browser close

**Path Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `assessment_id` | string | Yes | Assessment identifier (format varies, used for parsing only) |

**Request Body:**

```json
{
  "assessment_id": "cedar-park-primary-education-T1-2024-25",
  "standards": [
    {
      "standard_id": "ES1",
      "rating": 4,
      "evidence_comments": "Excellent curriculum implementation with clear impact on pupil outcomes...",
      "submitted_by": "user1"
    },
    {
      "standard_id": "ES2",
      "rating": 3,
      "evidence_comments": "Good teaching quality with some areas for development...",
      "submitted_by": "user1"
    }
  ]
}
```

**Request Fields:**

- `assessment_id`: Must match the path parameter (used for validation)
- `standards`: Array of standard submissions (can contain 1 or many standards)
    - `standard_id`: Unique identifier for the standard (e.g., "ES1", "HR3", "BO2")
    - `rating`: Integer 1-4 (1=Inadequate, 2=Requires Improvement, 3=Good, 4=Outstanding) or `null` for not rated
    - `evidence_comments`: Text evidence supporting the rating (can be empty string)
    - `submitted_by`: User ID of the person submitting

**UPSERT Logic:**

- **New standard**: Creates a new record with auto-generated UUID and assessment_id
- **Existing standard**: Updates the existing record while preserving the original UUID
- **Identification**: Records are matched using `(school_id, standard_id, term_id, academic_year)`
- **Auto-generation**: The `assessment_id` field is automatically generated by the database

**Example Requests:**

**Single standard (perfect for auto-save):**

```bash
curl -X POST "https://assurly-frontend-400616570417.europe-west2.run.app/api/assessments/cedar-park-primary-education-T1-2024-25/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "assessment_id": "cedar-park-primary-education-T1-2024-25",
    "standards": [
      {
        "standard_id": "ES1",
        "rating": 4,
        "evidence_comments": "Progressive save - individual standard",
        "submitted_by": "user1"
      }
    ]
  }'
```

**Multiple standards (bulk submission):**

```bash
curl -X POST "https://assurly-frontend-400616570417.europe-west2.run.app/api/assessments/cedar-park-primary-education-T1-2024-25/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "assessment_id": "cedar-park-primary-education-T1-2024-25",
    "standards": [
      {
        "standard_id": "ES1",
        "rating": 4,
        "evidence_comments": "Excellent implementation",
        "submitted_by": "user1"
      },
      {
        "standard_id": "ES2",
        "rating": 3,
        "evidence_comments": "Good progress shown",
        "submitted_by": "user1"
      },
      {
        "standard_id": "ES3",
        "rating": 2,
        "evidence_comments": "Requires improvement",
        "submitted_by": "user1"
      }
    ]
  }'
```

**Success Response (200):**

```json
{
  "message": "Successfully updated 3 standards",
  "assessment_id": "cedar-park-primary-education-T1-2024-25",
  "updated_standards": ["ES1", "ES2", "ES3"],
  "status": "success"
}
```