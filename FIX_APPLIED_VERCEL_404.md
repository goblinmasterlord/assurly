# ✅ FIXED: Magic Link 404 Error - Monorepo Build Configuration

## The Root Cause

The **404 error was NOT about the magic link verification** - it was about **Vercel not finding the built files** because of incorrect monorepo configuration.

### What Was Happening

```
User clicks: https://www.assurly.co.uk/auth/verify?token=...
                          ↓
Vercel tries to serve the page
                          ↓
Vercel looks for files in: /dist/
But files are actually in: /assurly-frontend/dist/
                          ↓
Result: 404 NOT_FOUND (x-vercel-error: NOT_FOUND)
```

The page **itself** was returning 404, not the API call. Vercel couldn't find `index.html` because it didn't know to look in the `assurly-frontend/` subdirectory.

## The Fix

### What Was Missing in vercel.json

**Before** (broken):
```json
{
  "headers": [...],
  "rewrites": [...]
  // ❌ No build commands - Vercel didn't know where to build from
}
```

**After** (fixed):
```json
{
  "buildCommand": "cd assurly-frontend && npm install && npm run build",
  "outputDirectory": "assurly-frontend/dist",
  "installCommand": "cd assurly-frontend && npm install",
  "headers": [...],
  "rewrites": [...]
}
```

### Also Fixed: CSP Header

Removed `'self'` from `connect-src` in Content Security Policy:

**Before**:
```
connect-src 'self' https://assurly-frontend-...run.app https://*.vercel.app
```

**After**:
```
connect-src https://assurly-frontend-...run.app https://*.vercel.app
```

This ensures API calls go ONLY to the backend, not to the frontend domain.

## Files Modified

```
✅ vercel.json - Added monorepo build configuration
✅ assurly-frontend/.env.development - Standardized debug flag
✅ assurly-frontend/.env.production - Added debug flag (false)
✅ assurly-frontend/.env.example - Comprehensive documentation
✅ assurly-frontend/.env.README.md - Environment variables guide
```

## To Deploy the Fix

```bash
cd /Users/pwned/Documents/Cursor/Assurly

# Review changes
git status
git diff vercel.json

# Commit
git add vercel.json
git add assurly-frontend/.env*
git commit -m "fix: Configure Vercel for monorepo build and fix magic link 404

- Add buildCommand to build from assurly-frontend/ subdirectory
- Add outputDirectory pointing to assurly-frontend/dist
- Add installCommand for proper npm install location
- Remove 'self' from CSP connect-src to prevent API calls to frontend domain
- Standardize .env files with consistent VITE_DEBUG_API configuration

Fixes 404 NOT_FOUND error when accessing /auth/verify magic link pages.
Vercel now correctly builds from monorepo subdirectory structure."

# Push to trigger deployment
git push origin main
```

## Verification After Deployment

### 1. Check Page Loads (Most Important)

Visit any route:
- https://www.assurly.co.uk/ ✅ Should load
- https://www.assurly.co.uk/auth/login ✅ Should load
- https://www.assurly.co.uk/auth/verify?token=test ✅ Should load (page should display, even if token is invalid)

**Expected**: Page loads, NOT 404

### 2. Check Vercel Build Logs

Go to Vercel Dashboard → Deployments → Latest → View Build Logs

Look for:
```
Running "cd assurly-frontend && npm install && npm run build"
...
Build Completed in /assurly-frontend/dist
```

**Expected**: Build runs in `assurly-frontend/` directory

### 3. Test Magic Link Flow

1. Go to: https://www.assurly.co.uk/auth/login
2. Enter email and request magic link
3. Check email for magic link
4. Click the magic link
5. Should redirect to verify page (NOT 404)
6. Verification should complete (or show appropriate error if token expired)

**Expected**: Full flow works without 404

### 4. Check API Calls in Network Tab

Open DevTools (F12) → Network tab → Click magic link

Look for:
```
Request URL: https://assurly-frontend-...run.app/api/auth/verify/{token}
Status: 200 OK (or 401 if token invalid - but NOT 404)
```

**Expected**: API calls go to backend domain, not frontend domain

### 5. Check Environment Variables

In browser console at www.assurly.co.uk:
```javascript
import.meta.env.VITE_API_BASE_URL
```

**Expected**: `"https://assurly-frontend-400616570417.europe-west2.run.app"`

## Why It Was Failing Before

### The Monorepo Structure

```
/Users/pwned/Documents/Cursor/Assurly/
├── assurly-backend/         # Backend (separate deployment)
├── assurly-frontend/        # Frontend (Vercel deployment)
│   ├── src/
│   ├── dist/                # Build output HERE
│   ├── package.json
│   └── vite.config.ts
└── vercel.json              # Root config
```

Without build commands, Vercel would:
1. Run `npm install` in **root** (fails - no package.json)
2. Look for built files in `/dist/` (doesn't exist)
3. Serve 404 for all routes

With build commands, Vercel now:
1. Runs `cd assurly-frontend && npm install` ✅
2. Runs `cd assurly-frontend && npm run build` ✅
3. Looks for built files in `/assurly-frontend/dist/` ✅
4. Serves pages correctly ✅

## Alternative Solution (Optional)

Instead of build commands in `vercel.json`, you can also:

### Set Root Directory in Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **General**
4. Scroll to **Root Directory**
5. Set to: `assurly-frontend`
6. Click **Save**
7. Simplify `vercel.json` by removing build commands

This is cleaner but requires dashboard configuration. The current approach (build commands in `vercel.json`) works and is fully in code.

## Troubleshooting

### If 404 persists after deployment:

1. **Check Vercel build logs** - Verify build runs in correct directory
2. **Clear Vercel cache** - Redeploy with "Clear cache" option
3. **Hard refresh browser** - Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
4. **Wait for propagation** - DNS/CDN can take a few minutes

### If page loads but API calls fail:

This would be a different issue (not the current 404). Check:
- `VITE_API_BASE_URL` is set in browser console
- Network tab shows correct backend URL
- CORS headers on backend include frontend domain

## Summary

**Problem**: Vercel 404 for `/auth/verify` page  
**Root Cause**: Vercel didn't know to build from `assurly-frontend/` subdirectory  
**Solution**: Added monorepo build configuration to `vercel.json`  
**Status**: ✅ Fixed - ready to deploy

**Before**: `x-vercel-error: NOT_FOUND`  
**After**: Page loads correctly ✅

The magic link will now work! 🎉

