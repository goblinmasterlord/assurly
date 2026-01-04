Frontend endpoint specifications:

1. GET /api/assessments/by-aspect/{aspect_code}
Purpose: Get all assessments for a specific aspect (all standards within that aspect) for a school/term. This powers the "assessment form view" where users rate all standards in one aspect.
Path Parameter:

aspect_code: e.g., EDU, HR, FIN

Query Parameters:

school_id (required): e.g., cedar-park-primary
term_id (required): e.g., T1-2024-25

SQL Query:
sqlSELECT
    a.assessment_id,
    a.id,
    a.mat_standard_id,
    ms.standard_code,
    ms.standard_name,
    ms.standard_description,
    ms.sort_order,
    a.rating,
    a.evidence_comments,
    a.version_id,
    sv.version_number,
    a.status,
    a.due_date,
    a.assigned_to,
    u.full_name as assigned_to_name,
    a.submitted_at,
    a.last_updated
FROM mat_standards ms
JOIN mat_aspects ma ON ms.mat_aspect_id = ma.mat_aspect_id
LEFT JOIN assessments a ON ms.mat_standard_id = a.mat_standard_id
    AND a.school_id = %s
    AND a.unique_term_id = %s
LEFT JOIN standard_versions sv ON a.version_id = sv.version_id
LEFT JOIN users u ON a.assigned_to = u.user_id
WHERE ma.aspect_code = %s
  AND ms.mat_id = %s
  AND ms.is_active = TRUE
ORDER BY ms.sort_order
Response:
json{
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
Notes:

Uses LEFT JOIN on assessments so standards without assessments still appear (with null values)
Calculates completed_standards and overall status from the standards array
Frontend uses this to render the full assessment form for an aspect


2. GET /api/standards/{mat_standard_id}
Purpose: Get a single standard with its full version history. Used for viewing standard details and seeing what changed between versions.
Path Parameter:

mat_standard_id: e.g., OLT-ES1

SQL Queries:
sql-- Main standard info
SELECT
    ms.mat_standard_id,
    ms.standard_code,
    ms.standard_name,
    ms.standard_description,
    ms.sort_order,
    ms.is_custom,
    ms.is_modified,
    ms.current_version_id,
    ma.mat_aspect_id,
    ma.aspect_code,
    ma.aspect_name,
    ms.created_at,
    ms.updated_at
FROM mat_standards ms
JOIN mat_aspects ma ON ms.mat_aspect_id = ma.mat_aspect_id
WHERE ms.mat_standard_id = %s
  AND ms.mat_id = %s

-- Version history
SELECT
    version_id,
    version_number,
    standard_code,
    standard_name,
    standard_description,
    effective_from,
    effective_to,
    change_reason,
    created_by_user_id,
    u.full_name as created_by_name
FROM standard_versions sv
LEFT JOIN users u ON sv.created_by_user_id = u.user_id
WHERE mat_standard_id = %s
ORDER BY version_number DESC
Response:
json{
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
            "standard_description": "Curriculum intent...",
            "effective_from": "2025-12-22T00:08:34Z",
            "effective_to": null,
            "change_reason": "Initial version - migrated from v1 schema",
            "created_by_name": null
        }
    ]
}

3. PUT /api/standards/{mat_standard_id}
Purpose: Update a standard's definition. Creates a new version (immutable history) rather than modifying in place. This preserves the exact wording used when assessments were made.
Path Parameter:

mat_standard_id: e.g., OLT-ES1

Request Body:
json{
    "standard_name": "Quality of Education (Updated)",
    "standard_description": "Updated description with clearer requirements...",
    "change_reason": "Clarified assessment criteria for 2025-26 academic year"
}
Process:

Get current version info
Set current version's effective_to = NOW()
Create new version with incremented version_number
Update mat_standards.current_version_id to new version
Update mat_standards name/description fields
Set is_modified = TRUE
Log to standard_edit_log

SQL Queries:
sql-- 1. Get current version
SELECT current_version_id, 
       (SELECT version_number FROM standard_versions WHERE version_id = ms.current_version_id) as current_version_num
FROM mat_standards ms
WHERE mat_standard_id = %s AND mat_id = %s

-- 2. Close current version
UPDATE standard_versions
SET effective_to = NOW()
WHERE version_id = %s

-- 3. Create new version
INSERT INTO standard_versions 
    (version_id, mat_standard_id, version_number, standard_code, standard_name, 
     standard_description, parent_version_id, effective_from, created_at, 
     created_by_user_id, change_reason)
VALUES 
    (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW(), %s, %s)

-- 4. Update mat_standards
UPDATE mat_standards
SET standard_name = %s,
    standard_description = %s,
    current_version_id = %s,
    is_modified = TRUE,
    updated_at = NOW()
WHERE mat_standard_id = %s AND mat_id = %s

-- 5. Log the edit
INSERT INTO standard_edit_log
    (log_id, mat_standard_id, version_id, action_type, edited_by_user_id, 
     edited_at, old_values, new_values, change_reason)
VALUES
    (%s, %s, %s, 'edited', %s, NOW(), %s, %s, %s)
Response:
json{
    "message": "Standard updated successfully",
    "mat_standard_id": "OLT-ES1",
    "new_version_id": "OLT-ES1-v2",
    "version_number": 2,
    "previous_version_id": "OLT-ES1-v1"
}
Implementation Notes:
python@app.put("/api/standards/{mat_standard_id}", tags=["Standards"])
async def update_standard(
    mat_standard_id: str,
    update_data: dict,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    connection = get_db_connection()
    cursor = connection.cursor()
    
    try:
        # Get current version info
        cursor.execute("""
            SELECT ms.current_version_id, ms.standard_code, sv.version_number
            FROM mat_standards ms
            JOIN standard_versions sv ON ms.current_version_id = sv.version_id
            WHERE ms.mat_standard_id = %s AND ms.mat_id = %s
        """, (mat_standard_id, current_mat_id))
        
        current = cursor.fetchone()
        if not current:
            raise HTTPException(status_code=404, detail="Standard not found")
        
        old_version_id = current['current_version_id']
        standard_code = current['standard_code']
        new_version_num = current['version_number'] + 1
        new_version_id = f"{mat_standard_id}-v{new_version_num}"
        
        new_name = update_data.get('standard_name')
        new_description = update_data.get('standard_description')
        change_reason = update_data.get('change_reason', '')
        
        # Close old version
        cursor.execute("""
            UPDATE standard_versions SET effective_to = NOW() WHERE version_id = %s
        """, (old_version_id,))
        
        # Create new version
        cursor.execute("""
            INSERT INTO standard_versions 
            (version_id, mat_standard_id, version_number, standard_code, standard_name,
             standard_description, parent_version_id, effective_from, created_at,
             created_by_user_id, change_reason)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW(), %s, %s)
        """, (new_version_id, mat_standard_id, new_version_num, standard_code,
              new_name, new_description, old_version_id, current_user.user_id, change_reason))
        
        # Update mat_standards
        cursor.execute("""
            UPDATE mat_standards
            SET standard_name = %s, standard_description = %s, 
                current_version_id = %s, is_modified = TRUE, updated_at = NOW()
            WHERE mat_standard_id = %s AND mat_id = %s
        """, (new_name, new_description, new_version_id, mat_standard_id, current_mat_id))
        
        # Log edit (store old/new as JSON)
        import json
        log_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO standard_edit_log
            (log_id, mat_standard_id, version_id, action_type, edited_by_user_id,
             edited_at, old_values, new_values, change_reason)
            VALUES (%s, %s, %s, 'edited', %s, NOW(), %s, %s, %s)
        """, (log_id, mat_standard_id, new_version_id, current_user.user_id,
              json.dumps({"version_id": old_version_id}),
              json.dumps({"version_id": new_version_id, "name": new_name}),
              change_reason))
        
        connection.commit()
        
        return JSONResponse(content={
            "message": "Standard updated successfully",
            "mat_standard_id": mat_standard_id,
            "new_version_id": new_version_id,
            "version_number": new_version_num,
            "previous_version_id": old_version_id
        }, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        connection.close()

4. GET /api/analytics/trends
Purpose: Get rating trends over time for analytics dashboard. Shows how ratings have improved (or not) across terms.
Query Parameters:

school_id (optional): Filter to single school, omit for trust-wide
aspect_code (optional): Filter to single aspect
from_term (optional): Start term, e.g., T1-2023-24
to_term (optional): End term, e.g., T1-2025-26

SQL Query:
sqlSELECT
    a.unique_term_id,
    a.academic_year,
    SUBSTRING(a.unique_term_id, 1, 2) as term_id,
    COUNT(*) as assessments_count,
    COUNT(CASE WHEN a.rating IS NOT NULL THEN 1 END) as rated_count,
    ROUND(AVG(a.rating), 2) as average_rating,
    MIN(a.rating) as min_rating,
    MAX(a.rating) as max_rating,
    COUNT(CASE WHEN a.rating = 1 THEN 1 END) as inadequate_count,
    COUNT(CASE WHEN a.rating = 2 THEN 1 END) as requires_improvement_count,
    COUNT(CASE WHEN a.rating = 3 THEN 1 END) as good_count,
    COUNT(CASE WHEN a.rating = 4 THEN 1 END) as outstanding_count
FROM assessments a
JOIN schools s ON a.school_id = s.school_id
JOIN mat_standards ms ON a.mat_standard_id = ms.mat_standard_id
JOIN mat_aspects ma ON ms.mat_aspect_id = ma.mat_aspect_id
WHERE s.mat_id = %s
  AND a.rating IS NOT NULL
  -- Optional filters applied here
GROUP BY a.unique_term_id, a.academic_year
ORDER BY a.academic_year, FIELD(SUBSTRING(a.unique_term_id, 1, 2), 'T1', 'T2', 'T3')
Response:
json{
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
Implementation Notes:
python@app.get("/api/analytics/trends", tags=["Analytics"])
async def get_trends(
    school_id: Optional[str] = None,
    aspect_code: Optional[str] = None,
    from_term: Optional[str] = None,
    to_term: Optional[str] = None,
    current_mat_id: str = Depends(get_current_mat)
):
    connection = get_db_connection()
    cursor = connection.cursor()
    
    query = """
        SELECT
            a.unique_term_id,
            a.academic_year,
            SUBSTRING(a.unique_term_id, 1, 2) as term_id,
            COUNT(*) as assessments_count,
            COUNT(CASE WHEN a.rating IS NOT NULL THEN 1 END) as rated_count,
            ROUND(AVG(a.rating), 2) as average_rating,
            MIN(a.rating) as min_rating,
            MAX(a.rating) as max_rating,
            COUNT(CASE WHEN a.rating = 1 THEN 1 END) as inadequate_count,
            COUNT(CASE WHEN a.rating = 2 THEN 1 END) as requires_improvement_count,
            COUNT(CASE WHEN a.rating = 3 THEN 1 END) as good_count,
            COUNT(CASE WHEN a.rating = 4 THEN 1 END) as outstanding_count
        FROM assessments a
        JOIN schools s ON a.school_id = s.school_id
        JOIN mat_standards ms ON a.mat_standard_id = ms.mat_standard_id
        JOIN mat_aspects ma ON ms.mat_aspect_id = ma.mat_aspect_id
        WHERE s.mat_id = %s
          AND a.rating IS NOT NULL
    """
    params = [current_mat_id]
    
    if school_id:
        query += " AND a.school_id = %s"
        params.append(school_id)
    
    if aspect_code:
        query += " AND ma.aspect_code = %s"
        params.append(aspect_code)
    
    if from_term:
        query += " AND a.unique_term_id >= %s"
        params.append(from_term)
    
    if to_term:
        query += " AND a.unique_term_id <= %s"
        params.append(to_term)
    
    query += """
        GROUP BY a.unique_term_id, a.academic_year
        ORDER BY a.academic_year, FIELD(SUBSTRING(a.unique_term_id, 1, 2), 'T1', 'T2', 'T3')
    """
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    # Build response
    trends = []
    for row in rows:
        trends.append({
            "unique_term_id": row['unique_term_id'],
            "term_id": row['term_id'],
            "academic_year": row['academic_year'],
            "assessments_count": row['assessments_count'],
            "rated_count": row['rated_count'],
            "average_rating": float(row['average_rating']) if row['average_rating'] else None,
            "min_rating": row['min_rating'],
            "max_rating": row['max_rating'],
            "rating_distribution": {
                "inadequate": row['inadequate_count'],
                "requires_improvement": row['requires_improvement_count'],
                "good": row['good_count'],
                "outstanding": row['outstanding_count']
            }
        })
    
    # Calculate summary
    if trends:
        first_avg = trends[0]['average_rating'] or 0
        last_avg = trends[-1]['average_rating'] or 0
        improvement = round(last_avg - first_avg, 2)
        overall_avg = round(sum(t['average_rating'] or 0 for t in trends) / len(trends), 2)
        trend_direction = "improving" if improvement > 0 else "declining" if improvement < 0 else "stable"
    else:
        improvement = 0
        overall_avg = 0
        trend_direction = "no_data"
    
    connection.close()
    
    return JSONResponse(content={
        "mat_id": current_mat_id,
        "filters": {
            "school_id": school_id,
            "aspect_code": aspect_code,
            "from_term": from_term,
            "to_term": to_term
        },
        "summary": {
            "total_terms": len(trends),
            "overall_average": overall_avg,
            "trend_direction": trend_direction,
            "improvement": improvement
        },
        "trends": trends
    }, status_code=200)

Summary
EndpointUse CaseComplexityGET /api/assessments/by-aspect/{aspect_code}Assessment form - rate all standards in aspectMediumGET /api/standards/{mat_standard_id}View standard details + version historyEasyPUT /api/standards/{mat_standard_id}Edit standard (creates new version)ComplexGET /api/analytics/trendsDashboard charts - rating trendsMedium