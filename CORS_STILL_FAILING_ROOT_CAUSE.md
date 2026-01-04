# CORS Issue Still Persisting - Root Cause & Fix

## Current Status
- ✅ Backend CORS configuration is correct (verified via curl)
- ✅ Backend exception handler is correctly adding CORS headers
- ❌ Browser still shows CORS errors when calling from www.assurly.co.uk

## Root Cause Analysis

### What the Curl Test Shows
```bash
curl -X OPTIONS \
  -H "Origin: https://www.assurly.co.uk" \
  https://assurly-frontend-400616570417.europe-west2.run.app/api/aspects
```

**Result:** ✅ SUCCESS
```
access-control-allow-origin: https://www.assurly.co.uk
access-control-allow-credentials: true
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
```

### What the Browser Shows
**Error:** "Access to XMLHttpRequest has been blocked by CORS policy"

### The Disconnect
**Backend works** via curl, but **browser fails** = This is NOT a backend CORS issue!

## The REAL Problem: Vercel Environment Variables

The frontend is deployed to Vercel but likely **missing the API base URL** environment variable.

### Check 1: Is VITE_API_BASE_URL Set in Vercel?

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (assurly-frontend)
3. Go to **Settings** → **Environment Variables**
4. Look for `VITE_API_BASE_URL`

**If missing or incorrect, this is your problem!**

### Expected Value
```
VITE_API_BASE_URL=https://assurly-frontend-400616570417.europe-west2.run.app
```

## Fix: Add Environment Variable to Vercel

### Via Vercel Dashboard (Recommended)

1. Go to **Project Settings** → **Environment Variables**
2. Click **Add New**
3. Set:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://assurly-frontend-400616570417.europe-west2.run.app`
   - **Environment:** Production (and Preview if needed)
4. Click **Save**
5. **Redeploy the frontend** (required for env vars to take effect)
   - Go to **Deployments** tab
   - Click **⋯** on latest deployment
   - Click **Redeploy**

### Via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link to project
cd assurly-frontend
vercel link

# Add environment variable
vercel env add VITE_API_BASE_URL production
# When prompted, enter: https://assurly-frontend-400616570417.europe-west2.run.app

# Redeploy
vercel --prod
```

### Via vercel.json (Alternative)

Add to root `vercel.json`:
```json
{
  "buildCommand": "cd assurly-frontend && npm install && npm run build",
  "outputDirectory": "assurly-frontend/dist",
  "installCommand": "cd assurly-frontend && npm install",
  "framework": null,
  "env": {
    "VITE_API_BASE_URL": "https://assurly-frontend-400616570417.europe-west2.run.app"
  },
  "headers": [
    ...
  ]
}
```

**Note:** Using `vercel.json` is less secure as it commits the URL to git. Dashboard method is preferred.

## Alternative Issue: CSP (Content Security Policy)

Your `vercel.json` has a CSP header that might be blocking the requests:

```json
"Content-Security-Policy": "... connect-src 'self' https://assurly-frontend-400616570417.europe-west2.run.app ..."
```

This is **correct** and should allow the connection. However, if the API URL is different or has changed, this could block it.

### Verify CSP is Not Blocking

1. Open browser DevTools → Console
2. Look for CSP errors like:
   ```
   Refused to connect to 'https://...' because it violates the following Content Security Policy directive: "connect-src..."
   ```

If you see this, update the CSP in `vercel.json` to include the correct API domain.

## Debugging Steps

### Step 1: Check What API URL Frontend is Using

Open browser console at www.assurly.co.uk and run:
```javascript
// Check if env var is defined
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);

// Check what axios is using
import apiClient from './src/lib/api-client';
console.log('Axios baseURL:', apiClient.defaults.baseURL);
```

**Expected:** Should show `https://assurly-frontend-400616570417.europe-west2.run.app`

**If empty or undefined:** Environment variable not set in Vercel!

### Step 2: Check Network Tab

1. Open DevTools → Network tab
2. Trigger the aspects API call
3. Click on the failed request
4. Check **Request URL** - does it show the full backend URL?
5. Check **Request Headers** - is `Origin: https://www.assurly.co.uk` present?
6. Check **Response Headers** - are CORS headers present?

### Step 3: Test Directly in Browser

In console at www.assurly.co.uk:
```javascript
fetch('https://assurly-frontend-400616570417.europe-west2.run.app/api/aspects', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('assurly_auth_token')}`
  }
})
.then(r => {
  console.log('Status:', r.status);
  console.log('Headers:', Object.fromEntries(r.headers));
  return r.json();
})
.then(data => console.log('Data:', data))
.catch(err => console.error('Error:', err));
```

**If this works but app doesn't:** Issue is in the app's API client configuration

**If this also fails with CORS:** CSP or browser security issue

## Quick Test: Temporarily Disable CSP

To test if CSP is the issue, temporarily remove the CSP header from `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        // Comment out or remove CSP temporarily
        // {
        //   "key": "Content-Security-Policy",
        //   "value": "..."
        // }
      ]
    }
  ]
}
```

Redeploy and test. If it works, CSP was blocking the connection.

## Expected Resolution

### Most Likely: Missing Environment Variable
1. Add `VITE_API_BASE_URL` to Vercel dashboard
2. Redeploy frontend
3. Hard refresh browser (Cmd+Shift+R)
4. CORS errors should disappear ✅

### Less Likely: CSP Blocking
1. Update CSP `connect-src` directive
2. Redeploy frontend
3. Hard refresh browser
4. CORS errors should disappear ✅

## Verification After Fix

1. **Clear browser cache completely**
2. **Hard refresh** (Cmd+Shift+R or Ctrl+Shift+R)
3. **Open DevTools → Network tab**
4. **Clear console**
5. **Reload page**
6. Check:
   - ✅ No CORS errors in console
   - ✅ Aspects API returns data
   - ✅ Standards API returns data
   - ✅ Request headers show `Origin: https://www.assurly.co.uk`
   - ✅ Response headers show `access-control-allow-origin: https://www.assurly.co.uk`

## Why Curl Works But Browser Doesn't

- **Curl:** Makes direct HTTP request, no browser security
- **Browser:** Enforces CORS, CSP, and other security policies
- **Issue:** Browser sees request from www.assurly.co.uk → backend, triggers CORS check
- **Backend:** Returns correct CORS headers (verified via curl)
- **But:** If frontend doesn't have correct API URL or CSP blocks it, request fails before CORS check

## Next Steps

1. ✅ Check Vercel environment variables (most likely cause)
2. ✅ Verify CSP allows the backend domain
3. ✅ Test with browser DevTools to see actual error
4. ✅ Redeploy frontend after fixing env vars
5. ✅ Hard refresh browser to clear cache

## Need More Help?

Provide:
1. Screenshot of Vercel environment variables page
2. Full error message from browser console (not just CORS error)
3. Network tab screenshot showing:
   - Request URL
   - Request headers
   - Response headers (if any)
4. Output of: `console.log(import.meta.env.VITE_API_BASE_URL)` from browser

