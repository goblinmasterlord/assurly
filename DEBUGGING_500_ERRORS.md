# 500 Error Debugging Guide - Aspects & Standards Endpoints

## Problem
`/api/aspects` and `/api/standards` endpoints return 500 Internal Server Error

## Root Cause
These endpoints **require authentication** for MAT isolation (to know which MAT's data to return), but requests may be:
1. Made without an auth token
2. Made with an invalid/expired token  
3. Made before user authentication

## Quick Checks

### 1. Check if Token Exists
Open browser console and run:
```javascript
localStorage.getItem('assurly_auth_token')
```
- **If null**: User is not authenticated - this is the issue!
- **If has value**: Token exists but might be invalid/expired

### 2. Check Browser Network Tab
1. Open Developer Tools → Network tab
2. Refresh the page
3. Find the request to `/api/aspects` or `/api/standards`
4. Check the **Headers** tab:
   - Look for `Authorization: Bearer <token>`
   - If missing → token not being sent
   - If present → check the **Response** tab for actual error

### 3. Check Backend Logs
If you have access to backend logs, look for:
- JWT decode errors
- Database connection errors
- MAT ID missing errors

## Solutions

### Solution 1: Ensure User is Authenticated
The frontend should only call these endpoints **after** successful authentication:

```typescript
// In your component/hook
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Don't fetch aspects/standards until authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchAspectsAndStandards();
    }
  }, [isAuthenticated, isLoading]);
}
```

### Solution 2: Add Error Boundary
Wrap API calls in try-catch to handle gracefully:

```typescript
try {
  const aspects = await getAspects();
} catch (error) {
  if (error.statusCode === 401) {
    // Redirect to login
    navigate('/auth/login');
  } else if (error.statusCode === 500) {
    console.error('Server error:', error);
    // Show user-friendly message
  }
}
```

### Solution 3: Check Backend Dependencies
The backend endpoints depend on:
- Valid JWT token with `mat_id` claim
- Database connection to `mat_aspects` and `mat_standards` tables
- User's MAT having data in these tables

#### Backend Query (from main.py line 1444):
```sql
SELECT mat_aspect_id, aspect_code, aspect_name, aspect_description,
       sort_order, is_custom,
       (SELECT COUNT(*) FROM mat_standards ms
        WHERE ms.mat_aspect_id = ma.mat_aspect_id AND ms.is_active = TRUE) as standards_count
FROM mat_aspects ma
WHERE mat_id = %s AND is_active = TRUE
ORDER BY sort_order
```

**If this query returns 0 rows** → The MAT has no aspects configured!

## Common Scenarios

### Scenario A: Fresh MAT with No Data
**Problem**: New MAT has no aspects/standards seeded
**Solution**: Run database seeding script or onboarding flow

### Scenario B: User Not Logged In
**Problem**: Accessing protected routes without authentication
**Solution**: Check ProtectedRoute wrapper and redirect to login

### Scenario C: Token Expired
**Problem**: Token expiration (check `exp` claim in JWT)
**Solution**: Implement token refresh or re-authenticate

### Scenario D: CORS Issue (Development)
**Problem**: Browser blocking request due to CORS
**Solution**: Check Vite proxy configuration in `vite.config.ts`

## Testing the Fix

### Test 1: Manual API Call with Token
```bash
# Get your token from localStorage or login response
TOKEN="your_jwt_token_here"

# Test aspects endpoint
curl -H "Authorization: Bearer $TOKEN" \
     https://your-backend.com/api/aspects

# Test standards endpoint  
curl -H "Authorization: Bearer $TOKEN" \
     https://your-backend.com/api/standards
```

Expected: 200 OK with JSON array
If 500: Check backend logs for actual error

### Test 2: Verify Token is Valid
Decode your JWT at https://jwt.io/ and check:
- `mat_id` field exists
- `exp` (expiration) is in the future
- Token signature is valid

### Test 3: Check Database
Connect to your database and verify:
```sql
-- Check if MAT has aspects
SELECT * FROM mat_aspects WHERE mat_id = 'YOUR_MAT_ID' AND is_active = TRUE;

-- Check if MAT has standards  
SELECT * FROM mat_standards WHERE mat_id = 'YOUR_MAT_ID' AND is_active = TRUE;
```

## Recommended Next Steps

1. **Add loading state** to prevent API calls before auth
2. **Add error handling** to gracefully handle 500 errors
3. **Check backend logs** to see actual error message
4. **Verify database** has data for the MAT
5. **Test authentication flow** end-to-end

## Need More Help?

Provide these details:
- Browser console errors (full stack trace)
- Network tab screenshot showing the failing request
- Backend error logs (if accessible)
- Your MAT ID
- Whether this is a fresh deployment or existing system

