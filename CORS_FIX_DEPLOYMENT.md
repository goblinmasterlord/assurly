# CORS Fix - Deployment Instructions

## Problem Fixed
**CORS Error on Production:** Frontend at `https://www.assurly.co.uk` was unable to call backend API at `https://assurly-frontend-400616570417.europe-west2.run.app` due to missing `Access-Control-Allow-Origin` headers.

## Root Cause
FastAPI's CORSMiddleware doesn't allow `allow_origins=["*"]` when `allow_credentials=True`. The wildcard was silently failing, causing CORS preflight requests to be rejected.

## Fix Applied
Updated `/assurly-backend/main.py` to explicitly list allowed origins:
```python
allow_origins=[
    "https://www.assurly.co.uk",      # Production frontend
    "https://assurly.co.uk",          # Production (no www)
    "http://localhost:5173",          # Vite dev server
    "http://localhost:3000",          # Alternative dev
]
```

## 🚨 DEPLOYMENT REQUIRED 🚨

**This fix requires redeploying the backend to Google Cloud Run.**

### Option 1: Deploy via gcloud CLI
```bash
cd assurly-backend

# Authenticate (if needed)
gcloud auth login

# Set project
gcloud config set project assurly-frontend

# Deploy to Cloud Run
gcloud run deploy assurly-frontend \
  --source . \
  --region europe-west2 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=assurly-frontend" \
  --max-instances=10 \
  --memory=512Mi
```

### Option 2: Deploy via Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Cloud Run** → Services
3. Click on your backend service
4. Click **EDIT & DEPLOY NEW REVISION**
5. No changes needed - just redeploy to pick up code changes
6. Click **DEPLOY**

### Option 3: Trigger from GitHub (if CI/CD set up)
```bash
git push origin main
```

## Verification Steps

### 1. Check Backend is Deployed
```bash
curl https://assurly-frontend-400616570417.europe-west2.run.app/docs
```
Should return the FastAPI docs page.

### 2. Test CORS Headers
```bash
curl -H "Origin: https://www.assurly.co.uk" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: authorization" \
     -X OPTIONS \
     -v \
     https://assurly-frontend-400616570417.europe-west2.run.app/api/aspects
```

Expected response headers:
```
Access-Control-Allow-Origin: https://www.assurly.co.uk
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Max-Age: 3600
```

### 3. Test from Frontend
1. Open https://www.assurly.co.uk in browser
2. Open Developer Tools → Console
3. Clear console errors
4. Refresh page
5. Check for CORS errors - should be gone!

### 4. Test API Calls
```javascript
// In browser console at www.assurly.co.uk
fetch('https://assurly-frontend-400616570417.europe-west2.run.app/api/aspects', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('assurly_auth_token')}`
  }
})
.then(r => r.json())
.then(console.log)
```

Should return aspects data, not CORS error.

## Adding More Domains

If you need to add more allowed origins (e.g., staging environment):

1. Edit `assurly-backend/main.py`
2. Add domain to `allow_origins` list:
```python
allow_origins=[
    "https://www.assurly.co.uk",
    "https://assurly.co.uk",
    "https://staging.assurly.co.uk",  # ← Add here
    "http://localhost:5173",
    # ...
]
```
3. Redeploy backend

## Rollback Plan

If this causes issues, you can rollback:

```bash
cd assurly-backend
git revert HEAD
git push origin main
```

Or redeploy previous Cloud Run revision from console.

## Additional Notes

- **Preflight Caching:** Set `max_age=3600` (1 hour) to reduce preflight OPTIONS requests
- **Credentials:** `allow_credentials=True` is required for sending cookies/auth headers
- **Wildcards:** Cannot use `["*"]` with credentials - browser security restriction
- **Subdomains:** Must explicitly list each subdomain (www vs non-www)

## Troubleshooting

### Still seeing CORS errors after deployment?

1. **Check deployment timestamp:**
   - Go to Cloud Run console
   - Verify latest revision is deployed and receiving traffic

2. **Hard refresh frontend:**
   - Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or clear browser cache

3. **Verify domain in error message:**
   - Check console error shows your domain
   - Ensure it matches exactly what's in `allow_origins`

4. **Check for typos:**
   - `https://` vs `http://`
   - `www.` vs no www
   - Trailing slashes (don't include them)

### Need to allow ALL domains temporarily?

**NOT RECOMMENDED FOR PRODUCTION**, but for testing:

```python
# TEMPORARY - DO NOT USE IN PRODUCTION
allow_origins=["*"],
allow_credentials=False,  # Must disable credentials
```

This removes security but helps diagnose if CORS is the only issue.

## Related Files
- Backend: `/assurly-backend/main.py` (lines 155-172)
- Frontend CORS config: `/assurly-frontend/vercel.json`
- Debug guide: `/DEBUGGING_500_ERRORS.md`

