# Assurly: Default vs Custom Deletion Strategy

**Date:** 2025-01-05  
**Version:** 5.1.0

## Overview

MATs need the ability to hide default standards and aspects they don't want to use, with the option to reinstate them later. This requires two different deletion strategies:

| Type | Identification | Delete Behavior | Reinstate Behavior |
|------|----------------|-----------------|-------------------|
| **Default** | `is_custom = FALSE` | Set `is_active = 0` | Set `is_active = 1` |
| **Custom** | `is_custom = TRUE` | Rename IDs + `is_active = 0` | Create new |

## Why Two Strategies?

**Default standards:**
- Copied from global `standards` table during MAT onboarding
- Have predictable IDs like `OLT-ES1`, `OLT-HR2`
- Should be reinstatable to original state
- Keep their IDs so they can be turned back on

**Custom standards:**
- Created by the MAT
- IDs need to be freed up if they want to reuse the code
- Archived permanently (can create a new one with same code)

---

## Backend Implementation

### 1. Update DELETE /api/standards/{mat_standard_id}

```python
@app.delete("/api/standards/{mat_standard_id}", tags=["Standards"])
async def delete_standard(
    mat_standard_id: str,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Delete (deactivate) a standard.
    - Default standards: Simply set is_active = 0 (can be reinstated)
    - Custom standards: Rename IDs and set is_active = 0 (archived permanently)
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Get standard details
        check_query = """
            SELECT mat_standard_id, standard_code, is_custom 
            FROM mat_standards
            WHERE mat_standard_id = %s AND mat_id = %s AND is_active = 1
        """
        cursor.execute(check_query, (mat_standard_id, current_mat_id))
        row = cursor.fetchone()
        
        if not row:
            connection.close()
            raise HTTPException(status_code=404, detail="Standard not found")

        is_custom = row['is_custom']
        original_code = row['standard_code']

        if is_custom:
            # CUSTOM STANDARD: Rename IDs to free them up (existing logic)
            import time
            timestamp = int(time.time())
            short_suffix = str(timestamp)[-6:]
            deleted_id = f"{mat_standard_id}-deleted-{timestamp}"
            deleted_code = f"{original_code}-{short_suffix}"
            
            # Clear current_version_id first
            cursor.execute("""
                UPDATE mat_standards SET current_version_id = NULL
                WHERE mat_standard_id = %s
            """, (mat_standard_id,))

            # Clear parent_version_id references
            cursor.execute("""
                UPDATE standard_versions SET parent_version_id = NULL
                WHERE mat_standard_id = %s
            """, (mat_standard_id,))

            # Rename all version_ids
            cursor.execute("""
                SELECT version_id FROM standard_versions
                WHERE mat_standard_id = %s
            """, (mat_standard_id,))
            versions = cursor.fetchall()
            
            for version in versions:
                old_version_id = version['version_id']
                new_version_id = f"{old_version_id}-deleted-{timestamp}"
                cursor.execute("""
                    UPDATE standard_versions SET version_id = %s
                    WHERE version_id = %s
                """, (new_version_id, old_version_id))

            # Rename and deactivate mat_standard
            cursor.execute("""
                UPDATE mat_standards
                SET mat_standard_id = %s,
                    standard_code = %s,
                    is_active = 0,
                    updated_at = NOW()
                WHERE mat_standard_id = %s AND mat_id = %s
            """, (deleted_id, deleted_code, mat_standard_id, current_mat_id))

            result_message = "Custom standard archived"
            archived_as = deleted_id

        else:
            # DEFAULT STANDARD: Simply deactivate (keep IDs intact for reinstatement)
            cursor.execute("""
                UPDATE mat_standards
                SET is_active = 0,
                    updated_at = NOW()
                WHERE mat_standard_id = %s AND mat_id = %s
            """, (mat_standard_id, current_mat_id))

            result_message = "Default standard deactivated"
            archived_as = None

        connection.commit()
        connection.close()

        return JSONResponse(content={
            "message": result_message,
            "mat_standard_id": mat_standard_id,
            "is_custom": is_custom,
            "archived_as": archived_as,
            "can_reinstate": not is_custom
        }, status_code=200)

    except HTTPException:
        raise
    except Exception as e:
        if connection:
            connection.rollback()
            connection.close()
        raise HTTPException(status_code=500, detail=f"Failed to delete standard: {str(e)}")
```

### 2. Add POST /api/standards/{mat_standard_id}/reinstate

```python
@app.post("/api/standards/{mat_standard_id}/reinstate", tags=["Standards"])
async def reinstate_standard(
    mat_standard_id: str,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Reinstate a previously deactivated default standard.
    Only works for default standards (is_custom = FALSE).
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Check if standard exists and is deactivated
        check_query = """
            SELECT mat_standard_id, is_custom, is_active
            FROM mat_standards
            WHERE mat_standard_id = %s AND mat_id = %s
        """
        cursor.execute(check_query, (mat_standard_id, current_mat_id))
        row = cursor.fetchone()
        
        if not row:
            connection.close()
            raise HTTPException(status_code=404, detail="Standard not found")

        if row['is_active']:
            connection.close()
            raise HTTPException(status_code=400, detail="Standard is already active")

        if row['is_custom']:
            connection.close()
            raise HTTPException(
                status_code=400, 
                detail="Custom standards cannot be reinstated. Create a new standard instead."
            )

        # Reinstate the standard
        cursor.execute("""
            UPDATE mat_standards
            SET is_active = 1,
                updated_at = NOW()
            WHERE mat_standard_id = %s AND mat_id = %s
        """, (mat_standard_id, current_mat_id))

        connection.commit()
        connection.close()

        return JSONResponse(content={
            "message": "Standard reinstated successfully",
            "mat_standard_id": mat_standard_id
        }, status_code=200)

    except HTTPException:
        raise
    except Exception as e:
        if connection:
            connection.rollback()
            connection.close()
        raise HTTPException(status_code=500, detail=f"Failed to reinstate standard: {str(e)}")
```

### 3. Add GET /api/standards/inactive (View deactivated standards)

```python
@app.get("/api/standards/inactive", tags=["Standards"])
async def get_inactive_standards(
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get list of deactivated default standards that can be reinstated.
    Does not include archived custom standards.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            SELECT ms.mat_standard_id,
                   ms.mat_id,
                   ms.standard_code,
                   ms.standard_name,
                   ms.standard_description,
                   ms.standard_type,
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
              AND ms.is_active = FALSE 
              AND ms.is_custom = FALSE
            ORDER BY ma.sort_order, ms.sort_order
        """
        cursor.execute(query, (current_mat_id,))
        standards = cursor.fetchall()

        connection.close()
        return standards

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch inactive standards: {str(e)}")
```

---

## Aspect Deletion (Same Pattern)

### 4. Update DELETE /api/aspects/{mat_aspect_id}

```python
@app.delete("/api/aspects/{mat_aspect_id}", tags=["Aspects"])
async def delete_aspect(
    mat_aspect_id: str,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Delete (deactivate) an aspect and all its standards.
    - Default aspects: Simply set is_active = 0 (can be reinstated)
    - Custom aspects: Rename IDs and set is_active = 0 (archived permanently)
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Get aspect details
        check_query = """
            SELECT mat_aspect_id, aspect_code, is_custom 
            FROM mat_aspects
            WHERE mat_aspect_id = %s AND mat_id = %s AND is_active = 1
        """
        cursor.execute(check_query, (mat_aspect_id, current_mat_id))
        row = cursor.fetchone()
        
        if not row:
            connection.close()
            raise HTTPException(status_code=404, detail="Aspect not found")

        is_custom = row['is_custom']

        if is_custom:
            # CUSTOM ASPECT: Rename IDs to free them up
            import time
            timestamp = int(time.time())
            short_suffix = str(timestamp)[-6:]
            deleted_id = f"{mat_aspect_id}-deleted-{timestamp}"
            deleted_code = f"{row['aspect_code']}-{short_suffix}"

            # Get all standards under this aspect
            cursor.execute("""
                SELECT mat_standard_id, standard_code FROM mat_standards
                WHERE mat_aspect_id = %s
            """, (mat_aspect_id,))
            standards = cursor.fetchall()

            # Archive each standard (rename IDs)
            for std in standards:
                std_deleted_id = f"{std['mat_standard_id']}-deleted-{timestamp}"
                std_deleted_code = f"{std['standard_code']}-{short_suffix}"

                # Clear version references
                cursor.execute("""
                    UPDATE mat_standards SET current_version_id = NULL
                    WHERE mat_standard_id = %s
                """, (std['mat_standard_id'],))

                cursor.execute("""
                    UPDATE standard_versions SET parent_version_id = NULL
                    WHERE mat_standard_id = %s
                """, (std['mat_standard_id'],))

                # Rename versions
                cursor.execute("""
                    SELECT version_id FROM standard_versions
                    WHERE mat_standard_id = %s
                """, (std['mat_standard_id'],))
                versions = cursor.fetchall()
                
                for version in versions:
                    new_version_id = f"{version['version_id']}-deleted-{timestamp}"
                    cursor.execute("""
                        UPDATE standard_versions SET version_id = %s
                        WHERE version_id = %s
                    """, (new_version_id, version['version_id']))

                # Rename and deactivate standard
                cursor.execute("""
                    UPDATE mat_standards
                    SET mat_standard_id = %s,
                        standard_code = %s,
                        is_active = 0,
                        updated_at = NOW()
                    WHERE mat_standard_id = %s
                """, (std_deleted_id, std_deleted_code, std['mat_standard_id']))

            # Rename and deactivate aspect
            cursor.execute("""
                UPDATE mat_aspects
                SET mat_aspect_id = %s,
                    aspect_code = %s,
                    is_active = 0,
                    updated_at = NOW()
                WHERE mat_aspect_id = %s AND mat_id = %s
            """, (deleted_id, deleted_code, mat_aspect_id, current_mat_id))

            result_message = "Custom aspect and standards archived"
            archived_as = deleted_id

        else:
            # DEFAULT ASPECT: Simply deactivate (keep IDs intact)
            # Also deactivate all standards under this aspect
            cursor.execute("""
                UPDATE mat_standards
                SET is_active = 0,
                    updated_at = NOW()
                WHERE mat_aspect_id = %s AND mat_id = %s
            """, (mat_aspect_id, current_mat_id))

            cursor.execute("""
                UPDATE mat_aspects
                SET is_active = 0,
                    updated_at = NOW()
                WHERE mat_aspect_id = %s AND mat_id = %s
            """, (mat_aspect_id, current_mat_id))

            result_message = "Default aspect and standards deactivated"
            archived_as = None

        connection.commit()
        connection.close()

        return JSONResponse(content={
            "message": result_message,
            "mat_aspect_id": mat_aspect_id,
            "is_custom": is_custom,
            "archived_as": archived_as,
            "can_reinstate": not is_custom
        }, status_code=200)

    except HTTPException:
        raise
    except Exception as e:
        if connection:
            connection.rollback()
            connection.close()
        raise HTTPException(status_code=500, detail=f"Failed to delete aspect: {str(e)}")
```

### 5. Add POST /api/aspects/{mat_aspect_id}/reinstate

```python
@app.post("/api/aspects/{mat_aspect_id}/reinstate", tags=["Aspects"])
async def reinstate_aspect(
    mat_aspect_id: str,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Reinstate a previously deactivated default aspect and its standards.
    Only works for default aspects (is_custom = FALSE).
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Check if aspect exists and is deactivated
        check_query = """
            SELECT mat_aspect_id, is_custom, is_active
            FROM mat_aspects
            WHERE mat_aspect_id = %s AND mat_id = %s
        """
        cursor.execute(check_query, (mat_aspect_id, current_mat_id))
        row = cursor.fetchone()
        
        if not row:
            connection.close()
            raise HTTPException(status_code=404, detail="Aspect not found")

        if row['is_active']:
            connection.close()
            raise HTTPException(status_code=400, detail="Aspect is already active")

        if row['is_custom']:
            connection.close()
            raise HTTPException(
                status_code=400, 
                detail="Custom aspects cannot be reinstated. Create a new aspect instead."
            )

        # Reinstate the aspect
        cursor.execute("""
            UPDATE mat_aspects
            SET is_active = 1,
                updated_at = NOW()
            WHERE mat_aspect_id = %s AND mat_id = %s
        """, (mat_aspect_id, current_mat_id))

        # Also reinstate all default standards under this aspect
        cursor.execute("""
            UPDATE mat_standards
            SET is_active = 1,
                updated_at = NOW()
            WHERE mat_aspect_id = %s AND mat_id = %s AND is_custom = FALSE
        """, (mat_aspect_id, current_mat_id))

        connection.commit()
        connection.close()

        return JSONResponse(content={
            "message": "Aspect and default standards reinstated successfully",
            "mat_aspect_id": mat_aspect_id
        }, status_code=200)

    except HTTPException:
        raise
    except Exception as e:
        if connection:
            connection.rollback()
            connection.close()
        raise HTTPException(status_code=500, detail=f"Failed to reinstate aspect: {str(e)}")
```

### 6. Add GET /api/aspects/inactive

```python
@app.get("/api/aspects/inactive", tags=["Aspects"])
async def get_inactive_aspects(
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get list of deactivated default aspects that can be reinstated.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            SELECT 
                ma.mat_aspect_id, 
                ma.mat_id,
                ma.aspect_code, 
                ma.aspect_name, 
                ma.aspect_description,
                ma.aspect_category,
                ma.sort_order, 
                ma.is_custom,
                ma.is_modified,
                (SELECT COUNT(*) FROM mat_standards ms 
                 WHERE ms.mat_aspect_id = ma.mat_aspect_id) as standards_count
            FROM mat_aspects ma
            WHERE ma.mat_id = %s 
              AND ma.is_active = FALSE 
              AND ma.is_custom = FALSE
            ORDER BY ma.sort_order
        """
        cursor.execute(query, (current_mat_id,))
        aspects = cursor.fetchall()

        connection.close()
        return aspects

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch inactive aspects: {str(e)}")
```

---

## API Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/standards/{id}` | DELETE | Deactivate standard (behavior differs by is_custom) |
| `/api/standards/{id}/reinstate` | POST | Reinstate deactivated default standard |
| `/api/standards/inactive` | GET | List deactivated default standards |
| `/api/aspects/{id}` | DELETE | Deactivate aspect and its standards |
| `/api/aspects/{id}/reinstate` | POST | Reinstate deactivated default aspect + standards |
| `/api/aspects/inactive` | GET | List deactivated default aspects |

---

## Response Examples

### DELETE /api/standards/OLT-ES1 (Default)
```json
{
    "message": "Default standard deactivated",
    "mat_standard_id": "OLT-ES1",
    "is_custom": false,
    "archived_as": null,
    "can_reinstate": true
}
```

### DELETE /api/standards/OLT-CUSTOM1 (Custom)
```json
{
    "message": "Custom standard archived",
    "mat_standard_id": "OLT-CUSTOM1",
    "is_custom": true,
    "archived_as": "OLT-CUSTOM1-deleted-1736100000",
    "can_reinstate": false
}
```

### POST /api/standards/OLT-ES1/reinstate
```json
{
    "message": "Standard reinstated successfully",
    "mat_standard_id": "OLT-ES1"
}
```

---

## Testing Checklist

- [ ] Delete default standard → `is_active = 0`, IDs unchanged
- [ ] Delete custom standard → IDs renamed, `is_active = 0`
- [ ] Reinstate default standard → `is_active = 1`
- [ ] Reinstate custom standard → Error (not allowed)
- [ ] View inactive standards → Only shows default standards
- [ ] Delete default aspect → Aspect + standards deactivated
- [ ] Reinstate default aspect → Aspect + default standards reinstated
- [ ] Create new standard with same code as archived custom → Works
- [ ] Create new standard with same code as deactivated default → Error (already exists)
