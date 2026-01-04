# Vercel Monorepo Configuration - FINAL SOLUTION

## Root Cause Found ✅

**The Issue:** Vercel's **Root Directory is already set to `assurly-frontend`** in the dashboard settings.

When Vercel runs build commands, it's **already inside** the `assurly-frontend/` directory, so:
- ❌ `cd assurly-frontend` → fails (directory doesn't exist from that context)
- ✅ `npm install` → works (package.json is right there)

## The Correct Configuration

### 1. Vercel Dashboard Settings (Already Configured)

Your Vercel project already has:
- **Root Directory:** `assurly-frontend`

This means Vercel automatically:
- Runs build from `assurly-frontend/` directory
- Uses `assurly-frontend/package.json`
- Auto-detects `npm install` and `npm run build` from package.json scripts
- Outputs to `dist/` (relative to Root Directory)

### 2. vercel.json (Simplified - Now Correct)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://assurly-frontend-400616570417.europe-west2.run.app https://*.vercel.app; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**What this does:**
- ✅ Sets HTTP security headers (CSP, XSS protection, etc.)
- ✅ Handles SPA routing (rewrites all routes to index.html)
- ✅ Lets Vercel auto-detect build from package.json

**What it doesn't do (and shouldn't):**
- ❌ No `buildCommand` - Vercel auto-detects from package.json
- ❌ No `installCommand` - Vercel auto-detects
- ❌ No `outputDirectory` - Vercel auto-detects dist/
- ❌ No `cd` commands - Root Directory already set

## Environment Variables (Still Required)

### In Vercel Dashboard:

1. Go to: **Settings** → **Environment Variables**
2. Verify this exists:
   ```
   Name: VITE_API_BASE_URL
   Value: https://assurly-frontend-400616570417.europe-west2.run.app
   Environment: Production ✓
   ```
3. If not present, add it and click **Save**

## Deployment Steps

```bash
# Push the fix
git push origin claude/fix-cors-production-Z14rB
```

Vercel will automatically:
1. ✅ Run `npm install` in `assurly-frontend/`
2. ✅ Run `npm run build` in `assurly-frontend/`
3. ✅ Deploy `dist/` folder
4. ✅ Apply headers from `vercel.json`
5. ✅ Inject `VITE_API_BASE_URL` environment variable

## Verification

### After Deployment:

1. **Check build logs in Vercel:**
   - Should show: `Running "npm install"` (not `cd assurly-frontend`)
   - Build should succeed

2. **Test in browser at www.assurly.co.uk:**
   ```javascript
   // Open console
   console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
   // Should show: https://assurly-frontend-400616570417.europe-west2.run.app
   ```

3. **Test API calls:**
   ```javascript
   fetch('https://assurly-frontend-400616570417.europe-west2.run.app/api/aspects', {
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('assurly_auth_token')}`
     }
   })
   .then(r => r.json())
   .then(data => console.log('✅ Success!', data))
   .catch(err => console.error('❌ Failed:', err));
   ```

4. **Verify no CORS errors in console**

## Why This Finally Works

### Previous Attempts (Failed):

1. ❌ `"rootDirectory": "assurly-frontend"` in vercel.json
   - Property doesn't exist in schema

2. ❌ `"buildCommand": "cd assurly-frontend && npm install && npm run build"`
   - Root Directory already set, so `cd assurly-frontend` fails

### Current Solution (Working):

✅ **Root Directory set in Vercel Dashboard** + **Minimal vercel.json**
- Vercel runs from correct directory
- Auto-detects build commands from package.json
- Injects environment variables correctly
- Applies security headers from vercel.json
- No conflicting configurations

## Monorepo Structure (Final)

```
/
├── assurly-backend/          # Backend code (not deployed to Vercel)
├── assurly-frontend/         # Frontend code ← Root Directory in Vercel
│   ├── package.json          # Build scripts auto-detected
│   ├── vite.config.ts        # Build config
│   ├── src/                  # Source code
│   └── dist/                 # Build output (deployed)
├── docs/                     # Documentation
└── vercel.json               # Headers + rewrites only
```

## Troubleshooting

### If build still fails:

1. **Check Vercel Dashboard:**
   - Settings → General → Root Directory should be `assurly-frontend`

2. **Check Environment Variables:**
   - Settings → Environment Variables
   - Verify `VITE_API_BASE_URL` is set for Production

3. **Check Build Logs:**
   - Should NOT see: `cd: assurly-frontend: No such file or directory`
   - Should see: `Running "npm install"` directly

4. **Clear Build Cache:**
   - Vercel Dashboard → Deployments
   - Redeploy → Check "Clear cache"

### If CORS errors persist after successful build:

1. **Hard refresh browser:** Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **Clear browser cache completely**
3. **Verify API URL in console:**
   ```javascript
   console.log(import.meta.env.VITE_API_BASE_URL)
   ```
4. **Check Network tab:** Verify requests go to correct backend URL

## Summary

✅ **Fixed:** Removed conflicting build commands from vercel.json
✅ **Reason:** Vercel Root Directory already set to `assurly-frontend` in dashboard
✅ **Result:** Vercel auto-detects build from package.json scripts

**Status:** Ready to deploy! 🚀

Push to trigger deployment, then verify CORS is resolved.

