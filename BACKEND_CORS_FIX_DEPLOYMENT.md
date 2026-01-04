# Backend CORS Fix - Deployment Instructions

## The Problem

You're seeing this error in the browser console:
```
Access to XMLHttpRequest at 'https://assurly-frontend-400616570417.europe-west2.run.app/api/aspects'
from origin 'https://www.assurly.co.uk' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

Even though:
- ✅ Authentication works (you can log in)
- ✅ Backend has CORS middleware configured
- ✅ Backend is deployed

## Root Cause

The issue is that **error responses (401, 403, etc.) don't include CORS headers**.

Here's what happens:
1. Frontend makes request to `/api/aspects` with JWT token
2. If token is invalid/expired, backend raises `401 Unauthorized`
3. The error is raised **before** CORS middleware processes the response
4. Browser receives `401` response **without** CORS headers
5. Browser blocks the response and shows CORS error instead

This is a common FastAPI + CORS issue where exceptions bypass the CORS middleware.

## The Fix

I've added a **custom exception handler** that ensures CORS headers are included in **ALL** responses, including errors.

**File changed:** `assurly-backend/main.py` (lines 174-209)

The exception handler:
- Catches all `HTTPException` responses (401, 403, 404, 500, etc.)
- Checks if the request origin is allowed
- Manually adds CORS headers to the error response
- Returns the error with proper headers

## Deployment Steps

### Step 1: Pull the latest code

```bash
# Switch to the fix branch (if not already)
git checkout claude/fix-cors-production-Z14rB

# Or merge into main if ready
git checkout main
git merge claude/fix-cors-production-Z14rB
```

### Step 2: Deploy to Google Cloud Run

Navigate to the backend directory and deploy:

```bash
# Navigate to backend folder
cd assurly-backend

# Deploy to Cloud Run
gcloud run deploy assurly-frontend \
  --source . \
  --region europe-west2 \
  --allow-unauthenticated \
  --platform managed
```

**Note:** The service name is `assurly-frontend` (this is the existing Cloud Run service name).

### Step 3: Wait for deployment

The deployment typically takes 2-3 minutes. You'll see output like:
```
Building using Dockerfile and deploying container to Cloud Run service [assurly-frontend]
✓ Creating Revision...
✓ Routing traffic...
✓ Setting IAM Policy...
Done.
Service [assurly-frontend] revision [assurly-frontend-00123-xyz] has been deployed
Service URL: https://assurly-frontend-400616570417.europe-west2.run.app
```

### Step 4: Verify the fix

1. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)

2. **Open browser DevTools** (F12) → Network tab

3. **Try to access /api/aspects:**
   - Log in to https://www.assurly.co.uk
   - The app should try to load aspects
   - Check the Network tab

4. **Expected result:**
   - If you see `401 Unauthorized` - Good! This means auth is failing but CORS works ✅
   - If you see `200 OK` with data - Perfect! Everything works ✅
   - If you still see CORS error - Deployment issue, see troubleshooting below ❌

## Alternative Deployment Methods

### Option 1: Deploy via Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Cloud Run** → **Services**
3. Click on `assurly-frontend` service
4. Click **EDIT & DEPLOY NEW REVISION**
5. Under "Container" → "Source", select your deployment method
6. Click **DEPLOY**

### Option 2: Deploy with Docker

```bash
cd assurly-backend

# Build Docker image
docker build -t gcr.io/assurly-frontend/assurly-backend:latest .

# Push to Google Container Registry
docker push gcr.io/assurly-frontend/assurly-backend:latest

# Deploy to Cloud Run
gcloud run deploy assurly-frontend \
  --image gcr.io/assurly-frontend/assurly-backend:latest \
  --region europe-west2 \
  --allow-unauthenticated
```

## Testing the Fix

### Test 1: Check error responses include CORS headers

```bash
# Test OPTIONS preflight request
curl -X OPTIONS \
  -H "Origin: https://www.assurly.co.uk" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization" \
  -v \
  https://assurly-frontend-400616570417.europe-west2.run.app/api/aspects
```

**Expected headers in response:**
```
Access-Control-Allow-Origin: https://www.assurly.co.uk
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
```

### Test 2: Check 401 errors include CORS headers

```bash
# Make request without auth token (should return 401)
curl -X GET \
  -H "Origin: https://www.assurly.co.uk" \
  -v \
  https://assurly-frontend-400616570417.europe-west2.run.app/api/aspects
```

**Expected:**
- Status: `401 Unauthorized`
- Headers should include: `Access-Control-Allow-Origin: https://www.assurly.co.uk`

### Test 3: Full flow from frontend

1. Open https://www.assurly.co.uk
2. Open DevTools (F12) → Network tab
3. Log in with your email
4. Wait for aspects to load
5. Check Network tab:
   - Look for request to `/api/aspects`
   - Should show `200 OK` (if authenticated) or `401` (if auth fails)
   - Should **NOT** show CORS error

## Troubleshooting

### Issue: Still seeing CORS errors after deployment

**Check 1: Verify deployment timestamp**
```bash
gcloud run services describe assurly-frontend --region europe-west2 --format="value(status.latestCreatedRevisionName)"
```

The revision name should be recent (today's date).

**Check 2: Verify correct service**
```bash
gcloud run services list --region europe-west2
```

Make sure you're deploying to the correct service (`assurly-frontend`).

**Check 3: Hard refresh browser**
- Press Ctrl+Shift+R (Windows/Linux)
- Or Cmd+Shift+R (Mac)
- Or clear browser cache completely

**Check 4: Check Cloud Run logs**
```bash
gcloud run services logs read assurly-frontend --region europe-west2 --limit=50
```

Look for any errors during startup or request handling.

### Issue: 401 Unauthorized errors

This is actually **good news** - it means CORS is working! The issue is now authentication.

**Check:**
1. Is the JWT token being sent in the request?
   - Open DevTools → Network → Click on request → Headers tab
   - Look for `Authorization: Bearer eyJ...` header

2. Is the token valid?
   - Test token at `/api/auth/me` endpoint
   - If it returns user data, token is valid
   - If it returns 401, token is expired/invalid

3. Token storage:
   - Open DevTools → Application → Local Storage
   - Check if `assurly_auth_token` exists
   - Try logging out and logging in again

### Issue: Deployment fails

**Common causes:**
1. **Wrong directory:** Make sure you're in `assurly-backend/` folder
2. **Missing Dockerfile:** Verify `Dockerfile` exists in `assurly-backend/`
3. **Missing requirements.txt:** Verify dependencies file exists
4. **Wrong project:** Check `gcloud config get-value project` returns `assurly-frontend`
5. **Permissions:** Ensure you have Cloud Run deployment permissions

**Fix:**
```bash
# Verify you're in the right directory
pwd
# Should show: .../assurly/assurly-backend

# Verify files exist
ls -la Dockerfile requirements.txt main.py

# Check project
gcloud config get-value project
# Should show: assurly-frontend

# Check permissions
gcloud projects get-iam-policy assurly-frontend \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:YOUR_EMAIL"
```

## What Changed

**Before (broken):**
```
User request → Backend → 401 Error (no CORS headers) → Browser blocks (CORS error)
```

**After (fixed):**
```
User request → Backend → 401 Error (with CORS headers) → Browser shows 401 error ✅
```

The fix ensures that even when authentication fails, the browser receives proper CORS headers, so it can show the real error instead of a CORS error.

## Files Modified

- ✅ `assurly-backend/main.py` - Added exception handler (lines 174-209)

## Environment Variables

Make sure these are still set in Cloud Run:

```bash
gcloud run services describe assurly-frontend \
  --region europe-west2 \
  --format="value(spec.template.spec.containers[0].env)"
```

Required variables:
- `FRONTEND_URL=https://www.assurly.co.uk`
- `JWT_SECRET_KEY` (your secret)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `GMAIL_USER`, `GMAIL_APP_PASSWORD`

## Summary

1. ✅ Pull latest code with CORS exception handler fix
2. ✅ Deploy backend to Cloud Run: `gcloud run deploy assurly-frontend --source . --region europe-west2`
3. ✅ Wait 2-3 minutes for deployment
4. ✅ Hard refresh browser (Ctrl+Shift+R)
5. ✅ Test - CORS errors should be gone!

The key insight: **CORS headers must be included in ALL responses, including errors**. The custom exception handler ensures this happens.
