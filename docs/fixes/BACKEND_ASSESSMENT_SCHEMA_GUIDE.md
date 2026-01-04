# Backend Assessment Schema Fix Guide

**Error:** `Unknown column 'a.term_id' in 'field list'`  
**Endpoint:** `GET /api/assessments`

---

## Problem

The backend query is trying to SELECT `a.term_id` from the `assessments` table (aliased as `a`), but this column doesn't exist in the v3.0 schema.

---

## v3.0 Assessment Schema Structure

### Core Assessment Table Fields

Based on the v3.0 API specification, assessments are identified by a **composite key**:
- `school_id` (UUID, FK to schools table)
- `mat_aspect_id` (UUID, FK to mat_aspects table) - **NOT** `category`
- `term_id` (String: "T1", "T2", "T3")
- `academic_year` (String: "2024-2025")

### Expected Assessments Table Structure

```sql
CREATE TABLE assessments (
  -- Composite primary key components
  school_id VARCHAR(36) NOT NULL,
  mat_aspect_id VARCHAR(36) NOT NULL,  -- Links to mat_aspects table
  term_id VARCHAR(10) NOT NULL,        -- "T1", "T2", "T3"
  academic_year VARCHAR(20) NOT NULL,  -- "2024-2025"
  
  -- Assessment data
  mat_standard_id VARCHAR(36) NOT NULL, -- FK to mat_standards
  rating INT,                           -- 1-4 or NULL
  evidence_comments TEXT,
  submitted_at DATETIME,
  submitted_by_user_id VARCHAR(36),
  
  -- Audit fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Composite PK
  PRIMARY KEY (school_id, mat_aspect_id, term_id, academic_year, mat_standard_id),
  
  -- Foreign keys
  FOREIGN KEY (school_id) REFERENCES schools(school_id),
  FOREIGN KEY (mat_aspect_id) REFERENCES mat_aspects(mat_aspect_id),
  FOREIGN KEY (mat_standard_id) REFERENCES mat_standards(mat_standard_id)
);
```

**Note:** Each row represents one standard's rating within an assessment. An "assessment" is the aggregate of all standards for a given (school, aspect, term, academic_year).

---

## Correct Query for GET /api/assessments

### Summary Query (List View)

```sql
SELECT 
  -- Composite assessment ID
  CONCAT(a.school_id, '-', asp.aspect_code, '-', a.term_id, '-', a.academic_year) as assessment_id,
  
  -- School info
  a.school_id,
  s.school_name,
  
  -- Assessment context
  a.mat_aspect_id,
  asp.aspect_code,
  asp.aspect_name,
  a.term_id,
  a.academic_year,
  
  -- Aggregated statistics
  COUNT(DISTINCT a.mat_standard_id) as total_standards,
  SUM(CASE WHEN a.rating IS NOT NULL THEN 1 ELSE 0 END) as completed_standards,
  AVG(a.rating) as overall_score,
  
  -- Status calculation
  CASE 
    WHEN SUM(CASE WHEN a.rating IS NOT NULL THEN 1 ELSE 0 END) = 0 THEN 'not_started'
    WHEN SUM(CASE WHEN a.rating IS NOT NULL THEN 1 ELSE 0 END) < COUNT(DISTINCT a.mat_standard_id) THEN 'in_progress'
    WHEN MIN(a.submitted_at) IS NOT NULL THEN 'submitted'
    ELSE 'completed'
  END as status,
  
  -- Submission info
  MIN(a.submitted_at) as submitted_at,
  MIN(a.submitted_by_user_id) as submitted_by_user_id,
  
  -- Audit
  MIN(a.created_at) as created_at,
  MAX(a.updated_at) as updated_at

FROM assessments a
INNER JOIN schools s ON a.school_id = s.school_id
INNER JOIN mat_aspects asp ON a.mat_aspect_id = asp.mat_aspect_id

-- MAT isolation
WHERE s.mat_id = %s  -- User's MAT ID from JWT
  AND asp.mat_id = %s  -- Same MAT ID
  AND asp.is_active = 1
  
-- Optional filters (add as needed)
-- AND a.school_id = %s (if school_id filter provided)
-- AND a.term_id = %s (if term filter provided)
-- AND a.academic_year = %s (if academic_year filter provided)
-- AND asp.aspect_code = %s (if category filter provided)

GROUP BY 
  a.school_id, 
  a.mat_aspect_id, 
  a.term_id, 
  a.academic_year,
  s.school_name,
  asp.aspect_code,
  asp.aspect_name

ORDER BY 
  s.school_name, 
  asp.sort_order, 
  a.academic_year DESC, 
  a.term_id;
```

### Detail Query (Single Assessment)

```sql
SELECT 
  -- Composite assessment ID
  CONCAT(a.school_id, '-', asp.aspect_code, '-', a.term_id, '-', a.academic_year) as assessment_id,
  
  -- School info
  a.school_id,
  s.school_name,
  
  -- Assessment context
  a.mat_aspect_id,
  asp.aspect_code,
  asp.aspect_name,
  a.term_id,
  a.academic_year,
  
  -- Standard details
  a.mat_standard_id,
  std.standard_code,
  std.standard_name,
  std.standard_description,
  std.sort_order,
  std.version_number,
  
  -- Assessment data for this standard
  a.rating,
  a.evidence_comments,
  a.submitted_at,
  a.submitted_by_user_id,
  a.created_at,
  a.updated_at

FROM assessments a
INNER JOIN schools s ON a.school_id = s.school_id
INNER JOIN mat_aspects asp ON a.mat_aspect_id = asp.mat_aspect_id
INNER JOIN mat_standards std ON a.mat_standard_id = std.mat_standard_id

-- MAT isolation
WHERE s.mat_id = %s
  AND asp.mat_id = %s
  AND std.mat_id = %s
  AND asp.is_active = 1
  AND std.is_active = 1
  
  -- Assessment identification (parsed from composite ID)
  AND a.school_id = %s
  AND asp.aspect_code = %s
  AND a.term_id = %s
  AND a.academic_year = %s

ORDER BY std.sort_order;
```

---

## Expected API Response Format

### GET /api/assessments

```json
[
  {
    "assessment_id": "school-uuid-EDU-T1-2024-2025",
    "school_id": "school-uuid",
    "school_name": "Cedar Park Primary",
    "mat_aspect_id": "aspect-uuid",
    "aspect_code": "EDU",
    "aspect_name": "Education",
    "term_id": "T1",
    "academic_year": "2024-2025",
    "status": "in_progress",
    "completed_standards": 15,
    "total_standards": 41,
    "overall_score": 3.2,
    "submitted_at": null,
    "submitted_by_user_id": null,
    "created_at": "2024-01-15T10:00:00",
    "updated_at": "2024-12-20T14:30:00"
  }
]
```

### GET /api/assessments/{assessment_id}

```json
{
  "assessment_id": "school-uuid-EDU-T1-2024-2025",
  "school_id": "school-uuid",
  "school_name": "Cedar Park Primary",
  "mat_aspect_id": "aspect-uuid",
  "aspect_code": "EDU",
  "aspect_name": "Education",
  "term_id": "T1",
  "academic_year": "2024-2025",
  "status": "in_progress",
  "completed_standards": 15,
  "total_standards": 41,
  "overall_score": 3.2,
  "submitted_at": null,
  "submitted_by_user_id": null,
  "created_at": "2024-01-15T10:00:00",
  "updated_at": "2024-12-20T14:30:00",
  "standards": [
    {
      "mat_standard_id": "standard-uuid",
      "standard_code": "ES1",
      "standard_name": "Quality of Education",
      "standard_description": "Curriculum intent, implementation...",
      "sort_order": 1,
      "version_number": 1,
      "rating": 3,
      "evidence_comments": "Strong curriculum planning...",
      "submitted_at": null,
      "submitted_by_user_id": null
    }
  ]
}
```

---

## Common Issues & Solutions

### Issue 1: "Unknown column 'a.term_id'"
**Cause:** Query assumes `term_id` is in assessments table but it doesn't exist.  
**Solution:** `term_id` **IS** in the assessments table as part of the composite key. Check your CREATE TABLE statement.

### Issue 2: Using `category` instead of `mat_aspect_id`
**Cause:** v2.x used `category` field.  
**Solution:** v3.0 uses `mat_aspect_id` (UUID) linking to `mat_aspects` table. Use `aspect_code` from the joined `mat_aspects` table for the composite ID.

### Issue 3: MAT Isolation Not Working
**Cause:** Not joining through schools table to check `mat_id`.  
**Solution:** Always join `schools` and `mat_aspects` tables and filter by `mat_id` from JWT.

### Issue 4: Assessment Status Calculation
**Cause:** No `status` column in table.  
**Solution:** Calculate dynamically:
- `not_started`: No standards have ratings
- `in_progress`: Some (but not all) standards have ratings
- `completed`: All standards have ratings, but not submitted
- `submitted`: All standards rated AND `submitted_at` is not NULL

---

## Parsing Composite Assessment ID

When receiving `assessment_id` from frontend (e.g., in detail view):

```python
# Example: "abc123-EDU-T1-2024-2025"
parts = assessment_id.split('-')
school_id = parts[0]
aspect_code = parts[1]
term_id = parts[2]
academic_year = '-'.join(parts[3:])  # Handle "2024-2025"

# Then use these in WHERE clause after looking up mat_aspect_id:
# SELECT mat_aspect_id FROM mat_aspects 
# WHERE aspect_code = %s AND mat_id = %s
```

---

## Testing Checklist

- [ ] GET /api/assessments returns list without errors
- [ ] Response includes `term_id` and `academic_year` fields
- [ ] MAT isolation works (only shows assessments for user's MAT)
- [ ] Status is calculated correctly
- [ ] `overall_score` is NULL when no ratings exist
- [ ] GET /api/assessments/{composite_id} parses ID correctly
- [ ] Detail view returns all standards for the assessment
- [ ] Standards are ordered by `sort_order`

---

## Frontend Compatibility

The frontend is **ready** for this response structure. The following have been updated:
- ✅ `ApiAssessmentSummary` interface in `data-transformers.ts`
- ✅ `ApiAssessmentDetail` interface in `data-transformers.ts`
- ✅ `transformAssessmentSummary()` transformer
- ✅ `transformAssessmentDetail()` transformer
- ✅ Assessment service endpoints

Once backend returns the correct structure, assessments will load immediately.

---

**Last Updated:** Dec 22, 2025  
**For Questions:** Check `docs/api/FRONTEND_MIGRATION_GUIDE.md`


