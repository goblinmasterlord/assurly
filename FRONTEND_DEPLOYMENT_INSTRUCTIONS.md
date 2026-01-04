# Frontend Deployment Instructions - Fix Magic Link 404 Errors

## The Problem
The backend endpoints work perfectly when tested in Swagger UI (`/api/docs`), but the website UI still shows 404 errors. This is because **the frontend code changes haven't been deployed yet**.

The old frontend code is still running on your website at `https://www.assurly.co.uk`, calling the wrong endpoint paths.

## What Was Fixed
The following files were updated to match the new backend API paths:
- ✅ `assurly-frontend/src/services/auth-service.ts` - Fixed magic link and verify endpoints
- ✅ `assurly-frontend/src/lib/api-client.ts` - Updated token exclusion logic

These changes are currently in the branch: `claude/fix-cors-production-Z14rB`

## Deployment Steps

### Option 1: Deploy via GitHub Merge (Recommended - Auto-deploys to Vercel)

1. **Merge the fix branch to main:**
   ```bash
   # Switch to main branch
   git checkout main

   # Pull latest changes
   git pull origin main

   # Merge the fix branch
   git merge claude/fix-cors-production-Z14rB

   # Push to main
   git push origin main
   ```

2. **Wait for Vercel to auto-deploy:**
   - Vercel should automatically detect the push to `main`
   - Check your Vercel dashboard: https://vercel.com/dashboard
   - You should see a new deployment starting
   - Wait for it to complete (usually 2-3 minutes)

3. **Verify the deployment:**
   - Go to https://www.assurly.co.uk
   - Open browser DevTools (F12) → Network tab
   - Try to log in with your email
   - You should see a POST request to `/api/auth/request-magic-link` (not `/api/auth/login`)
   - Status should be 200 ✅ (not 404 ❌)

### Option 2: Deploy via Vercel Dashboard

1. **Push your branch to GitHub:**
   ```bash
   # Make sure changes are pushed
   git push origin claude/fix-cors-production-Z14rB
   ```

2. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Find your `assurly` project
   - Click on it

3. **Deploy from Git:**
   - Go to "Deployments" tab
   - Find the latest deployment from your branch
   - Click the three dots menu (⋮)
   - Click "Promote to Production"

### Option 3: Manual Vercel CLI Deployment

If you have Vercel CLI installed:

```bash
# Navigate to frontend directory
cd assurly-frontend

# Deploy to production
vercel --prod

# Or deploy to preview first to test
vercel
```

## Verification Steps

After deployment, verify the fix worked:

### 1. Check Network Requests
1. Open https://www.assurly.co.uk
2. Open DevTools (F12) → Network tab
3. Enter your email and click "Send magic link"
4. Check the network request:
   - **URL should be**: `https://assurly-frontend-400616570417.europe-west2.run.app/api/auth/request-magic-link`
   - **Method**: POST
   - **Status**: 200 OK ✅

### 2. Check Console for Errors
1. Open DevTools (F12) → Console tab
2. Try logging in
3. You should NOT see any 404 errors
4. You should see: `"Magic link request successful"` (if debug mode is on)

### 3. Test Full Login Flow
1. Enter your email on the login page
2. Click "Send magic link"
3. You should see: "Check your email" confirmation page
4. Check your email inbox
5. Click the magic link in the email
6. You should be redirected and logged in ✅

## Expected Behavior After Deployment

### Before (404 Errors):
```
POST /api/auth/login → 404 Not Found ❌
- Backend doesn't have this endpoint
```

### After (Working):
```
POST /api/auth/request-magic-link → 200 OK ✅
- Email sent successfully
- Token stored in database
```

## Troubleshooting

### Issue: Still getting 404 after deployment

**Solution 1: Hard refresh the website**
- Press `Ctrl + Shift + R` (Windows/Linux)
- Or `Cmd + Shift + R` (Mac)
- This clears the browser cache

**Solution 2: Check deployment status**
```bash
# Make sure you're on main branch
git branch

# Check last commit
git log -1 --oneline

# Should show: "fix: Correct authentication endpoint paths..."
```

**Solution 3: Verify Vercel is building from the correct directory**
- Go to Vercel Dashboard → Settings → General
- Check "Root Directory": Should be blank or `assurly-frontend`
- Check "Build Command": Should use the root `vercel.json` config

### Issue: Vercel isn't auto-deploying

**Check GitHub integration:**
1. Go to Vercel Dashboard → Settings → Git
2. Verify GitHub is connected
3. Check "Production Branch" is set to `main`
4. Ensure "Auto-deploy" is enabled

**Manual trigger:**
```bash
# Push an empty commit to trigger deploy
git commit --allow-empty -m "chore: Trigger Vercel deployment"
git push origin main
```

### Issue: Build fails on Vercel

**Check build logs:**
1. Go to Vercel Dashboard → Deployments
2. Click on the failed deployment
3. Check the build logs for errors

**Common fixes:**
- Ensure `package.json` in `assurly-frontend/` has all dependencies
- Check that `vercel.json` at root is correct
- Verify environment variables are set in Vercel

## Environment Variables

Make sure these are set in Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_BASE_URL=https://assurly-frontend-400616570417.europe-west2.run.app
VITE_FRONTEND_URL=https://www.assurly.co.uk
```

## Quick Test Commands

### Test magic link endpoint directly:
```bash
curl -X POST https://assurly-frontend-400616570417.europe-west2.run.app/api/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

Expected response:
```json
{
  "message": "If this email is registered, you'll receive a login link shortly.",
  "email": "your-email@example.com",
  "expires_in_minutes": 15
}
```

### Test verify endpoint:
```bash
curl -X GET "https://assurly-frontend-400616570417.europe-west2.run.app/api/auth/verify/YOUR_TOKEN_HERE"
```

## Summary

1. ✅ **Merge** `claude/fix-cors-production-Z14rB` to `main`
2. ✅ **Push** to GitHub (triggers Vercel auto-deploy)
3. ✅ **Wait** for Vercel deployment to complete
4. ✅ **Test** the login flow on your website
5. ✅ **Verify** no 404 errors in Network tab

## Need Help?

If you're still experiencing issues after deployment:
1. Check Vercel deployment logs
2. Verify the branch was merged correctly
3. Hard refresh your browser (Ctrl+Shift+R)
4. Test the backend endpoints directly (they work in Swagger)
5. Check browser console for any JavaScript errors

The backend is working perfectly - we just need to deploy the updated frontend code that calls the correct endpoints!
