# Vercel Monorepo Configuration - CORRECT Approach

## The Problem

Vercel's `vercel.json` does **NOT support** `rootDirectory` property. 

The correct approach for monorepos is:
1. Use `cd` commands in `vercel.json` (for build commands)
2. Configure **Root Directory** in Vercel Dashboard (for project settings)

## ✅ Correct Solution

### Option 1: Configure Root Directory in Vercel Dashboard (Recommended)

This is the **official Vercel way** for monorepos.

#### Step 1: Configure in Vercel Dashboard

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your project (e.g., `assurly`)
3. Go to **Settings** → **General**
4. Scroll to **Root Directory**
5. Set to: `assurly-frontend`
6. Click **Save**

#### Step 2: Simplify vercel.json

Since Vercel will run from `assurly-frontend/`, your `vercel.json` in root can be simplified:

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

Vercel will automatically use `package.json` scripts from `assurly-frontend/`.

---

### Option 2: Keep Current Setup (Working Now)

Keep the `cd` commands in `vercel.json` (this is what I've just fixed):

```json
{
  "buildCommand": "cd assurly-frontend && npm install && npm run build",
  "outputDirectory": "assurly-frontend/dist",
  "installCommand": "cd assurly-frontend && npm install",
  "headers": [...],
  "rewrites": [...]
}
```

This works but is less clean than Option 1.

---

## Environment Variables Setup (Required for Both Options)

### In Vercel Dashboard:

1. Go to: **Settings** → **Environment Variables**
2. Add:
   ```
   Name: VITE_API_BASE_URL
   Value: https://assurly-frontend-400616570417.europe-west2.run.app
   Environment: Production (check the box)
   ```
3. Click **Save**

### Verify After Deploy:

Open browser console at www.assurly.co.uk:
```javascript
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
// Should show: https://assurly-frontend-400616570417.europe-west2.run.app
```

---

## Why Previous Attempt Failed

❌ **Wrong:** `"rootDirectory": "assurly-frontend"` in `vercel.json`
- This property doesn't exist in Vercel's JSON schema
- Causes validation error: "should NOT have additional property 'rootDirectory'"

✅ **Correct:** Either:
1. Set Root Directory in **Vercel Dashboard** (Settings → General)
2. OR use `cd` commands in build/install commands

---

## Quick Fix Steps

### Current Status: ✅ Working
The `vercel.json` has been corrected to use `cd` commands.

### To Deploy:

```bash
# Commit the fix
git add vercel.json
git commit -m "fix: Remove invalid rootDirectory from vercel.json"
git push origin main
```

### After Vercel Deploys:

1. ✅ Hard refresh browser (Cmd+Shift+R)
2. ✅ Check API URL in console
3. ✅ Test aspects/standards endpoints
4. ✅ Verify no CORS errors

---

## Alternative: Set Root Directory in Vercel Dashboard

If you prefer the cleaner approach:

### Step 1: Configure Root Directory
1. Vercel Dashboard → Your Project → Settings → General
2. Root Directory: `assurly-frontend`
3. Save

### Step 2: Simplify vercel.json
Remove build commands (Vercel auto-detects from package.json):
```json
{
  "headers": [...],
  "rewrites": [...]
}
```

### Step 3: Redeploy
Vercel will automatically use:
- `npm install` from assurly-frontend/package.json
- `npm run build` from assurly-frontend/package.json
- Output to dist/ (auto-detected)

---

## Verification Checklist

After deployment:

- [ ] Build succeeds in Vercel
- [ ] Site loads at www.assurly.co.uk
- [ ] Console shows correct API URL
- [ ] No CORS errors on aspects/standards endpoints
- [ ] Can fetch data successfully

---

## Troubleshooting

### If build still fails:
```bash
# Test locally from root
cd assurly-frontend
npm install
npm run build
# Should succeed
```

### If CORS persists:
1. Check Environment Variables in Vercel dashboard
2. Hard refresh browser (clear cache)
3. Check Network tab for actual API URL being called
4. Verify CSP header allows backend domain

---

## Summary

**Current fix applied:** ✅ vercel.json uses `cd` commands
**Next steps:** 
1. Add `VITE_API_BASE_URL` to Vercel env vars
2. Push and deploy
3. Hard refresh browser

**Optional enhancement:** Set Root Directory in Vercel Dashboard for cleaner config

