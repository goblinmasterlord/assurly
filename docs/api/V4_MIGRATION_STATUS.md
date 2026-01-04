# V4 Schema Migration Status

**Date:** 2025-12-29
**Branch:** `claude/aspects-mj7q251wgs0dopwj-EiE0X`

## Overview

Migrating from UUID-based IDs to human-readable IDs per `ASSESSMENT_API_SPECIFICATION_v4.md`.

### Key ID Format Changes

| Entity | Old (v3) | New (v4) | Example |
|--------|----------|----------|---------|
| School | UUID | slug | `cedar-park-primary` |
| MAT Aspect | UUID | `{MAT}-{CODE}` | `OLT-EDU` |
| MAT Standard | UUID | `{MAT}-{CODE}` | `OLT-ES1` |
| Assessment | `{uuid}-{uuid}-{term}` | `{school}-{code}-{term}` | `cedar-park-primary-ES1-T1-2024-25` |
| Group ID | N/A | `{school}-{aspect}-{term}` | `cedar-park-primary-EDU-T1-2024-25` |

---

## ✅ COMPLETED - ALL ENDPOINTS MIGRATED

### 1. GET `/api/assessments` ✅

**Updated:** Query parameters, grouping logic, response format

**Query Parameters:**
- `school_id` - school slug (e.g., "cedar-park-primary")
- `aspect_code` - aspect code (e.g., "EDU", "HR")
- `term_id` - term (e.g., "T1", "T2")
- `academic_year` - year (e.g., "2024-25")
- `status` - filter by status

**Response Format:**
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
  }
]
```

**Query:**
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
    ...
FROM assessments a
JOIN schools s ON a.school_id = s.school_id
JOIN mat_standards ms ON a.mat_standard_id = ms.mat_standard_id
JOIN mat_aspects ma ON ms.mat_aspect_id = ma.mat_aspect_id
WHERE s.mat_id = %s
GROUP BY s.school_id, s.school_name, ma.mat_aspect_id, ma.aspect_code,
         ma.aspect_name, a.unique_term_id, a.academic_year
```

---

### 2. GET `/api/assessments/{assessment_id}` ✅

**Updated:** Simplified query using virtual `assessment_id` column

**Path Parameter:**
- `assessment_id`: `cedar-park-primary-ES1-T1-2024-25`

**Implementation:**

```python
@app.get("/api/assessments/{assessment_id}", tags=["Assessments"])
async def get_assessment_details(
    assessment_id: str,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get detailed assessment with all standards.
    assessment_id format: {school_id}-{standard_code}-{unique_term_id}
    Example: cedar-park-primary-ES1-T1-2024-25
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Query using virtual assessment_id column
        query = """
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
        """
        cursor.execute(query, (assessment_id, current_mat_id))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Assessment not found")

        # Format response
        assessment_data = process_row_for_json(row)

        # Format dates
        if assessment_data.get('due_date') and isinstance(row['due_date'], date):
            assessment_data['due_date'] = row['due_date'].strftime('%Y-%m-%d')
        if assessment_data.get('submitted_at') and isinstance(row['submitted_at'], datetime):
            assessment_data['submitted_at'] = row['submitted_at'].strftime('%Y-%m-%dT%H:%M:%SZ')
        if assessment_data.get('last_updated') and isinstance(row['last_updated'], datetime):
            assessment_data['last_updated'] = row['last_updated'].strftime('%Y-%m-%dT%H:%M:%SZ')

        connection.close()
        return JSONResponse(content=assessment_data, status_code=200)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

### 3. PUT `/api/assessments/{assessment_id}` ✅

**Updated:** Update by `assessment_id` directly using v4 schema

**Implementation:**

```python
@app.put("/api/assessments/{assessment_id}", tags=["Assessments"])
async def update_assessment(
    assessment_id: str,
    update_data: dict,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Update assessment rating and evidence.
    assessment_id format: cedar-park-primary-ES1-T1-2024-25
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        rating = update_data.get('rating')
        evidence_comments = update_data.get('evidence_comments')

        # Update query with MAT isolation
        query = """
            UPDATE assessments a
            JOIN schools s ON a.school_id = s.school_id
            SET
                a.rating = %s,
                a.evidence_comments = %s,
                a.status = CASE
                    WHEN %s IS NOT NULL THEN 'completed'
                    ELSE 'in_progress'
                END,
                a.submitted_by = %s,
                a.last_updated = NOW(),
                a.updated_by = %s
            WHERE a.assessment_id = %s
              AND s.mat_id = %s
        """
        cursor.execute(query, (
            rating,
            evidence_comments,
            rating,
            current_user.user_id,
            current_user.user_id,
            assessment_id,
            current_mat_id
        ))

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Assessment not found")

        connection.close()
        return JSONResponse(content={
            "message": "Assessment updated successfully",
            "assessment_id": assessment_id,
            "status": "completed" if rating else "in_progress"
        }, status_code=200)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

### 4. POST `/api/assessments` ✅

**Updated:** Uses `aspect_code` and `unique_term_id` (format: `T1-2024-25`) with v4 schema

**Implementation:**

```python
@app.post("/api/assessments", tags=["Assessments"])
async def create_assessments(
    assessment_data: dict,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Create assessments for schools/aspect/term combination.

    Request body:
    {
        "school_ids": ["cedar-park-primary", "oak-hill-academy"],
        "aspect_code": "EDU",
        "term_id": "T1-2024-25",
        "due_date": "2024-12-20",
        "assigned_to": "user7"
    }
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        school_ids = assessment_data.get('school_ids', [])
        aspect_code = assessment_data.get('aspect_code')
        unique_term_id = assessment_data.get('term_id')  # Format: T1-2024-25
        due_date = assessment_data.get('due_date')
        assigned_to = assessment_data.get('assigned_to')

        # Extract academic_year from unique_term_id
        # T1-2024-25 -> 2024-25
        academic_year = unique_term_id.split('-', 1)[1] if '-' in unique_term_id else None

        # Validate schools belong to MAT
        placeholders = ','.join(['%s'] * len(school_ids))
        verify_query = f"""
            SELECT school_id FROM schools
            WHERE school_id IN ({placeholders}) AND mat_id = %s
        """
        cursor.execute(verify_query, school_ids + [current_mat_id])
        valid_schools = {row['school_id'] for row in cursor.fetchall()}

        invalid = set(school_ids) - valid_schools
        if invalid:
            raise HTTPException(
                status_code=403,
                detail=f"Schools not in your MAT: {', '.join(invalid)}"
            )

        # Get all mat_standards for this aspect
        standards_query = """
            SELECT ms.mat_standard_id, sv.version_id
            FROM mat_standards ms
            JOIN mat_aspects ma ON ms.mat_aspect_id = ma.mat_aspect_id
            JOIN standard_versions sv ON ms.current_version_id = sv.version_id
            WHERE ms.mat_id = %s
              AND ma.aspect_code = %s
              AND ms.is_active = TRUE
        """
        cursor.execute(standards_query, (current_mat_id, aspect_code))
        standards = cursor.fetchall()

        if not standards:
            raise HTTPException(
                status_code=404,
                detail=f"No standards found for aspect: {aspect_code}"
            )

        # Create assessment for each (school, standard, term)
        created_count = 0
        for school_id in school_ids:
            for standard_row in standards:
                mat_standard_id = standard_row['mat_standard_id']
                version_id = standard_row['version_id']

                # Check if exists
                check_query = """
                    SELECT id FROM assessments
                    WHERE school_id = %s
                      AND mat_standard_id = %s
                      AND unique_term_id = %s
                """
                cursor.execute(check_query, (school_id, mat_standard_id, unique_term_id))

                if not cursor.fetchone():
                    # Create new assessment
                    insert_query = """
                        INSERT INTO assessments
                        (id, school_id, mat_standard_id, version_id,
                         unique_term_id, academic_year, due_date,
                         assigned_to, status, last_updated, updated_by)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'not_started', NOW(), %s)
                    """
                    new_id = str(uuid.uuid4())
                    cursor.execute(insert_query, (
                        new_id,
                        school_id,
                        mat_standard_id,
                        version_id,
                        unique_term_id,
                        academic_year,
                        due_date,
                        assigned_to or current_user.user_id,
                        current_user.user_id
                    ))
                    created_count += 1

        connection.close()
        return JSONResponse(content={
            "message": f"Created {created_count} assessments for {len(school_ids)} schools",
            "assessments_created": created_count,
            "schools": school_ids,
            "aspect_code": aspect_code,
            "term_id": unique_term_id
        }, status_code=201)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

### 5. POST `/api/assessments/bulk-update` ✅

**Updated:** Updates by `assessment_id` array using v4 schema

**Implementation:**

```python
@app.post("/api/assessments/bulk-update", tags=["Assessments"])
async def bulk_update_assessments(
    bulk_data: dict,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Bulk update multiple assessments.

    Request body:
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
                "evidence_comments": "Good"
            }
        ]
    }
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        updates = bulk_data.get('updates', [])
        updated_count = 0

        update_query = """
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
        """

        for update in updates:
            assessment_id = update.get('assessment_id')
            rating = update.get('rating')
            evidence_comments = update.get('evidence_comments')

            cursor.execute(update_query, (
                rating,
                evidence_comments,
                rating,
                current_user.user_id,
                current_user.user_id,
                assessment_id,
                current_mat_id
            ))
            updated_count += cursor.rowcount

        connection.close()
        return JSONResponse(content={
            "message": f"Updated {updated_count} assessments",
            "updated_count": updated_count,
            "failed_count": len(updates) - updated_count
        }, status_code=200)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Migration Checklist

- [x] Update GET /api/assessments - ✅ COMPLETED
- [x] Update GET /api/assessments/{assessment_id} - ✅ COMPLETED
- [x] Update PUT /api/assessments/{assessment_id} - ✅ COMPLETED
- [x] Update POST /api/assessments - ✅ COMPLETED
- [x] Update POST /api/assessments/bulk-update - ✅ COMPLETED
- [ ] Test all endpoints with real data
- [ ] Update FRONTEND_MIGRATION_GUIDE.md
- [ ] Update API_DOCUMENTATION.md

---

## Testing Commands

```bash
# Test GET list (should work)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/assessments?aspect_code=EDU&term_id=T1"

# Test GET detail (needs update)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/assessments/cedar-park-primary-ES1-T1-2024-25"

# Test PUT (needs update)
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating": 4, "evidence_comments": "Excellent"}' \
  "http://localhost:8000/api/assessments/cedar-park-primary-ES1-T1-2024-25"

# Test POST (needs update)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "school_ids": ["cedar-park-primary"],
    "aspect_code": "EDU",
    "term_id": "T1-2025-26",
    "due_date": "2025-12-20"
  }' \
  "http://localhost:8000/api/assessments"
```

---

## Notes

- The `assessment_id` column in the database is a **VIRTUAL** column computed from other fields
- No complex parsing needed - just use it directly in WHERE clauses
- All IDs are now human-readable (school slugs, aspect codes, standard codes)
- MAT isolation is enforced via JOIN with schools table and `WHERE s.mat_id = %s`

**See:** `ASSESSMENT_API_SPECIFICATION_v4.md` for complete API specification
