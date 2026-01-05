# Magic Link 404 Issue - Clarification Needed

## Current Understanding

### Magic Link Flow

1. **Backend generates magic link** (in `auth_utils.py` line 66):
   ```python
   base_url = FRONTEND_URL.rstrip('/')
   magic_link = f"{base_url}/auth/verify?token={token}"
   ```
   
   Result: `https://www.assurly.co.uk/auth/verify?token=abc123...`

2. **User clicks link** → Opens in browser

3. **Expected behavior**:
   - Frontend loads the `/auth/verify` page (React SPA)
   - Page extracts token from URL query parameter
   - Page makes API call to backend: `https://assurly-frontend-.../api/auth/verify/{token}`
   - Backend validates token and returns JWT
   - User is logged in

### What We Know Works

- ✅ Backend API endpoint works (tested in Swagger)
- ✅ Frontend has `/auth/verify` route in React Router
- ✅ Other endpoints like `/api/auth/me` correctly call the backend
- ✅ `VITE_API_BASE_URL` is set correctly

## What's Unclear

**When you click the magic link, what exactly happens?**

### Scenario A: Page itself shows 404
```
User clicks: https://www.assurly.co.uk/auth/verify?token=...
Browser shows: Vercel 404 page or blank page
```

**This means**: The SPA routing is broken or page doesn't exist

**Possible causes**:
- `vercel.json` rewrites not working
- Route not properly configured in React Router
- Build/deployment issue

### Scenario B: Page loads but verification fails
```
User clicks: https://www.assurly.co.uk/auth/verify?token=...
Page loads: Verify page appears (shows "Verifying..." or similar)
Then: Shows error "Verification failed" or 404 error message
```

**This means**: Page loads but API call fails

**Possible causes**:
- API call going to wrong URL
- CORS issue
- Token invalid/expired

### Scenario C: API call goes to wrong domain
```
User clicks: https://www.assurly.co.uk/auth/verify?token=...
Page loads: ✅
API call goes to: https://www.assurly.co.uk/api/auth/verify/... ❌
Should go to: https://assurly-frontend-.../api/auth/verify/... ✅
```

**This means**: `baseURL` is not being used correctly

**Possible causes**:
- `VITE_API_BASE_URL` not set in production build
- Environment variable not being read
- Axios config issue

## What We've Changed

### Changes Made (that might have affected things)

1. **`vercel.json`**:
   - ✅ Removed `'self'` from CSP `connect-src`
   - ✅ Restored `rewrites` section (was accidentally removed)
   - Current state: Should be working now

2. **`.env` files**:
   - ✅ Standardized all three files
   - ✅ Added `VITE_DEBUG_API` to production
   - Should not affect functionality, just consistency

3. **`api-client.ts`**:
   - ✅ Reverted to original (no changes from working version)

## Debugging Steps Needed

### Step 1: Identify Exact Failure Point

Open browser DevTools (F12) and click the magic link. Check:

1. **Does the page load at all?**
   - Browser URL: `https://www.assurly.co.uk/auth/verify?token=...`
   - Page content: Do you see the Verify component UI?

2. **Check Console tab**:
   - Any errors? (red messages)
   - What does `import.meta.env.VITE_API_BASE_URL` show?

3. **Check Network tab**:
   - Is there a request to `/api/auth/verify/...`?
   - What's the full Request URL?
   - What's the Status code?
   - What's the Response?

### Step 2: Verify Backend Environment

Check backend environment variable:

```bash
# Check what FRONTEND_URL is set to in backend
gcloud run services describe assurly-frontend \
  --region europe-west2 \
  --format="value(spec.template.spec.containers[0].env)" \
  | grep FRONTEND_URL
```

**Expected**: `FRONTEND_URL=https://www.assurly.co.uk` or `https://www.assurly.co.uk`

### Step 3: Verify Frontend Build

Check if environment variables are in the build:

```bash
# In browser console on www.assurly.co.uk
import.meta.env.VITE_API_BASE_URL
import.meta.env.MODE
```

**Expected**: 
- `VITE_API_BASE_URL`: `"https://assurly-frontend-400616570417.europe-west2.run.app"`
- `MODE`: `"production"`

### Step 4: Test Direct API Call

Try calling the backend directly:

```bash
# Replace TOKEN with an actual token from a magic link
curl -X GET "https://assurly-frontend-400616570417.europe-west2.run.app/api/auth/verify/TOKEN"
```

**Expected**: Should return user data or error message (not 404)

## Possible Solutions

### If Page Gives 404 (Scenario A)

**Problem**: SPA routing broken

**Solution**: 
1. Verify `vercel.json` has rewrites (✅ restored)
2. Redeploy frontend
3. Hard refresh browser

### If API Call Goes to Wrong URL (Scenario C)

**Problem**: `VITE_API_BASE_URL` not being used

**Solutions**:

#### Option 1: Explicit API Proxy (if VITE_API_BASE_URL doesn't work)

Add to `vercel.json`:
```json
"rewrites": [
  {
    "source": "/api/:path*",
    "destination": "https://assurly-frontend-400616570417.europe-west2.run.app/api/:path*"
  },
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
]
```

This would proxy all `/api/*` requests from `www.assurly.co.uk/api/*` to the backend.

**BUT**: This would require changing the frontend code to use relative URLs.

#### Option 2: Verify Environment Variable

Ensure `VITE_API_BASE_URL` is set in Vercel Dashboard and redeploy.

### If CORS Error

**Problem**: Backend rejecting requests from frontend

**Solution**: Check backend CORS config includes `www.assurly.co.uk`

## What Information We Need

To proceed, please provide:

1. **Screenshot or description**: What do you see when clicking the magic link?
2. **Browser Console output**: Any errors?
3. **Network tab**: What request is being made? (Full URL and status)
4. **Environment check**: What does `import.meta.env.VITE_API_BASE_URL` show in browser console?

## Current State of vercel.json

```json
{
  "headers": [...security headers...],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This should handle SPA routing correctly.

---

**Status**: Waiting for clarification on exact failure point
**Next Step**: Debug with browser DevTools to see exact error

