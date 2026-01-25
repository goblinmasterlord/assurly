# User Management Backend Requirements

**Date:** January 25, 2026  
**Status:** Frontend Complete - Backend Endpoints Needed

## Overview

A new Users Management feature has been added to the Assurly frontend, allowing MAT Administrators to manage user accounts across their Multi-Academy Trust. This document outlines the required backend API endpoints to support this functionality.

## Frontend Implementation

✅ **Completed:**
- Users management page UI (`/app/admin/users`)
- Protected route (MAT Administrator only)
- Add user dialog with form validation
- Delete user confirmation dialog
- User listing with search and filtering
- Integration with existing `/api/users` GET endpoint

## Required Backend Endpoints

### 1. Create User - `POST /api/users`

**Purpose:** Create a new user account within the MAT

**Request Body:**
```json
{
  "email": "user@example.com",
  "full_name": "John Smith",
  "role_title": "Department Head" | "MAT Administrator" | "School Leader",
  "school_id": "school-id" | null,
  "mat_id": "mat-id"
}
```

**Response:** `201 Created`
```json
{
  "user_id": "generated-uuid",
  "email": "user@example.com",
  "full_name": "John Smith",
  "role_title": "Department Head",
  "school_id": "school-id",
  "mat_id": "mat-id",
  "is_active": true,
  "created_at": "2026-01-25T12:00:00Z"
}
```

**Requirements:**
- Generate unique `user_id` (UUID)
- Validate email format and uniqueness within MAT
- Enforce MAT isolation (users can only create users in their own MAT)
- Set `is_active = true` by default
- **Security:** Only MAT Administrators should be able to create users
- Send welcome email with magic link for first-time login
- Hash any temporary passwords if using password-based auth

**Error Responses:**
- `400 Bad Request` - Invalid input or email already exists
- `403 Forbidden` - User lacks MAT Administrator role
- `500 Internal Server Error` - Database or email service error

---

### 2. Delete User - `DELETE /api/users/{user_id}`

**Purpose:** Soft delete a user account (set `is_active = false`)

**Path Parameter:**
- `user_id` (string): The unique identifier of the user to delete

**Response:** `200 OK`
```json
{
  "message": "User successfully deleted",
  "user_id": "user-id",
  "deleted_at": "2026-01-25T12:00:00Z"
}
```

**Requirements:**
- Soft delete only (set `is_active = false` instead of hard delete)
- Preserve user data for audit trail
- Enforce MAT isolation (can only delete users in same MAT)
- **Security:** Only MAT Administrators can delete users
- Prevent self-deletion (users cannot delete their own account)
- Optional: Add `deleted_at` timestamp field to users table

**Error Responses:**
- `400 Bad Request` - Attempting to delete own account
- `403 Forbidden` - User lacks MAT Administrator role
- `404 Not Found` - User ID doesn't exist or already deleted
- `500 Internal Server Error` - Database error

---

## Database Schema Considerations

The existing `users` table should support these fields:

```sql
CREATE TABLE users (
  user_id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role_title VARCHAR(100),
  school_id VARCHAR(100),
  mat_id VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  UNIQUE KEY unique_email_per_mat (email, mat_id)
);
```

**Notes:**
- The `is_active` field already exists and is used for soft deletion
- Consider adding `deleted_at` for audit purposes
- Unique constraint on `(email, mat_id)` ensures email uniqueness within MAT only

---

## Security & Authorization

### Required Checks:

1. **Authentication:** All endpoints require valid JWT token
2. **MAT Isolation:** Users can only manage accounts within their own MAT
3. **Role Authorization:** Only users with `role_title = 'MAT Administrator'` can:
   - Create new users
   - Delete users
4. **Self-Protection:** Users cannot delete their own account
5. **Input Validation:** 
   - Email format validation
   - Role title must be one of: `MAT Administrator`, `Department Head`, `School Leader`
   - School ID must exist in the schools table (if provided)

### Implementation Suggestion:

```python
def verify_mat_admin(current_user: UserResponse):
    """Dependency to verify user is MAT Administrator"""
    if current_user.role_title != "MAT Administrator":
        raise HTTPException(
            status_code=403,
            detail="Only MAT Administrators can perform this action"
        )
    return current_user

@app.post("/api/users", tags=["Users"])
async def create_user(
    user_data: CreateUserRequest,
    current_user: UserResponse = Depends(verify_mat_admin),
    current_mat_id: str = Depends(get_current_mat)
):
    # Implementation...
```

---

## Email Notifications

### Welcome Email (on user creation):

**Subject:** Welcome to Assurly

**Content:**
- Welcome message
- Magic link for first-time login
- Brief instructions on getting started
- Contact information for support

**Note:** Integrate with existing `email_service.py` using the magic link authentication flow.

---

## Testing Checklist

### Functional Testing:
- [ ] Create user with all fields populated
- [ ] Create user with optional school_id as null
- [ ] Attempt to create user with duplicate email (should fail)
- [ ] Attempt to create user as non-MAT Admin (should fail with 403)
- [ ] Delete user successfully
- [ ] Attempt to delete own account (should fail)
- [ ] Attempt to delete user in different MAT (should fail)
- [ ] Verify soft delete (is_active = false, not hard delete)

### Edge Cases:
- [ ] Create user with invalid email format
- [ ] Create user with non-existent school_id
- [ ] Delete already deleted user
- [ ] Create user with missing required fields

---

## Frontend Integration Points

The frontend makes these API calls:

1. **List Users:** `GET /api/users` (already implemented ✅)
2. **Create User:** `POST /api/users` with JSON body
3. **Delete User:** `DELETE /api/users/{user_id}`

All requests include:
- `Authorization: Bearer {token}` header
- `Content-Type: application/json` (for POST)

---

## Migration Path

### Phase 1: Backend Implementation
1. Add POST /api/users endpoint
2. Add DELETE /api/users/{user_id} endpoint
3. Add MAT Administrator role check dependency
4. Integrate with email service for welcome emails

### Phase 2: Testing
1. Unit tests for endpoints
2. Integration tests with frontend
3. Security testing (authorization checks)
4. Email delivery testing

### Phase 3: Deployment
1. Deploy backend changes
2. Test in staging environment
3. Deploy to production
4. Monitor for errors

---

## Priority

**High Priority** - This is a core administrative feature required for MAT Administrators to onboard new users to the platform.

## Questions for Backend Team

1. Should we implement hard delete or soft delete? (Recommendation: soft delete)
2. Do we need email verification for new users, or is the magic link sufficient?
3. Should we add audit logging for user creation/deletion?
4. Do we need pagination for the GET /api/users endpoint as user base grows?
5. Should deleted users be filterable in the GET endpoint, or always excluded?

---

**Document Version:** 1.0  
**Last Updated:** January 25, 2026  
**Author:** Frontend Development Team
