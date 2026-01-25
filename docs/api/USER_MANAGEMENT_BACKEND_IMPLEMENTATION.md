# User Management Backend Implementation

**Date:** 2025-01-25  
**Status:** Implementation Guide

---

## Current State

✅ `GET /api/users` - Exists (needs updates for MAT isolation)  
❌ `POST /api/users` - Needs implementation  
❌ `DELETE /api/users/{user_id}` - Needs implementation  

---

## Database Schema Check

First, verify your `users` table has the required fields:

```sql
DESCRIBE users;

-- If missing deleted_at, add it:
ALTER TABLE users ADD COLUMN deleted_at DATETIME DEFAULT NULL;

-- Ensure unique constraint exists:
-- Check if constraint exists first
SHOW INDEX FROM users WHERE Key_name = 'unique_email_per_mat';

-- If not, add it:
ALTER TABLE users ADD UNIQUE KEY unique_email_per_mat (email, mat_id);
```

---

## Implementation

### 1. Add MAT Administrator Verification Dependency

```python
from fastapi import Depends, HTTPException, status

async def verify_mat_admin(
    current_user: UserResponse = Depends(get_current_user)
) -> UserResponse:
    """
    Dependency to verify user is MAT Administrator.
    Use this for endpoints that require admin privileges.
    """
    if current_user.role_title != "MAT Administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only MAT Administrators can perform this action"
        )
    return current_user
```

---

### 2. Update GET /api/users (Add MAT Isolation)

```python
@app.get("/api/users", tags=["Users"])
async def get_users(
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user),
    school_id: Optional[str] = Query(None),
    role_title: Optional[str] = Query(None),
    include_inactive: bool = Query(False, description="Include deleted/inactive users")
):
    """
    Get list of users within the MAT.
    Enforces MAT isolation - only returns users in the authenticated user's MAT.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        query = """
            SELECT 
                u.user_id, 
                u.email, 
                u.full_name, 
                u.role_title, 
                u.school_id,
                s.school_name,
                u.mat_id, 
                u.is_active,
                u.last_login,
                u.created_at
            FROM users u
            LEFT JOIN schools s ON u.school_id = s.school_id
            WHERE u.mat_id = %s
        """
        params = [current_mat_id]
        
        if not include_inactive:
            query += " AND u.is_active = 1"
        
        if school_id:
            query += " AND u.school_id = %s"
            params.append(school_id)
        
        if role_title:
            query += " AND u.role_title = %s"
            params.append(role_title)
        
        query += " ORDER BY u.full_name"
        
        cursor.execute(query, params)
        users = cursor.fetchall()
        
        # Process datetime fields
        processed_users = []
        for user in users:
            processed_user = dict(user)
            if processed_user.get('last_login'):
                processed_user['last_login'] = processed_user['last_login'].strftime('%Y-%m-%dT%H:%M:%SZ')
            if processed_user.get('created_at'):
                processed_user['created_at'] = processed_user['created_at'].strftime('%Y-%m-%dT%H:%M:%SZ')
            processed_users.append(processed_user)
        
        connection.close()
        return JSONResponse(content=processed_users, status_code=200)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

### 3. POST /api/users (Create User)

```python
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
import uuid

class CreateUserRequest(BaseModel):
    email: EmailStr
    full_name: str
    role_title: str
    school_id: Optional[str] = None
    
    @validator('role_title')
    def validate_role(cls, v):
        allowed_roles = ['MAT Administrator', 'Department Head', 'School Leader']
        if v not in allowed_roles:
            raise ValueError(f"role_title must be one of: {', '.join(allowed_roles)}")
        return v
    
    @validator('full_name')
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError("full_name must be at least 2 characters")
        return v.strip()


@app.post("/api/users", tags=["Users"], status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: CreateUserRequest,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(verify_mat_admin)
):
    """
    Create a new user within the MAT.
    
    - Only MAT Administrators can create users
    - Enforces MAT isolation
    - Validates email uniqueness within MAT
    - Sends welcome email with magic link
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Check if email already exists in this MAT
        check_query = """
            SELECT user_id FROM users 
            WHERE email = %s AND mat_id = %s AND is_active = 1
        """
        cursor.execute(check_query, (user_data.email, current_mat_id))
        existing = cursor.fetchone()
        
        if existing:
            connection.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A user with email '{user_data.email}' already exists in your MAT"
            )
        
        # If school_id provided, verify it belongs to the MAT
        if user_data.school_id:
            school_query = """
                SELECT school_id FROM schools 
                WHERE school_id = %s AND mat_id = %s AND is_active = 1
            """
            cursor.execute(school_query, (user_data.school_id, current_mat_id))
            school = cursor.fetchone()
            
            if not school:
                connection.close()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"School '{user_data.school_id}' not found in your MAT"
                )
        
        # Generate user_id
        user_id = f"user{uuid.uuid4().hex[:8]}"
        
        # Insert new user
        insert_query = """
            INSERT INTO users 
            (user_id, email, full_name, role_title, school_id, mat_id, is_active, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, 1, NOW())
        """
        cursor.execute(insert_query, (
            user_id,
            user_data.email,
            user_data.full_name,
            user_data.role_title,
            user_data.school_id,
            current_mat_id
        ))
        
        connection.commit()
        
        # Fetch the created user
        fetch_query = """
            SELECT 
                u.user_id, 
                u.email, 
                u.full_name, 
                u.role_title, 
                u.school_id,
                s.school_name,
                u.mat_id, 
                u.is_active,
                u.created_at
            FROM users u
            LEFT JOIN schools s ON u.school_id = s.school_id
            WHERE u.user_id = %s
        """
        cursor.execute(fetch_query, (user_id,))
        created_user = cursor.fetchone()
        
        connection.close()
        
        # Process datetime
        if created_user.get('created_at'):
            created_user['created_at'] = created_user['created_at'].strftime('%Y-%m-%dT%H:%M:%SZ')
        
        # TODO: Send welcome email with magic link
        # await send_welcome_email(user_data.email, user_data.full_name)
        
        return JSONResponse(content=dict(created_user), status_code=201)
        
    except HTTPException:
        raise
    except Exception as e:
        if connection:
            connection.rollback()
            connection.close()
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")
```

---

### 4. DELETE /api/users/{user_id} (Soft Delete)

```python
@app.delete("/api/users/{user_id}", tags=["Users"])
async def delete_user(
    user_id: str,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(verify_mat_admin)
):
    """
    Soft delete a user (set is_active = false).
    
    - Only MAT Administrators can delete users
    - Cannot delete your own account
    - Enforces MAT isolation
    - Preserves user data for audit trail
    """
    try:
        # Prevent self-deletion
        if user_id == current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot delete your own account"
            )
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Verify user exists and belongs to same MAT
        check_query = """
            SELECT user_id, email, full_name, is_active 
            FROM users 
            WHERE user_id = %s AND mat_id = %s
        """
        cursor.execute(check_query, (user_id, current_mat_id))
        user = cursor.fetchone()
        
        if not user:
            connection.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if not user['is_active']:
            connection.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already deleted"
            )
        
        # Soft delete: set is_active = false and record deleted_at
        delete_query = """
            UPDATE users 
            SET is_active = 0, deleted_at = NOW()
            WHERE user_id = %s AND mat_id = %s
        """
        cursor.execute(delete_query, (user_id, current_mat_id))
        
        connection.commit()
        connection.close()
        
        return JSONResponse(content={
            "message": "User successfully deleted",
            "user_id": user_id,
            "email": user['email'],
            "full_name": user['full_name'],
            "deleted_at": datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ')
        }, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        if connection:
            connection.rollback()
            connection.close()
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")
```

---

### 5. Optional: PUT /api/users/{user_id} (Update User)

```python
class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    role_title: Optional[str] = None
    school_id: Optional[str] = None
    
    @validator('role_title')
    def validate_role(cls, v):
        if v is None:
            return v
        allowed_roles = ['MAT Administrator', 'Department Head', 'School Leader']
        if v not in allowed_roles:
            raise ValueError(f"role_title must be one of: {', '.join(allowed_roles)}")
        return v


@app.put("/api/users/{user_id}", tags=["Users"])
async def update_user(
    user_id: str,
    user_data: UpdateUserRequest,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(verify_mat_admin)
):
    """
    Update a user's details.
    
    - Only MAT Administrators can update users
    - Enforces MAT isolation
    - Cannot change email (use separate endpoint if needed)
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Verify user exists and belongs to same MAT
        check_query = """
            SELECT user_id FROM users 
            WHERE user_id = %s AND mat_id = %s AND is_active = 1
        """
        cursor.execute(check_query, (user_id, current_mat_id))
        user = cursor.fetchone()
        
        if not user:
            connection.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # If school_id provided, verify it belongs to the MAT
        if user_data.school_id:
            school_query = """
                SELECT school_id FROM schools 
                WHERE school_id = %s AND mat_id = %s AND is_active = 1
            """
            cursor.execute(school_query, (user_data.school_id, current_mat_id))
            school = cursor.fetchone()
            
            if not school:
                connection.close()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"School '{user_data.school_id}' not found in your MAT"
                )
        
        # Build update query dynamically
        updates = []
        params = []
        
        if user_data.full_name:
            updates.append("full_name = %s")
            params.append(user_data.full_name)
        
        if user_data.role_title:
            updates.append("role_title = %s")
            params.append(user_data.role_title)
        
        if user_data.school_id is not None:  # Allow setting to NULL
            updates.append("school_id = %s")
            params.append(user_data.school_id if user_data.school_id else None)
        
        if not updates:
            connection.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        updates.append("updated_at = NOW()")
        params.extend([user_id, current_mat_id])
        
        update_query = f"""
            UPDATE users 
            SET {', '.join(updates)}
            WHERE user_id = %s AND mat_id = %s
        """
        cursor.execute(update_query, params)
        
        connection.commit()
        
        # Fetch updated user
        fetch_query = """
            SELECT 
                u.user_id, 
                u.email, 
                u.full_name, 
                u.role_title, 
                u.school_id,
                s.school_name,
                u.mat_id, 
                u.is_active
            FROM users u
            LEFT JOIN schools s ON u.school_id = s.school_id
            WHERE u.user_id = %s
        """
        cursor.execute(fetch_query, (user_id,))
        updated_user = cursor.fetchone()
        
        connection.close()
        
        return JSONResponse(content={
            "message": "User updated successfully",
            "user": dict(updated_user)
        }, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        if connection:
            connection.rollback()
            connection.close()
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")
```

---

### 6. Optional: Welcome Email Integration

```python
from email_service import send_magic_link_email  # Your existing email service

async def send_welcome_email(email: str, full_name: str):
    """
    Send welcome email to new user with magic link for first login.
    """
    try:
        # Generate a magic link token for the new user
        # This uses your existing magic link system
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Generate token
        import secrets
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(hours=24)  # 24 hour expiry for welcome
        
        # Store token
        cursor.execute("""
            UPDATE users 
            SET magic_link_token = %s, token_expires_at = %s
            WHERE email = %s
        """, (token, expires_at, email))
        
        connection.commit()
        connection.close()
        
        # Send email (adapt to your email service)
        magic_link = f"https://www.assurly.co.uk/auth/verify?token={token}"
        
        # Use your existing email service
        await send_magic_link_email(
            to_email=email,
            full_name=full_name,
            magic_link=magic_link,
            subject="Welcome to Assurly - Complete Your Setup"
        )
        
    except Exception as e:
        print(f"Failed to send welcome email: {e}")
        # Don't fail user creation if email fails
```

---

## Summary of Required Changes

| Endpoint | Status | Action |
|----------|--------|--------|
| `GET /api/users` | Exists | Update for MAT isolation + include school_name |
| `POST /api/users` | Missing | Implement with admin check |
| `DELETE /api/users/{user_id}` | Missing | Implement soft delete |
| `PUT /api/users/{user_id}` | Optional | Implement if editing needed |

---

## Database Changes Required

```sql
-- Add deleted_at column if missing
ALTER TABLE users ADD COLUMN deleted_at DATETIME DEFAULT NULL;

-- Add updated_at column if missing
ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT NULL;

-- Add unique constraint if missing
ALTER TABLE users ADD UNIQUE KEY unique_email_per_mat (email, mat_id);

-- Verify columns
DESCRIBE users;
```

---

## Testing Checklist

After implementation, test:

- [ ] `GET /api/users` - Returns only users in current MAT
- [ ] `GET /api/users` - Excludes inactive users by default
- [ ] `GET /api/users?include_inactive=true` - Includes inactive users
- [ ] `POST /api/users` - Creates user successfully
- [ ] `POST /api/users` - Fails with duplicate email
- [ ] `POST /api/users` - Fails for non-admin user (403)
- [ ] `POST /api/users` - Validates role_title
- [ ] `DELETE /api/users/{id}` - Soft deletes user
- [ ] `DELETE /api/users/{id}` - Cannot delete self (400)
- [ ] `DELETE /api/users/{id}` - Cannot delete user in different MAT (404)
- [ ] `DELETE /api/users/{id}` - Fails for non-admin user (403)

---

## Answers to Frontend Team Questions

1. **Hard delete or soft delete?** → Soft delete (is_active = 0)
2. **Email verification for new users?** → Magic link is sufficient
3. **Audit logging?** → deleted_at timestamp captures deletion time
4. **Pagination for GET?** → Not yet needed, can add later
5. **Deleted users filterable?** → Yes, via `include_inactive=true` query param

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-25
